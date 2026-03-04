document.addEventListener('DOMContentLoaded', async () => {

    const loginModal = document.getElementById('login-modal');
    const dashboard = document.getElementById('admin-dashboard');
    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('login-btn');
    const errorMsg = document.getElementById('login-error');

    // Super simple auth (since static site)
    loginBtn.addEventListener('click', async () => {
        if (passwordInput.value === 'BLHN@123') {
            loginModal.style.display = 'none';
            dashboard.style.display = 'block';
            await loadCustomProducts();
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

        // Convert image to Base64 to save
        const reader = new FileReader();
        reader.onload = async function (event) {
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
                featured: document.getElementById('prod-featured').checked,
                dateAdded: new Date().toISOString()
            };

            await saveProduct(newProduct);
        };
        reader.readAsDataURL(file);
    });

    async function saveProduct(product) {
        await Database.saveCustomProduct(product);

        const successMsg = document.getElementById('success-msg');
        if (window.useFirebase) {
            successMsg.innerHTML = 'Product added <strong>globally</strong>! All users will see this.';
        } else {
            successMsg.innerHTML = 'Product added <strong>locally</strong> to this browser! To make it permanent for all users, please contact the developer or configure Firebase.';
        }
        successMsg.style.display = 'block';

        form.reset();
        await loadCustomProducts();

        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);
    }

    async function loadCustomProducts() {
        const list = document.getElementById('custom-products-list');
        list.innerHTML = 'Loading...';

        let products = await Database.getCustomProducts();

        list.innerHTML = '';
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

            let badgesHtml = '';
            if (p.featured) {
                badgesHtml = '<span style="background: #2196F3; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 10px;">PREMIUM</span>';
            }

            item.innerHTML = `
                <img src="${p.image}" alt="${p.title}">
                <div class="custom-product-info">
                    <h4>${p.title} ${badgesHtml}</h4>
                    <p>Category: <strong>${p.category}</strong></p>
                    <p>Price: ${priceHtml}</p>
                </div>
                <button class="delete-btn" onclick="deleteProduct('${p.id}')">Delete</button>
            `;
            list.appendChild(item);
        });
    }

    // Attach to window so inline onclick can use it
    window.deleteProduct = async function (id) {
        if (confirm("Are you sure you want to completely remove this product?")) {
            await Database.deleteCustomProduct(id);
            await loadCustomProducts();
        }
    };

    // --- Custom Category / Navigation Menu Logic ---
    const categoryForm = document.getElementById('category-form');

    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const menuName = document.getElementById('new-menu-name').value.trim();
        const brandName = document.getElementById('new-brand-name').value.trim();

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

        await Database.saveCustomCategory(newCategory);

        const catSuccessMsg = document.getElementById('cat-success-msg');
        catSuccessMsg.style.display = 'block';
        categoryForm.reset();

        await loadCustomCategories();

        setTimeout(() => {
            catSuccessMsg.style.display = 'none';
        }, 3000);
    });

    async function loadCustomCategories() {
        const catList = document.getElementById('custom-categories-list');
        catList.innerHTML = 'Loading...';

        const prodCategorySelect = document.getElementById('prod-category');
        Array.from(prodCategorySelect.querySelectorAll('.custom-optgroup')).forEach(el => el.remove());

        let categories = await Database.getCustomCategories();

        catList.innerHTML = '';
        if (categories.length === 0) {
            catList.innerHTML = '<p style="color: #777; font-style: italic;">No custom menus added yet.</p>';
            return;
        }

        const groupedCategories = {};
        categories.forEach(c => {
            if (!groupedCategories[c.menuName]) groupedCategories[c.menuName] = [];
            groupedCategories[c.menuName].push(c);
        });

        for (const [menuName, cats] of Object.entries(groupedCategories)) {
            const optGroup = document.createElement('optgroup');
            optGroup.label = menuName + " (Custom)";
            optGroup.className = 'custom-optgroup';

            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.brandName;
                opt.dataset.displayName = c.displayName;
                optGroup.appendChild(opt);
            });
            prodCategorySelect.appendChild(optGroup);
        }

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

    window.deleteCategory = async function (id) {
        if (confirm("Remove this custom menu? Products assigned to it won't be deleted, but they might not show up correctly until you reassign them.")) {
            await Database.deleteCustomCategory(id);
            await loadCustomCategories();
        }
    };

    await loadCustomCategories();

    // --- Hero Slider Management ---
    const sliderForm = document.getElementById('slider-form');
    const slideImageInput = document.getElementById('slide-image');

    sliderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const file = slideImageInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function (event) {
            const base64Image = event.target.result;
            const newSlide = {
                id: 'slide-' + Date.now(),
                image: base64Image
            };

            await Database.saveCustomSlide(newSlide);

            const msg = document.getElementById('slide-msg');
            msg.style.display = 'block';
            sliderForm.reset();
            await loadCustomSlides();

            setTimeout(() => msg.style.display = 'none', 3000);
        };
        reader.readAsDataURL(file);
    });

    async function loadCustomSlides() {
        const list = document.getElementById('custom-slides-list');
        list.innerHTML = 'Loading...';

        const slides = await Database.getCustomSlides();
        list.innerHTML = '';

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

    window.deleteSlide = async function (id) {
        if (confirm("Delete this hero slide?")) {
            await Database.deleteCustomSlide(id);
            await loadCustomSlides();
        }
    };
    await loadCustomSlides();

    // --- Special Offers Banner Management ---
    const offerForm = document.getElementById('offer-banner-form');
    const offerInput = document.getElementById('offer-text');

    const settings = await Database.getSettings();
    offerInput.value = settings.storeOfferBannerText || '';

    offerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await Database.saveSetting('storeOfferBannerText', offerInput.value.trim());

        const msg = document.getElementById('banner-msg');
        msg.textContent = 'Banner updated ' + (window.useFirebase ? 'globally' : 'locally') + '!';
        msg.style.color = 'green';
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
    });

    document.getElementById('clear-banner-btn').addEventListener('click', async () => {
        await Database.saveSetting('storeOfferBannerText', "");
        offerInput.value = '';

        const msg = document.getElementById('banner-msg');
        msg.textContent = 'Banner removed from storefront.';
        msg.style.color = '#ff9800';
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
    });



});
