document.addEventListener('DOMContentLoaded', async () => {
    try {
        const meRes = await fetch('/api/me');
        if (!meRes.ok) {
            alert('Для оформления заказа необходимо авторизоваться.');
            window.location.href = 'index.html';
            return;
        }

        const user = await meRes.json();
        const nameInput = document.getElementById('checkout-name');
        const phoneInput = document.getElementById('checkout-phone');

        if (nameInput && !nameInput.value) nameInput.value = user.login;
        if (phoneInput && !phoneInput.value) phoneInput.value = user.phone;

    } catch (err) { console.error(err); }

    const phoneInput = document.querySelector('.phoneinput');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let input = e.target.value.replace(/\D/g, '');
            if (input.length === 0) { e.target.value = ''; return; }
            if (input[0] !== '7') input = '7' + input;
            if (input.length > 11) input = input.substring(0, 11);

            let formatted = '+7';
            if (input.length > 1) formatted += ' (' + input.substring(1, 4);
            if (input.length >= 5) formatted += ') ' + input.substring(4, 7);
            if (input.length >= 8) formatted += '-' + input.substring(7, 9);
            if (input.length >= 10) formatted += '-' + input.substring(9, 11);
            e.target.value = formatted;
        });
    }

    let cartData = [];
    try {
        const res = await fetch('/api/cart');
        cartData = await res.json();
    } catch (e) { console.error(e); }

    const qtyEl = document.querySelectorAll('.checkouttext')[0];
    const sumEl = document.querySelector('.sumtext');

    let totalQty = 0;
    let totalSum = 0;

    cartData.forEach(item => {
        totalQty += item.qty;
        totalSum += item.price * item.qty;
    });

    if (qtyEl) qtyEl.textContent = `Количество позиций: ${totalQty}`;
    if (sumEl) sumEl.innerHTML = `Итоговая сумма: &nbsp;&nbsp;&nbsp;&nbsp; ${totalSum} ₽`;

    const checkoutBtn = document.querySelector('.checkoutbtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            if (cartData.length === 0) return alert('Ваша корзина пуста!');

            const nameInput = document.getElementById('checkout-name');
            const phoneVal = document.getElementById('checkout-phone').value;

            let payment = 'Не выбран';
            document.querySelectorAll('input[name="payment"]').forEach(r => { if (r.checked) payment = r.nextElementSibling.textContent; });

            let delivery = 'Не выбран';
            document.querySelectorAll('input[name="delivery"]').forEach(r => { if (r.checked) delivery = r.nextElementSibling.textContent; });

            if (!nameInput.value || !phoneVal) return alert('Заполните имя и телефон.');

            try {
                const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: nameInput.value,
                        phone: phoneVal,
                        payment: payment,
                        delivery: delivery
                    })
                });

                const data = await res.json();
                if (data.error) alert(data.error);
                else {
                    alert('Заказ успешно оформлен! Номер вашего заказа: №' + data.order.id);
                    window.location.href = 'profile.html';
                }
            } catch (err) { alert('Ошибка при оформлении заказа.'); }
        });
    }
});