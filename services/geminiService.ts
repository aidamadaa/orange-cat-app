import { GoogleGenAI, Content, GenerateContentResponse } from "@google/genai";
import { Message, Language } from "../types";
import { PROTOCOL_REGISTRY, RegistryTier } from "../constants";

/* 
   SECURITY LOCK: PROTOCOL_V3_AUTHORITATIVE
   SYSTEM INTEGRITY: LOCKED
   ACCESS: ADMIN_ONLY
   
   This service handles the Decuple AI Registry Failover Protocol.
   Do not modify failover logic without authorization.
*/

// Helper to sanitize API Key
const cleanApiKey = (key: string): string => {
  if (!key) return "";
  return key.replace(/[^\x20-\x7E]/g, '').trim();
};

const formatHistory = (messages: Message[]): Content[] => {
  return messages.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getCurrentDateTime = () => {
    const now = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    return {
        date: now.toLocaleDateString('en-US', dateOptions),
        time: now.toLocaleTimeString('en-US', timeOptions)
    };
};

// === ADAPTIVE PROTOCOL WRAPPER ===
async function executeProtocol<T>(
    operationName: string,
    operation: (tier: RegistryTier) => Promise<T>
): Promise<T> {
    let lastError: any;
    const attemptedTiers: string[] = [];

    for (let i = 0; i < PROTOCOL_REGISTRY.length; i++) {
        const tier = PROTOCOL_REGISTRY[i];
        
        try {
            // Progressive Backoff: 150ms base + 100ms per tier depth
            if (i > 0) await delay(150 + (i * 100));
            
            // console.log(`[Protocol] Executing ${operationName} :: ${tier.name}`);
            return await operation(tier);

        } catch (error: any) {
            lastError = error;
            attemptedTiers.push(tier.name);
            
            const errStr = (error.message || error.toString()).toLowerCase();
            
            // Critical Security/Auth Errors - Fail Immediately
            if (errStr.includes('key') || errStr.includes('unauthenticated') || errStr.includes('permission')) {
                throw new Error("Security Alert: API Credentials Rejected.");
            }

            // Retryable Errors
            const isRetryable = 
                errStr.includes('429') || 
                errStr.includes('503') || 
                errStr.includes('quota') || 
                errStr.includes('overloaded') ||
                errStr.includes('not found') || 
                errStr.includes('fetch failed') ||
                errStr.includes('candidate'); // Blocked content often throws candidate errors

            if (isRetryable) {
                console.warn(`[Protocol Failover] ${tier.name} failed. Adapting...`);
                continue;
            }

            console.warn(`[Protocol Warning] Unknown error on ${tier.name}. Failover initiated.`);
            continue;
        }
    }

    console.error(`[Protocol Critical] All ${attemptedTiers.length} tiers exhausted.`, lastError);
    
    if (lastError?.toString().includes('429') || lastError?.toString().toLowerCase().includes('quota')) {
        throw new Error("System Capacity Reached. All AI tiers are busy. Please try again.");
    }
    
    throw lastError;
}

export const streamGeminiResponse = async (
  history: Message[],
  userMessage: string,
  onProgress: (fullText: string) => void,
  language: Language = 'en',
  customApiKey?: string | null
): Promise<{ text: string; sources?: { title: string; uri: string }[] }> => {
  
  let apiKey = customApiKey || process.env.API_KEY;
  if (apiKey) apiKey = cleanApiKey(apiKey);
  if (!apiKey) throw new Error("API Key is missing. Check settings.");

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const validHistory = history.filter(m => !m.isError && m.text.trim() !== "");
  
  const langMap: Record<Language, string> = {
      en: 'English',
      ms: 'Bahasa Melayu (Malay)',
      zh: 'Chinese (Simplified)',
      ta: 'Tamil',
      id: 'Bahasa Indonesia'
  };
  const { date, time } = getCurrentDateTime();
  
  // === STEALTH COMMERCE PROMPTING ===
  // Instructs AI to look for product vitals and enforces links
  const systemInstruction = `Today is ${date}. Current time: ${time}.
      You are Orange Cat, a secure AI assistant.
      
      CORE RULES:
      - Output Language: Respond in ${langMap[language]}.
      
      MANDATORY COMMERCE PROTOCOL:
      1. LINKING IS MANDATORY: You MUST provide clickable links for EVERY item, category, or department mentioned in a list.
      2. FORMAT: Use Markdown: [Item Name](URL).
      3. SEARCH URL GENERATION (CRITICAL):
         If a direct URL is not found, you MUST generate a Search URL:
         - Shopee MY: https://shopee.com.my/search?keyword=EXACT_NAME
         - Amazon: https://www.amazon.com/s?k=EXACT_NAME
      4. DEPARTMENT LISTS: When asked for "Best Sellers Departments" or categories, link EACH department to its Amazon/Shopee page.
         - Example: [Electronics](https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics)
      5. VITALS: Include Price/Rating if applicable.
      6. DOMAINS: Use "shopee.com.my" and "amazon.com" only.
      
      SPECIALTIES:
      - Social Media: When asked to draft posts, make them "Ready to Post" with hashtags.
      - Coding: Senior Engineer level.
  `;

  return executeProtocol<{ text: string, sources: any[] }>(
      "StreamResponse",
      async (tier) => {
          // Dynamic Tool Configuration
          const tools = tier.useSearch ? [{ googleSearch: {} }] : undefined;
          
          // Thinking Config (only for tiers that support it)
          const thinkingConfig = tier.thinkingBudget ? { thinkingBudget: tier.thinkingBudget } : undefined;

          // Conflict Resolution: Tools cannot be used with JSON mode (though we aren't enforcing JSON mode here, just good to know)
          
          const chat = ai.chats.create({
              model: tier.model,
              history: formatHistory(validHistory),
              config: {
                  tools: tools,
                  // thinkingConfig: thinkingConfig, // Only enable if supported by SDK version and model
                  systemInstruction: systemInstruction,
              },
          });

          const resultStream = await chat.sendMessageStream({ message: userMessage });
          
          let buffer = ""; 
          const sources: { title: string; uri: string }[] = [];

          for await (const chunk of resultStream) {
              const c = chunk as GenerateContentResponse;
              const text = c.text;
              if (text) {
                  buffer += text;
                  onProgress(buffer); 
              }

              const candidate = c.candidates?.[0];
              if (candidate?.groundingMetadata?.groundingChunks) {
                  candidate.groundingMetadata.groundingChunks.forEach((g: any) => {
                      if (g.web?.uri && g.web?.title) {
                          if (!sources.some(s => s.uri === g.web.uri)) {
                              sources.push({ title: g.web.title, uri: g.web.uri });
                          }
                      }
                  });
              }
          }
          
          return { text: buffer, sources };
      }
  );
};

export const generateTitle = async (firstMessage: string, customApiKey?: string | null): Promise<string> => {
  let apiKey = customApiKey || process.env.API_KEY;
  if (apiKey) apiKey = cleanApiKey(apiKey);
  if (!apiKey) return "New Chat";

  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
      // Use a simple flash model for titles to save latency/cost
      return await executeProtocol<string>("GenerateTitle", async (tier) => {
          // Skip high-reasoning tiers for titles, jump to Tier 7 (Flash Latest) logic if possible, 
          // but for simplicity we iterate. Actually, let's just use the first available tier but minimal config.
          const response = await ai.models.generateContent({
              model: tier.model,
              contents: `Generate a 4-word max title for: "${firstMessage}". No quotes.`,
          });
          return response.text?.trim() || "New Chat";
      });
  } catch (e) {
      return "New Chat";
  }
}
