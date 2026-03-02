// Wait for the DOM to fully load before running scripts
document.addEventListener("DOMContentLoaded", () => {

    // --- Mobile Menu Toggle ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // --- Dynamic Offers Banner ---
    const offerText = localStorage.getItem('storeOfferBannerText');
    if (offerText) {
        // Create the banner element
        const banner = document.createElement('div');
        banner.style.cssText = "background-color: #ff9800; color: #fff; text-align: center; padding: 10px; font-weight: bold; overflow: hidden; white-space: nowrap;";

        // Make it marquee/scroll
        const marquee = document.createElement('marquee');
        marquee.scrollAmount = 8;
        marquee.textContent = offerText;
        banner.appendChild(marquee);

        // Insert it as the very first element in the body
        document.body.insertBefore(banner, document.body.firstChild);
    }

    // --- Dynamic Hero Slider ---
    const customSlides = JSON.parse(localStorage.getItem('customStoreSlides') || '[]');
    if (customSlides.length > 0) {
        const scrollingTrack = document.querySelector('.scrolling-track');
        if (scrollingTrack) {
            // Empty the default hardcoded static images
            scrollingTrack.innerHTML = '';

            // Generate the track twice for seamless infinite scrolling, just like the original HTML
            for (let i = 0; i < 2; i++) {
                customSlides.forEach(slide => {
                    const img = document.createElement('img');
                    img.src = slide.image;
                    img.className = 'scroll-img';
                    img.alt = 'Custom Hero Slide';
                    // Optional styling if the user didn't upload identical dimensions
                    img.style.objectFit = 'cover';
                    scrollingTrack.appendChild(img);
                });
            }
        }
    }

    // --- Dynamic Custom Navigation Categories Loader ---
    const customCategories = JSON.parse(localStorage.getItem('customStoreCategories') || '[]');
    const mainDropdownContent = document.getElementById('main-dropdown-content');

    if (mainDropdownContent) {
        customCategories.forEach(cat => {
            // Find existing submenu by its Title
            let targetSubmenu = null;
            const allSubmenus = mainDropdownContent.querySelectorAll('.dropdown-submenu');
            allSubmenus.forEach(sub => {
                const titleNode = sub.querySelector('.dropdown-submenu-title');
                if (titleNode && titleNode.textContent.trim().toLowerCase() === cat.menuName.toLowerCase()) {
                    targetSubmenu = sub;
                }
            });

            // If it doesn't exist, create a new top-level sub-menu block inside Our Products
            if (!targetSubmenu) {
                targetSubmenu = document.createElement('div');
                targetSubmenu.className = 'dropdown-submenu';
                targetSubmenu.innerHTML = `
                    <a href="javascript:void(0);" class="dropdown-submenu-title">${cat.menuName}</a>
                    <div class="dropdown-submenu-content"></div>
                `;
                mainDropdownContent.appendChild(targetSubmenu);
            }

            // Append the new brand link
            const submenuContent = targetSubmenu.querySelector('.dropdown-submenu-content');
            if (submenuContent) {
                // Ensure we don't accidentally add duplicates if it's somehow run multiple times
                if (!submenuContent.querySelector(`a[href="#${cat.id}"]`)) {
                    const brandLink = document.createElement('a');
                    brandLink.href = `#${cat.id}`;
                    brandLink.textContent = cat.brandName;
                    submenuContent.appendChild(brandLink);
                }
            }
        });
    }

    // --- Dynamic Custom Products Loader ---
    const customProducts = JSON.parse(localStorage.getItem('customStoreProducts') || '[]');
    customProducts.forEach(p => {
        let sectionHeading = document.getElementById(p.category);
        let gridToAppend = null;

        // If the section doesn't exist in the HTML yet (because it's a brand new custom category)
        if (!sectionHeading) {
            sectionHeading = document.createElement('div');
            sectionHeading.id = p.category;
            sectionHeading.style.cssText = "max-width: 1200px; margin: 40px auto 30px auto; text-align: left; padding-top: 40px; margin-top: -20px;";

            // Use saved categoryDisplayName or fallback to ID
            const headingTitle = p.categoryDisplayName || p.category.replace(/-/g, ' ');
            sectionHeading.innerHTML = `<h3 style="font-size: 24px; color: var(--primary-color); border-bottom: 2px solid #ddd; padding-bottom: 10px;">${headingTitle}</h3>`;

            gridToAppend = document.createElement('div');
            gridToAppend.className = 'product-grid';
            gridToAppend.style.cssText = "grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); justify-content: start;";

            // Append it to the main 'All Products' bucket
            const allProductsContainer = document.getElementById('all-products') || document.querySelector('.products-section');
            if (allProductsContainer) {
                allProductsContainer.appendChild(sectionHeading);
                allProductsContainer.appendChild(gridToAppend);
            }
        }
        // If it existing, find the adjacent grid
        else if (sectionHeading.nextElementSibling && sectionHeading.nextElementSibling.classList.contains('product-grid')) {
            gridToAppend = sectionHeading.nextElementSibling;
        }

        if (gridToAppend) {
            let priceHtml = `₹${p.origPrice}`;
            if (p.offerPrice) {
                priceHtml = `<del style="color:#999; font-size:0.85em; margin-right:6px;">₹${p.origPrice}</del> <span class="current-price">₹${p.offerPrice}</span>`;
            }

            const newCard = document.createElement('div');
            newCard.className = 'product-card';
            newCard.innerHTML = `
                <img src="${p.image}" alt="${p.title}" onerror="this.src='cooker.png'">
                <div class="product-info" style="text-align: left;">
                    <h3 class="product-title">${p.title}</h3>
                    <p class="product-price">${priceHtml}</p>
                    <p class="product-desc">${p.desc}</p>
                </div>
            `;
            gridToAppend.appendChild(newCard);
        }
    });
    // --------------------------------------

    // --- Hide Default Items (Admin Configured) ---
    const hiddenCategories = JSON.parse(localStorage.getItem('hiddenStoreCategories') || '[]');
    hiddenCategories.forEach(catId => {
        // Hide the section header div
        const sectionDiv = document.getElementById(catId);
        if (sectionDiv) {
            sectionDiv.style.display = 'none';
            // Also hide the adjacent product grid for that category
            if (sectionDiv.nextElementSibling && sectionDiv.nextElementSibling.classList.contains('product-grid')) {
                sectionDiv.nextElementSibling.style.display = 'none';
            }
        }

        // Hide from dropdown menu navigation
        const navLink = document.querySelector(`a[href="#${catId}"]`);
        if (navLink) navLink.style.display = 'none';
    });

    const hiddenProducts = JSON.parse(localStorage.getItem('hiddenStoreProducts') || '[]');
    if (hiddenProducts.length > 0) {
        const allProductCards = document.querySelectorAll('.product-card');
        allProductCards.forEach(card => {
            const titleEl = card.querySelector('.product-title');
            if (titleEl) {
                // If the title contains any of the hidden terms (e.g. '3-Burner Gas Stove')
                const shouldHide = hiddenProducts.some(term => titleEl.textContent.includes(term));
                if (shouldHide) {
                    card.style.display = 'none';
                    // We also add a custom class so the AI Chatbot scraper knows to skip it
                    card.classList.add('admin-hidden-product');
                }
            }
        });
    }
    // ---------------------------------------------

    // Smooth scrolling for navigation links
    const scrollLinks = document.querySelectorAll('a[href^="#"]');

    scrollLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
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

    // Chatbot functionality
    const chatButton = document.getElementById('chatButton');
    const chatWindow = document.getElementById('chatWindow');
    const closeChat = document.getElementById('closeChat');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');

    // Toggle chat window
    chatButton.addEventListener('click', () => {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            chatInput.focus();
        }
    });

    closeChat.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });

    // Simulate AI Store Assistant
    let lastSearchTerms = [];

    const getBotResponse = (message) => {
        const lowerMsg = message.toLowerCase();

        // Basic conversational responses
        if (lowerMsg === 'hello' || lowerMsg === 'hi' || lowerMsg === 'hey' || lowerMsg.includes('start') || lowerMsg === 'menu') {
            return "Hello! I can help you find products. Just tell me what you are looking for, like 'mixer', 'Prestige cooker', or ask 'find mixers under 4000'.";
        } else if (lowerMsg.includes('contact') || lowerMsg.includes('phone') || lowerMsg.includes('call')) {
            return "You can call us at +91 12345 67890 between 10 AM and 9 PM, Monday to Saturday.";
        } else if (lowerMsg.includes('location') || lowerMsg.includes('where')) {
            return "We are located on Main Road in Rajahmundry, Andhra Pradesh.";
        }

        // Detect price constraints
        let isLookingForCheap = lowerMsg.includes('less cost') || lowerMsg.includes('cheap') || lowerMsg.includes('less price') || lowerMsg.includes('low cost') || lowerMsg.includes('low price') || lowerMsg.includes('budget');
        let maxBudget = Infinity;

        // Try to find "under X" or "below X" or "less than X"
        const underMatch = lowerMsg.match(/(?:under|below|less than|max) (\d+)/);
        if (underMatch) {
            maxBudget = parseInt(underMatch[1], 10);
            isLookingForCheap = true; // Implies price sort
        }

        // Dynamic product search querying the page's actual HTML products (ignoring explicitly hidden ones)
        const productCards = Array.from(document.querySelectorAll('.product-card')).filter(card => !card.classList.contains('admin-hidden-product'));
        const foundProducts = [];
        const seenTitles = new Set();

        // Filter out common conversational words to find the actual product keywords
        const stopWords = ['can', 'you', 'show', 'me', 'the', 'some', 'what', 'are', 'is', 'for', 'and', 'with', 'about', 'details', 'price', 'cost', 'how', 'much', 'please', 'want', 'need', 'have', 'do', 'any', 'a', 'an', 'in', 'of', 'to', 'cheap', 'less', 'under', 'below', 'budget', 'low', 'than', 'only', 'which', 'that', 'it', 'on', 'at', 'i', 'looking', 'find', 'search'];
        let searchTerms = lowerMsg.replace(/[^\w\s]/gi, '').split(/\s+/).filter(word => word.length > 2 && !stopWords.includes(word) && isNaN(word));

        // Use context from previous message if no new valid nouns were provided but price filters were
        if (searchTerms.length === 0 && (isLookingForCheap || maxBudget !== Infinity) && lastSearchTerms.length > 0) {
            searchTerms = lastSearchTerms;
        } else if (searchTerms.length > 0) {
            lastSearchTerms = searchTerms;
        }

        if (searchTerms.length === 0 && !isLookingForCheap) {
            return "Could you please specify a product? For example, ask for 'mixers', 'Prestige', or 'grinder'.";
        }

        productCards.forEach(card => {
            const titleEl = card.querySelector('.product-title');
            const descEl = card.querySelector('.product-desc');
            const priceEl = card.querySelector('.product-price');

            if (titleEl && descEl && priceEl) {
                const title = titleEl.textContent;
                const desc = descEl.textContent;

                const currentPriceEl = priceEl.querySelector('.current-price');
                // Use current price if available to calculate budget constraints
                const activePriceStr = currentPriceEl ? currentPriceEl.textContent : priceEl.textContent;

                // Grab innerHTML so the chat renders the strike-through exactly as it is on the card
                const displayPriceHTML = priceEl.innerHTML;

                // Parse integer from string like ₹1,999
                const numericPrice = parseInt(activePriceStr.replace(/[^\d]/g, ''), 10);

                const searchString = (title + " " + desc + " " + title.replace(/-/g, '')).toLowerCase();

                let matchScore = 0;
                let matchesAllTerms = true;

                // If they ONLY asked for cheap products with no search terms
                if (searchTerms.length === 0) {
                    matchScore = 1;
                } else {
                    for (let term of searchTerms) {
                        // special handling for plural/singular
                        let singularTerm = term.endsWith('s') ? term.slice(0, -1) : term;
                        if (searchString.includes(term) || searchString.includes(singularTerm)) {
                            matchScore++;
                        } else {
                            matchesAllTerms = false;
                        }
                    }
                }

                // If keywords matched AND it's under the requested budget
                if (matchesAllTerms && matchScore > 0 && numericPrice <= maxBudget) {
                    if (!seenTitles.has(title)) {
                        seenTitles.add(title);
                        // Give the card an ID if it doesn't have one so we can link to it
                        if (!card.id) {
                            card.id = 'product-' + title.replace(/\s+/g, '-').toLowerCase();
                        }
                        foundProducts.push({ title, priceStr: displayPriceHTML, numericPrice, desc, matchScore, id: card.id });
                    }
                }
            }
        });

        if (foundProducts.length > 0) {
            // ALWAYS prioritize relevance (most keyword matches first), then price (cheapest first)
            foundProducts.sort((a, b) => {
                if (b.matchScore !== a.matchScore) {
                    return b.matchScore - a.matchScore; // Relevance FIRST
                }
                return a.numericPrice - b.numericPrice; // Then lowest price
            });

            let topProducts;
            let response = "";
            let hiddenCount = 0;

            // If user explicitly asks for the cheapest/lowest price, strictly filter to the best single match.
            if (isLookingForCheap) {
                // Ensure we only look at the highest matchScore tier
                const highestScore = foundProducts[0].matchScore;
                const bestMatches = foundProducts.filter(p => p.matchScore === highestScore);

                topProducts = bestMatches.slice(0, 1);
                response = "Here is the most affordable exact match";
                hiddenCount = foundProducts.length - 1;
            } else {
                topProducts = foundProducts.slice(0, 3);
                response = "Here are the best matches";
                hiddenCount = foundProducts.length - 3;
            }

            if (maxBudget !== Infinity) response += ` under ₹${maxBudget}`;
            response += ":<br><br>";

            topProducts.forEach(product => {
                // Make the title a clickable link
                response += `• <a href="#${product.id}" class="chat-product-link" onclick="scrollToProduct(event, '${product.id}')" style="color: var(--primary-color); font-weight:bold; text-decoration: underline;">${product.title}</a><br>&nbsp;&nbsp;Price: ${product.priceStr}<br>&nbsp;&nbsp;Specs: ${product.desc}<br><br>`;
            });

            if (hiddenCount > 0) {
                response += `(And <strong style="color:var(--primary-color);">${hiddenCount}</strong> more. Try searching with more specific keywords!)`;
            }

            return response.trim();
        }

        if (maxBudget !== Infinity) {
            return `I couldn't find any "${searchTerms.join(' ')}" under ₹${maxBudget}. Try increasing your budget or changing the product type!`;
        }

        return `I couldn't find exact matches for "${searchTerms.join(' ')}". We have Mixers, Grinders, Cookers, Gas Stoves, and Induction Cooktops. Try asking for one of those!`;
    };

    const addMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        // Use innerHTML so the anchor links render correctly
        msgDiv.innerHTML = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
    };

    // Make scrollToProduct available globally so inline onclick handlers in the chat can reach it
    window.scrollToProduct = function (event, targetId) {
        event.preventDefault();
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Highlight the product card briefly
            const originalBg = targetElement.style.backgroundColor;
            const originalTransition = targetElement.style.transition;
            targetElement.style.transition = 'background-color 0.5s ease';
            targetElement.style.backgroundColor = '#fff3e0'; // Light orange highlight

            setTimeout(() => {
                targetElement.style.backgroundColor = originalBg;
                setTimeout(() => {
                    targetElement.style.transition = originalTransition;
                }, 500);
            }, 1500);
        }
    };

    const handleSend = () => {
        const text = chatInput.value.trim();
        if (text === '') return;

        // Add user message
        addMessage(text, 'user');
        chatInput.value = '';

        // Simulate thinking delay then add bot response
        setTimeout(() => {
            const botReply = getBotResponse(text);
            addMessage(botReply, 'bot');
        }, 600 + Math.random() * 600);
    };

    sendButton.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    // Live Search Dropdown Functionality
    window.filterProducts = function () {
        const searchInput = document.getElementById('navSearchInput');
        const dropdown = document.getElementById('searchResultsDropdown');
        if (!searchInput || !dropdown) return;

        const searchTerm = searchInput.value.toLowerCase().trim();
        const productCards = document.querySelectorAll('.product-card');

        // Clear previous results
        dropdown.innerHTML = '';

        if (searchTerm.length === 0) {
            dropdown.classList.remove('active');

            // Re-show all product cards if they were previously hidden
            productCards.forEach(card => card.style.display = 'block');
            return;
        }

        let hasResults = false;

        // Use a Set to track unique product titles (to avoid duplicates from sections)
        const seenTitles = new Set();

        productCards.forEach((card, index) => {
            const titleEl = card.querySelector('.product-title');
            const descEl = card.querySelector('.product-desc');
            const priceEl = card.querySelector('.product-price');
            const imgEl = card.querySelector('img');

            const title = titleEl ? titleEl.textContent : '';
            const desc = descEl ? descEl.textContent.toLowerCase() : '';
            const price = priceEl ? priceEl.textContent : '';
            const imgSrc = imgEl ? imgEl.src : '';

            // Give the card an ID if it doesn't have one so we can scroll to it
            if (!card.id) {
                card.id = 'product-' + index + '-' + title.replace(/\s+/g, '-').toLowerCase();
            }

            // Restore visibility in the main page (optional: you could keep them filtered or leave them alone)
            card.style.display = 'block';

            if (!seenTitles.has(title) && title.toLowerCase().includes(searchTerm)) {
                hasResults = true;
                seenTitles.add(title);

                const itemDiv = document.createElement('a');
                itemDiv.href = '#' + card.id; // Link to specific product ID
                itemDiv.className = 'search-result-item';

                // Add click listener to scroll to products and close dropdown
                itemDiv.addEventListener('click', (e) => {
                    e.preventDefault();
                    dropdown.classList.remove('active');
                    searchInput.value = '';

                    // Calculate the fixed header height offset (approx 80px)
                    const headerOffset = 80;
                    const elementPosition = card.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Optional: Add a brief highlight effect to the product
                    const originalBg = card.style.backgroundColor;
                    const originalTransition = card.style.transition;
                    card.style.transition = 'background-color 0.5s ease';
                    card.style.backgroundColor = '#fff3e0'; // Light orange highlight

                    setTimeout(() => {
                        card.style.backgroundColor = originalBg;
                        setTimeout(() => {
                            card.style.transition = originalTransition;
                        }, 500);
                    }, 1500);
                });

                itemDiv.innerHTML = `
                    <img src="${imgSrc}" class="search-result-img" alt="${title}">
                    <div class="search-result-info">
                        <span class="search-result-title">${title}</span>
                        <span class="search-result-price">${price}</span>
                    </div>
                `;

                dropdown.appendChild(itemDiv);
            }
        });

        if (!hasResults) {
            dropdown.innerHTML = '<div class="search-no-results">No products found for "' + searchTerm + '"</div>';
        }

        dropdown.classList.add('active');
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', function (event) {
        const searchContainer = document.querySelector('.nav-search-container');
        const dropdown = document.getElementById('searchResultsDropdown');

        if (dropdown && searchContainer && !searchContainer.contains(event.target)) {
            dropdown.classList.remove('active');
        }
    });

});