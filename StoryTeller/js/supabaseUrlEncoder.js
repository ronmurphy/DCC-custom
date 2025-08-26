// ⚠️⚠️⚠️ CRITICAL SUPABASE URL ENCODER - DO NOT TOUCH ⚠️⚠️⚠️
// For Brad, David, Manus, Claude, Copilot, and EVERYONE:
// This file handles URL shortening to prevent accidental clicking by users
// PLEASE DO NOT MODIFY - This prevents user confusion and accidental URL clicks
// ⚠️⚠️⚠️ DO NOT CHANGE WITHOUT BACKING UP FIRST ⚠️⚠️⚠️

/**
 * Supabase URL Encoder/Decoder
 * Converts full Supabase URLs to shortened, non-clickable formats
 * and back again for actual connection use.
 */
class SupabaseUrlEncoder {
    constructor() {
        this.supabaseDomain = '.supabase.co';
        this.shortDomain = '.s_co';
    }

    /**
     * Encode a full Supabase URL to a shortened format
     * @param {string} fullUrl - Full Supabase URL like https://skddvbmxzeprvxfslhlk.supabase.co?session=ABC123
     * @returns {string} - Shortened URL like skddvbmxzeprvxfslhlk.s_co?session=ABC123
     */
    encodeUrl(fullUrl) {
        try {
            if (!fullUrl || typeof fullUrl !== 'string') {
                console.warn('SupabaseUrlEncoder: Invalid URL provided for encoding');
                return fullUrl;
            }

            // Remove https:// if present
            let shortened = fullUrl.replace(/^https?:\/\//, '');
            
            // Replace .supabase.co with .s_co
            shortened = shortened.replace(this.supabaseDomain, this.shortDomain);
            
            console.log('URL Encoded:', fullUrl, '→', shortened);
            return shortened;
        } catch (error) {
            console.error('SupabaseUrlEncoder: Error encoding URL:', error);
            return fullUrl; // Fallback to original
        }
    }

    /**
     * Decode a shortened URL back to full Supabase URL
     * @param {string} shortUrl - Shortened URL like skddvbmxzeprvxfslhlk.s_co?session=ABC123
     * @returns {string} - Full URL like https://skddvbmxzeprvxfslhlk.supabase.co?session=ABC123
     */
    decodeUrl(shortUrl) {
        try {
            if (!shortUrl || typeof shortUrl !== 'string') {
                console.warn('SupabaseUrlEncoder: Invalid URL provided for decoding');
                return shortUrl;
            }

            let fullUrl = shortUrl;

            // If it contains .s_co, decode it
            if (fullUrl.includes(this.shortDomain)) {
                // Replace .s_co with .supabase.co
                fullUrl = fullUrl.replace(this.shortDomain, this.supabaseDomain);
                
                // Add https:// if not present
                if (!fullUrl.startsWith('http')) {
                    fullUrl = 'https://' + fullUrl;
                }
                
                console.log('URL Decoded:', shortUrl, '→', fullUrl);
            } else {
                console.log('URL appears to be full format already:', shortUrl);
            }

            return fullUrl;
        } catch (error) {
            console.error('SupabaseUrlEncoder: Error decoding URL:', error);
            return shortUrl; // Fallback to original
        }
    }

    /**
     * Check if a URL is in shortened format
     * @param {string} url - URL to check
     * @returns {boolean} - True if URL is shortened
     */
    isShortened(url) {
        return url && url.includes(this.shortDomain);
    }

    /**
     * Check if a URL is in full format
     * @param {string} url - URL to check
     * @returns {boolean} - True if URL is full format
     */
    isFull(url) {
        return url && url.includes(this.supabaseDomain);
    }

    /**
     * Smart decode - handles both shortened and full URLs
     * @param {string} url - Any URL format
     * @returns {string} - Always returns full URL format
     */
    ensureFullUrl(url) {
        if (this.isShortened(url)) {
            return this.decodeUrl(url);
        }
        return url; // Already full or different format
    }
}

// Create global instance
window.supabaseUrlEncoder = new SupabaseUrlEncoder();

// Also export for module use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseUrlEncoder;
}
