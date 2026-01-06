import { GoogleGenAI, Content, GenerateContentResponse } from "@google/genai";
import { Message, Language } from "../types";
import { GEMINI_MODEL } from "../constants";

// Helper to sanitize API Key to prevent "Header contains non ISO-8859-1" errors
// This removes any character that is not a standard printable ASCII character
const cleanApiKey = (key: string): string => {
  if (!key) return "";
  return key.replace(/[^\x20-\x7E]/g, '').trim();
};

// Helper to convert our internal Message format to the SDK's Content format
const formatHistory = (messages: Message[]): Content[] => {
  return messages.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));
};

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const streamGeminiResponse = async (
  history: Message[],
  userMessage: string,
  onChunk: (text: string) => void,
  language: Language = 'en',
  customApiKey?: string | null // NEW: Accept decrypted key from App
): Promise<{ text: string; sources?: { title: string; uri: string }[] }> => {
  
  // Prioritize passed custom key, fallback to env
  let apiKey = customApiKey || process.env.API_KEY;

  // Sanitize the key to ensure no hidden characters break the HTTP headers
  if (apiKey) {
      apiKey = cleanApiKey(apiKey);
  }

  if (!apiKey) {
    throw new Error("API Key is missing. Please check settings.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Filter out error messages or empty messages from history before sending to API
  const validHistory = history.filter(m => !m.isError && m.text.trim() !== "");
  
  // Map language code to full English name for the prompt
  const langMap: Record<Language, string> = {
      en: 'English',
      ms: 'Bahasa Melayu (Malay)',
      zh: 'Chinese (Simplified)',
      ta: 'Tamil',
      id: 'Bahasa Indonesia'
  };
  const targetLang = langMap[language];

  // Robust Date/Time Formatting
  const now = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
  
  const currentDate = now.toLocaleDateString('en-US', dateOptions);
  const currentTime = now.toLocaleTimeString('en-US', timeOptions);
  
  const systemContext = `Today is ${currentDate}. The current time is ${currentTime}.`;

  const chat = ai.chats.create({
    model: GEMINI_MODEL,
    history: formatHistory(validHistory),
    config: {
      tools: [{ googleSearch: {} }], // Enabled for real-time data
      systemInstruction: `${systemContext}
      You are Orange Cat, a secure, private AI assistant with access to Real-Time Google Search.
      
      CORE RULE:
      - **TIME AWARENESS:** Always use "${currentDate}" as your reference for "today", "now", or "current". Do not assume it is 2024 or 2026.
      - You are CONNECTED to the internet via Google Search.
      - **ALWAYS** use the Google Search tool for queries about current events, news, prices, weather, or any information that changes over time.
      - **NEVER** say "My knowledge cutoff is..." or "I don't have real-time access". You DO have real-time access via Google Search.
      
      IMPORTANT LANGUAGE RULE:
      You MUST respond in ${targetLang}. Even if the context is mixed, your final output must be in ${targetLang} unless explicitly asked to translate.
      
      CORE SPECIALTIES:
      1. SHOPPING & COMMERCE (Primary):
         - You are an Expert Shopper for **Amazon.com** AND **Shopee Malaysia**.
         - **Context Awareness:** 
           - If the user asks for "Shopee", "Malaysia", "RM", "Ringgit", or local brands, **ONLY provide Shopee Malaysia links**.
           - If the user asks for global items or specific US brands, use Amazon.
         
         **AMAZON RULES:**
         - Provide valid 'https://' links formatted as Markdown.
         - **CRITICAL**: Do NOT guess specific product ASINs or IDs. They are often wrong.
         - **Format**: Always use the search URL format: https://www.amazon.com/s?k=YOUR_SEARCH_TERMS
         - Replace spaces with + or %20.
         - Example: [Stanley Cup](https://www.amazon.com/s?k=Stanley+Quencher+H2.0)
         - Prioritize "Best Sellers" and "Movers & Shakers".

         **SPECIAL REQUEST: AMAZON BEST SELLERS LIST**
         If the user asks for "Amazon Best Sellers" or the "Department List", DO NOT search. Instead, output the following Markdown list EXACTLY (The app will automatically add affiliate tags):

         ### Amazon Best Sellers by Department
         *   [Any Department](https://www.amazon.com/gp/bestsellers)
         *   [Amazon Devices & Accessories](https://www.amazon.com/gp/bestsellers/amazon-devices)
         *   [Amazon Renewed](https://www.amazon.com/gp/bestsellers/amazon-renewed)
         *   [Appliances](https://www.amazon.com/gp/bestsellers/appliances)
         *   [Apps & Games](https://www.amazon.com/gp/bestsellers/mobile-apps)
         *   [Arts, Crafts & Sewing](https://www.amazon.com/gp/bestsellers/arts-crafts)
         *   [Audible Books & Originals](https://www.amazon.com/gp/bestsellers/audible)
         *   [Automotive](https://www.amazon.com/gp/bestsellers/automotive)
         *   [Baby](https://www.amazon.com/gp/bestsellers/baby-products)
         *   [Beauty & Personal Care](https://www.amazon.com/gp/bestsellers/beauty)
         *   [Books](https://www.amazon.com/gp/bestsellers/books)
         *   [Camera & Photo Products](https://www.amazon.com/gp/bestsellers/photo)
         *   [CDs & Vinyl](https://www.amazon.com/gp/bestsellers/music)
         *   [Cell Phones & Accessories](https://www.amazon.com/gp/bestsellers/wireless)
         *   [Clothing, Shoes & Jewelry](https://www.amazon.com/gp/bestsellers/fashion)
         *   [Collectible Coins](https://www.amazon.com/gp/bestsellers/coins)
         *   [Computers & Accessories](https://www.amazon.com/gp/bestsellers/pc)
         *   [Digital Educational Resources](https://www.amazon.com/gp/bestsellers/software)
         *   [Digital Music](https://www.amazon.com/gp/bestsellers/dmusic)
         *   [Electronics](https://www.amazon.com/gp/bestsellers/electronics)
         *   [Entertainment Collectibles](https://www.amazon.com/gp/bestsellers/entertainment-collectibles)
         *   [Gift Cards](https://www.amazon.com/gp/bestsellers/gift-cards)
         *   [Grocery & Gourmet Food](https://www.amazon.com/gp/bestsellers/grocery)
         *   [Handmade Products](https://www.amazon.com/gp/bestsellers/handmade)
         *   [Health & Household](https://www.amazon.com/gp/bestsellers/hpc)
         *   [Home & Kitchen](https://www.amazon.com/gp/bestsellers/home-garden)
         *   [Industrial & Scientific](https://www.amazon.com/gp/bestsellers/industrial)
         *   [Kindle Store](https://www.amazon.com/gp/bestsellers/digital-text)
         *   [Kitchen & Dining](https://www.amazon.com/gp/bestsellers/kitchen)
         *   [Movies & TV](https://www.amazon.com/gp/bestsellers/movies-tv)
         *   [Musical Instruments](https://www.amazon.com/gp/bestsellers/musical-instruments)
         *   [Office Products](https://www.amazon.com/gp/bestsellers/office-products)
         *   [Patio, Lawn & Garden](https://www.amazon.com/gp/bestsellers/lawn-garden)
         *   [Pet Supplies](https://www.amazon.com/gp/bestsellers/pet-supplies)
         *   [Software](https://www.amazon.com/gp/bestsellers/software)
         *   [Sports & Outdoors](https://www.amazon.com/gp/bestsellers/sporting-goods)
         *   [Sports Collectibles](https://www.amazon.com/gp/bestsellers/sports-collectibles)
         *   [Tools & Home Improvement](https://www.amazon.com/gp/bestsellers/hi)
         *   [Toys & Games](https://www.amazon.com/gp/bestsellers/toys-and-games)
         *   [Video Games](https://www.amazon.com/gp/bestsellers/videogames)

         **SHOPEE MALAYSIA RULES:**
         - **CRITICAL**: Always use the domain **shopee.com.my**. DO NOT use 'shopee.com' or 'shopee.sg'.
         - You CANNOT guess specific product IDs. You MUST use Search URLs.
         - **Format:** [Product Name](https://shopee.com.my/search?keyword=YOUR_SEARCH_TERMS)
         - Replace spaces in keywords with %20.
         - Example: "I found some options: [Whiskas Cat Food](https://shopee.com.my/search?keyword=whiskas%20cat%20food)"
      
      2. CODING & TECHNICAL:
         - If the user asks for code, debugging, or technical explanation -> ACT AS A SENIOR ENGINEER.
         - Use standard Markdown code blocks (\`\`\`language ... \`\`\`) for all code.
         - Be concise, efficient, and modern in your coding solutions.
      
      3. WRITING & CREATIVITY:
         - If the user asks for emails, stories, or content -> ACT AS A PROFESSIONAL WRITER.
         - Use clear formatting, bullet points, and headers.
         - Adjust tone based on the user's request (Professional vs Creative).
      
      4. GENERAL KNOWLEDGE:
         - If the user asks about facts, history, or science -> ACT AS A RESEARCHER.
         - Provide up-to-date information.
         
      Discovery Links Map:
      - "Shopee Shocking Sale": "https://shopee.com.my/flash_deals"
      - "Shopee Mall": "https://shopee.com.my/mall"
      `,
    },
  });

  let lastError: any;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
        const resultStream = await chat.sendMessageStream({ message: userMessage });
        
        let fullText = "";
        const collectedSources: { title: string; uri: string }[] = [];

        for await (const chunk of resultStream) {
            const c = chunk as GenerateContentResponse;
            const text = c.text;
            if (text) {
                fullText += text;
                onChunk(text);
            }

            // Extract Grounding Metadata (Sources)
            const candidate = c.candidates?.[0];
            if (candidate?.groundingMetadata?.groundingChunks) {
                candidate.groundingMetadata.groundingChunks.forEach((chunk: any) => {
                    if (chunk.web?.uri && chunk.web?.title) {
                        // Deduplicate sources
                        if (!collectedSources.some(s => s.uri === chunk.web.uri)) {
                            collectedSources.push({
                                title: chunk.web.title,
                                uri: chunk.web.uri
                            });
                        }
                    }
                });
            }
        }
        
        return { text: fullText, sources: collectedSources };

    } catch (error: any) {
        lastError = error;
        // Check specifically for 503 (Overloaded)
        const isOverloaded = error.toString().includes('503');
        
        if (isOverloaded && attempt < maxRetries) {
            const waitTime = 1000 * attempt; // Exponential backoff: 1s, 2s...
            console.warn(`Gemini Service Overloaded (503). Retrying attempt ${attempt}/${maxRetries} in ${waitTime}ms...`);
            await delay(waitTime);
            continue;
        }
        
        // If not a retriable error or max retries reached, break
        break;
    }
  }

  // Handle errors that persisted after retries
  console.error("Gemini API Final Error:", lastError);
    
  // Friendly error handling for Free Tier limitations
  if (lastError?.toString().includes('429') || lastError?.toString().toLowerCase().includes('quota')) {
      throw new Error("Free Tier usage limit reached. Please add your own API Key in Settings to continue.");
  }
  
  if (lastError?.toString().includes('503')) {
      throw new Error("The AI service is temporarily overloaded. Please try again.");
  }

  throw lastError;
};

export const generateTitle = async (firstMessage: string, customApiKey?: string | null): Promise<string> => {
  let apiKey = customApiKey || process.env.API_KEY;

  if (apiKey) {
      apiKey = cleanApiKey(apiKey);
  }

   if (!apiKey) {
    return "New Chat";
  }
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Generate a very short, concise title (max 4-5 words) for a chat that starts with this message: "${firstMessage}". Do not use quotes.`,
    });
    return response.text?.trim() || "New Chat";
  } catch (e) {
    return "New Chat";
  }
}