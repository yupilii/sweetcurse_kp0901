document.addEventListener('DOMContentLoaded', () => {
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

    document.querySelectorAll('.knopka').forEach(btn => {
        btn.addEventListener('click', async (e) => {
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
        });
    });
});