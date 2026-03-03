document.addEventListener('DOMContentLoaded', () => {

    const loginModal = document.getElementById('login-modal');
    const dashboard = document.getElementById('admin-dashboard');
    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('login-btn');
    const errorMsg = document.getElementById('login-error');

    // Super simple auth (since static site)
    loginBtn.addEventListener('click', () => {
        if (passwordInput.value === 'BLHN@123') {
            loginModal.style.display = 'none';
            dashboard.style.display = 'block';
            loadCustomProducts();
        } else {
            errorMsg.style.display = 'block';
        }
    });

    // Form submission
    const form = document.getElementById('product-form');
    const imageInput = document.getElementById('prod-image');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const file = imageInput.files[0];
        if (!file) {
            alert("Please select an image");
            return;
        }

        // Convert image to Base64 to save in localStorage
        const reader = new FileReader();
        reader.onload = function (event) {
            const base64Image = event.target.result;

            const catSelect = document.getElementById('prod-category');
            const selectedOpt = catSelect.options[catSelect.selectedIndex];
            let displayName = selectedOpt.text;
            if (selectedOpt.parentElement && selectedOpt.parentElement.tagName === 'OPTGROUP') {
                displayName = `${selectedOpt.parentElement.label.replace(' (Custom)', '')} > ${selectedOpt.text}`;
            }

            const newProduct = {
                id: 'custom-' + Date.now(),
                title: document.getElementById('prod-name').value,
                category: catSelect.value,
                categoryDisplayName: selectedOpt.dataset.displayName || displayName,
                image: base64Image,
                origPrice: document.getElementById('prod-orig-price').value,
                offerPrice: document.getElementById('prod-offer-price').value,
                desc: document.getElementById('prod-desc').value,
                dateAdded: new Date().toISOString()
            };

            saveProduct(newProduct);
        };
        reader.readAsDataURL(file);
    });

    function saveProduct(product) {
        let products = JSON.parse(localStorage.getItem('customStoreProducts') || '[]');
        products.push(product);
        localStorage.setItem('customStoreProducts', JSON.stringify(products));

        const successMsg = document.getElementById('success-msg');
        successMsg.innerHTML = 'Product added <strong>locally</strong> to this browser! To make it permanent for all users, please contact the developer.';
        successMsg.style.display = 'block';

        form.reset();
        loadCustomProducts();

        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);
    }

    function loadCustomProducts() {
        const list = document.getElementById('custom-products-list');
        list.innerHTML = '';

        let products = JSON.parse(localStorage.getItem('customStoreProducts') || '[]');

        if (products.length === 0) {
            list.innerHTML = '<p style="color: #777; font-style: italic;">No custom products added yet.</p>';
            return;
        }

        products.forEach(p => {
            const item = document.createElement('div');
            item.className = 'custom-product-item';

            // Generate price display string for admin viewing
            let priceHtml = `₹${p.origPrice}`;
            if (p.offerPrice) {
                priceHtml = `<del style="color:#999; margin-right:5px;">₹${p.origPrice}</del> ₹${p.offerPrice}`;
            }

            item.innerHTML = `
                <img src="${p.image}" alt="${p.title}">
                <div class="custom-product-info">
                    <h4>${p.title}</h4>
                    <p>Category: <strong>${p.category}</strong></p>
                    <p>Price: ${priceHtml}</p>
                </div>
                <button class="delete-btn" onclick="deleteProduct('${p.id}')">Delete</button>
            `;
            list.appendChild(item);
        });
    }

    // Attach to window so inline onclick can use it
    window.deleteProduct = function (id) {
        if (confirm("Are you sure you want to completely remove this product?")) {
            let products = JSON.parse(localStorage.getItem('customStoreProducts') || '[]');
            products = products.filter(p => p.id !== id);
            localStorage.setItem('customStoreProducts', JSON.stringify(products));
            loadCustomProducts();
        }
    };

    // --- Custom Category / Navigation Menu Logic ---
    const categoryForm = document.getElementById('category-form');

    categoryForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const menuName = document.getElementById('new-menu-name').value.trim();
        const brandName = document.getElementById('new-brand-name').value.trim();

        // Slugify the names to create a safe ID (e.g., "Mixers" + "Bajaj" = "mixers-bajaj")
        const menuSlug = menuName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const categoryId = `${menuSlug}-${brandSlug}`;

        const newCategory = {
            id: categoryId,
            menuName: menuName,
            brandName: brandName,
            displayName: `${menuName} > ${brandName}`,
            dateAdded: new Date().toISOString()
        };

        let categories = JSON.parse(localStorage.getItem('customStoreCategories') || '[]');
        // Avoid exact duplicates
        if (!categories.find(c => c.id === newCategory.id)) {
            categories.push(newCategory);
            localStorage.setItem('customStoreCategories', JSON.stringify(categories));
        }

        const catSuccessMsg = document.getElementById('cat-success-msg');
        catSuccessMsg.style.display = 'block';
        categoryForm.reset();

        loadCustomCategories();

        setTimeout(() => {
            catSuccessMsg.style.display = 'none';
        }, 3000);
    });

    function loadCustomCategories() {
        // Load into the custom categories management list
        const catList = document.getElementById('custom-categories-list');
        catList.innerHTML = '';

        // Load into the Product dropdown Select
        const prodCategorySelect = document.getElementById('prod-category');
        // Remove previously added custom optgroups if any, so we can re-render cleanly
        Array.from(prodCategorySelect.querySelectorAll('.custom-optgroup')).forEach(el => el.remove());

        let categories = JSON.parse(localStorage.getItem('customStoreCategories') || '[]');

        if (categories.length === 0) {
            catList.innerHTML = '<p style="color: #777; font-style: italic;">No custom menus added yet.</p>';
            return;
        }

        // Group categories by their Main Menu for the dropdown
        const groupedCategories = {};
        categories.forEach(c => {
            if (!groupedCategories[c.menuName]) groupedCategories[c.menuName] = [];
            groupedCategories[c.menuName].push(c);
        });

        // Add them to the Dropdown
        for (const [menuName, cats] of Object.entries(groupedCategories)) {
            const optGroup = document.createElement('optgroup');
            optGroup.label = menuName + " (Custom)";
            optGroup.className = 'custom-optgroup';

            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.brandName;
                opt.dataset.displayName = c.displayName; // Save full display name so the product saving logic can extract it
                optGroup.appendChild(opt);
            });
            prodCategorySelect.appendChild(optGroup);
        }

        // Add them to the Management List UI
        categories.forEach(c => {
            const item = document.createElement('div');
            item.className = 'custom-product-item';
            item.style.padding = '10px';
            item.innerHTML = `
                <div class="custom-product-info">
                    <h4 style="margin:0;">${c.displayName}</h4>
                    <p style="margin:0; font-size:12px; color:#888;">ID: ${c.id}</p>
                </div>
                <button class="delete-btn" onclick="deleteCategory('${c.id}')">Remove Menu</button>
            `;
            catList.appendChild(item);
        });
    }

    window.deleteCategory = function (id) {
        if (confirm("Remove this custom menu? Products assigned to it won't be deleted, but they might not show up correctly until you reassign them.")) {
            let categories = JSON.parse(localStorage.getItem('customStoreCategories') || '[]');
            categories = categories.filter(c => c.id !== id);
            localStorage.setItem('customStoreCategories', JSON.stringify(categories));
            loadCustomCategories();
        }
    };

    // Load custom categories on startup
    loadCustomCategories();

    // --- Hero Slider Management ---
    const sliderForm = document.getElementById('slider-form');
    const slideImageInput = document.getElementById('slide-image');

    sliderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const file = slideImageInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            const base64Image = event.target.result;
            const newSlide = {
                id: 'slide-' + Date.now(),
                image: base64Image
            };

            let slides = JSON.parse(localStorage.getItem('customStoreSlides') || '[]');
            slides.push(newSlide);
            localStorage.setItem('customStoreSlides', JSON.stringify(slides));

            const msg = document.getElementById('slide-msg');
            msg.style.display = 'block';
            sliderForm.reset();
            loadCustomSlides();

            setTimeout(() => msg.style.display = 'none', 3000);
        };
        reader.readAsDataURL(file);
    });

    function loadCustomSlides() {
        const list = document.getElementById('custom-slides-list');
        list.innerHTML = '';
        const slides = JSON.parse(localStorage.getItem('customStoreSlides') || '[]');

        if (slides.length === 0) {
            list.innerHTML = '<p style="color: #777; font-style: italic;">No custom hero slides.</p>';
            return;
        }

        slides.forEach(s => {
            const item = document.createElement('div');
            item.className = 'custom-product-item';
            item.innerHTML = `
                <img src="${s.image}" style="width: 100px; height: 50px; object-fit: cover; border-radius: 4px;">
                <div class="custom-product-info"></div>
                <button class="delete-btn" onclick="deleteSlide('${s.id}')">Delete</button>
            `;
            list.appendChild(item);
        });
    }

    window.deleteSlide = function (id) {
        if (confirm("Delete this hero slide?")) {
            let slides = JSON.parse(localStorage.getItem('customStoreSlides') || '[]');
            slides = slides.filter(s => s.id !== id);
            localStorage.setItem('customStoreSlides', JSON.stringify(slides));
            loadCustomSlides();
        }
    };
    loadCustomSlides();

    // --- Special Offers Banner Management ---
    const offerForm = document.getElementById('offer-banner-form');
    const offerInput = document.getElementById('offer-text');

    // Pre-fill if exists
    offerInput.value = localStorage.getItem('storeOfferBannerText') || '';

    offerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.setItem('storeOfferBannerText', offerInput.value.trim());

        const msg = document.getElementById('banner-msg');
        msg.textContent = 'Banner updated automatically!';
        msg.style.color = 'green';
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
    });

    document.getElementById('clear-banner-btn').addEventListener('click', () => {
        localStorage.removeItem('storeOfferBannerText');
        offerInput.value = '';

        const msg = document.getElementById('banner-msg');
        msg.textContent = 'Banner removed from storefront.';
        msg.style.color = '#ff9800';
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
    });

    // --- Default / Live Storefront Item Management ---
    const defaultCategoriesList = [
        // Mixers
        { id: 'mixers-preethi', name: 'Mixers > Preethi' },
        { id: 'mixers-prestige', name: 'Mixers > Prestige' },
        { id: 'mixers-ultra', name: 'Mixers > Ultra' },
        { id: 'mixers-ganga', name: 'Mixers > Ganga' },
        { id: 'mixers-electron', name: 'Mixers > Electron' },

        // Grinders
        { id: 'grinders-ultra', name: 'Grinders > Ultra' },
        { id: 'grinders-prestige', name: 'Grinders > Prestige' },
        { id: 'grinders-preethi', name: 'Grinders > Preethi' },
        { id: 'grinders-lakshmi', name: 'Grinders > Lakshmi' },

        // Cookers
        { id: 'cookers-prestige', name: 'Cookers > Prestige' },
        { id: 'cookers-butterfly', name: 'Cookers > Butterfly' },
        { id: 'cookers-ganga', name: 'Cookers > Ganga' },

        // Fans
        { id: 'fans-crompton', name: 'Fans > Crompton' },
        { id: 'fans-havells', name: 'Fans > Havells' },

        // Blenders
        { id: 'blenders-prestige', name: 'Blenders > Prestige' },
        { id: 'blenders-panasonic', name: 'Blenders > Panasonic' },
        { id: 'blenders-mexican', name: 'Blenders > Mexican' },

        // Gas Stoves
        { id: 'gas-stove-preethi', name: 'Gas Stoves > Preethi' },
        { id: 'gas-stove-prestige', name: 'Gas Stoves > Prestige' },
        { id: 'gas-stove-ganga', name: 'Gas Stoves > Ganga' },
        { id: 'gas-stove-butterfly', name: 'Gas Stoves > Butterfly' },

        // Water Filters
        { id: 'water-filters-kent', name: 'Water Filters > Kent' },
        { id: 'water-filters-pure-it', name: 'Water Filters > Pure It' },
        { id: 'water-filters-aquaguard', name: 'Water Filters > Aquaguard' },

        // Misc
        { id: 'induction-cooktops', name: 'Induction Cooktops' }
    ];

    const defaultProductsList = [
        { name: '3-Burner Gas Stove (Premium)', identifyTerm: '3-Burner Gas Stove' },
        { name: 'Table Top Wet Grinder (Premium)', identifyTerm: 'Table Top Wet Grinder' },
        { name: 'Powerful Mixer Grinder (Premium)', identifyTerm: 'Powerful Mixer Grinder' },
        { name: 'Prestige Cooker (Premium)', identifyTerm: 'Prestige Cooker' },
        { name: 'Prestige Cooktop (Premium)', identifyTerm: 'Prestige Cooktop' },
        { name: 'Preethi Zodiac Mixer Grinder', identifyTerm: 'Preethi Zodiac Mixer Grinder' },
        { name: 'Prestige Endura PRO Mixer', identifyTerm: 'Prestige Endura PRO Mixer Grinder' },
        { name: 'Ultra Perfect+ Wet Grinder', identifyTerm: 'Ultra Perfect+ Wet Grinder' },
        { name: 'Preethi Lavender Pro Wet Grinder', identifyTerm: 'Preethi Lavender Pro Wet Grinder' },
        { name: 'Prestige Stainless Steel Cooker', identifyTerm: 'Prestige Stainless Steel Cooker' },
        { name: 'Ganga Cooker', identifyTerm: 'Ganga Cooker' },
        { name: 'Prestige 2-Burner Gas Stove', identifyTerm: 'Prestige 2-Burner Gas Stove' },
        { name: 'Preethi Blue Flame Gas Stove', identifyTerm: 'Preethi Blue Flame' },
        { name: 'Prestige PIC 20.0 Induction Cooktop', identifyTerm: 'Prestige PIC 20.0 Induction Cooktop' }
    ];

    function renderDefaultItemsToggleList(itemsArray, containerId, storageKey, type) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        const hiddenItems = JSON.parse(localStorage.getItem(storageKey) || '[]');

        itemsArray.forEach(item => {
            const isHidden = hiddenItems.includes(item.id || item.identifyTerm);

            const div = document.createElement('div');
            div.className = 'custom-product-item';
            div.style.padding = '8px 12px';
            div.innerHTML = `
                <div class="custom-product-info">
                    <h4 style="margin:0; font-size:14px; ${isHidden ? 'color:#999; text-decoration:line-through;' : ''}">${item.name}</h4>
                </div>
                <button class="toggle-visibility-btn ${isHidden ? 'hidden-mode' : ''}" 
                        onclick="toggleDefaultVisibility('${item.id || item.identifyTerm}', '${storageKey}')">
                    ${isHidden ? 'Show Item' : 'Hide Item'}
                </button>
            `;
            container.appendChild(div);
        });
    }

    window.toggleDefaultVisibility = function (identifier, storageKey) {
        let hiddenItems = JSON.parse(localStorage.getItem(storageKey) || '[]');

        if (hiddenItems.includes(identifier)) {
            // It's hidden, so show it
            hiddenItems = hiddenItems.filter(id => id !== identifier);
        } else {
            // It's visible, so hide it
            hiddenItems.push(identifier);
        }

        localStorage.setItem(storageKey, JSON.stringify(hiddenItems));

        // Re-render both lists just to be safe
        renderDefaultItemsToggleList(defaultCategoriesList, 'default-categories-list', 'hiddenStoreCategories', 'category');
        renderDefaultItemsToggleList(defaultProductsList, 'default-products-list', 'hiddenStoreProducts', 'product');
    };

    renderDefaultItemsToggleList(defaultCategoriesList, 'default-categories-list', 'hiddenStoreCategories', 'category');
    renderDefaultItemsToggleList(defaultProductsList, 'default-products-list', 'hiddenStoreProducts', 'product');

});
