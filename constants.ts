
/* 
   SECURITY LOCK: PROTOCOL_V3_AUTHORITATIVE
   SYSTEM INTEGRITY: LOCKED
   ACCESS: ADMIN_ONLY
   
   WARNING: This registry is immutable. 
   Modifications require administrative override.
*/

// Primary Model (Reference only, protocol uses registry)
export const GEMINI_MODEL = 'gemini-3-pro-preview';

export interface RegistryTier {
    model: string;
    useSearch: boolean;
    name: string;
    thinkingBudget?: number;
}

// === DECUPLE AI REGISTRY (v3.3 - 10 TIER RESILIENCE LOOP) ===
// 1. Pro Intelligence (Search)
// 2. Pro Intelligence (Redundant)
// 3. Performance Flash (Search)
// 4. Performance Flash (Redundant)
// 5. Grounding Fallback (Pro - No Search)
// 6. Grounding Fallback (Flash - No Search)
// 7. Availability Optimized (Latest Flash)
// 8. Availability Optimized (Lite)
// 9. Legacy Fallback (2.0 Flash)
// 10. Ultimate Fallback (1.5 Flash)

export const PROTOCOL_REGISTRY: RegistryTier[] = [
    // TIER 1-2: PRO INTELLIGENCE (Max Reasoning + Search)
    { model: 'gemini-3-pro-preview', useSearch: true, thinkingBudget: 32000, name: 'Tier 1: Gemini 3 Pro (Deep Search)' },
    { model: 'gemini-3-pro-preview', useSearch: true, thinkingBudget: 16000, name: 'Tier 2: Gemini 3 Pro (Retry)' },

    // TIER 3-4: PERFORMANCE FLASH (Speed + Search)
    { model: 'gemini-3-flash-preview', useSearch: true, name: 'Tier 3: Gemini 3 Flash (Speed Search)' },
    { model: 'gemini-3-flash-preview', useSearch: true, name: 'Tier 4: Gemini 3 Flash (Retry)' },

    // TIER 5-6: GROUNDING FALLBACK (Bypass Regional Search Blocks)
    { model: 'gemini-3-pro-preview', useSearch: false, name: 'Tier 5: Gemini 3 Pro (Direct)' },
    { model: 'gemini-3-flash-preview', useSearch: false, name: 'Tier 6: Gemini 3 Flash (Direct)' },
    
    // TIER 7-8: AVAILABILITY OPTIMIZED
    { model: 'gemini-flash-latest', useSearch: false, name: 'Tier 7: Flash Latest' },
    { model: 'gemini-flash-lite-latest', useSearch: false, name: 'Tier 8: Flash Lite' },
    
    // TIER 9-10: LEGACY / STABILITY LAYER
    { model: 'gemini-2.0-flash', useSearch: false, name: 'Tier 9: Gemini 2.0 Flash' },
    { model: 'gemini-1.5-flash', useSearch: false, name: 'Tier 10: Gemini 1.5 Flash' }
];

// Compatibility export
export const GEMINI_MODELS = PROTOCOL_REGISTRY.map(t => t.model);

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
