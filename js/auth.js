document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.querySelector('.iconnav a[href="#"]');
    const registerModal = document.getElementById('registerModal');
    const loginModal = document.getElementById('loginModal');
    const goToLogin = document.getElementById('goToLogin');
    const goToRegister = document.getElementById('goToRegister');
    const phoneInput = document.querySelector('input[type="tel"]');

    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.style.display = 'flex';
        });
    }

    if (goToLogin) {
        goToLogin.addEventListener('click', () => {
            registerModal.style.display = 'none';
            loginModal.style.display = 'flex';
        });
    }

    if (goToRegister) {
        goToRegister.addEventListener('click', () => {
            loginModal.style.display = 'none';
            registerModal.style.display = 'flex';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === registerModal) {
            registerModal.style.display = 'none';
        }
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let input = e.target.value.replace(/\D/g, ''); 
            
            if (input.length === 0) {
                e.target.value = '';
                return;
            }

            if (input[0] !== '7') {
                input = '7' + input;
            }

            if (input.length > 11) {
                input = input.substring(0, 11);
            }

            // Форматируем
            let formatted = '+7';
            
            if (input.length > 1) {
                formatted += ' (' + input.substring(1, 4);
            }
            if (input.length >= 5) {
                formatted += ') ' + input.substring(4, 7);
            }
            if (input.length >= 8) {
                formatted += '-' + input.substring(7, 9);
            }
            if (input.length >= 10) {
                formatted += '-' + input.substring(9, 11);
            }

            e.target.value = formatted;
        });

        phoneInput.addEventListener('keydown', (e) => {
            if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                (e.keyCode === 65 && e.ctrlKey === true) || 
                (e.keyCode === 67 && e.ctrlKey === true) || 
                (e.keyCode === 86 && e.ctrlKey === true) || 
                (e.keyCode === 88 && e.ctrlKey === true) || 
                (e.keyCode >= 35 && e.keyCode <= 40)) {   
                return;
            }
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
    }
});