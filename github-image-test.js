// GitHub Image Hosting Test Script
// Run this in the browser console to test the system

console.log('🧪 Testing GitHub Image Hosting System...');

// Test 1: Check if classes are loaded
function testClassLoading() {
    console.log('\n--- Test 1: Class Loading ---');
    
    const classes = {
        'GitHubImageHost': typeof GitHubImageHost !== 'undefined',
        'MultiImageHost': typeof MultiImageHost !== 'undefined',
        'ChatImageSystem': typeof ChatImageSystem !== 'undefined'
    };
    
    for (const [className, loaded] of Object.entries(classes)) {
        console.log(`${loaded ? '✅' : '❌'} ${className}: ${loaded ? 'loaded' : 'NOT LOADED'}`);
    }
    
    return Object.values(classes).every(loaded => loaded);
}

// Test 2: Check localStorage token
function testTokenStorage() {
    console.log('\n--- Test 2: Token Storage ---');
    
    const token = localStorage.getItem('github_api_token');
    if (token) {
        console.log('✅ GitHub API token found in localStorage');
        console.log(`🔑 Token starts with: ${token.substring(0, 8)}...`);
        return true;
    } else {
        console.log('⚠️ No GitHub API token found');
        console.log('💡 Use command: /github:YOUR_TOKEN_HERE');
        return false;
    }
}

// Test 3: Test session detection
function testSessionDetection() {
    console.log('\n--- Test 3: Session Detection ---');
    
    try {
        const githubHost = new GitHubImageHost();
        console.log(`📁 Detected session: ${githubHost.sessionCode || 'default'}`);
        return true;
    } catch (error) {
        console.log('❌ Session detection failed:', error);
        return false;
    }
}

// Test 4: Test MultiImageHost initialization
function testMultiImageHost() {
    console.log('\n--- Test 4: MultiImageHost Initialization ---');
    
    try {
        const config = {
            githubOwner: 'ronmurphy',
            githubRepo: 'dcc-image-storage',
            githubToken: localStorage.getItem('github_api_token')
        };
        
        const multiHost = new MultiImageHost(config);
        console.log('✅ MultiImageHost initialized');
        console.log(`🔧 Services available: ${multiHost.services.map(s => s.name).join(', ')}`);
        
        if (multiHost.githubHost && multiHost.githubHost.config.apiToken) {
            console.log('✅ GitHub service ready');
        } else {
            console.log('⚠️ GitHub service needs token');
        }
        
        return true;
    } catch (error) {
        console.log('❌ MultiImageHost initialization failed:', error);
        return false;
    }
}

// Test 5: Test command interceptor
function testCommandInterceptor() {
    console.log('\n--- Test 5: Command Interceptor ---');
    
    if (window.commandInterceptorInitialized) {
        console.log('✅ Command interceptor is active');
        console.log('💡 Try command: /github:YOUR_TOKEN_HERE');
        return true;
    } else {
        console.log('❌ Command interceptor not initialized');
        return false;
    }
}

// Test 6: Mock file upload test (without actual file)
function testUploadSystem() {
    console.log('\n--- Test 6: Upload System Check ---');
    
    try {
        if (window.ChatImageSystem) {
            console.log('✅ ChatImageSystem available');
            
            // Check if the system can create buttons
            const testContainer = document.createElement('div');
            const system = new ChatImageSystem();
            
            if (typeof system.createUploadButton === 'function') {
                console.log('✅ Upload button creation available');
            }
            
            return true;
        } else {
            console.log('❌ ChatImageSystem not available');
            return false;
        }
    } catch (error) {
        console.log('❌ Upload system check failed:', error);
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('🧪 GitHub Image Hosting System Test Suite');
    console.log('==========================================');
    
    const tests = [
        { name: 'Class Loading', test: testClassLoading },
        { name: 'Token Storage', test: testTokenStorage },
        { name: 'Session Detection', test: testSessionDetection },
        { name: 'MultiImageHost', test: testMultiImageHost },
        { name: 'Command Interceptor', test: testCommandInterceptor },
        { name: 'Upload System', test: testUploadSystem }
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const { name, test } of tests) {
        try {
            if (test()) {
                passed++;
            }
        } catch (error) {
            console.log(`❌ ${name} test crashed:`, error);
        }
    }
    
    console.log('\n==========================================');
    console.log(`📊 Test Results: ${passed}/${total} passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! System is ready.');
        console.log('💡 Next steps:');
        console.log('   1. Get GitHub token from: https://github.com/settings/tokens');
        console.log('   2. Use command: /github:YOUR_TOKEN_HERE');
        console.log('   3. Look for 📷 button in chat interface');
    } else {
        console.log('⚠️ Some tests failed. Check the logs above.');
    }
    
    return { passed, total };
}

// Auto-run tests if this script is loaded directly
if (typeof window !== 'undefined') {
    setTimeout(() => {
        runAllTests();
    }, 1000); // Wait 1 second for all scripts to load
}

// Export for manual testing
window.githubImageTest = {
    runAllTests,
    testClassLoading,
    testTokenStorage,
    testSessionDetection,
    testMultiImageHost,
    testCommandInterceptor,
    testUploadSystem
};
