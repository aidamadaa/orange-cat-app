import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { LockScreen } from './components/LockScreen';
import { AboutModal } from './components/AboutModal';
import { SettingsModal } from './components/SettingsModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSecurity } from './hooks/useSecurity';
import { streamGeminiResponse, generateTitle } from './services/geminiService';
import { Message, ChatSession, Language } from './types';
import { Icons } from './components/Icon';
import { AUTH_DATA_KEY, STORAGE_KEY, USER_EMAIL_KEY, USER_API_KEY } from './constants';
import { encryptData, decryptData } from './utils/crypto';

function App() {
  const {
    isAuthenticated,
    isSetup,
    isLoading: isSecurityLoading,
    encryptionKey, // This is the Master Key
    userEmail,
    setup,
    login,
    recoverAccount,
    lock,
    nuke
  } = useSecurity();

  // Pass the encryptionKey (Master Key) to useLocalStorage
  const { 
    sessions, 
    addSession, 
    updateSession, 
    addMessageToSession, 
    deleteSession,
    isLoaded,
    clearAllSessions
  } = useLocalStorage(encryptionKey);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Custom API Key State (Decrypted)
  const [customApiKey, setCustomApiKey] = useState<string | null>(null);

  // Language State
  const [language, setLanguage] = useState<Language>(() => {
     return (localStorage.getItem('gemini_app_lang') as Language) || 'en';
  });

  const handleSetLanguage = (lang: Language) => {
      setLanguage(lang);
      localStorage.setItem('gemini_app_lang', lang);
  };
  
  // SECURE API KEY LOADING
  useEffect(() => {
    const loadSecureKey = async () => {
        if (isAuthenticated && encryptionKey) {
            const encryptedKey = localStorage.getItem(USER_API_KEY);
            if (encryptedKey) {
                // Decrypt the API key using the same Master Key as the chats
                const decrypted = await decryptData(encryptedKey, encryptionKey);
                if (decrypted) {
                    setCustomApiKey(decrypted);
                }
            }
        } else if (!isAuthenticated) {
            // Clear from memory on logout
            setCustomApiKey(null);
        }
    };
    loadSecureKey();
  }, [isAuthenticated, encryptionKey]);

  // SECURE API KEY SAVING
  const handleSaveApiKey = async (rawKey: string) => {
      if (encryptionKey) {
          // Encrypt with Master Key
          const encrypted = await encryptData(rawKey, encryptionKey);
          localStorage.setItem(USER_API_KEY, encrypted);
          setCustomApiKey(rawKey);
      }
  };

  const handleRemoveApiKey = () => {
      localStorage.removeItem(USER_API_KEY);
      setCustomApiKey(null);
  };
  
  // Initialize or restore session
  useEffect(() => {
    if (isLoaded && isAuthenticated && !currentSessionId) {
      if (sessions.length > 0) {
        // Open most recent session
        const mostRecent = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0];
        setCurrentSessionId(mostRecent.id);
      } else {
        // Create new session if none exist
        handleNewChat();
      }
    }
  }, [isLoaded, sessions, currentSessionId, isAuthenticated]);

  const getCurrentSession = useCallback(() => {
    return sessions.find(s => s.id === currentSessionId);
  }, [sessions, currentSessionId]);

  const handleNewChat = useCallback(() => {
    // Prevent creating duplicate empty sessions
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession && currentSession.messages.length === 0) {
        return; 
    }

    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Encrypted Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addSession(newSession);
    setCurrentSessionId(newSession.id);
  }, [addSession, sessions, currentSessionId]);

  const handleSendMessage = async (text: string) => {
    if (!currentSessionId) return;

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      text,
      timestamp: Date.now()
    };

    addMessageToSession(currentSessionId, userMsg);
    setIsLoading(true);

    const currentSession = sessions.find(s => s.id === currentSessionId);
    
    // Privacy Control: Filter history based on Incognito Mode
    const history = currentSession ? [...currentSession.messages] : []; 
    const historyPayload = incognitoMode ? [] : [...history, userMsg];

    // Optimistic AI message placeholder
    const aiMsgId = uuidv4();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'model',
      text: '', 
      timestamp: Date.now()
    };
    addMessageToSession(currentSessionId, aiMsg);

    if (currentSession && currentSession.messages.length === 0) {
        // Pass customApiKey to title generator
        generateTitle(text, customApiKey).then(title => {
            updateSession(currentSessionId, { title });
        });
    }

    try {
      let fullText = "";
      const result = await streamGeminiResponse(
        historyPayload.filter(m => m.id !== aiMsgId), 
        text, 
        (chunk) => {
          fullText += chunk;
           updateSession(currentSessionId, {
             messages: history.concat(userMsg, { ...aiMsg, text: fullText })
           });
        },
        language,
        customApiKey // Pass the decrypted key
      );
      
      updateSession(currentSessionId, {
         messages: history.concat(userMsg, { 
            ...aiMsg, 
            text: result.text,
            sources: result.sources 
         })
       });

    } catch (error: any) {
       const errorMessage = error.message || "Connection error. Please check your network.";
       
       const failedMsg = { ...aiMsg, isError: true, text: `Error: ${errorMessage}` };
       const session = sessions.find(s => s.id === currentSessionId);
       if(session) {
           const newMessages = [...session.messages, userMsg, failedMsg]; 
           updateSession(currentSessionId, { messages: newMessages });
       }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSession(id);
    if (currentSessionId === id) {
      setCurrentSessionId(null); 
    }
  };

  // --- Backup & Restore Logic ---
  const handleBackup = () => {
    try {
        const data = {
            auth: localStorage.getItem(AUTH_DATA_KEY),
            chats: localStorage.getItem(STORAGE_KEY),
            email: localStorage.getItem(USER_EMAIL_KEY),
            // We should ideally backup the API key too, but it's encrypted with Master Key so it's safe to export
            apiKey: localStorage.getItem(USER_API_KEY),
            timestamp: Date.now(),
            version: 'v3',
            app: 'OrangeCat'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orange-cat-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        alert("Failed to generate backup: " + e);
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            
            if (!json.auth || !json.version || json.app !== 'OrangeCat') {
                throw new Error("Invalid or incompatible backup file.");
            }
            
            if (window.confirm("WARNING: Restoring will OVERWRITE all current data on this device. This action cannot be undone. Proceed?")) {
                localStorage.setItem(AUTH_DATA_KEY, json.auth);
                if (json.chats) localStorage.setItem(STORAGE_KEY, json.chats);
                if (json.email) localStorage.setItem(USER_EMAIL_KEY, json.email);
                if (json.apiKey) localStorage.setItem(USER_API_KEY, json.apiKey);
                
                alert("Restore successful! The app will now reload.");
                window.location.reload();
            }
        } catch (err: any) {
            alert("Failed to restore backup: " + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if ((!isLoaded && encryptionKey) || isSecurityLoading) {
    return (
      <div className="h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-gray-500 gap-4">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm animate-pulse">Decrypting secure storage...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LockScreen 
        mode={isSetup ? 'unlock' : 'setup'} 
        onSetup={setup}
        onLogin={login}
        onRecover={recoverAccount}
        language={language}
        onSetLanguage={handleSetLanguage}
      />
    );
  }

  const currentSession = getCurrentSession();

  return (
    <div className="flex h-screen w-full bg-[#FDFBF7] text-gray-800 overflow-hidden font-sans">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onLock={lock}
        onNuke={() => {
            if(window.confirm("WARNING: This will permanently delete ALL encrypted chats and reset your account. This action cannot be undone.")) {
                clearAllSessions();
                nuke();
            }
        }}
        onChangePin={() => alert("To change PIN, please use the Lock button then 'Forgot PIN?' option with your Recovery Code.")}
        incognitoMode={incognitoMode}
        onToggleIncognito={() => setIncognitoMode(!incognitoMode)}
        onBackup={handleBackup}
        onRestore={handleRestore}
        onShowAbout={() => setIsAboutOpen(true)}
        onShowSettings={() => setIsSettingsOpen(true)}
        language={language}
        onSetLanguage={handleSetLanguage}
      />
      
      <main className="flex-1 flex flex-col h-full w-full min-w-0">
        <ChatArea 
          messages={currentSession?.messages || []}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onNewChat={handleNewChat}
          currentTitle={currentSession?.title || 'New Chat'}
          language={language}
          hasCustomKey={!!customApiKey} // Check if key exists
          onOpenSettings={() => setIsSettingsOpen(true)} // Open Settings
        />
        {incognitoMode && (
             <div className="absolute top-16 right-4 md:right-8 z-10 flex items-center gap-2 px-3 py-1 bg-yellow-100/80 backdrop-blur text-xs text-yellow-800 rounded-full border border-yellow-200 shadow-md pointer-events-none">
                 <Icons.Shield size={12} />
                 <span>{language === 'ms' ? 'Mod Inkognito' : 'Incognito Mode'}</span>
             </div>
        )}
      </main>

      <AboutModal 
         isOpen={isAboutOpen} 
         onClose={() => setIsAboutOpen(false)} 
         language={language}
      />
      
      <SettingsModal 
         isOpen={isSettingsOpen}
         onClose={() => setIsSettingsOpen(false)}
         language={language}
         currentApiKey={customApiKey}
         onSaveKey={handleSaveApiKey}
         onRemoveKey={handleRemoveApiKey}
      />
    </div>
  );
}

export default App;