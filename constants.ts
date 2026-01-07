
/* 
   SECURITY LOCK: PROTOCOL_V3_AUTHORITATIVE
   SYSTEM INTEGRITY: LOCKED
   ACCESS: ADMIN_ONLY
*/

// Primary Model (Reference only, protocol uses registry)
export const GEMINI_MODEL = 'gemini-3-pro-preview';

// === DECUPLE AI REGISTRY ===
// The Fallback Protocol: A prioritized hierarchy of 10 AI models.
// The system automatically cascades down this list upon failure.
export const GEMINI_MODELS = [
    // TIER 1: HIGH REASONING & PREVIEW
    'gemini-3-pro-preview',             // 1. Top Tier (Reasoning)
    'gemini-2.0-pro-exp-02-05',         // 2. Experimental Pro

    // TIER 2: THINKING & FLASH
    'gemini-2.0-flash-thinking-exp-01-21', // 3. Thinking (CoT)
    'gemini-2.0-flash-exp',             // 4. Flash Experimental

    // TIER 3: SPEED & STABILITY
    'gemini-3-flash-preview',           // 5. Next Gen Flash
    'gemini-exp-1206',                  // 6. Stable Snapshot
    
    // TIER 4: PRODUCTION
    'gemini-2.5-flash-latest',          // 7. Stable Flash 2.5
    'gemini-2.5-flash-lite-latest',     // 8. Lite (High QPS)
    
    // TIER 5: SPECIALIZED & BACKUP
    'learnlm-1.5-pro-experimental',     // 9. Education Specialized
    'gemini-1.5-flash-8b-latest'        // 10. Micro Model (Last Resort)
];

// Updated to V3 for Master Key Architecture
export const STORAGE_KEY = 'gemini_secure_data_v3';
export const AUTH_DATA_KEY = 'gemini_secure_auth_v3';
export const USER_EMAIL_KEY = 'gemini_secure_email_v3';
export const PERSISTENT_SESSION_KEY = 'gemini_secure_session_v3';

// NEW: User Custom API Key Storage
export const USER_API_KEY = 'gemini_user_custom_key';

// AMAZON
export const AMAZON_AFFILIATE_TAG = 'reviewradar88-20'; 

// SHOPEE MALAYSIA
export const SHOPEE_AFFILIATE_USERNAME = 'myhalalshopadmin';
export const SHOPEE_AFFILIATE_ID = '12372440119';

export const WELCOME_MESSAGE = "Meow! I'm Orange Cat. I am encrypted and secure.";
