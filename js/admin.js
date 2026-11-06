function switchTab(id, event) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

    document.getElementById(id).classList.add('active');
    event.target.classList.add('active');

    loadData(id);
}

async function loadData(type) {
    if (type === 'orders') {
        const res = await fetch('/api/admin/orders');
        const data = await res.json();
        document.getElementById('orders-table').innerHTML = data.map(o => `
            <tr>
                <td>${o.id}</td>
                <td>${o.customer_name} (${o.customer_phone})</td>
                <td>${o.total} ₽</td>
                <td>${o.status}</td>
                <td>
                    <select onchange="changeStatus(${o.id}, this.value)">
                        <option value="Готовится" ${o.status === 'Готовится' ? 'selected' : ''}>Готовится</option>
                        <option value="Доставлен" ${o.status === 'Доставлен' ? 'selected' : ''}>Доставлен</option>
                    </select>
                </td>
            </tr>
        `).join('');
    }

    if (type === 'users') {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        document.getElementById('users-table').innerHTML = data.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.login}</td>
                <td>${u.phone}</td>
                <td>${u.role}</td>
                <td>
                    <button onclick="toggleBan(${u.id})">${u.is_banned ? 'Разбанить' : 'Забанить'}</button>
                    <button onclick="deleteUser(${u.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
    }

    if (type === 'reviews') {
        const res = await fetch('/api/admin/reviews');
        const data = await res.json();
        document.getElementById('reviews-table').innerHTML = data.map(r => `
            <tr>
                <td>${r.author}</td>
                <td class="${r.is_hidden ? 'hidden-text' : ''}">${r.text}</td>
                <td>${r.rating} ★</td>
                <td>${r.is_hidden ? 'Скрыт' : 'Опубликован'}</td>
                <td><button onclick="toggleReview(${r.id})">${r.is_hidden ? 'Показать' : 'Скрыть'}</button></td>
            </tr>
        `).join('');
    }

    if (type === 'products') {
        const res = await fetch('/api/products');
        const data = await res.json();
        document.getElementById('products-table').innerHTML = data.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.category === 'drink' ? 'Напиток' : 'Десерт'}</td>
                <td>${p.name}</td>
                <td>${p.price} ₽</td>
                <td><button onclick="deleteProduct(${p.id})">Удалить</button></td>
            </tr>
        `).join('');
    }
}

async function changeStatus(id, status) {
    await fetch(`/api/admin/orders/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
}

async function toggleBan(id) {
    await fetch(`/api/admin/users/${id}/ban`, { method: 'POST' });
    loadData('users');
}

async function deleteUser(id) {
    if (confirm('Удалить пользователя?')) {
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        loadData('users');
    }
}

async function toggleReview(id) {
    await fetch(`/api/admin/reviews/${id}/toggle`, { method: 'POST' });
    loadData('reviews');
}

async function deleteProduct(id) {
    if (confirm('Удалить товар?')) {
        await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
        loadData('products');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadData('orders');

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/logout', { method: 'POST' });
                window.location.href = 'index.html';
            } catch (err) {
                alert('Ошибка при выходе из аккаунта.');
            }
        });
    }

    const addBtn = document.getElementById('addProductBtn');
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const category = document.getElementById('p-category').value;
            const name = document.getElementById('p-name').value.trim();
            const price = document.getElementById('p-price').value;
            const fileInput = document.getElementById('p-image');
            const file = fileInput.files[0];

            if (!name || !price) {
                return alert('Введите название и цену товара.');
            }
            if (!file) {
                return alert('Выберите картинку для товара.');
            }

            const formData = new FormData();
            formData.append('category', category);
            formData.append('name', name);
            formData.append('price', price);
            formData.append('image', file);

            try {
                const res = await fetch('/api/admin/products', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();

                if (res.ok) {
                    alert('Товар успешно добавлен!');
                    document.getElementById('p-name').value = '';
                    document.getElementById('p-price').value = '';
                    document.getElementById('p-image').value = '';
                    loadData('products');
                } else {
                    alert('Ошибка: ' + (data.error || 'Не удалось добавить товар'));
                }
            } catch (err) {
                alert('Ошибка сети при добавлении товара.');
            }
        });
    }
});