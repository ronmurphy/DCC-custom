// Debug script for Vercel localStorage issues
console.log('🔍 Checking localStorage support...');

try {
    // Test basic localStorage functionality
    const testKey = 'dcc_test_' + Date.now();
    const testValue = 'test_data';
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved === testValue) {
        console.log('✅ localStorage is working properly');
        
        // Check current character data
        const currentData = localStorage.getItem('wasteland_characters');
        if (currentData) {
            console.log('✅ Character data found:', JSON.parse(currentData).length, 'characters');
        } else {
            console.log('⚠️ No character data found in localStorage');
        }
    } else {
        console.log('❌ localStorage test failed');
    }
    
    // Check if we're in a secure context
    console.log('🔒 Secure context:', window.isSecureContext);
    console.log('🌐 Origin:', window.location.origin);
    console.log('📍 URL:', window.location.href);
    
} catch (error) {
    console.error('❌ localStorage error:', error);
    
    // Check for common issues
    if (error.name === 'QuotaExceededError') {
        console.log('💾 Storage quota exceeded - try clearing browser data');
    } else if (error.name === 'SecurityError') {
        console.log('🔒 Security error - localStorage blocked by browser/Vercel');
    }
}

// Check service worker status
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        console.log('🔧 Service worker active:', registration.active ? 'Yes' : 'No');
    });
}
