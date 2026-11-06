document.addEventListener('DOMContentLoaded', () => {
    const btnDrinks = document.getElementById('btn-drinks');
    const btnDeserts = document.getElementById('btn-deserts');
    const drinksGroup = document.getElementById('drinks-group');
    const desertsGroup = document.getElementById('deserts-group');

    if (btnDrinks && btnDeserts && drinksGroup && desertsGroup) {
        btnDrinks.addEventListener('click', () => {
            drinksGroup.style.display = 'flex';
            desertsGroup.style.display = 'none';
        });

        btnDeserts.addEventListener('click', () => {
            drinksGroup.style.display = 'none';
            desertsGroup.style.display = 'flex';
        });
    }
});