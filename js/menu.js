document.addEventListener('DOMContentLoaded', async () => {
    const openMenuBtn = document.querySelector('.knop1');
    if (openMenuBtn && openMenuBtn.textContent.includes('Открыть меню')) {
        openMenuBtn.addEventListener('click', () => {
            const menuSection = document.getElementById('menuchka');
            if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    const btnDrinks = document.getElementById('btn-drinks');
    const btnDeserts = document.getElementById('btn-deserts');
    const drinksGroup = document.getElementById('drinks-group');
    const desertsGroup = document.getElementById('deserts-group');

    if (btnDrinks && btnDeserts && drinksGroup && desertsGroup) {
        btnDrinks.addEventListener('click', () => { drinksGroup.style.display = 'flex'; desertsGroup.style.display = 'none'; });
        btnDeserts.addEventListener('click', () => { drinksGroup.style.display = 'none'; desertsGroup.style.display = 'flex'; });
    }

    try {
        const res = await fetch('/api/products');
        const products = await res.json();

        drinksGroup.innerHTML = '';
        desertsGroup.innerHTML = '';

        const drinks = products.filter(p => p.category === 'drink');
        const desserts = products.filter(p => p.category === 'dessert');

        function renderRows(items, container, isDrink) {
            const chunks = [];
            for (let i = 0; i < items.length; i += 3) {
                chunks.push(items.slice(i, i + 3));
            }

            chunks.forEach(chunk => {
                let rowHTML = '<div class="menucard">';

                chunk.forEach(p => {
                    const cardClass = isDrink ? 'card' : 'card desertcard';
                    const fonImg = isDrink ? 'image/cartnapitki (1).svg' : 'image/cartdesert (1).svg';

                    rowHTML += `
                        <div class="${cardClass}">
                            <img class="cardfon" src="${fonImg}" alt="фон карточки">
                            <div class="product-wrapper">
                                <img class="cardproduct" src="${p.image_url}" alt="товар">
                                <p class="cardname">${p.name}</p>
                            </div>
                            <div class="cardd">
                                <p class="price">${p.price} ₽</p>
                                <button class="knopka">В корзину</button>
                            </div>
                        </div>
                    `;
                });

                rowHTML += '</div>';
                container.insertAdjacentHTML('beforeend', rowHTML);
            });
        }

        if (drinks.length > 0) renderRows(drinks, drinksGroup, true);
        if (desserts.length > 0) renderRows(desserts, desertsGroup, false);

    } catch (err) {
        console.error('Ошибка загрузки меню:', err);
    }

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('knopka')) {
            const btn = e.target;
            const card = btn.closest('.card');
            const name = card.querySelector('.cardname').textContent;
            const price = parseInt(card.querySelector('.price').textContent.replace(/\D/g, ''));
            const image = card.querySelector('.cardproduct').getAttribute('src');

            try {
                const res = await fetch('/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, price, image })
                });

                if (res.status === 401) {
                    const registerModal = document.getElementById('registerModal');
                    if (registerModal) registerModal.style.display = 'flex';
                    return;
                }

                if (res.ok) {
                    const orig = btn.textContent;
                    btn.textContent = 'Добавлено!';
                    btn.style.backgroundColor = '#CDBDD8';
                    btn.style.color = '#484453';
                    setTimeout(() => {
                        btn.textContent = orig;
                        btn.style.backgroundColor = '';
                        btn.style.color = '';
                    }, 1000);
                }
            } catch (err) { console.error(err); }
        }
    });
});