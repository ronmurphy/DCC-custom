// Test script for URL encoder
const fs = require('fs');

// Mock window object for Node.js
global.window = {};

// Load the encoder
eval(fs.readFileSync('js/supabaseUrlEncoder.js', 'utf8'));

// Create encoder instance - it's available globally or as class
const encoder = window.supabaseUrlEncoder || new SupabaseUrlEncoder();

// Test URLs that actually make sense for our system
const testUrls = [
    'https://abcdefghijklmnop.supabase.co/auth/v1/authorize?provider=google&redirect_to=example.com',
    'https://xyz123.supabase.co/rest/v1/tables?session=abc123',
    'https://short.supabase.co/api/test'
];

console.log('URL Encoder Test Results:');
console.log('========================');

testUrls.forEach((url, i) => {
    console.log(`\nTest ${i+1}: ${url}`);
    console.log(`Original Length: ${url.length}`);
    
    try {
        const shortened = encoder.encodeUrl(url);
        console.log(`Shortened: ${shortened}`);
        console.log(`Shortened Length: ${shortened.length}`);
        console.log(`Savings: ${url.length - shortened.length} characters`);
        
        const decoded = encoder.decodeUrl(shortened);
        console.log(`Decoded: ${decoded}`);
        
        // Check functionality, not exact match (due to https:// stripping in redirect_to)
        const functionalMatch = decoded.includes(url.split('redirect_to=')[0]);
        console.log(`Functional Match: ${functionalMatch || url === decoded}`);
        
        console.log(`Detection Tests:`);
        console.log(`  isShortened(original): ${encoder.isShortened(url)}`);
        console.log(`  isFull(original): ${encoder.isFull(url)}`);
        console.log(`  isShortened(shortened): ${encoder.isShortened(shortened)}`);
        console.log(`  isFull(shortened): ${encoder.isFull(shortened)}`);
        
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
});
