// This script should be included in ALL HTML pages
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Check if user is logged in
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            // User not logged in, show default
            setDefaultProfileIcon();
            return;
        }
        
        // Check localStorage first (fast)
        const cachedPhoto = localStorage.getItem(`profilePhoto_${user.uid}`);
        if (cachedPhoto) {
            applyProfilePhoto(cachedPhoto);
        }
        
        // Then check Firestore
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().profilePhoto) {
                const photo = userDoc.data().profilePhoto;
                localStorage.setItem(`profilePhoto_${user.uid}`, photo);
                applyProfilePhoto(photo);
            } else {
                setDefaultProfileIcon(user);
            }
        } catch (error) {
            console.error("Error loading profile photo:", error);
            setDefaultProfileIcon(user);
        }
    });
    
    // Listen for photo updates from other tabs
    window.addEventListener('storage', function(e) {
        if (e.key && e.key.startsWith('profilePhoto_')) {
            const userId = e.key.replace('profilePhoto_', '');
            const currentUser = auth.currentUser;
            
            if (currentUser && currentUser.uid === userId) {
                applyProfilePhoto(e.newValue);
            }
        }
    });
});

function applyProfilePhoto(photoUrl) {
    // Update navbar profile icon
    const profileIcon = document.getElementById('navbarProfileIcon') || 
                       document.querySelector('.profile-icon');
    
    if (profileIcon) {
        if (photoUrl) {
            profileIcon.innerHTML = `<img src="${photoUrl}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            // Show initials
            const auth = firebase.auth();
            const user = auth.currentUser;
            if (user) {
                profileIcon.innerHTML = `<span>${user.email.charAt(0).toUpperCase()}</span>`;
            }
        }
    }
    
    // Update other profile images on the page
    const profileImages = document.querySelectorAll('.user-profile-photo, .avatar-img');
    profileImages.forEach(img => {
        if (photoUrl && img.id !== 'navbarProfileIcon') {
            img.src = photoUrl;
        }
    });
}

function setDefaultProfileIcon(user = null) {
    const profileIcon = document.getElementById('navbarProfileIcon') || 
                       document.querySelector('.profile-icon');
    
    if (profileIcon) {
        if (user) {
            profileIcon.innerHTML = `<span>${user.email.charAt(0).toUpperCase()}</span>`;
        } else {
            profileIcon.innerHTML = '<span>U</span>';
        }
    }
}

// Function to update profile photo (for use in profile page)
function updateProfilePhoto(photoUrl) {
    applyProfilePhoto(photoUrl);
}