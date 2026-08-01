// Profile Manager for syncing user data across all pages
// profile.js - Updated with better error handling

// Wait for firebase to be available
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebase) {
            resolve(window.firebase);
            return;
        }

        let attempts = 0;
        const checkFirebase = setInterval(() => {
            attempts++;
            if (window.firebase) {
                clearInterval(checkFirebase);
                resolve(window.firebase);
            } else if (attempts > 50) { // 5 seconds timeout
                clearInterval(checkFirebase);
                console.error("Firebase not loaded after 5 seconds");
                resolve(null);
            }
        }, 100);
    });
}

// Profile Manager for syncing user data across all pages
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.profileData = null;
        this.photoUrl = null;
        this.init();
    }

    async init() {
        try {
            // Wait for firebase to load
            const firebase = await waitForFirebase();
            if (!firebase) {
                console.error("Firebase not available");
                return;
            }

            // Initialize Firebase
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            
            // Listen for auth changes
            this.auth.onAuthStateChanged(async (user) => {
                this.currentUser = user;
                if (user) {
                    await this.loadUserProfile(user.uid);
                    await this.loadProfilePhoto();
                    this.updateUI();
                    this.syncAcrossPages();
                } else {
                    this.resetUI();
                }
            });
        } catch (error) {
            console.error("ProfileManager initialization error:", error);
        }
    }

    async loadUserProfile(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                this.profileData = userDoc.data();
                return true;
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        }
        return false;
    }

    async loadProfilePhoto() {
        if (!this.currentUser) return;
        
        // Check localStorage first (fastest)
        const savedPhoto = localStorage.getItem(`profilePhoto_${this.currentUser.uid}`);
        if (savedPhoto) {
            this.photoUrl = savedPhoto;
            this.applyPhotoToAllElements();
            return;
        }
        
        // Check Firestore
        try {
            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
            if (userDoc.exists && userDoc.data().profilePhoto) {
                this.photoUrl = userDoc.data().profilePhoto;
                localStorage.setItem(`profilePhoto_${this.currentUser.uid}`, this.photoUrl);
                this.applyPhotoToAllElements();
            } else {
                this.setDefaultAvatar();
            }
        } catch (error) {
            console.error("Error loading profile photo:", error);
            this.setDefaultAvatar();
        }
    }

    async uploadProfilePhoto(file) {
        if (!this.currentUser || !file) return false;
        
        try {
            this.showUploadLoading(true);
            
            const compressedImage = await this.compressImage(file);
            const base64Image = await this.fileToBase64(compressedImage);
            
            await this.db.collection('users').doc(this.currentUser.uid).set({
                profilePhoto: base64Image,
                profilePhotoUpdated: new Date().toISOString()
            }, { merge: true });
            
            localStorage.setItem(`profilePhoto_${this.currentUser.uid}`, base64Image);
            this.photoUrl = base64Image;
            
            this.applyPhotoToAllElements();
            localStorage.setItem(`profilePhotoUpdated_${this.currentUser.uid}`, Date.now().toString());
            
            this.showUploadLoading(false);
            return true;
        } catch (error) {
            console.error("Error uploading photo:", error);
            this.showUploadLoading(false);
            return false;
        }
    }

    async compressImage(file, maxWidth = 200, maxHeight = 200, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });
    }

    applyPhotoToAllElements() {
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar && this.photoUrl) {
            profileAvatar.innerHTML = `<img src="${this.photoUrl}" alt="Profile Photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        }
        
        const navbarProfileIcon = document.getElementById('navbarProfileIcon');
        if (navbarProfileIcon) {
            if (this.photoUrl) {
                navbarProfileIcon.innerHTML = `<img src="${this.photoUrl}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            } else if (this.currentUser) {
                navbarProfileIcon.innerHTML = `<span>${this.currentUser.email.charAt(0).toUpperCase()}</span>`;
            }
        }
        
        document.querySelectorAll('.user-profile-photo').forEach(img => {
            if (this.photoUrl) {
                img.src = this.photoUrl;
            }
        });
    }

    setDefaultAvatar() {
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            profileAvatar.innerHTML = `
                <div style="width:100%;height:100%;border-radius:50%;background:var(--primary-green);display:flex;align-items:center;justify-content:center;color:white;">
                    <i class="fas fa-user"></i>
                </div>
            `;
        }
        
        const navbarProfileIcon = document.getElementById('navbarProfileIcon');
        if (navbarProfileIcon && this.currentUser) {
            navbarProfileIcon.innerHTML = `<span>${this.currentUser.email.charAt(0).toUpperCase()}</span>`;
        }
    }

    showUploadLoading(show) {
        const avatarImg = document.getElementById('profileAvatar');
        if (!avatarImg) return;
        
        if (show) {
            avatarImg.dataset.original = avatarImg.innerHTML;
            avatarImg.innerHTML = `
                <div class="avatar-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <div style="font-size:0.8rem;margin-top:5px;">Uploading...</div>
                </div>
            `;
        } else {
            if (avatarImg.dataset.original && !avatarImg.innerHTML.includes('<img')) {
                avatarImg.innerHTML = avatarImg.dataset.original;
            }
        }
    }

    updateUI() {
        this.applyPhotoToAllElements();
    }

    resetUI() {
        const profileElements = document.querySelectorAll('.user-profile-photo, .profile-icon, #profileAvatar');
        profileElements.forEach(el => {
            if (el.id === 'profileAvatar') {
                this.setDefaultAvatar();
            } else if (el.classList.contains('profile-icon')) {
                el.innerHTML = '<span>U</span>';
            }
        });
    }

    syncAcrossPages() {
        window.addEventListener('storage', (e) => {
            if (e.key === `profilePhotoUpdated_${this.currentUser?.uid}`) {
                const savedPhoto = localStorage.getItem(`profilePhoto_${this.currentUser.uid}`);
                if (savedPhoto) {
                    this.photoUrl = savedPhoto;
                    this.applyPhotoToAllElements();
                }
            }
        });
    }
}

// Initialize only when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Give time for firebase-config.js to load
    setTimeout(() => {
        if (!window.profileManager) {
            window.profileManager = new ProfileManager();
        }
    }, 1000);
});

// Initialize Profile Manager globally
window.profileManager = new ProfileManager();