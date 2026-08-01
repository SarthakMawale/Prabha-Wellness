// --- FIREBASE CONFIGURATION (Ek hi jagah sahi config) ---
const firebaseConfig = {
    apiKey: "AIzaSyASK7lbjWDA50G3IJdzU2sEKubkdR0dwgY",
    authDomain: "prabha-wellness.firebaseapp.com",
    projectId: "prabha-wellness",
    storageBucket: "prabha-wellness.firebasestorage.app",
    messagingSenderId: "555332322398",
    appId: "1:555332322398:web:57e29182b8693c35ef60cf",
    measurementId: "G-EQ36VYT215"
};

// Initialize Firebase (Check if already initialized to prevent error)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else if (typeof firebase === 'undefined') {
    console.error("Firebase SDK not loaded! Make sure to include firebase-app.js and firebase-auth.js in your HTML.");
}

// Get Auth and Firestore Instances
const auth = (typeof firebase !== 'undefined') ? firebase.auth() : null;
const db = (typeof firebase !== 'undefined') ? firebase.firestore() : null;

// Profile Picture Cache
let profilePhotoCache = {};

// --- UI ELEMENTS LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    if (!auth) return; // Stop if Firebase didn't load

    const userProfileBox = document.getElementById('userProfileBox');
    const loginBtnNav = document.getElementById('loginBtnNav');
    const userInitial = document.getElementById('userInitial'); 
    const displayEmail = document.getElementById('displayEmail');
    const profileIcon = document.querySelector('.profile-icon');

    // --- CHECK USER LOGIN STATUS ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // --- User Logged In ---
            console.log("User Active:", user.email);

            if (userProfileBox) userProfileBox.style.display = 'flex';
            if (loginBtnNav) loginBtnNav.style.display = 'none';
            if (displayEmail) displayEmail.innerText = user.email;
            
            // Set user initial
            const initial = user.email.charAt(0).toUpperCase();
            if (userInitial) {
                userInitial.innerText = initial;
            }

            // Check for profile photo
            await loadAndDisplayProfilePhoto(user.uid, user.email, profileIcon, userInitial);

        } else {
            // --- User Logged Out ---
            console.log("User NOT logged in");

            if (userProfileBox) userProfileBox.style.display = 'none';
            // Show Login button
            if (loginBtnNav) loginBtnNav.style.display = 'inline-block'; 
            
            // Reset profile photo
            if (profileIcon) {
                profileIcon.innerHTML = '<span>U</span>';
            }
        }
    });

    // --- CLICK OUTSIDE TO CLOSE DROPDOWN ---
    window.addEventListener('click', function (e) {
        const profileBox = document.getElementById('userProfileBox');
        const dropdown = document.getElementById('profileDropdown');
        
        // Agar click profile box ke bahar hua hai, toh dropdown band karo
        if (profileBox && dropdown && !profileBox.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // Listen for profile photo updates from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('profilePhoto_')) {
            const userId = e.key.replace('profilePhoto_', '');
            const currentUser = auth.currentUser;
            
            if (currentUser && currentUser.uid === userId && e.newValue) {
                updateProfilePhotoInUI(e.newValue);
            }
        }
    });
});

// --- GLOBAL FUNCTIONS ---
window.toggleProfileMenu = function() {
    const dropdown = document.getElementById('profileDropdown');
    if(dropdown) {
        dropdown.classList.toggle('active');
        console.log("Toggled Dropdown");
    } else {
        console.warn("Profile Dropdown element not found!");
    }
}

window.logoutUser = function() {
    if (!auth) return;

    auth.signOut().then(() => {
        // Clear profile photo cache
        profilePhotoCache = {};
        
        // Clear localStorage profile data
        if (auth.currentUser) {
            localStorage.removeItem(`profilePhoto_${auth.currentUser.uid}`);
        }
        
        alert("Logged out successfully!");
        window.location.href = "login";
        
    }).catch((error) => {
        console.error("Logout Error:", error);
        alert("Error logging out: " + error.message);
    });
}

// --- PROFILE PHOTO FUNCTIONS ---
async function loadAndDisplayProfilePhoto(userId, userEmail, profileIcon, userInitial) {
    try {
        // Check cache first
        if (profilePhotoCache[userId]) {
            updateProfilePhotoInUI(profilePhotoCache[userId]);
            return;
        }

        // Check localStorage
        const savedPhoto = localStorage.getItem(`profilePhoto_${userId}`);
        if (savedPhoto) {
            profilePhotoCache[userId] = savedPhoto;
            updateProfilePhotoInUI(savedPhoto);
            return;
        }

        // Check Firestore
        if (db) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists && userDoc.data().profilePhoto) {
                const photoUrl = userDoc.data().profilePhoto;
                
                // Cache it
                profilePhotoCache[userId] = photoUrl;
                localStorage.setItem(`profilePhoto_${userId}`, photoUrl);
                
                updateProfilePhotoInUI(photoUrl);
                return;
            }
        }

        // No photo found, use initial
        if (profileIcon && userInitial) {
            profileIcon.innerHTML = `<span>${userEmail.charAt(0).toUpperCase()}</span>`;
        }

    } catch (error) {
        console.error("Error loading profile photo:", error);
        // Fallback to initial
        if (profileIcon && userEmail) {
            profileIcon.innerHTML = `<span>${userEmail.charAt(0).toUpperCase()}</span>`;
        }
    }
}

function updateProfilePhotoInUI(photoUrl) {
    // Update navbar profile icon
    const profileIcon = document.querySelector('.profile-icon');
    if (profileIcon) {
        profileIcon.innerHTML = `
            <img src="${photoUrl}" 
                 alt="Profile" 
                 style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;"
                 onerror="this.onerror=null; this.parentElement.innerHTML='<span>${auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}</span>';">
        `;
    }

    // Update dropdown profile if exists
    const dropdownAvatar = document.querySelector('.profile-header-dropdown img');
    if (dropdownAvatar) {
        dropdownAvatar.src = photoUrl;
    }

    // Update other profile images on the page
    document.querySelectorAll('.user-profile-photo').forEach(img => {
        img.src = photoUrl;
    });
}

// Function to upload profile photo (call from profile)
window.uploadProfilePhoto = async function(file) {
    if (!auth.currentUser || !db || !file) return false;
    
    try {
        // Compress image
        const compressedImage = await compressImageForUpload(file);
        const base64Image = await fileToBase64(compressedImage);
        
        // Save to Firestore
        await db.collection('users').doc(auth.currentUser.uid).set({
            profilePhoto: base64Image,
            profilePhotoUpdated: new Date().toISOString()
        }, { merge: true });
        
        // Update cache and localStorage
        profilePhotoCache[auth.currentUser.uid] = base64Image;
        localStorage.setItem(`profilePhoto_${auth.currentUser.uid}`, base64Image);
        
        // Update UI
        updateProfilePhotoInUI(base64Image);
        
        // Trigger storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
            key: `profilePhoto_${auth.currentUser.uid}`,
            newValue: base64Image
        }));
        
        return true;
        
    } catch (error) {
        console.error("Error uploading photo:", error);
        return false;
    }
}

// Helper function to compress image
async function compressImageForUpload(file, maxWidth = 300, maxHeight = 300, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions
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

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
}

// Get current user's profile photo (for other pages)
window.getCurrentUserProfilePhoto = function() {
    if (!auth.currentUser) return null;
    return profilePhotoCache[auth.currentUser.uid] || 
           localStorage.getItem(`profilePhoto_${auth.currentUser.uid}`) || 
           null;
}