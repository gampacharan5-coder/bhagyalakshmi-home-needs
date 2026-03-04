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
        let priceHtml = `₹${p.price}`;
        if (p.origPrice) {
            priceHtml = `<del style="color:#999; font-size:0.85em; margin-right:6px;">₹${p.origPrice}</del> <span class="current-price">₹${p.price}</span>`;
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

    if (typeof PRODUCTS_DATA !== 'undefined') {
        renderProducts();
    }

    // --- Dynamic Hero Slider ---
    // customSlides already loaded from Database
    if (customSlides.length > 0) {
        const heroSection = document.getElementById('hero');
        const scrollingWrapper = document.querySelector('.scrolling-wrapper');

        if (heroSection && scrollingWrapper) {
            // Hide the old scrolling track
            scrollingWrapper.style.display = 'none';

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

            // Setup crossfade interval if more than 1 slide
            if (customSlides.length > 1) {
                let currentSlide = 0;
                const slides = sliderContainer.querySelectorAll('.dynamic-hero-slide');

                setInterval(() => {
                    slides[currentSlide].style.opacity = '0';
                    currentSlide = (currentSlide + 1) % slides.length;
                    slides[currentSlide].style.opacity = '1';
                }, 5000); // Change image every 5 seconds
            }
        }
    }

    // --- Dynamic Custom Navigation Categories Loader ---
    // customCategoriesData already loaded from Database
    const mainDropdownContent = document.getElementById('main-dropdown-content');

    if (mainDropdownContent) {
        customCategoriesData.forEach(cat => {
            let targetSubmenu = null;
            const allSubmenus = mainDropdownContent.querySelectorAll('.dropdown-submenu');
            allSubmenus.forEach(sub => {
                const titleNode = sub.querySelector('.dropdown-submenu-title');
                if (titleNode && titleNode.textContent.trim().toLowerCase() === cat.menuName.toLowerCase()) {
                    targetSubmenu = sub;
                }
            });

            if (!targetSubmenu) {
                targetSubmenu = document.createElement('div');
                targetSubmenu.className = 'dropdown-submenu';
                targetSubmenu.innerHTML = `
                    <a href="javascript:void(0);" class="dropdown-submenu-title">${cat.menuName}</a>
                    <div class="dropdown-submenu-content"></div>
                `;
                mainDropdownContent.appendChild(targetSubmenu);
            }

            const submenuContent = targetSubmenu.querySelector('.dropdown-submenu-content');
            if (submenuContent) {
                if (!submenuContent.querySelector(`a[href="#${cat.id}"]`)) {
                    const brandLink = document.createElement('a');
                    brandLink.href = `#${cat.id}`;
                    brandLink.textContent = cat.brandName;
                    submenuContent.appendChild(brandLink);
                }
            }
        });
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

    // Smooth scrolling for navigation links
    const scrollLinks = document.querySelectorAll('a[href^="#"]');

    scrollLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            // Skip generic hash links used for accordion toggles
            if (targetId === '#') return;

            e.preventDefault();

            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                // Calculate the fixed header height offset (approx 80px)
                const headerOffset = 80;
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Live Search Dropdown Functionality
    let globalNavProductCards = [];
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

            // Combine and filter
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

                    itemDiv.addEventListener('click', (e) => {
                        if (!isAllProd) return; // Allow navigation to work naturally

                        e.preventDefault();
                        dropdown.classList.remove('active');
                        searchInput.value = '';

                        const targetCard = document.getElementById(anchorId);
                        if (targetCard) {
                            const headerOffset = 80;
                            const elementPosition = targetCard.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });

                            const originalBg = targetCard.style.backgroundColor;
                            targetCard.style.transition = 'background-color 0.5s ease';
                            targetCard.style.backgroundColor = '#fff3e0';
                            setTimeout(() => { targetCard.style.backgroundColor = originalBg; }, 1500);
                        }
                    });

                    itemDiv.innerHTML = `
                        <img src="${p.image}" class="search-result-img" alt="${p.title}" onerror="this.src='mixer.png'">
                        <div class="search-result-info">
                            <span class="search-result-title">${p.title}</span>
                            <span class="search-result-price">₹${p.price}</span>
                        </div>
                    `;
                    dropdown.appendChild(itemDiv);
                });
            }

            dropdown.classList.add('active');

            if (window.innerWidth <= 768) {
                const navLinks = document.querySelector('.nav-links');
                if (navLinks) navLinks.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 300);
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', function (event) {
        const searchContainer = document.querySelector('.nav-search-container');
        const dropdown = document.getElementById('searchResultsDropdown');

        if (dropdown && searchContainer && !searchContainer.contains(event.target)) {
            dropdown.classList.remove('active');
        }
    });

    // --- Mobile Menu Accordion Handlers ---

    // 1. Toggle Our Products
    const productsToggle = document.getElementById('mobile-products-toggle');
    if (productsToggle) {
        productsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent bubbling to document
            const content = document.getElementById('main-dropdown-content');
            if (content) {
                const isOpen = content.classList.contains('mobile-open');
                // Close all other submenus first for a clean accordion effect
                document.querySelectorAll('.dropdown-submenu-content.mobile-open').forEach(sub => {
                    sub.classList.remove('mobile-open');
                });
                content.classList.toggle('mobile-open');
            }
        });
    }

    // 2. Toggle Submenus (Mixer, Grinder, etc.)
    const subMenuTitles = document.querySelectorAll('.dropdown-submenu-title');
    subMenuTitles.forEach(title => {
        title.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const submenuContent = title.nextElementSibling;
            if (submenuContent) {
                // Optional: close other submenus in the same group
                const parent = title.closest('.dropdown-content');
                if (parent) {
                    parent.querySelectorAll('.dropdown-submenu-content.mobile-open').forEach(sub => {
                        if (sub !== submenuContent) sub.classList.remove('mobile-open');
                    });
                }
                submenuContent.classList.toggle('mobile-open');
            }
        });
    });

    // 3. Close Menu on Link Click
    const closeTriggers = document.querySelectorAll('.nav-close-trigger, .nav-links > li > a:not(#mobile-products-toggle)');
    closeTriggers.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
            // Also reset accordions for next open
            document.querySelectorAll('.dropdown-content.mobile-open, .dropdown-submenu-content.mobile-open').forEach(el => {
                el.classList.remove('mobile-open');
            });
        });
    });

});
