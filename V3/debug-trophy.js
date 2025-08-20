// Debug Trophy Button
console.log('Checking trophy button...');

document.addEventListener('DOMContentLoaded', function() {
    const trophyBtn = document.querySelector('.trophy-btn');
    if (trophyBtn) {
        console.log('Trophy button found:', trophyBtn);
        console.log('Trophy button styles:', window.getComputedStyle(trophyBtn));
        console.log('Trophy button display:', window.getComputedStyle(trophyBtn).display);
        console.log('Trophy button visibility:', window.getComputedStyle(trophyBtn).visibility);
    } else {
        console.log('Trophy button NOT found');
    }
    
    // Test if showAchievementsModal is available
    if (typeof showAchievementsModal === 'function') {
        console.log('showAchievementsModal function is available');
    } else {
        console.log('showAchievementsModal function is NOT available');
    }
});
