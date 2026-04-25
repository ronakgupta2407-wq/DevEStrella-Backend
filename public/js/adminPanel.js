if (!sessionStorage.getItem('adminSession')) {
            window.location.href = 'index.html';
        }
        
        function logoutAdmin() {
            sessionStorage.removeItem('adminSession');
            sessionStorage.removeItem('adminName');
            window.location.href = 'index.html';
        }

document.getElementById('adminNameDisplay').textContent = sessionStorage.getItem('adminName') || 'Admin';