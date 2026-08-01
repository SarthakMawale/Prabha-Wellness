// cart-sync.js
// FIREBASE CART SYNC SYSTEM

class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem("prabhaCart")) || [];
        this.init();
    }

    async init() {
        // Wait for firebase to be ready
        await this.waitForFirebase();
        
        // Sync with Firebase when user logs in
        this.setupAuthListener();
        
        // Setup storage listener
        this.setupStorageListener();
        
        // Initial update
        this.updateCartCount();
    }

    waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const checkFirebase = () => {
                attempts++;
                if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                    resolve();
                } else if (attempts < 10) {
                    setTimeout(checkFirebase, 500);
                } else {
                    console.warn("Firebase not loaded, cart will work locally only");
                    resolve();
                }
            };
            checkFirebase();
        });
    }

    setupAuthListener() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    // User logged in - sync cart with Firebase
                    await this.syncCartWithFirebase(user.email);
                } else {
                    // User logged out - clear cart
                    this.cart = [];
                    localStorage.removeItem("prabhaCart");
                    this.updateCartCount();
                }
            });
        }
    }

    setupStorageListener() {
        // Listen for cart changes from other tabs/pages
        window.addEventListener("storage", (e) => {
            if (e.key === "prabhaCart") {
                this.cart = JSON.parse(e.newValue) || [];
                this.updateCartCount();
            }
        });
    }

    async syncCartWithFirebase(userEmail) {
        try {
            const db = firebase.firestore();
            const cartRef = db.collection("userCarts").doc(userEmail);
            
            // Get cart from Firebase
            const doc = await cartRef.get();
            
            if (doc.exists) {
                // Firebase has cart data, merge with local cart
                const firebaseCart = doc.data().cart || [];
                
                // Merge logic: Combine items, keep max quantity
                const mergedCart = this.mergeCarts(this.cart, firebaseCart);
                this.cart = mergedCart;
            } else {
                // Save local cart to Firebase
                await cartRef.set({
                    cart: this.cart,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            // Save merged cart to localStorage
            this.saveToLocalStorage();
            this.updateCartCount();
            
        } catch (error) {
            console.error("Error syncing cart with Firebase:", error);
        }
    }

    mergeCarts(localCart, firebaseCart) {
        const merged = [...localCart];
        
        firebaseCart.forEach(fbItem => {
            const existingIndex = merged.findIndex(item => item.id === fbItem.id);
            
            if (existingIndex !== -1) {
                // Merge quantities
                merged[existingIndex].qty = Math.max(
                    merged[existingIndex].qty || 1,
                    fbItem.qty || 1
                );
            } else {
                // Add new item
                merged.push(fbItem);
            }
        });
        
        return merged;
    }

    saveToLocalStorage() {
        localStorage.setItem("prabhaCart", JSON.stringify(this.cart));
        // Trigger storage event for other tabs
        localStorage.setItem("cart_sync_timestamp", Date.now().toString());
    }

    async saveToFirebase() {
        const user = firebase.auth().currentUser;
        if (user) {
            try {
                const db = firebase.firestore();
                await db.collection("userCarts").doc(user.email).set({
                    cart: this.cart,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                console.error("Error saving cart to Firebase:", error);
            }
        }
    }

    async addToCart(product) {
        // Check if user is logged in and approved (use your existing approval check)
        const user = firebase.auth().currentUser;
        if (!user) {
            this.showToast("Please login to add to cart", true);
            return false;
        }

        // Your existing approval check logic here...
        // ...

        // Add to cart
        const existingIndex = this.cart.findIndex(item => item.id === product.id);
        
        if (existingIndex !== -1) {
            this.cart[existingIndex].qty = (this.cart[existingIndex].qty || 1) + 1;
        } else {
            this.cart.push({
                ...product,
                qty: 1,
                addedAt: new Date().toISOString()
            });
        }

        // Save to both localStorage and Firebase
        this.saveToLocalStorage();
        await this.saveToFirebase();
        this.updateCartCount();
        
        return true;
    }

    updateCartCount() {
        const cartCountElement = document.getElementById("cart-count");
        if (!cartCountElement) return;

        const totalQty = this.cart.reduce(
            (sum, item) => sum + (item.qty || 1),
            0
        );

        cartCountElement.textContent = totalQty;
    }

    showToast(message, isError = false) {
        // Your toast function...
    }

    getCart() {
        return [...this.cart];
    }

    clearCart() {
        this.cart = [];
        this.saveToLocalStorage();
        this.saveToFirebase();
        this.updateCartCount();
    }
}

// Initialize Cart Manager
window.cartManager = new CartManager();

// Initial load
document.addEventListener("DOMContentLoaded", () => {
    window.cartManager.updateCartCount();
});