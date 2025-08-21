/* ========================================
   QR CODE FUNCTIONALITY
   Character sharing via QR codes
   ======================================== */

// QR Code Generation and Sharing
function shareCharacterAsQR() {
    const currentCharacter = getCurrentCharacterData();
    if (!currentCharacter || !currentCharacter.name) {
        showNotification('Please create a character first!', 'warning');
        return;
    }

    try {
        // Create a compact character data object
        const qrData = {
            type: 'dcc-character',
            version: '1.0',
            data: currentCharacter,
            timestamp: new Date().toISOString()
        };

        const qrString = JSON.stringify(qrData);
        
        // Check if data is too large for QR code
        if (qrString.length > 2000) {
            showNotification('Character data too large for QR code. Try reducing backstory length.', 'warning');
            return;
        }

        generateQRCode(qrString);
        document.getElementById('qr-modal').style.display = 'flex';
    } catch (error) {
        console.error('Error generating QR code:', error);
        showNotification('Failed to generate QR code', 'error');
    }
}

function generateQRCode(data) {
    const canvas = document.getElementById('qr-canvas');
    
    // Get theme colors for QR code
    const computedStyle = getComputedStyle(document.body);
    const darkColor = computedStyle.getPropertyValue('--text-primary').trim() || '#000000';
    const lightColor = computedStyle.getPropertyValue('--bg-primary').trim() || '#ffffff';

    QRCode.toCanvas(canvas, data, {
        width: 300,
        margin: 2,
        color: {
            dark: darkColor,
            light: lightColor
        }
    }, function (error) {
        if (error) {
            console.error('QR Code generation failed:', error);
            showNotification('Failed to generate QR code', 'error');
        }
    });
}

function closeQRModal() {
    document.getElementById('qr-modal').style.display = 'none';
}

function downloadQR() {
    const canvas = document.getElementById('qr-canvas');
    const currentCharacter = getCurrentCharacterData();
    
    // Create filename: CharName-Class-Level.png
    const charName = (currentCharacter?.name || 'Character').replace(/[^a-zA-Z0-9]/g, '_');
    const charClass = (currentCharacter?.class || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
    const charLevel = currentCharacter?.level || '1';
    const filename = `${charName}-${charClass}-${charLevel}.png`;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    showNotification(`QR code saved as ${filename}`, 'success');
}

function shareQR() {
    const canvas = document.getElementById('qr-canvas');
    const currentCharacter = getCurrentCharacterData();
    
    canvas.toBlob(function(blob) {
        if (navigator.share && navigator.canShare) {
            const charName = currentCharacter?.name || 'Character';
            const filename = `${charName.replace(/[^a-zA-Z0-9]/g, '_')}-QR.png`;
            const file = new File([blob], filename, { type: 'image/png' });
            
            navigator.share({
                title: 'DCC Character QR Code',
                text: `Share ${charName} for Dungeon Crawler World`,
                files: [file]
            }).catch(error => {
                console.error('Share failed:', error);
                showNotification('Share failed. Use "Save Image" instead.', 'warning');
            });
        } else {
            // Fallback: copy canvas data URL to clipboard if supported
            if (navigator.clipboard && canvas.toDataURL) {
                canvas.toBlob(blob => {
                    const item = new ClipboardItem({ "image/png": blob });
                    navigator.clipboard.write([item]).then(() => {
                        showNotification('QR code copied to clipboard!', 'success');
                    }).catch(() => {
                        showNotification('Use "Save Image" to download the QR code', 'info');
                    });
                });
            } else {
                showNotification('Use "Save Image" to download the QR code', 'info');
            }
        }
    });
}

// QR Code Scanning
let qrStream = null;
let qrScanning = false;

function scanQRForCharacter() {
    document.getElementById('qr-scanner-modal').style.display = 'flex';
    // Hide camera option since we're going file-upload only for now
    const cameraBtn = document.getElementById('camera-btn');
    if (cameraBtn) cameraBtn.style.display = 'none';
    
    showNotification('Upload a QR code image to import a character', 'info');
}

function closeQRScannerModal() {
    qrScanning = false;
    if (qrStream) {
        if (qrStream.stop) {
            // QrScanner object
            qrStream.stop();
        } else if (qrStream.getTracks) {
            // MediaStream object
            qrStream.getTracks().forEach(track => track.stop());
        }
        qrStream = null;
    }
    
    // Reset modal display
    document.querySelector('.scanner-container').style.display = 'none';
    document.querySelector('.file-upload-area').style.display = 'block';
    
    document.getElementById('qr-scanner-modal').style.display = 'none';
}

function uploadQRImage() {
    document.getElementById('qr-file-input').click();
}

function processQRFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Create a simple image reader for now
    const img = new Image();
    
    img.onload = function() {
        // For now, we'll show a message that the user needs to use JSON export/import
        // since we need a working QR decoder
        showNotification('QR code uploaded! For now, please use "Export" and "Load" buttons to share characters.', 'info');
        closeQRScannerModal();
    };
    
    img.onerror = function() {
        showNotification('Failed to load image', 'error');
    };
    
    img.src = URL.createObjectURL(file);
    event.target.value = '';
}

