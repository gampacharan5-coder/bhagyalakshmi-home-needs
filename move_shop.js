const fs = require('fs');

// 1. Read files
let indexHtml = fs.readFileSync('index.html', 'utf8');
let menuHtml = fs.readFileSync('menu.html', 'utf8');

// 2. Extract 'shop' section from index.html
const shopStart = indexHtml.indexOf('<section id="shop" class="products-section">');
if (shopStart > -1) {
    const shopEnd = indexHtml.indexOf('</section>', shopStart) + 10;
    const shopHtml = indexHtml.substring(shopStart, shopEnd);

    // Remove from index
    indexHtml = indexHtml.substring(0, shopStart) + indexHtml.substring(shopEnd);

    // Add to menu html before the all-products section
    const insertPoint = menuHtml.indexOf('<section id="all-products"');
    if (insertPoint > -1) {
        menuHtml = menuHtml.substring(0, insertPoint) + shopHtml + '\n\n    ' + menuHtml.substring(insertPoint);
    } else {
        // Just append before contact or footer if all-products is missing
        const fallbackPoint = menuHtml.indexOf('<section id="contact"');
        menuHtml = menuHtml.substring(0, fallbackPoint) + shopHtml + '\n\n    ' + menuHtml.substring(fallbackPoint);
    }
}

// 3. Rename references to menu.html -> all-products.html
indexHtml = indexHtml.replace(/menu\.html/g, 'all-products.html');
menuHtml = menuHtml.replace(/menu\.html/g, 'all-products.html');

// Also update 'Explore Collections' link in index.html to point to all-products.html#shop
indexHtml = indexHtml.replace(/href="#shop"/g, 'href="all-products.html#shop"');

// 4. Save files
fs.writeFileSync('index.html', indexHtml);
fs.writeFileSync('all-products.html', menuHtml);

// Delete menu.html
try { fs.unlinkSync('menu.html'); } catch (e) { }

console.log('Done!');
