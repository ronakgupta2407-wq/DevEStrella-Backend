// Initialize Supabase
        const supabaseUrl = 'https://rfbcubnahrqfqnvyucmc.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmYmN1Ym5haHJxZnFudnl1Y21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjA3OTQsImV4cCI6MjA5MjY5Njc5NH0.lYvmXAre6h46JEI6tuaASeJOaQCFRKKbkEFOoycCNzU';
        const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

        let allProductIDs = [];
        const input = document.getElementById('productID');
        const resultsContainer = document.getElementById('autocompleteResults');
        const statusMsg = document.getElementById('statusMsg');

        // Fetch IDs on page load
        async function fetchProductsFromSupabase() {
            try {
                const { data, error } = await supabaseClient
                    .from('products')
                    .select('id');

                if (error) {
                    const exactError = error.message || error.details || "Unknown Error";
                    statusMsg.textContent = `Setup Error: ${exactError}`;
                    statusMsg.style.color = "#ef4444";
                    alert(`Supabase Error: ${exactError}\n\nPlease check your table name and column name in the code.`);
                    return;
                }

                if (data && data.length > 0) {
                    // Extract IDs into a clean array
                    allProductIDs = data.map(item => item.id).filter(id => id);
                    statusMsg.textContent = `✓ Connected. ${allProductIDs.length} products ready for search.`;
                    statusMsg.style.color = "#10b981";
                } else {
                    statusMsg.textContent = "No Products Found in Table";
                }
            } catch (err) {
                statusMsg.textContent = "Connection Error";
                statusMsg.style.color = "#ef4444";
            }
        }

        // Run fetch as soon as the window loads
        window.onload = fetchProductsFromSupabase;

        // Custom Autocomplete Search Logic
        input.addEventListener('input', function () {
            const val = this.value.trim().toLowerCase();
            resultsContainer.innerHTML = ''; // Clear previous

            if (!val) {
                resultsContainer.style.display = 'none';
                return;
            }

            // Filter the fetched IDs based on what user types
            const matches = allProductIDs.filter(id => id.toString().toLowerCase().includes(val));

            if (matches.length > 0) {
                // Display matches
                matches.forEach(match => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-item';
                    div.textContent = match;
                    div.onclick = function () {
                        input.value = match; // fill input
                        resultsContainer.style.display = 'none'; // hide dropdown
                        generateQR(match); // INSTANTLY GENERATE
                    };
                    resultsContainer.appendChild(div);
                });
            } else {
                // Display no match found
                const div = document.createElement('div');
                div.className = 'autocomplete-no-match';
                div.textContent = `No PRD found matching "${val}"`;
                resultsContainer.appendChild(div);
            }

            resultsContainer.style.display = 'block';
        });

        // Hide dropdown if clicked outside
        document.addEventListener('click', function (e) {
            if (e.target !== input && e.target !== resultsContainer) {
                resultsContainer.style.display = 'none';
            }
        });

        // Generate QR Logic (runs instantly upon selection)
        function generateQR(selectedID) {
            // Clear previous QR code
            document.getElementById('qrcode').innerHTML = "";

            // Hide empty state and show QR container + Download button
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('qrcode').style.display = 'block';
            document.getElementById('productSummary').style.display = 'block';
            document.getElementById('downloadBtn').style.display = 'block';

            // Generate new QR code
            new QRCode(document.getElementById("qrcode"), {
                text: selectedID,
                width: 220,
                height: 220,
                colorDark: "#0f172a", // Dark slate to match theme
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H // High error correction for better scanning
            });

            // Update summary UI
            document.getElementById('resID').textContent = selectedID;
        }

        // Download QR Code Image
        document.getElementById('downloadBtn').addEventListener('click', function () {
            // qrcode.js renders an <img /> or <canvas>. We grab the img src.
            const qrImage = document.querySelector('#qrcode img');
            const encodedID = document.getElementById('resID').textContent;

            if (qrImage && qrImage.src) {
                const a = document.createElement('a');
                a.href = qrImage.src;
                a.download = `QR_${encodedID}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                // Fallback if browser forces canvas rendering
                const canvas = document.querySelector('#qrcode canvas');
                if (canvas) {
                    const a = document.createElement('a');
                    a.href = canvas.toDataURL("image/png");
                    a.download = `QR_${encodedID}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            }
        });