const initChatbot = () => {
    if (document.querySelector('.chat-widget')) return; // Prevent duplicate injection

    const chatHTML = `
<!-- Chatbot UI Widget -->
    <div class="chat-widget">
        <div class="chat-button" id="chatButton" aria-label="Open Chat">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
            </svg>
        </div>

        <div class="chat-window" id="chatWindow">
            <div class="chat-header">
                <h3>Store Assistant (AI)</h3>
                <button class="close-chat" id="closeChat">&times;</button>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="message bot">
                    Hi! I'm the Bhagyalakshmi Home Needs virtual assistant. How can I help you find the perfect
                    appliance today?
                </div>
            </div>
            <div class="chat-input-area">
                <input type="text" class="chat-input" id="chatInput" placeholder="Type a message...">
                <button class="send-button" id="sendButton">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHTML);

    // Chatbot functionality
    const chatButton = document.getElementById('chatButton');
    const chatWindow = document.getElementById('chatWindow');
    const closeChat = document.getElementById('closeChat');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');

    if (!chatButton || !chatWindow) return;

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


    let globalProductCards = [];
    async function getProductCards() {
        if (globalProductCards.length > 0) return globalProductCards;
        let cards = Array.from(document.querySelectorAll('.product-card'));
        if (cards.length > 0) {
            globalProductCards = cards;
            return cards;
        }
        try {
            const response = await fetch('all-products.html');
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            globalProductCards = Array.from(doc.querySelectorAll('.product-card'));
            return globalProductCards;
        } catch (e) {
            return [];
        }
    }

    const getBotResponse = async (message) => {
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
        const productCards = (await getProductCards()).filter(card => !card.classList.contains('admin-hidden-product'));
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


            const isAllProductsPage = window.location.pathname.includes('all-products.html');
            const basePath = isAllProductsPage ? '' : 'all-products.html';

            topProducts.forEach(product => {
                // Make the title a clickable link
                response += `• <a href="${basePath}#${product.id}" class="chat-product-link" onclick="if(!window.location.pathname.includes('all-products.html')){ window.location.href='all-products.html#' + '${product.id}'; return false; } scrollToProduct(event, '${product.id}')" style="color: var(--primary-color); font-weight:bold; text-decoration: underline;">${product.title}</a><br>&nbsp;&nbsp;Price: ${product.priceStr}<br>&nbsp;&nbsp;Specs: ${product.desc}<br><br>`;
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

            setTimeout(async () => {
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
        setTimeout(async () => {
            const botReply = await getBotResponse(text);
            addMessage(botReply, 'bot');
        }, 600 + Math.random() * 600);
    };

    sendButton.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });
};

// Robust initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}

