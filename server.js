const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7, sameSite: 'lax' }
}));


app.post('/api/register', async (req, res) => {
    const { phone, login, password, password2 } = req.body;
    if (!phone || !login || !password) return res.status(400).json({ error: 'Заполните все поля' });
    if (password !== password2) return res.status(400).json({ error: 'Пароли не совпадают' });
    if (password.length < 6) return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });

    try {
        const [existing] = await db.query('SELECT id FROM users WHERE login = ? OR phone = ?', [login, phone]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Логин или телефон уже заняты' });
        }

        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (phone, login, password) VALUES (?, ?, ?)',
            [phone, login, hash]
        );

        req.session.user = { id: result.insertId, login, phone };
        res.json({ ok: true, login });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE login = ?', [login]);
        if (users.length === 0) return res.status(401).json({ error: 'Неверный логин или пароль' });

        const user = users[0];
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: 'Неверный логин или пароль' });

        req.session.user = { id: user.id, login: user.login, phone: user.phone };
        res.json({ ok: true, login: user.login });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/me', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Не авторизован' });
    res.json(req.session.user);
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
});


app.get('/api/cart', (req, res) => res.json(req.session.cart || []));

app.post('/api/cart', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Необходима авторизация' });
    const { name, price, image } = req.body;
    const cart = req.session.cart || [];
    const existing = cart.find(i => i.name === name);
    
    if (existing) existing.qty += 1;
    else cart.push({ name, price: Number(price), image, qty: 1 });
    
    req.session.cart = cart;
    res.json(cart);
});

app.patch('/api/cart/:name', (req, res) => {
    const cart = req.session.cart || [];
    const item = cart.find(i => i.name === req.params.name);
    if (item) {
        item.qty += Number(req.body.delta) || 0;
        if (item.qty <= 0) req.session.cart = cart.filter(i => i.name !== req.params.name);
    }
    res.json(req.session.cart || []);
});


app.post('/api/checkout', async (req, res) => {
    const cart = req.session.cart || [];
    if (!cart.length) return res.status(400).json({ error: 'Корзина пуста' });
    if (!req.session.user) return res.status(401).json({ error: 'Необходима авторизация' });

    const { name, phone } = req.body;
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

    try {
        const [orderResult] = await db.query(
            'INSERT INTO orders (user_id, customer_name, customer_phone, total) VALUES (?, ?, ?, ?)',
            [req.session.user.id, name, phone, total]
        );
        const orderId = orderResult.insertId;

        const itemsValues = cart.map(item => [orderId, item.name, item.price, item.qty]);
        await db.query(
            'INSERT INTO order_items (order_id, product_name, price, quantity) VALUES ?',
            [itemsValues]
        );

        req.session.cart = [];
        res.json({ ok: true, order: { id: orderId, total } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка оформления заказа' });
    }
});

app.get('/api/orders', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Не авторизован' });

    try {
        const [orders] = await db.query(
            'SELECT id, total, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [req.session.user.id]
        );

        for (let order of orders) {
            const [items] = await db.query(
                'SELECT product_name, price, quantity FROM order_items WHERE order_id = ?',
                [order.id]
            );
            order.items = items;
            order.qty_total = items.reduce((sum, i) => sum + i.quantity, 0);
        }

        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка получения заказов' });
    }
});


app.get('/api/reviews', async (req, res) => {
    try {
        const [reviews] = await db.query('SELECT * FROM reviews ORDER BY created_at DESC');
        const formatted = reviews.map(r => ({
            id: r.id,
            author: r.author,
            text: r.text,
            rating: r.rating,
            date: r.created_at
        }));
        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка получения отзывов' });
    }
});

app.post('/api/reviews', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Необходима авторизация' });
    
    const { text, rating } = req.body;
    if (!text || text.trim().length === 0) return res.status(400).json({ error: 'Отзыв не может быть пустым' });
    if (text.length > 115) return res.status(400).json({ error: 'Отзыв не может быть длиннее 115 символов' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Поставьте оценку от 1 до 5' });

    try {
        await db.query(
            'INSERT INTO reviews (user_id, author, text, rating) VALUES (?, ?, ?, ?)',
            [req.session.user.id, req.session.user.login, text.trim(), rating]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при сохранении отзыва' });
    }
});


app.get('/profile.html', (req, res, next) => {
    if (!req.session.user) return res.redirect('/');
    next();
});

app.use(express.static(__dirname, {
    extensions: ['html'],
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('server.js') || filePath.endsWith('package.json') || filePath.endsWith('db.js')) {
            res.status(403).end();
        }
    }
}));

app.use((req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});