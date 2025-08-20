# 📁 Files to Upload to GitHub - Quick Checklist

## 🎯 Essential Files (Upload to V2 folder)

### ✅ Core Enhancement Files
- [ ] `improvements.js` - DCC book content (31 skills, 6 races, 18 classes)
- [ ] `achievements.js` - Achievement system logic
- [ ] `achievements.json` - Achievement database (150+ achievements)

### ✅ PWA/Mobile Files
- [ ] `manifest.json` - PWA configuration
- [ ] `sw.js` - Service worker for offline functionality
- [ ] `icon-192.png` - App icon (small)
- [ ] `icon-512.png` - App icon (large)

### ✅ Documentation (Optional)
- [ ] `GITHUB_INTEGRATION_GUIDE.md` - This integration guide
- [ ] `DCC_IMPROVEMENTS_README.md` - DCC content documentation
- [ ] `ACHIEVEMENTS_README.md` - Achievement system documentation

## 🔧 Code to Add to Your Existing index_1-v3.html

### 1. Add to `<head>` section (after existing meta tags):
```html
<!-- PWA Meta Tags -->
<meta name="format-detection" content="telephone=no">
<meta name="msapplication-tap-highlight" content="no">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#ff6b35">
<meta name="apple-mobile-web-app-title" content="DCC Sheet">
<link rel="apple-touch-icon" href="icon-192.png">
```

### 2. Add before closing `</body>` tag (after existing scripts):
```html
<!-- DCC Enhancements -->
<script src="improvements.js"></script>
<script src="achievements.js"></script>

<!-- PWA Setup -->
<script>
// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
            .then(function(registration) {
                console.log('DCC: Service Worker registered');
            })
            .catch(function(error) {
                console.log('DCC: Service Worker failed:', error);
            });
    });
}

// PWA Install Button
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const installBtn = document.createElement('button');
    installBtn.textContent = '📱 Install App';
    installBtn.style.cssText = `
        position: fixed; top: 10px; right: 10px; z-index: 10000;
        background: #ff6b35; color: white; border: none;
        padding: 10px 15px; border-radius: 5px; cursor: pointer;
    `;
    installBtn.onclick = () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
            deferredPrompt = null;
            installBtn.remove();
        });
    };
    document.body.appendChild(installBtn);
});
</script>
```

## 🚀 Upload Process

1. **Go to your GitHub repository**
2. **Navigate to V2 folder**
3. **Click "Add file" → "Upload files"**
4. **Drag and drop the 7 essential files**
5. **Edit index_1-v3.html and add the code above**
6. **Commit changes**
7. **Enable GitHub Pages in Settings**
8. **Test at your GitHub Pages URL**

## 🎯 What You'll Get

- ✅ **150+ Achievements** with smart selection
- ✅ **31 DCC Skills** from the books
- ✅ **6 New Races** (Bopca, Skyfowl, Primal, etc.)
- ✅ **18 New Classes** (Compensated Anarchist, etc.)
- ✅ **Mobile PWA** that installs like an app
- ✅ **Offline functionality** 
- ✅ **All existing features preserved**

## 📱 Mobile Result

After upload, users can:
1. Visit your GitHub Pages URL on mobile
2. See "📱 Install App" button
3. Install as PWA for app-like experience
4. Use offline with all DCC content

**That's it! GitHub Pages will solve the CSS loading issues and give you a professional mobile-ready character sheet.**

