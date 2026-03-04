// db.js - Centralized Database Helper
// By default, this uses LocalStorage (saves to your current device only).
// To sync across devices, add your Firebase Config below.

const firebaseConfig = {
    apiKey: "AIzaSyD1aW-xtTN_Abooll847p4_qufgyKbQLP8",
    authDomain: "bhagyalakshmi-home-needs.firebaseapp.com",
    projectId: "bhagyalakshmi-home-needs",
    storageBucket: "bhagyalakshmi-home-needs.firebasestorage.app",
    messagingSenderId: "412298247106",
    appId: "1:412298247106:web:1056a52dec0f069422745b",
    measurementId: "G-5QHZ74R2HS"
};

let db = null;
let useFirebase = false;

if (firebaseConfig.apiKey) {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        useFirebase = true;
        console.log("Firebase Database is ACTIVE. Products are syncing globally.");

        // One-time auto-migration from LocalStorage to Firebase
        setTimeout(async () => {
            if (localStorage.getItem("migratedToFirebase") !== "true") {
                console.log("Running one-time data migration from Local Storage to Firebase...");

                // Migrate Products
                const localProducts = JSON.parse(localStorage.getItem('customStoreProducts') || '[]');
                for (let p of localProducts) {
                    await db.collection("customStoreProducts").doc(p.id).set(p);
                }

                // Migrate Categories
                const localCats = JSON.parse(localStorage.getItem('customStoreCategories') || '[]');
                for (let c of localCats) {
                    await db.collection("customStoreCategories").doc(c.id).set(c);
                }

                // Migrate Slides
                const localSlides = JSON.parse(localStorage.getItem('customStoreSlides') || '[]');
                for (let s of localSlides) {
                    await db.collection("customStoreSlides").doc(s.id).set(s);
                }

                // Migrate Settings
                const hiddenProds = JSON.parse(localStorage.getItem('hiddenStoreProducts') || '[]');
                const hiddenCats = JSON.parse(localStorage.getItem('hiddenStoreCategories') || '[]');
                const offerText = localStorage.getItem('storeOfferBannerText') || "";

                await db.collection("settings").doc("global").set({
                    hiddenStoreProducts: hiddenProds,
                    hiddenStoreCategories: hiddenCats,
                    storeOfferBannerText: offerText
                }, { merge: true });

                localStorage.setItem("migratedToFirebase", "true");
                console.log("Migration Complete! Please refresh the page.");
            }
        }, 1500);

    } catch (e) {
        console.error("Firebase initialization failed. Check config.", e);
    }
} else {
    console.log("Using Local Storage. Add Firebase config to db.js to sync across devices.");
}

const Database = {
    async getCustomProducts() {
        if (useFirebase) {
            const snap = await db.collection("customStoreProducts").get();
            return snap.docs.map(doc => doc.data());
        }
        return JSON.parse(localStorage.getItem('customStoreProducts') || '[]');
    },
    async saveCustomProduct(product) {
        if (useFirebase) {
            await db.collection("customStoreProducts").doc(product.id).set(product);
        } else {
            const products = await this.getCustomProducts();
            products.push(product);
            localStorage.setItem('customStoreProducts', JSON.stringify(products));
        }
    },
    async deleteCustomProduct(id) {
        if (useFirebase) {
            await db.collection("customStoreProducts").doc(id).delete();
        } else {
            let products = await this.getCustomProducts();
            products = products.filter(p => p.id !== id);
            localStorage.setItem('customStoreProducts', JSON.stringify(products));
        }
    },

    // Categories
    async getCustomCategories() {
        if (useFirebase) {
            const snap = await db.collection("customStoreCategories").get();
            return snap.docs.map(doc => doc.data());
        }
        return JSON.parse(localStorage.getItem('customStoreCategories') || '[]');
    },
    async saveCustomCategory(cat) {
        if (useFirebase) {
            await db.collection("customStoreCategories").doc(cat.id).set(cat);
        } else {
            const cats = await this.getCustomCategories();
            if (!cats.find(c => c.id === cat.id)) cats.push(cat);
            localStorage.setItem('customStoreCategories', JSON.stringify(cats));
        }
    },
    async deleteCustomCategory(id) {
        if (useFirebase) {
            await db.collection("customStoreCategories").doc(id).delete();
        } else {
            let cats = await this.getCustomCategories();
            cats = cats.filter(c => c.id !== id);
            localStorage.setItem('customStoreCategories', JSON.stringify(cats));
        }
    },

    // Slides
    async getCustomSlides() {
        if (useFirebase) {
            const snap = await db.collection("customStoreSlides").get();
            return snap.docs.map(doc => doc.data());
        }
        return JSON.parse(localStorage.getItem('customStoreSlides') || '[]');
    },
    async saveCustomSlide(slide) {
        if (useFirebase) {
            await db.collection("customStoreSlides").doc(slide.id).set(slide);
        } else {
            const slides = await this.getCustomSlides();
            slides.push(slide);
            localStorage.setItem('customStoreSlides', JSON.stringify(slides));
        }
    },
    async deleteCustomSlide(id) {
        if (useFirebase) {
            await db.collection("customStoreSlides").doc(id).delete();
        } else {
            let slides = await this.getCustomSlides();
            slides = slides.filter(s => s.id !== id);
            localStorage.setItem('customStoreSlides', JSON.stringify(slides));
        }
    },

    // Settings (Hidden Items & Offer Banner)
    async getSettings() {
        const defaultSettings = {
            hiddenStoreProducts: [],
            hiddenStoreCategories: [],
            storeOfferBannerText: ""
        };
        if (useFirebase) {
            const doc = await db.collection("settings").doc("global").get();
            if (doc.exists) {
                return { ...defaultSettings, ...doc.data() };
            }
            return defaultSettings;
        }
        return {
            hiddenStoreProducts: JSON.parse(localStorage.getItem('hiddenStoreProducts') || '[]'),
            hiddenStoreCategories: JSON.parse(localStorage.getItem('hiddenStoreCategories') || '[]'),
            storeOfferBannerText: localStorage.getItem('storeOfferBannerText') || ""
        };
    },
    async saveSetting(key, value) {
        if (useFirebase) {
            await db.collection("settings").doc("global").set({ [key]: value }, { merge: true });
        } else {
            if (typeof value === 'string') localStorage.setItem(key, value);
            else localStorage.setItem(key, JSON.stringify(value));
        }
    }
};

window.Database = Database;
window.useFirebase = useFirebase;
