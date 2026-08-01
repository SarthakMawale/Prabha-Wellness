// --- COMMON LOADER SCRIPT ---
window.addEventListener('load', () => {
    const loader = document.getElementById('pageLoader');
    if(loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 800); // 800ms delay for smoothness
    }
});

// Page Transition function (Optional: for onclick events)
function triggerPageTransition() {
    const loader = document.getElementById('pageLoader');
    if(loader) loader.classList.remove('hidden');
}
