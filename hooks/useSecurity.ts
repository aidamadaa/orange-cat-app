import { useState, useEffect } from 'react';
import { encryptData, decryptData, generateId } from '../utils/crypto';
import { AUTH_DATA_KEY, USER_EMAIL_KEY, PERSISTENT_SESSION_KEY } from '../constants';

interface AuthData {
  encryptedMasterKeyByPin: string;
  encryptedMasterKeyByRecovery: string;
}

export const useSecurity = () => {
  // Initialize from localStorage synchronously to prevent flash of "Setup" state
  const [isSetup, setIsSetup] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(AUTH_DATA_KEY);
      return !!stored && stored.length > 0;
    } catch (e) {
      console.error("Failed to read localStorage during init", e);
      return false;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null); // This is the Master Key
  const [userEmail, setUserEmail] = useState<string | null>(() => {
      try {
          return localStorage.getItem(USER_EMAIL_KEY);
      } catch {
          return null;
      }
  });

  // Check for persistent session on mount
  useEffect(() => {
      const checkPersistence = async () => {
          try {
              const persistentKey = localStorage.getItem(PERSISTENT_SESSION_KEY);
              if (persistentKey && isSetup) {
                  // If we have a saved key, use it to auto-login
                  setEncryptionKey(persistentKey);
                  setIsAuthenticated(true);
              }
          } catch (e) {
              console.error("Failed to restore session", e);
          } finally {
              setIsLoading(false);
          }
      };
      checkPersistence();
  }, [isSetup]);

  const setup = async (email: string, pin: string): Promise<string> => {
    // 1. Generate Master Key (The actual key used to encrypt data)
    const masterKey = generateId(); 
    
    // 2. Generate Recovery Code
    const recoveryCode = generateId().split('-').slice(0, 3).join('-').toUpperCase(); // format: XXXXXXXX-XXXX-XXXX

    // 3. Encrypt Master Key with PIN
    const encryptedMasterKeyByPin = await encryptData(masterKey, pin);

    // 4. Encrypt Master Key with Recovery Code
    const encryptedMasterKeyByRecovery = await encryptData(masterKey, recoveryCode);

    // 5. Store
    const authData: AuthData = {
      encryptedMasterKeyByPin,
      encryptedMasterKeyByRecovery
    };
    
    const serializedData = JSON.stringify(authData);

    try {
        localStorage.setItem(AUTH_DATA_KEY, serializedData);
        localStorage.setItem(USER_EMAIL_KEY, email);
        
        // Verify storage
        const verify = localStorage.getItem(AUTH_DATA_KEY);
        if (verify !== serializedData) {
            throw new Error("Storage verification failed. Browser may be blocking localStorage.");
        }
    } catch (e: any) {
        console.error("Failed to save setup data", e);
        throw new Error(e.message || "Could not save account data. Storage might be full or disabled.");
    }

    // 6. Set State
    setUserEmail(email);
    setEncryptionKey(masterKey);
    setIsSetup(true);
    // DO NOT set isAuthenticated(true) here. 
    // We want the user to see the "Account Created" screen with the recovery code first.

    return recoveryCode;
  };

  const login = async (pin: string, remember: boolean = false): Promise<boolean> => {
    const storedAuth = localStorage.getItem(AUTH_DATA_KEY);
    if (!storedAuth) return false;

    try {
      const authData: AuthData = JSON.parse(storedAuth);
      const masterKey = await decryptData(authData.encryptedMasterKeyByPin, pin);
      
      if (masterKey) {
        setEncryptionKey(masterKey);
        setIsAuthenticated(true);
        
        if (remember) {
            localStorage.setItem(PERSISTENT_SESSION_KEY, masterKey);
        }
        
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const recoverAccount = async (email: string, recoveryCode: string, newPin: string): Promise<boolean> => {
    const storedAuth = localStorage.getItem(AUTH_DATA_KEY);
    const storedEmail = localStorage.getItem(USER_EMAIL_KEY);

    // If email was lost but auth exists, we might still allow recovery if code matches?
    // For now strict check on auth presence.
    if (!storedAuth) return false;
    
    // Optional: Verify email if it exists in storage
    if (storedEmail && email.toLowerCase().trim() !== storedEmail.toLowerCase().trim()) return false;

    try {
      const authData: AuthData = JSON.parse(storedAuth);
      // Try to decrypt Master Key with Recovery Code
      const masterKey = await decryptData(authData.encryptedMasterKeyByRecovery, recoveryCode);
      
      if (masterKey) {
        // Success! Re-encrypt Master Key with New PIN
        const newEncryptedMasterKeyByPin = await encryptData(masterKey, newPin);
        
        // Update Storage
        const newAuthData: AuthData = {
          ...authData,
          encryptedMasterKeyByPin: newEncryptedMasterKeyByPin
        };
        localStorage.setItem(AUTH_DATA_KEY, JSON.stringify(newAuthData));
        // Ensure email is set if recovered
        localStorage.setItem(USER_EMAIL_KEY, email);

        setEncryptionKey(masterKey);
        setIsAuthenticated(true);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const lock = () => {
    localStorage.removeItem(PERSISTENT_SESSION_KEY); // Clear the remembered session
    setIsAuthenticated(false);
    setEncryptionKey(null);
  }

  const nuke = () => {
    localStorage.removeItem(AUTH_DATA_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    localStorage.removeItem(PERSISTENT_SESSION_KEY);
    setIsSetup(false);
    setIsAuthenticated(false);
    setEncryptionKey(null);
    setUserEmail(null);
    window.location.reload();
  };

  return {
    isAuthenticated,
    isSetup,
    isLoading,
    encryptionKey,
    userEmail,
    setup,
    login,
    recoverAccount,
    lock,
    nuke
  };
};