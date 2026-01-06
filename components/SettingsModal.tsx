import React, { useState, useEffect } from 'react';
import { Icons } from './Icon';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentApiKey: string | null;
  onSaveKey: (key: string) => void;
  onRemoveKey: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    language, 
    currentApiKey, 
    onSaveKey, 
    onRemoveKey 
}) => {
  const [apiKey, setApiKey] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  
  const t = translations[language];
  // Check the flag injected by Vite
  const hasSharedKey = (process.env.HAS_SHARED_KEY as unknown) as boolean;

  useEffect(() => {
    if (isOpen) {
        if (currentApiKey) {
            setApiKey(currentApiKey);
        } else {
            setApiKey('');
        }
    }
  }, [isOpen, currentApiKey]);

  const handleSave = () => {
      // Aggressive cleaning to ensure no hidden characters cause HTTP Header errors
      // Removes anything that isn't a standard ASCII character (32-126)
      const cleanKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();

      if (!cleanKey) return;
      
      onSaveKey(cleanKey);
      setApiKey(cleanKey); // Update the UI to show the cleaned key
      
      setStatusMsg(t.keySaved);
      setTimeout(() => setStatusMsg(''), 2000);
  };

  const handleRemove = () => {
      onRemoveKey();
      setApiKey('');
      setStatusMsg(t.keyRemoved);
      setTimeout(() => setStatusMsg(''), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
        >
          <Icons.X size={20} />
        </button>
        
        <div className="p-6">
           <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gray-50 rounded-xl text-orange-600">
                    <Icons.Settings size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t.settings}</h2>
           </div>

           {/* API KEY SECTION */}
           <div className="space-y-4">
               <div>
                   <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                       {t.customKey}
                   </label>
                   <div className="relative">
                       <input 
                          type="password" 
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="AIza..."
                          className="w-full bg-gray-50 text-gray-900 rounded-xl pl-4 pr-10 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 text-sm font-mono placeholder-gray-400"
                       />
                       <div className="absolute right-3 top-3 text-gray-400">
                           <Icons.Key size={18} />
                       </div>
                   </div>
               </div>

               {/* Status Indicator */}
               <div className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2">
                       {currentApiKey ? (
                           <span className="text-green-600 flex items-center gap-1 font-medium bg-green-50 px-2 py-1 rounded">
                               <Icons.CheckCircle2 size={12} />
                               {t.usingCustom}
                           </span>
                       ) : hasSharedKey ? (
                           <span className="text-blue-600 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded">
                               <Icons.Info size={12} />
                               {t.usingDefault}
                           </span>
                       ) : (
                           <span className="text-red-500 flex items-center gap-1 font-medium bg-red-50 px-2 py-1 rounded">
                               <Icons.X size={12} />
                               No Key Set
                           </span>
                       )}
                   </div>
                   {statusMsg && <span className="text-orange-600 font-bold animate-pulse">{statusMsg}</span>}
               </div>

               <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                   <p className="text-[10px] text-gray-500 leading-relaxed">
                       <Icons.Lock size={10} className="inline mr-1 text-orange-500"/>
                       <strong>Security:</strong> Your API key is encrypted with your PIN before being saved. It is never sent to our servers, only to Google.
                   </p>
               </div>

               <div className="flex gap-2 pt-2">
                   <button 
                      onClick={handleSave}
                      disabled={!apiKey}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                   >
                       {t.saveKey}
                   </button>
                   {currentApiKey && (
                       <button 
                          onClick={handleRemove}
                          className="px-4 bg-white hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-xl font-medium transition-colors text-sm border border-gray-200 hover:border-red-200"
                       >
                           {t.removeKey}
                       </button>
                   )}
               </div>
           </div>

        </div>
      </div>
    </div>
  );
};