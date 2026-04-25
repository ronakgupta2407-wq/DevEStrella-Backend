async function loadGuards() {
            try {
                const res = await fetch('/api/auth/guards');
                const data = await res.json();
                
                const tbody = document.getElementById('guardTableBody');
                
                if (data.error) {
                    tbody.innerHTML = `<tr><td colspan="3" style="color:#ef4444;">Error: ${data.error}</td></tr>`;
                    return;
                }

                if (data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" class="loading">No guards registered yet.</td></tr>';
                    return;
                }

                tbody.innerHTML = '';
                data.forEach(guard => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${guard.name}</td>
                        <td><span style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; font-family: monospace;">${guard.id}</span></td>
                        <td style="text-align: right;">
                            <button class="btn-delete" onclick="deleteGuard('${guard.id}')">Remove</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (err) {
                console.error(err);
                document.getElementById('guardTableBody').innerHTML = '<tr><td colspan="3" style="color:#ef4444;">Failed to connect to server.</td></tr>';
            }
        }

        async function deleteGuard(id) {
            if (!confirm(`Are you sure you want to remove guard ${id}?`)) return;
            
            try {
                const res = await fetch(`/api/auth/guards/${id}`, { method: 'DELETE' });
                const data = await res.json();
                
                if (data.success) {
                    loadGuards();
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (err) {
                alert('Connection error');
            }
        }

        document.getElementById('guardForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = e.target.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Adding...';
            btn.disabled = true;

            const payload = {
                name: document.getElementById('guardName').value,
                id: document.getElementById('guardId').value,
                password: document.getElementById('guardPassword').value
            };

            try {
                const res = await fetch('/api/auth/addGuard', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (data.success) {
                    e.target.reset();
                    loadGuards();
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (err) {
                alert('Connection error');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });

        // Load initially
        loadGuards();