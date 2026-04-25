// If already logged in, skip this page
        if (sessionStorage.getItem('guardSession')) {
            window.location.href = 'guard.html';
        }

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = e.target.querySelector('button');
            const errorMsg = document.getElementById('errorMsg');
            const originalText = btn.textContent;
            
            btn.textContent = 'Verifying...';
            btn.disabled = true;
            errorMsg.style.display = 'none';

            const payload = {
                role: 'guard',
                id: document.getElementById('guardId').value,
                password: document.getElementById('guardPassword').value
            };

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (data.success) {
                    // Save session
                    sessionStorage.setItem('guardSession', JSON.stringify({
                        id: payload.id,
                        name: data.name
                    }));
                    window.location.href = 'guard.html';
                } else {
                    errorMsg.textContent = data.message || data.error;
                    errorMsg.style.display = 'block';
                }
            } catch (err) {
                errorMsg.textContent = 'Connection error to authentication server.';
                errorMsg.style.display = 'block';
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });