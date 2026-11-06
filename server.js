const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'image'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const isAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }
    next();
};

app.post('/api/register', async (req, res) => {
    const { phone, login, password, password2 } = req.body;
    if (!phone || !login || !password) return res.status(400).json({ error: 'Заполните все поля' });
    if (password !== password2) return res.status(400).json({ error: 'Пароли не совпадают' });

    try {
        const [existing] = await db.query('SELECT id FROM users WHERE login = ? OR phone = ?', [login, phone]);
        if (existing.length > 0) return res.status(409).json({ error: 'Логин или телефон уже заняты' });

        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query('INSERT INTO users (phone, login, password) VALUES (?, ?, ?)', [phone, login, hash]);

        req.session.user = { id: result.insertId, login, phone, role: 'user' };
        res.json({ ok: true, login });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE login = ?', [login]);
        if (users.length === 0) return res.status(401).json({ error: 'Неверный логин или пароль' });

        const user = users[0];
        if (user.is_banned) return res.status(403).json({ error: 'Ваш аккаунт заблокирован' });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: 'Неверный логин или пароль' });

        req.session.user = { id: user.id, login: user.login, phone: user.phone, role: user.role };
        res.json({ ok: true, login: user.login, role: user.role });
    } catch (err) {
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
        const [orderResult] = await db.query('INSERT INTO orders (user_id, customer_name, customer_phone, total) VALUES (?, ?, ?, ?)', [req.session.user.id, name, phone, total]);
        const orderId = orderResult.insertId;
        const itemsValues = cart.map(item => [orderId, item.name, item.price, item.qty]);
        await db.query('INSERT INTO order_items (order_id, product_name, price, quantity) VALUES ?', [itemsValues]);

        req.session.cart = [];
        res.json({ ok: true, order: { id: orderId, total } });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка оформления заказа' });
    }
});

app.get('/api/orders', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Не авторизован' });
    try {
        const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.session.user.id]);
        for (let order of orders) {
            const [items] = await db.query('SELECT product_name, price, quantity FROM order_items WHERE order_id = ?', [order.id]);
            order.items = items;
            order.qty_total = items.reduce((sum, i) => sum + i.quantity, 0);
        }
        res.json(orders);
    } catch (err) { res.status(500).json({ error: 'Ошибка' }); }
});

app.get('/api/products', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products ORDER BY id ASC');
        res.json(products);
    } catch (err) { res.status(500).json({ error: 'Ошибка получения товаров' }); }
});

app.get('/api/reviews', async (req, res) => {
    try {
        const [reviews] = await db.query('SELECT * FROM reviews WHERE is_hidden = FALSE ORDER BY created_at DESC');
        res.json(reviews);
    } catch (err) { res.status(500).json({ error: 'Ошибка' }); }
});

app.post('/api/reviews', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Необходима авторизация' });
    const { text, rating } = req.body;
    if (!text || text.length > 115) return res.status(400).json({ error: 'Некорректный текст' });
    try {
        await db.query('INSERT INTO reviews (user_id, author, text, rating) VALUES (?, ?, ?, ?)', [req.session.user.id, req.session.user.login, text, rating]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: 'Ошибка' }); }
});

app.get('/api/admin/users', isAdmin, async (req, res) => {
    const [users] = await db.query('SELECT id, login, phone, role, is_banned FROM users');
    res.json(users);
});

app.post('/api/admin/users/:id/ban', isAdmin, async (req, res) => {
    await db.query('UPDATE users SET is_banned = NOT is_banned WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
});

app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
});

app.get('/api/admin/reviews', isAdmin, async (req, res) => {
    const [reviews] = await db.query('SELECT * FROM reviews ORDER BY created_at DESC');
    res.json(reviews);
});

app.post('/api/admin/reviews/:id/toggle', isAdmin, async (req, res) => {
    await db.query('UPDATE reviews SET is_hidden = NOT is_hidden WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
});

app.get('/api/admin/orders', isAdmin, async (req, res) => {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(orders);
});

app.post('/api/admin/orders/:id/status', isAdmin, async (req, res) => {
    const { status } = req.body;
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
});

app.post('/api/admin/products', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { category, name, price } = req.body;
        const image_url = req.file ? 'image/' + req.file.filename : 'image/cartnapitki (1).svg';

        await db.query('INSERT INTO products (category, name, price, image_url) VALUES (?, ?, ?, ?)', [category, name, price, image_url]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка' });
    }
});

app.delete('/api/admin/products/:id', isAdmin, async (req, res) => {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
});

app.get('/admin.html', (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/');
    next();
});

app.get('/profile.html', (req, res, next) => {
    if (!req.session.user) return res.redirect('/');
    if (req.session.user.role === 'admin') return res.redirect('/admin.html');
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