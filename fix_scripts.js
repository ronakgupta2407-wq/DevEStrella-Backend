const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(file, '.html');
    
    const scriptTag = `<script src="js/${name}.js"></script>`;
    
    // If the script tag exists
    if (content.includes(scriptTag)) {
        // Remove it from its current position
        content = content.replace(scriptTag, '');
        
        // Add it just before </body>
        content = content.replace('</body>', `    ${scriptTag}\n</body>`);
        
        fs.writeFileSync(filePath, content);
        console.log(`Fixed ${file}`);
    }
});
