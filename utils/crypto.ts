import { v4 as uuidv4 } from 'uuid';

const enc = new TextEncoder();
const dec = new TextDecoder();

// Basic Crypto Helpers
const getKeyMaterial = (password: string) => 
  window.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);

const getKey = async (password: string, salt: Uint8Array) => {
  const keyMaterial = await getKeyMaterial(password);
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const generateId = () => {
    return uuidv4();
};

export const encryptData = async (text: string, password: string): Promise<string> => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(text)
  );

  const bundle = {
    s: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    d: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
  };
  return JSON.stringify(bundle);
};

export const decryptData = async (bundleStr: string, password: string): Promise<string | null> => {
  try {
    const bundle = JSON.parse(bundleStr);
    const salt = Uint8Array.from(atob(bundle.s), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(bundle.iv), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(bundle.d), c => c.charCodeAt(0));
    
    const key = await getKey(password, salt);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    return dec.decode(decrypted);
  } catch (e) {
    // console.error("Decryption failed", e); // Silence errors for wrong PIN attempts
    return null;
  }
};