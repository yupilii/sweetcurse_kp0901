document.addEventListener('DOMContentLoaded', async () => {
    const profileBlock = document.querySelector('.profileblock');
    const profileName = document.querySelector('.profilename');
    const profilePhone = document.querySelector('.profilephone');
    const reviewBtn = document.querySelector('.reviewbtn');

    try {
        const meRes = await fetch('/api/me');
        if (!meRes.ok) { window.location.href = 'index.html'; return; }
        const me = await meRes.json();
        if (profileName) profileName.textContent = me.login;
        if (profilePhone) profilePhone.textContent = me.phone;
    } catch (err) { console.error(err); }

    try {
        const ordersRes = await fetch('/api/orders');
        if (ordersRes.ok) {
            const orders = await ordersRes.json();

            document.querySelectorAll('.orderrow').forEach(row => row.remove());
            const existingEmpty = document.getElementById('empty-orders-msg');
            if (existingEmpty) existingEmpty.remove();

            if (orders.length === 0) {
                const emptyMsg = document.createElement('p');
                emptyMsg.id = 'empty-orders-msg';
                emptyMsg.style.cssText = "font-family:'lora'; font-size:25px; color:#7D6E94; margin-left:119px; margin-top:20px; margin-bottom: 40px;";
                emptyMsg.textContent = 'У вас пока нет заказов.';
                profileBlock.insertBefore(emptyMsg, reviewBtn);
            } else {
                orders.forEach(order => {
                    const date = new Date(order.created_at).toLocaleDateString('ru-RU');
                    const itemsCount = order.qty_total;
                    const rowHTML = `
        <div class="orderrow">
            <span class="ordernumber">№${order.id}</span>
            <span class="orderdate">${date}</span>
            <span class="orderpos">${itemsCount} шт</span>
            <span class="ordersum">${order.total} ₽</span>
            <span class="orderstatus">${order.status}</span>
        </div>
    `;
                    reviewBtn.insertAdjacentHTML('beforebegin', rowHTML);
                });
            }
        }
    } catch (err) { console.error(err); }

    const reviewModal = document.getElementById('reviewModal');
    const reviewForm = document.getElementById('reviewForm');
    const reviewText = document.getElementById('reviewText');
    const charCount = document.getElementById('charCount');
    const stars = document.querySelectorAll('.star');
    let currentRating = 0;

    if (reviewBtn && reviewModal) {
        reviewBtn.addEventListener('click', () => {
            reviewModal.style.display = 'flex';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === reviewModal) reviewModal.style.display = 'none';
    });

    if (reviewText && charCount) {
        reviewText.addEventListener('input', () => {
            charCount.textContent = reviewText.value.length;
        });
    }

    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const val = Number(star.getAttribute('data-value'));
            updateStars(val);
        });

        star.addEventListener('mouseout', () => {
            updateStars(currentRating);
        });

        star.addEventListener('click', () => {
            currentRating = Number(star.getAttribute('data-value'));
            updateStars(currentRating);
        });
    });

    function updateStars(rating) {
        stars.forEach(s => {
            const val = Number(s.getAttribute('data-value'));
            if (val <= rating) {
                s.src = 'image/Star 2.svg';
            } else {
                s.src = 'image/Star 6.svg';
            }
        });
    }

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = reviewText.value.trim();

            if (text.length === 0) return alert('Отзыв не может быть пустым!');
            if (currentRating === 0) return alert('Пожалуйста, поставьте оценку (звезды).');

            try {
                const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, rating: currentRating })
                });
                const data = await res.json();

                if (data.error) {
                    alert(data.error);
                } else {
                    alert('Спасибо за ваш отзыв!');
                    reviewModal.style.display = 'none';
                    reviewForm.reset();
                    charCount.textContent = '0';
                    currentRating = 0;
                    updateStars(0);
                }
            } catch (err) {
                alert('Ошибка при отправке отзыва.');
            }
        });
    }
});