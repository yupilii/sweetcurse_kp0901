document.addEventListener('DOMContentLoaded', async () => {
    const reviewContainer = document.querySelector('.review-container');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (!reviewContainer) return;

    try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
            const reviews = await res.json();

            reviews.forEach(review => {
                const initial = review.author.charAt(0).toUpperCase();
                const rating = review.rating || 5;

                let starsHTML = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= rating) {
                        starsHTML += `<img src="image/Star 2.svg" width="39px" alt="звезда">`;
                    } else {
                        starsHTML += `<img src="image/Star 6.svg" width="39px" alt="пустая звезда">`;
                    }
                }

                const reviewHTML = `
                    <div class="review">
                        <div class="verh">
                            <div class="nameuser">
                                <div class="avatar">
                                    <img src="image/Ellipse 4.svg" alt="аватар">
                                    <span class="avatar-letter">${initial}</span>
                                </div>
                                <p>${review.author}</p>
                            </div>
                            <div class="rating">
                                ${starsHTML}
                            </div>
                        </div>
                        <p class="textreview">${review.text}</p>
                    </div>
                `;
                reviewContainer.insertAdjacentHTML('beforeend', reviewHTML);
            });
        }
    } catch (err) { console.error('Ошибка загрузки отзывов:', err); }

    const reviews = document.querySelectorAll('.review');
    let currentIndex = 0;

    if (reviews.length > 0) {
        reviews[0].classList.add('active');
    }

    function showReview(index) {
        reviews.forEach(review => review.classList.remove('active'));
        reviews[index].classList.add('active');
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentIndex++;
            if (currentIndex >= reviews.length) currentIndex = 0;
            showReview(currentIndex);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentIndex--;
            if (currentIndex < 0) currentIndex = reviews.length - 1;
            showReview(currentIndex);
        });
    }
});