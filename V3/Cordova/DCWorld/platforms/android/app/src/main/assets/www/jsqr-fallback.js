/* ========================================
   SIMPLE QR SCANNER FALLBACK
   Basic QR code scanning for character import
   ======================================== */

// Simple QR code scanner fallback (file upload only)
function simpleQRScanner() {
    return {
        scan: function(imageData, width, height) {
            // This is a placeholder - we'll rely on file upload
            // and manual QR reading for now
            return null;
        }
    };
}

// Export for use in qr.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = simpleQRScanner;
} else {
    window.jsQR = simpleQRScanner().scan;
}
