import { useState, useEffect, useCallback } from 'react';
import { ChatSession, Message } from '../types';
import { STORAGE_KEY } from '../constants';
import { encryptData, decryptData } from '../utils/crypto';

export const useLocalStorage = (encryptionKey: string | null) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load and Decrypt
  useEffect(() => {
    const load = async () => {
      if (!encryptionKey) return;
      
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const decryptedJson = await decryptData(stored, encryptionKey);
          if (decryptedJson) {
            setSessions(JSON.parse(decryptedJson));
          } else {
             console.error("Failed to decrypt storage");
          }
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
      } finally {
        setIsLoaded(true);
      }
    };
    
    if (encryptionKey && !isLoaded) {
        load();
    } else if (!encryptionKey) {
        setIsLoaded(false);
        setSessions([]);
    }
  }, [encryptionKey, isLoaded]);

  // Save and Encrypt
  useEffect(() => {
    const save = async () => {
      if (isLoaded && encryptionKey) {
        const encrypted = await encryptData(JSON.stringify(sessions), encryptionKey);
        localStorage.setItem(STORAGE_KEY, encrypted);
      }
    };
    
    const timeout = setTimeout(save, 500);
    return () => clearTimeout(timeout);
  }, [sessions, isLoaded, encryptionKey]);

  const addSession = useCallback((session: ChatSession) => {
    setSessions(prev => [session, ...prev]);
  }, []);

  const updateSession = useCallback((id: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(session => 
      session.id === id ? { ...session, ...updates, updatedAt: Date.now() } : session
    ));
  }, []);

  const addMessageToSession = useCallback((sessionId: string, message: Message) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          messages: [...session.messages, message],
          updatedAt: Date.now()
        };
      }
      return session;
    }));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    sessions,
    isLoaded,
    addSession,
    updateSession,
    addMessageToSession,
    deleteSession,
    clearAllSessions
  };
};