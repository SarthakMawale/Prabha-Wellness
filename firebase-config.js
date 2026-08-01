
// Prevent redeclaration (VERY IMPORTANT)
if (!window.firebaseConfigInitialized) {

    const firebaseConfig = {
        apiKey: "AIzaSyASK7lbjWDA50G3IJdzU2sEKubkdR0dwgY",
        authDomain: "prabha-wellness.firebaseapp.com",
        projectId: "prabha-wellness",
        storageBucket: "prabha-wellness.firebasestorage.app",
        messagingSenderId: "555332322398",
        appId: "1:555332322398:web:57e29182b8693c35ef60cf",
        measurementId: "G-EQ36VYT215"
    };


    // Expose globally (important for all pages)


    window.firebaseConfigInitialized = true;
}



// ================= ADMIN LOGIC =================

const ADMIN_EMAIL = "sarthakbhawsar8@gmail.com";

// Check if user is admin
window.isAdmin = function (user) {
    return user && user.email === ADMIN_EMAIL;
};

// Protect admin pages
window.requireAdmin = function (callback) {
    auth.onAuthStateChanged((user) => {
        if (isAdmin(user)) {
            callback(user);
        } else {
            window.location.href = "admin-login.html";
        }
    });
};
