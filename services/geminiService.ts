import { GoogleGenAI, Content, GenerateContentResponse } from "@google/genai";
import { Message, Language } from "../types";
import { GEMINI_MODELS } from "../constants";

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

// === UNIFIED EXECUTION WRAPPER ===
// Manages the 10-tier fallback protocol for any AI operation
async function executeProtocol<T>(
    operationName: string,
    operation: (model: string) => Promise<T>
): Promise<T> {
    let lastError: any;
    const attemptedTiers: string[] = [];

    for (const modelTier of GEMINI_MODELS) {
        try {
            // console.log(`[Protocol] Executing ${operationName} :: Tier ${modelTier}`);
            return await operation(modelTier);
        } catch (error: any) {
            lastError = error;
            attemptedTiers.push(modelTier);
            
            // Enhanced Error Parsing: Check both message property and string representation
            const errStr = (error.message || error.toString()).toLowerCase();
            
            // Critical Security/Auth Errors - Fail Immediately
            if (errStr.includes('key') || errStr.includes('unauthenticated') || errStr.includes('permission')) {
                throw new Error("Security Alert: API Credentials Rejected.");
            }

            // Retryable Errors (Quota, 503, 404, Not Found, etc)
            const isRetryable = 
                errStr.includes('429') || 
                errStr.includes('503') || 
                errStr.includes('quota') || 
                errStr.includes('overloaded') ||
                errStr.includes('not found') || // Catches "model not found" errors
                errStr.includes('fetch failed');

            if (isRetryable) {
                console.warn(`[Protocol Failover] ${modelTier} unavailable. Switching to next tier...`);
                await delay(200); // 200ms latency buffer before switching
                continue;
            }

            // Unknown error - attempt failover as safety measure for robustness
            console.warn(`[Protocol Warning] Unknown error on ${modelTier}. Failover initiated.`);
            continue;
        }
    }

    console.error(`[Protocol Critical] All ${attemptedTiers.length} tiers failed.`, lastError);
    
    if (lastError?.toString().includes('429') || lastError?.toString().toLowerCase().includes('quota')) {
        throw new Error("System Capacity Reached. All 10 AI tiers are currently busy. Please try again shortly.");
    }
    
    throw lastError;
}

export const streamGeminiResponse = async (
  history: Message[],
  userMessage: string,
  onProgress: (fullText: string) => void, // UPDATED: Receives FULL text for atomic UI updates
  language: Language = 'en',
  customApiKey?: string | null
): Promise<{ text: string; sources?: { title: string; uri: string }[] }> => {
  
  let apiKey = customApiKey || process.env.API_KEY;
  if (apiKey) apiKey = cleanApiKey(apiKey);
  if (!apiKey) throw new Error("API Key is missing. Check settings.");

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const validHistory = history.filter(m => !m.isError && m.text.trim() !== "");
  
  // Language & Date Context
  const langMap: Record<Language, string> = {
      en: 'English',
      ms: 'Bahasa Melayu (Malay)',
      zh: 'Chinese (Simplified)',
      ta: 'Tamil',
      id: 'Bahasa Indonesia'
  };
  const { date, time } = getCurrentDateTime();
  const systemInstruction = `Today is ${date}. Current time: ${time}.
      You are Orange Cat, a secure AI assistant.
      
      CORE RULES:
      - Time Reference: Use "${date}" as "today".
      - Connectivity: You have Real-Time Google Search access. Use it for news, prices, and events.
      - Output Language: Respond in ${langMap[language]}.
      
      SPECIALTIES:
      1. SHOPPING (Amazon & Shopee MY):
         - Shopee MY: Use "shopee.com.my". No "shopee.sg".
         - Amazon: Use "amazon.com".
         - NEVER guess product IDs. Use Search URLs.
      2. CODING: Act as Senior Engineer.
      3. WRITING: Professional & Creative.
  `;

  // Execute via Protocol
  return executeProtocol<{ text: string, sources: any[] }>(
      "StreamResponse",
      async (model) => {
          const chat = ai.chats.create({
              model: model,
              history: formatHistory(validHistory),
              config: {
                  tools: [{ googleSearch: {} }],
                  systemInstruction: systemInstruction,
              },
          });

          const resultStream = await chat.sendMessageStream({ message: userMessage });
          
          let buffer = ""; // Attempt-local buffer
          const sources: { title: string; uri: string }[] = [];

          for await (const chunk of resultStream) {
              const c = chunk as GenerateContentResponse;
              const text = c.text;
              if (text) {
                  buffer += text;
                  onProgress(buffer); // Emit FULL buffer to overwrite any previous failed attempts in UI
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

  // Use Protocol for Title Generation too (High Availability)
  try {
      return await executeProtocol<string>("GenerateTitle", async (model) => {
          const response = await ai.models.generateContent({
              model: model,
              contents: `Generate a 4-word max title for: "${firstMessage}". No quotes.`,
          });
          return response.text?.trim() || "New Chat";
      });
  } catch (e) {
      return "New Chat";
  }
}
