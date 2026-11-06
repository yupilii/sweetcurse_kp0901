document.addEventListener('DOMContentLoaded', async () => {
    const cartLeft = document.getElementById('cart-items-container');
    const qtyDisplay = document.getElementById('cart-total-qty');
    const sumDisplay = document.getElementById('cart-total-price');
    const checkoutBtn = document.querySelector('.cartknop');

    if (!cartLeft) return;

    async function renderCart() {
        try {
            const res = await fetch('/api/cart');
            const cart = await res.json();
            
            cartLeft.innerHTML = '';
            let totalQty = 0;
            let totalSum = 0;

            if (cart.length === 0) {
                cartLeft.innerHTML = '<p style="color: #7D6E94; font-family: \'lora\'; font-size: 30px;">Ваша корзина пуста</p>';
            } else {
                cart.forEach(item => {
                    totalQty += item.qty;
                    totalSum += item.price * item.qty;

                    const itemHTML = `
                        <div class="cartitem">
                            <img src="${item.image}" width="140px" alt="${item.name}" class="cartimg">
                            <div class="cartinfo">
                                <p class="cartname">${item.name}</p>
                                <p class="cartprice">${item.price} ₽</p>
                            </div>
                            <div class="cartqty">
                                <span class="qtybtn minus" data-name="${item.name}">-</span>
                                <span class="qtynum">${item.qty}</span>
                                <span class="qtybtn plus" data-name="${item.name}">+</span>
                            </div>
                        </div>
                    `;
                    cartLeft.insertAdjacentHTML('beforeend', itemHTML);
                });
            }

            if (qtyDisplay) qtyDisplay.textContent = totalQty;
            if (sumDisplay) sumDisplay.textContent = totalSum + ' ₽';

            document.querySelectorAll('.qtybtn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const name = btn.getAttribute('data-name');
                    const delta = btn.classList.contains('plus') ? 1 : -1;
                    
                    await fetch('/api/cart/' + encodeURIComponent(name), {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ delta })
                    });
                    renderCart();
                });
            });

        } catch (err) { 
            console.error(err); 
            cartLeft.innerHTML = '<p style="color: #7D6E94; font-family: \'lora\'; font-size: 30px;">Ошибка загрузки корзины</p>';
        }
    }

    await renderCart();

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const qtyText = qtyDisplay.textContent;
            if (qtyText === '0') {
                alert('Корзина пуста! Сначала добавьте товары.');
            } else {
                window.location.href = 'checkout.html';
            }
        });
    }
});