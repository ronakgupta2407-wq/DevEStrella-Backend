// AUTHENTICATION CHECK
        const sessionStr = sessionStorage.getItem('guardSession');
        if (!sessionStr) {
            window.location.href = 'guardLogin.html';
        }
        const sessionInfo = JSON.parse(sessionStr);

document.getElementById('guardNameDisplay').textContent = sessionInfo.name;

let lastScannedCode = null;
        let lastScanTime = 0;

        async function verifyToken(token) {
            const statusBox = document.getElementById('statusResult');
            statusBox.className = 'status-box'; // reset
            statusBox.innerHTML = '<h2 style="color:white;">Verifying...</h2>';
            statusBox.style.display = 'block';

            try {
                const res = await fetch(`/api/verify/${token}`);
                const data = await res.json();

                if (res.ok && data.success) {
                    // VERIFIED GREEN
                    let itemsHtml = '<div class="items-list"><h3>Purchased Items:</h3>';
                    data.items.forEach(i => {
                        itemsHtml += `<div class="item-row">
                            <span>${i.name} <br><small style="color:#94a3b8">${i.id}</small></span>
                            <span>Qty: ${i.quantity}</span>
                        </div>`;
                    });
                    itemsHtml += '</div>';

                    statusBox.className = 'status-box success';
                    statusBox.innerHTML = `
                        <h2>✅ VERIFIED - CLEAR TO GO</h2>
                        <p>${data.message}</p>
                        ${itemsHtml}
                        <button onclick="resumeScanner()" style="width: 100%; margin-top: 1rem; padding: 0.75rem; background: #10b981; color: white; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; font-family: 'Inter', sans-serif;">Scan Next Bill</button>
                    `;
                } else {
                    // FLAGGED RED
                    statusBox.className = 'status-box error';
                    statusBox.innerHTML = `
                        <h2>❌ FLAGGED</h2>
                        <p>${data.message}</p>
                        <p style="margin-top:1rem; font-weight:bold;">DO NOT LET CUSTOMER PASS.</p>
                        <button onclick="resumeScanner()" style="width: 100%; margin-top: 1rem; padding: 0.75rem; background: #ef4444; color: white; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; font-family: 'Inter', sans-serif;">Scan Next Bill</button>
                    `;
                }
            } catch (err) {
                statusBox.className = 'status-box error';
                statusBox.innerHTML = `
                    <h2>⚠️ SYSTEM ERROR</h2>
                    <p>Could not connect to Security Server.</p>
                    <p style="font-size:0.8rem; color:#94a3b8;">Ensure Node.js backend is running on port 3000.</p>
                    <button onclick="resumeScanner()" style="width: 100%; margin-top: 1rem; padding: 0.75rem; background: #ef4444; color: white; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; font-family: 'Inter', sans-serif;">Scan Next Bill</button>
                `;
            }
        }

        async function onScanSuccess(decodedText, decodedResult) {
            const now = Date.now();
            // Prevent double scans
            if (decodedText === lastScannedCode && (now - lastScanTime) < 3000) return;
            
            // PAUSE SCANNER
            try { html5QrcodeScanner.pause(true); } catch(e) {}

            lastScannedCode = decodedText;
            lastScanTime = now;
            
            if (navigator.vibrate) navigator.vibrate(200);
            
            await verifyToken(decodedText);
        }

        function resumeScanner() {
            try { html5QrcodeScanner.resume(); } catch(e) {}
            document.getElementById('statusResult').style.display = 'none';
            lastScannedCode = null;
        }

        function onScanFailure(error) {
            // Ignored
        }

        // Initialize Scanner
        let html5QrcodeScanner = new Html5QrcodeScanner(
            "reader", { fps: 10, formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] }, false
        );
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);

        function simulateScan() {
            const token = document.getElementById('devToken').value.trim();
            if (token) {
                lastScannedCode = null;
                onScanSuccess(token, null);
                document.getElementById('devToken').value = '';
            }
        }