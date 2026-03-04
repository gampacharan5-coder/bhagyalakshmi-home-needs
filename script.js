// Wait for the DOM to fully load before running scripts
document.addEventListener("DOMContentLoaded", async () => {

    // --- PRELOAD GLOBAL DATA FROM DATABASE ---
    const customProducts = await Database.getCustomProducts();
    const settings = await Database.getSettings();
    const hiddenProducts = settings.hiddenStoreProducts || [];
    const hiddenCategories = settings.hiddenStoreCategories || [];
    const offerText = settings.storeOfferBannerText || "";
    const customSlides = await Database.getCustomSlides();
    const customCategoriesData = await Database.getCustomCategories();
    const customMarquees = await Database.getCustomMarquees();

    window.globalStoreData = { customProducts, hiddenProducts };

    console.log("Global Store Data Loaded:", window.globalStoreData);
    console.log("PRODUCTS_DATA Loaded?", typeof PRODUCTS_DATA !== 'undefined');

    // --- Mobile Menu Toggle ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // --- Unified Rendering Engine ---
    function createProductCard(p, index) {
        let priceHtml = `₹${p.origPrice || p.price || 0}`;
        if (p.offerPrice) {
            priceHtml = `<del style="color:#999; font-size:0.85em; margin-right:6px;">₹${p.origPrice}</del> <span class="current-price">₹${p.offerPrice}</span>`;
        } else if (p.price) {
            // Fallback for older data if it exists
            priceHtml = `<span class="current-price">₹${p.price}</span>`;
        }

        const card = document.createElement('div');
        card.className = 'product-card';
        card.id = `prod-${p.id || 'custom-' + index}`;

        card.innerHTML = `
            <img src="${p.image}" alt="${p.title}" onerror="this.src='mixer.png'">
            <div class="product-info" style="text-align: left;">
                <h3 class="product-title">${p.title}</h3>
                <p class="product-price">${priceHtml}</p>
                <p class="product-desc">${p.desc || ''}</p>
            </div>
        `;
        return card;
    }

    function renderProducts() {
        const premiumGrid = document.getElementById('premium-products-grid');
        const dynamicContainer = document.getElementById('all-products-dynamic-container');

        // Data is passed from the parent scope

        // Combine permanent and custom products
        const allItems = [...PRODUCTS_DATA, ...(Array.isArray(customProducts) ? customProducts : [])];
        console.log("Total items to render:", allItems.length);

        // 1. Render Premium/Featured Collection
        if (premiumGrid) {
            premiumGrid.innerHTML = '';
            const featured = allItems.filter(p => p.featured && !hiddenProducts.includes(p.title));
            console.log("Featured items count:", featured.length);
            featured.forEach((p, idx) => {
                premiumGrid.appendChild(createProductCard(p, idx));
            });
        }

        // 2. Render All Products Page Content
        if (dynamicContainer) {
            dynamicContainer.innerHTML = '';

            // Group by category
            const categories = {};
            allItems.forEach(p => {
                if (hiddenProducts.includes(p.title) || hiddenCategories.includes(p.category)) return;

                if (!categories[p.category]) categories[p.category] = [];
                categories[p.category].push(p);
            });

            // Render each category
            for (const [catId, products] of Object.entries(categories)) {
                const section = document.createElement('section');
                section.className = 'products-section';
                section.style.backgroundColor = '#eef2f5';

                let displayTitle = catId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                const customCat = customCategoriesData.find(c => c.id === catId);
                if (customCat) displayTitle = customCat.displayName;

                section.innerHTML = `
                    <div id="${catId}" style="max-width: 1200px; margin: 0 auto 30px auto; text-align: left; padding-top: 40px; margin-top: -20px;">
                        <h2 class="section-title" style="text-align: left; margin-bottom: 10px; border-bottom: 2px solid #ddd; padding-bottom: 10px;">${displayTitle}</h2>
                    </div>
                    <div class="product-grid"></div>
                `;

                const grid = section.querySelector('.product-grid');
                products.forEach((p, idx) => {
                    grid.appendChild(createProductCard(p, idx));
                });

                dynamicContainer.appendChild(section);
            }
        }
    }

    function renderNavigationMenu() {
        const menuContainer = document.getElementById('main-dropdown-content');
        if (!menuContainer) return;

        menuContainer.innerHTML = '';

        if (!customCategoriesData || customCategoriesData.length === 0) {
            menuContainer.innerHTML = '<a href="javascript:void(0);" style="padding: 10px 20px; color: #888; font-style: italic;">No categories added</a>';
            return;
        }

        // Group categories by menuName and De-duplicate brand names
        const grouped = {};
        customCategoriesData.forEach(cat => {
            const mName = cat.menuName || "Products";
            if (!grouped[mName]) grouped[mName] = [];

            // Only add if this brand isn't already in this menu group
            if (!grouped[mName].some(existing => existing.brandName === cat.brandName)) {
                grouped[mName].push(cat);
            }
        });

        // Create submenus
        for (const [menuName, categories] of Object.entries(grouped)) {
            const submenu = document.createElement('div');
            submenu.className = 'dropdown-submenu';

            let submenuHtml = `<a href="javascript:void(0);" class="dropdown-submenu-title">${menuName}</a>`;
            submenuHtml += `<div class="dropdown-submenu-content">`;

            categories.forEach(cat => {
                const isAllProd = window.location.pathname.includes('all-products.html');
                const linkHref = (isAllProd ? '' : 'all-products.html') + '#' + cat.id;
                submenuHtml += `<a href="${linkHref}" class="nav-close-trigger">${cat.brandName}</a>`;
            });

            submenuHtml += `</div>`;
            submenu.innerHTML = submenuHtml;
            menuContainer.appendChild(submenu);
        }
    }

    function handleHashScroll() {
        const hash = window.location.hash;
        if (hash && hash !== '#') {
            const cleanId = hash.replace('#', '');
            const target = document.getElementById(cleanId);
            if (target) {
                setTimeout(() => {
                    const headerOffset = 95;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }
    }

    if (typeof PRODUCTS_DATA !== 'undefined') {
        renderProducts();
        renderNavigationMenu();

        // Handle initial hash in URL
        setTimeout(handleHashScroll, 800);
    }

    // Listen for hash changes (for menu clicks on the same page)
    window.addEventListener('hashchange', handleHashScroll);

    // --- Dynamic Hero Slider ---
    if (customSlides.length > 0) {
        const heroSection = document.getElementById('hero');
        const scrollingWrapper = document.querySelector('.scrolling-wrapper');

        if (heroSection && scrollingWrapper) {
            // WE NO LONGER HIDE THE SCROLLING WRAPPER
            // because the user wants "decorative sides" on top of the background.
            // scrollingWrapper.style.display = 'none';

            // Create a container for our full-screen fading slides
            const sliderContainer = document.createElement('div');
            sliderContainer.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; overflow: hidden;";

            customSlides.forEach((slide, idx) => {
                const slideBg = document.createElement('div');
                slideBg.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('${slide.image}'); background-size: cover; background-position: center; opacity: ${idx === 0 ? 1 : 0}; transition: opacity 2s ease-in-out;`;
                slideBg.className = 'dynamic-hero-slide';
                sliderContainer.appendChild(slideBg);
            });

            heroSection.appendChild(sliderContainer);

            if (customSlides.length > 1) {
                let currentSlide = 0;
                const slides = sliderContainer.querySelectorAll('.dynamic-hero-slide');
                setInterval(() => {
                    slides[currentSlide].style.opacity = '0';
                    currentSlide = (currentSlide + 1) % slides.length;
                    slides[currentSlide].style.opacity = '1';
                }, 5000);
            }
        }
    }

    // --- Dynamic Decorative Marquee ---
    if (customMarquees.length > 0) {
        const scrollingTrack = document.querySelector('.scrolling-track');
        if (scrollingTrack) {
            scrollingTrack.innerHTML = '';
            // Duplicate multiple times to ensure the marquee is filled and loops smoothly
            const repeatCount = customMarquees.length < 5 ? 4 : 2;
            for (let i = 0; i < repeatCount; i++) {
                customMarquees.forEach(m => {
                    const img = document.createElement('img');
                    img.src = m.image;
                    img.className = 'scroll-img';
                    img.alt = 'Decorative Icon';
                    scrollingTrack.appendChild(img);
                });
            }
        }
    }

    // --- Dynamic Offers Banner ---
    // offerText already loaded from Database
    if (offerText) {
        const banner = document.createElement('div');
        banner.style.cssText = "background-color: #ff9800; color: #fff; text-align: center; padding: 10px; font-weight: bold; overflow: hidden; white-space: nowrap;";
        const marquee = document.createElement('marquee');
        marquee.scrollAmount = 8;
        marquee.textContent = offerText;
        banner.appendChild(marquee);
        document.body.insertBefore(banner, document.body.firstChild);
    }
    // ---------------------------------------------

    // --- Consolidated Navigation Delegation ---
    document.addEventListener('click', (e) => {
        // 1. Handle Internal Hash Links (Smooth Scroll with Offset)
        const anchor = e.target.closest('a[href^="#"], a[href*="all-products.html#"]');
        if (anchor) {
            const url = new URL(anchor.href, window.location.origin);
            const hash = url.hash;

            // If it's a hash link for the current conceptual "Products" navigation
            if (hash && hash !== '#' && (url.pathname === window.location.pathname || url.pathname.endsWith('all-products.html') || window.location.pathname.endsWith('all-products.html'))) {
                const cleanId = hash.replace('#', '');
                const target = document.getElementById(cleanId);

                if (target) {
                    e.preventDefault();

                    // Close mobile menu if it was open
                    if (navLinks && navLinks.classList.contains('active')) {
                        navLinks.classList.remove('active');
                    }
                    document.querySelectorAll('.mobile-open').forEach(el => el.classList.remove('mobile-open'));

                    const headerOffset = 95;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Update URL hash without jumping
                    history.pushState(null, null, hash);
                }
            }
        }

        // 2. Handle Mobile Menu Toggles (Accordion)
        const productsToggle = e.target.closest('#mobile-products-toggle');
        if (productsToggle) {
            e.preventDefault();
            const content = document.getElementById('main-dropdown-content');
            if (content) {
                // Close all other submenus first
                document.querySelectorAll('.dropdown-submenu-content.mobile-open').forEach(sub => {
                    sub.classList.remove('mobile-open');
                });
                content.classList.toggle('mobile-open');
            }
        }

        const subTitle = e.target.closest('.dropdown-submenu-title');
        if (subTitle && window.innerWidth <= 768) {
            e.preventDefault();
            const submenuContent = subTitle.nextElementSibling;
            if (submenuContent) {
                const parent = subTitle.closest('.dropdown-content');
                if (parent) {
                    parent.querySelectorAll('.dropdown-submenu-content.mobile-open').forEach(sub => {
                        if (sub !== submenuContent) sub.classList.remove('mobile-open');
                    });
                }
                submenuContent.classList.toggle('mobile-open');
            }
        }

        // 3. Generic Close Triggers
        if (e.target.closest('.nav-close-trigger') || (e.target.closest('.nav-links > li > a') && !e.target.closest('#mobile-products-toggle'))) {
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
            document.querySelectorAll('.mobile-open').forEach(el => el.classList.remove('mobile-open'));
        }
    });

    // Live Search Dropdown Functionality
    let searchDebounceTimer;
    window.filterProducts = function () {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            const searchInput = document.getElementById('navSearchInput');
            const dropdown = document.getElementById('searchResultsDropdown');
            if (!searchInput || !dropdown) return;

            const searchTerm = searchInput.value.toLowerCase().trim();
            dropdown.innerHTML = '';

            if (searchTerm.length === 0) {
                dropdown.classList.remove('active');
                return;
            }

            const customProducts = window.globalStoreData.customProducts;
            const hiddenProducts = window.globalStoreData.hiddenProducts;
            const allItems = [...PRODUCTS_DATA, ...customProducts].filter(p => !hiddenProducts.includes(p.title));
            const results = allItems.filter(p => p.title.toLowerCase().includes(searchTerm));

            if (results.length === 0) {
                dropdown.innerHTML = `<div class="search-no-results">No products found for "${searchTerm}"</div>`;
            } else {
                results.forEach((p, idx) => {
                    const itemDiv = document.createElement('a');
                    const isAllProd = window.location.pathname.includes('all-products.html');
                    const anchorId = `prod-${p.id || 'custom-' + idx}`;
                    itemDiv.href = (isAllProd ? '' : 'all-products.html') + '#' + anchorId;
                    itemDiv.className = 'search-result-item';

                    const displayPrice = p.offerPrice || p.origPrice || p.price || 0;
                    itemDiv.innerHTML = `
                        <img src="${p.image}" class="search-result-img" alt="${p.title}" onerror="this.src='mixer.png'">
                        <div class="search-result-info">
                            <span class="search-result-title">${p.title}</span>
                            <span class="search-result-price">₹${displayPrice}</span>
                        </div>
                    `;
                    dropdown.appendChild(itemDiv);
                });
            }
            dropdown.classList.add('active');
        }, 300);
    };

    // Close search dropdown when clicking outside
    document.addEventListener('click', (event) => {
        const searchContainer = document.querySelector('.nav-search-container');
        const dropdown = document.getElementById('searchResultsDropdown');
        if (dropdown && searchContainer && !searchContainer.contains(event.target)) {
            dropdown.classList.remove('active');
        }
    });

});
