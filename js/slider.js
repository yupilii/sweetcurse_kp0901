document.addEventListener('DOMContentLoaded', () => {
    const reviews = document.querySelectorAll('.review');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let currentIndex = 0;

    function showReview(index) {
        // Убираем класс active у всех
        reviews.forEach(review => review.classList.remove('active'));
        // Добавляем класс active нужному отзыву
        reviews[index].classList.add('active');
    }

    nextBtn.addEventListener('click', () => {
        currentIndex++;
        if (currentIndex >= reviews.length) {
            currentIndex = 0; 
        }
        showReview(currentIndex);
    });

    prevBtn.addEventListener('click', () => {
        currentIndex--;
        if (currentIndex < 0) {
            currentIndex = reviews.length - 1; 
        }
        showReview(currentIndex);
    });
});