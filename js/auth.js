document.addEventListener('DOMContentLoaded', async () => {
    const profileBtn = document.querySelector('.profile-trigger');
    const registerModal = document.getElementById('registerModal');
    const loginModal = document.getElementById('loginModal');
    const goToLogin = document.getElementById('goToLogin');
    const goToRegister = document.getElementById('goToRegister');
    const phoneInput = document.querySelector('input[type="tel"]');

    const regForm = registerModal ? registerModal.querySelector('form') : null;
    const loginForm = loginModal ? loginModal.querySelector('form') : null;

    let isAuth = false;
    try {
        const res = await fetch('/api/me');
        if (res.ok) isAuth = true;
    } catch (e) { }

    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isAuth) {
                window.location.href = 'profile.html';
            } else if (registerModal) {
                registerModal.style.display = 'flex';
            }
        });
    }

    if (goToLogin) goToLogin.addEventListener('click', () => { registerModal.style.display = 'none'; loginModal.style.display = 'flex'; });
    if (goToRegister) goToRegister.addEventListener('click', () => { loginModal.style.display = 'none'; registerModal.style.display = 'flex'; });

    window.addEventListener('click', (e) => {
        if (e.target === registerModal) registerModal.style.display = 'none';
        if (e.target === loginModal) loginModal.style.display = 'none';
    });

    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputs = regForm.querySelectorAll('input');
            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: inputs[0].value,
                        login: inputs[1].value,
                        password: inputs[2].value,
                        password2: inputs[3].value
                    })
                });
                const data = await res.json();
                if (data.error) alert(data.error);
                else window.location.href = 'profile.html';
            } catch (err) { alert('Ошибка сервера.'); }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputs = loginForm.querySelectorAll('input');
            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ login: inputs[0].value, password: inputs[1].value })
                });
                const data = await res.json();
                if (data.error) alert(data.error);
                else window.location.href = 'profile.html';
            } catch (err) { alert('Ошибка сервера.'); }
        });
    }

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
});