function processQRData(qrString) {
    try {
        const qrData = JSON.parse(qrString);
        
        // Validate QR data
        if (qrData.type !== 'dcc-character' || !qrData.data) {
            showNotification('Invalid character QR code', 'error');
            return;
        }

        // Close scanner modal
        closeQRScannerModal();

        // Confirm import
        const characterName = qrData.data.name || 'Unknown Character';
        const characterClass = qrData.data.class || 'Unknown Class';
        const characterLevel = qrData.data.level || '?';
        
        const message = `Import character "${characterName}" (${characterClass}, Level ${characterLevel})?\n\nThis will replace your current character.`;
        
        if (confirm(message)) {
            importCharacterFromQR(qrData.data);
            showNotification(`Character "${characterName}" imported successfully!`, 'success');
        }

    } catch (error) {
        console.error('Error processing QR data:', error);
        showNotification('Invalid QR code format', 'error');
    }
}

function importCharacterFromQR(characterData) {
    try {
        // Try to use existing character loading function if available
        if (typeof loadCharacterData === 'function') {
            loadCharacterData(characterData);
        } else if (typeof window.loadCharacter === 'function') {
            window.loadCharacter(characterData);
        } else {
            // Fallback: store in localStorage and trigger reload
            localStorage.setItem('qr-imported-character', JSON.stringify(characterData));
            localStorage.setItem('qr-import-pending', 'true');
            
            // Try to trigger character load if function exists
            if (typeof refreshCharacterDisplay === 'function') {
                refreshCharacterDisplay();
            } else {
                // Last resort: reload page
                showNotification('Character data saved. Refreshing page...', 'info');
                setTimeout(() => location.reload(), 1000);
            }
        }
    } catch (error) {
        console.error('Error importing character:', error);
        showNotification('Failed to import character', 'error');
    }
}

function getCurrentCharacterData() {
    // Try different ways to get current character data
    if (window.currentCharacter) {
        return window.currentCharacter;
    }
    
    if (window.character) {
        return window.character;
    }
    
    // Try to get from localStorage
    const stored = localStorage.getItem('currentCharacter') || localStorage.getItem('character');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing stored character:', e);
        }
    }
    
    // Try to build character from form fields
    const charName = document.getElementById('char-name')?.value;
    if (charName) {
        return {
            name: charName,
            level: document.getElementById('char-level')?.value || 1,
            class: document.getElementById('class-select')?.value || 'Unknown',
            race: document.getElementById('race-select')?.value || 'Unknown',
            // Add more fields as needed
        };
    }
    
    return null;
}

// Handle imported character on page load
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('qr-import-pending') === 'true') {
        const importedData = localStorage.getItem('qr-imported-character');
        if (importedData) {
            try {
                const characterData = JSON.parse(importedData);
                // Clear the import flags
                localStorage.removeItem('qr-import-pending');
                localStorage.removeItem('qr-imported-character');
                
                // Try to load the character
                setTimeout(() => {
                    importCharacterFromQR(characterData);
                }, 500); // Small delay to ensure page is ready
            } catch (error) {
                console.error('Error processing imported character:', error);
                localStorage.removeItem('qr-import-pending');
                localStorage.removeItem('qr-imported-character');
            }
        }
    }
});

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        if (event.target.id === 'qr-modal') closeQRModal();
        if (event.target.id === 'qr-scanner-modal') closeQRScannerModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeQRModal();
        closeQRScannerModal();
    }
});
