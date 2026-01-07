
/* 
   SECURITY LOCK: PROTOCOL_V3_AUTHORITATIVE
   SYSTEM INTEGRITY: LOCKED
   ACCESS: ADMIN_ONLY
   
   WARNING: This registry is immutable. 
   Modifications require administrative override.
*/

// Primary Model (Reference only, protocol uses registry)
export const GEMINI_MODEL = 'gemini-2.0-pro-exp-02-05';

// === DECUPLE AI REGISTRY (v3.2) ===
// The Fallback Protocol: A prioritized hierarchy of 10 AI models.
// Strictly enforces Gemini 2.0 and 3.0 series. NO LEGACY MODELS.
export const GEMINI_MODELS = [
    // TIER 1: INTELLIGENCE & REASONING (The "Brain")
    'gemini-2.0-pro-exp-02-05',             // 1. Newest Pro Experimental
    'gemini-2.0-flash-thinking-exp-01-21',  // 2. Deep Thinking (Chain of Thought)
    
    // TIER 2: HIGH-SPEED PREVIEWS (The "Reflex")
    'gemini-3-pro-preview',                 // 3. Next-Gen Preview (Complex Tasks)
    'gemini-2.0-flash-exp',                 // 4. Flash Experimental (Speed)
    
    // TIER 3: NEW LITE ARCHITECTURE
    'gemini-2.0-flash-lite-preview-02-05',  // 5. Newest Lite Architecture
    
    // TIER 4: STABLE PREVIEWS
    'gemini-3-flash-preview',               // 6. Next-Gen Flash
    'gemini-exp-1206',                      // 7. Stable Snapshot
    
    // TIER 5: PRODUCTION ALIASES (Auto-updates to best available)
    'gemini-flash-latest',                  // 8. General Flash Alias
    'gemini-flash-lite-latest',             // 9. General Lite Alias
    
    // TIER 6: ULTIMATE FALLBACK
    'gemini-2.0-flash'                      // 10. Base 2.0 Flash
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
