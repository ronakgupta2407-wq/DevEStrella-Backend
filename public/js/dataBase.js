// Array to store our session products before exporting
        let csvDatabase = [];

        const SUPABASE_URL = 'https://rfbcubnahrqfqnvyucmc.supabase.co/rest/v1/products';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmYmN1Ym5haHJxZnFudnl1Y21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjA3OTQsImV4cCI6MjA5MjY5Njc5NH0.lYvmXAre6h46JEI6tuaASeJOaQCFRKKbkEFOoycCNzU'; // ⚠️ IMPORTANT: Replace this with your actual Supabase anon key

        async function saveToSupabase(newProducts) {
            try {
                const response = await fetch(SUPABASE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Prefer': 'return=minimal' // Prevents returning the full inserted rows to save bandwidth
                    },
                    body: JSON.stringify(newProducts)
                });

                if (!response.ok) {
                    console.error('Supabase error:', await response.text());
                    alert('Failed to save to Supabase. Did you replace YOUR_SUPABASE_ANON_KEY_HERE with your actual key?');
                    return false;
                } else {
                    console.log('Successfully saved to Supabase!');
                    return true;
                }
            } catch (err) {
                console.error('Network error:', err);
                alert('Network error while connecting to Supabase.');
                return false;
            }
        }

        function generateUniqueId() {
            let id;
            do {
                const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
                id = `PRD-${randomStr}`;
            } while (csvDatabase.some(p => p.id === id));
            return id;
        }

        function renderProducts() {
            const tbody = document.getElementById('productTableBody');
            const emptyState = document.getElementById('emptyState');
            const exportBtn = document.getElementById('exportBtn');

            tbody.innerHTML = '';

            if (csvDatabase.length === 0) {
                emptyState.style.display = 'block';
                exportBtn.style.display = 'none';
            } else {
                emptyState.style.display = 'none';
                exportBtn.style.display = 'block';

                csvDatabase.forEach(product => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="font-family: monospace; color: #38bdf8;">${product.id}</td>
                        <td>${product.name}</td>
                        <td>$${parseFloat(product.price).toFixed(2)}</td>
                        <td>${product.quantity}</td>
                        <td>
                            <button class="delete-btn" onclick="deleteProduct('${product.id}')">Remove</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }

        document.getElementById('productForm').addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('productName').value.trim();
            const price = parseFloat(document.getElementById('productPrice').value);
            const quantity = parseInt(document.getElementById('productQuantity').value);

            // Generate multiple distinct items based on the quantity
            const newProducts = [];
            for (let i = 0; i < quantity; i++) {
                const id = generateUniqueId();
                const product = { id, name, price, quantity: 1 };
                csvDatabase.push(product);
                newProducts.push(product);
            }


            // Note: We no longer auto-save here, the user clicks "Save Data to Supabase" button

            // Clear form
            document.getElementById('productForm').reset();

            // Focus back on the first input for quick data entry
            document.getElementById('productName').focus();

            // Re-render table
            renderProducts();
        });

        function deleteProduct(id) {
            csvDatabase = csvDatabase.filter(p => p.id !== id);
            renderProducts();
        }

        async function uploadToSupabase() {
            if (csvDatabase.length === 0) {
                alert("Database is empty.");
                return;
            }

            const btn = document.getElementById('exportBtn');
            const originalText = btn.innerText;
            btn.innerText = 'Saving to Supabase...';
            btn.disabled = true;

            const success = await saveToSupabase(csvDatabase);

            btn.innerText = originalText;
            btn.disabled = false;

            if (success) {
                alert("Successfully saved all items to Supabase!");
                // Clear the table so they don't get uploaded twice
                csvDatabase = [];
                renderProducts();
            }
        }