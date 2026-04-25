// Database & Cart Keys
        const DB_KEY = 'store_products';
        const CART_KEY = 'user_cart';

        // Supabase Configuration
        const SUPABASE_URL = 'https://rfbcubnahrqfqnvyucmc.supabase.co/rest/v1/products';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmYmN1Ym5haHJxZnFudnl1Y21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjA3OTQsImV4cCI6MjA5MjY5Njc5NH0.lYvmXAre6h46JEI6tuaASeJOaQCFRKKbkEFOoycCNzU';

        // Load/Save Cart
        function getCart() {
            const cart = localStorage.getItem(CART_KEY);
            return cart ? JSON.parse(cart) : [];
        }

        function saveCart(cart) {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
            renderCart();
        }

        // Add item to cart
        function addToCart(product) {
            const cart = getCart();
            const existingItem = cart.find(item => item.id === product.id);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    ...product,
                    quantity: 1
                });
            }
            saveCart(cart);
        }

        // Update item quantity
        function updateQuantity(id, delta) {
            let cart = getCart();
            const item = cart.find(i => i.id === id);

            if (item) {
                item.quantity += delta;
                if (item.quantity <= 0) {
                    cart = cart.filter(i => i.id !== id);
                }
                saveCart(cart);
            }
        }

        // Remove item from cart
        function removeItem(id) {
            let cart = getCart();
            cart = cart.filter(i => i.id !== id);
            saveCart(cart);
        }

        // Remove sold items from Supabase database
        async function removeSoldItems(cart) {
            for (const item of cart) {
                try {
                    await fetch(`${SUPABASE_URL}?id=eq.${item.id}`, {
                        method: 'DELETE',
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': `Bearer ${SUPABASE_KEY}`
                        }
                    });
                    console.log(`Deleted sold item ${item.id} from database`);
                } catch (err) {
                    console.error(`Failed to delete ${item.id}:`, err);
                }
            }
        }

        // Generate and show invoice
        function generateInvoice(cart, subtotal, secureToken) {
            const billNo = Math.floor(100 + Math.random() * 900);
            const date = new Date().toLocaleDateString();
            
            document.getElementById('invoiceDate').innerText = `Date: ${date}`;
            document.getElementById('invoiceBillNo').innerText = `Bill No: #${billNo}`;
            
            const tbody = document.getElementById('invoiceTableBody');
            tbody.innerHTML = '';
            
            cart.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.name}<br><small style="color:#94a3b8">${item.id}</small></td>
                    <td>${item.quantity}</td>
                    <td>$${(item.price * item.quantity).toFixed(2)}</td>
                `;
                tbody.appendChild(tr);
            });
            
            const gst = subtotal * 0.18;
            const finalTotal = subtotal + gst;
            
            document.getElementById('invoiceSubtotal').innerText = `$${subtotal.toFixed(2)}`;
            document.getElementById('invoiceTax').innerText = `$${gst.toFixed(2)}`;
            document.getElementById('invoiceTotal').innerText = `$${finalTotal.toFixed(2)}`;
            
            // Draw QR Code
            const qrContainer = document.getElementById('invoice-qrcode');
            qrContainer.innerHTML = ''; // Clear previous
            if (secureToken) {
                new QRCode(qrContainer, {
                    text: secureToken,
                    width: 128,
                    height: 128,
                    colorDark : "#0f172a",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            }

            document.getElementById('invoiceModal').style.display = 'flex';
        }

        function closeInvoice() {
            document.getElementById('invoiceModal').style.display = 'none';
        }

        // Checkout via Razorpay
        function checkout() {
            const cart = getCart();
            if (cart.length === 0) {
                alert("Your cart is empty!");
                return;
            }

            // Calculate total amount
            let totalAmount = 0;
            cart.forEach(item => {
                totalAmount += (item.price * item.quantity);
            });

            // Convert to smallest currency unit (paise for INR)
            const amountInPaise = Math.round(totalAmount * 100);

            var options = {
                "key": "rzp_test_Sexhu4dUl1TZLH", // Razorpay Test Key
                "amount": amountInPaise.toString(),
                "currency": "INR",
                "name": "Smart Cart Shopping",
                "description": "In-store checkout payment",
                "handler": async function (response){
                    // 1. Remove sold items from Supabase
                    await removeSoldItems(cart);
                    
                    // 2. Register bill with local Node.js server to get Secure Token
                    try {
                        const res = await fetch('/api/bills', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ items: cart })
                        });
                        const data = await res.json();
                        
                        // 3. Generate Invoice with QR Code
                        generateInvoice(cart, totalAmount, data.secureToken);
                        
                    } catch (err) {
                        console.error("Failed to register bill with guard server:", err);
                        alert("Payment succeeded, but could not register bill with security server.");
                        generateInvoice(cart, totalAmount, null);
                    }

                    // 4. Clear local cart
                    localStorage.setItem(CART_KEY, JSON.stringify([]));
                    renderCart();
                },
                "prefill": {
                    "name": "Guest Customer",
                    "email": "customer@example.com",
                    "contact": "9999999999"
                },
                "theme": {
                    "color": "#10b981" // Emerald green
                }
            };
            var rzp1 = new Razorpay(options);
            rzp1.on('payment.failed', function (response){
                alert("Payment Failed: " + response.error.description);
            });
            rzp1.open();
        }

        // Render Cart UI
        function renderCart() {
            const cart = getCart();
            const container = document.getElementById('cart-items-container');
            const totalEl = document.getElementById('cart-total');

            container.innerHTML = '';
            let total = 0;

            if (cart.length === 0) {
                container.innerHTML = '<div class="empty-cart">Your cart is currently empty. Scan a product to start shopping.</div>';
            } else {
                cart.forEach(item => {
                    const itemTotal = item.price * item.quantity;
                    total += itemTotal;

                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'cart-item';
                    itemDiv.innerHTML = `
                        <div class="item-details">
                            <span class="item-name">${item.name}</span>
                            <span class="item-price">$${parseFloat(item.price).toFixed(2)} each</span>
                        </div>
                        <div class="item-controls">
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                            <span class="qty-display">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                            <button class="remove-btn" onclick="removeItem('${item.id}')">Remove</button>
                        </div>
                    `;
                    container.appendChild(itemDiv);
                });
            }

            totalEl.innerText = `$${total.toFixed(2)}`;
        }

        // Scanner Logic
        let lastScannedCode = null;
        let lastScanTime = 0;
        let feedbackTimeout;

        function showFeedback(message, type) {
            const feedbackEl = document.getElementById('scan-feedback');
            feedbackEl.innerText = message;
            feedbackEl.className = type === 'success' ? 'feedback-success' : 'feedback-error';
            feedbackEl.style.opacity = 1;

            clearTimeout(feedbackTimeout);
            feedbackTimeout = setTimeout(() => {
                feedbackEl.style.opacity = 0;
            }, 3000);
        }

        async function onScanSuccess(decodedText, decodedResult) {
            const now = Date.now();
            // Prevent double scans within 2 seconds for the same item
            if (decodedText === lastScannedCode && (now - lastScanTime) < 2000) {
                return;
            }

            // PAUSE SCANNER IMMEDIATELY
            try { html5QrcodeScanner.pause(true); } catch(e) {}

            lastScannedCode = decodedText;
            lastScanTime = now;

            showFeedback(`Looking up...`, 'success');

            try {
                // Query Supabase for the specific Product ID
                const response = await fetch(`${SUPABASE_URL}?id=eq.${decodedText}&select=*`, {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                });
                
                if (!response.ok) throw new Error('Network response was not ok');
                
                const data = await response.json();
                
                // Supabase returns an array for select queries. If empty, product isn't found.
                if (data && data.length > 0) {
                    const product = data[0];
                    addToCart(product);
                    showFeedback(`Added ${product.name} to cart!`, 'success');
                    if (navigator.vibrate) navigator.vibrate(200);
                } else {
                    showFeedback(`Product ID '${decodedText}' not found.`, 'error');
                }
            } catch (err) {
                console.error("Error fetching product:", err);
                showFeedback(`Error connecting to database.`, 'error');
            }

            // Show Resume Button
            document.getElementById('resumeScanBtn').style.display = 'block';
        }

        function resumeScanner() {
            try { html5QrcodeScanner.resume(); } catch(e) {}
            document.getElementById('resumeScanBtn').style.display = 'none';
            document.getElementById('scan-feedback').style.opacity = 0;
            lastScannedCode = null; // allow scanning same item again
        }

        function onScanFailure(error) {
            // Usually ignored
        }

        // Initialize Scanner & Cart using the robust settings
        let html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
            },
            /* verbose= */ false
        );

        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        renderCart();

        // Developer Test Function
        function simulateScan() {
            const input = document.getElementById('devTestId');
            const testId = input.value.trim();
            if (testId) {
                // Clear the debounce variables so we can test the same ID repeatedly without waiting
                lastScannedCode = null;
                lastScanTime = 0;
                onScanSuccess(testId, null);
                input.value = ''; // Clear input after testing
            } else {
                alert("Please enter a Product ID to simulate a scan.");
            }
        }
        // Admin Login Modal Logic
        function openAdminModal() {
            document.getElementById('adminModal').style.display = 'flex';
        }

        function closeAdminModal() {
            document.getElementById('adminModal').style.display = 'none';
        }

        document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = e.target.querySelector('button[type="submit"]');
            const errorMsg = document.getElementById('adminErrorMsg');
            const originalText = btn.textContent;
            
            btn.textContent = 'Verifying...';
            btn.disabled = true;
            errorMsg.style.display = 'none';

            const payload = {
                username: document.getElementById('adminUsername').value,
                password: document.getElementById('adminPassword').value
            };

            try {
                const res = await fetch('/api/auth/adminLogin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (data.success) {
                    sessionStorage.setItem('adminSession', 'true');
                    sessionStorage.setItem('adminName', data.name);
                    window.location.href = 'adminPanel.html';
                } else {
                    errorMsg.textContent = data.message || 'Invalid credentials';
                    errorMsg.style.display = 'block';
                }
            } catch (err) {
                errorMsg.textContent = 'Connection error.';
                errorMsg.style.display = 'block';
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });