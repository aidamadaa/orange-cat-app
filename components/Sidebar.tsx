import React, { useRef, useState } from 'react';
import { ChatSession, Language } from '../types';
import { Icons } from './Icon';
import { translations } from '../utils/translations';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  onLock: () => void;
  onNuke: () => void;
  onChangePin: () => void;
  incognitoMode: boolean;
  onToggleIncognito: () => void;
  onBackup: () => void;
  onRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShowAbout: () => void;
  onShowSettings: () => void;
  language: Language;
  onSetLanguage: (lang: Language) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onCloseMobile,
  onLock,
  onNuke,
  onChangePin,
  incognitoMode,
  onToggleIncognito,
  onBackup,
  onRestore,
  onShowAbout,
  onShowSettings,
  language,
  onSetLanguage
}) => {
  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/20 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed md:relative z-30 
          w-72 h-full 
          bg-[#F5F2EA] border-r border-[#E5E2D9]
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E5E2D9] flex items-center justify-between shrink-0 h-16">
          <button 
            onClick={onShowAbout}
            className="flex items-center gap-3 font-semibold text-gray-800 hover:opacity-80 transition-opacity group"
            title="App Info & Privacy"
          >
            <Icons.Cat size={32} className="text-orange-600 group-hover:scale-105 transition-transform" />
            <span className="text-lg tracking-tight">Orange Cat</span>
          </button>
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-2 text-gray-500 hover:text-gray-900"
          >
            <Icons.X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 shrink-0">
          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg font-medium group"
          >
            <Icons.Plus size={20} className="group-hover:scale-110 transition-transform" />
            <span>{t.newChat}</span>
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {sortedSessions.length === 0 ? (
            <div className="text-center py-10 px-4 text-gray-400">
              <Icons.Lock className="mx-auto mb-3 opacity-50" size={32} />
              <p className="text-sm">Encrypted Storage.</p>
              <p className="text-xs mt-1">Chats are safe and private.</p>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.history}
              </div>
              {sortedSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onCloseMobile();
                  }}
                  className={`
                    group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors
                    ${currentSessionId === session.id 
                      ? 'bg-white text-gray-900 border border-gray-200 shadow-sm' 
                      : 'text-gray-600 hover:bg-white/60 hover:text-gray-900 border border-transparent'}
                  `}
                >
                  <Icons.MessageSquare size={16} className={`shrink-0 ${currentSessionId === session.id ? 'text-orange-500' : 'opacity-70'}`} />
                  <div className="flex-1 truncate text-sm font-medium">
                    {session.title || 'Encrypted Chat'}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id, e);
                    }}
                    className={`
                      p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 
                      opacity-0 group-hover:opacity-100 transition-all focus:opacity-100
                      ${currentSessionId === session.id ? 'opacity-100' : ''}
                    `}
                    title="Delete chat"
                  >
                    <Icons.Trash2 size={14} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E2D9] shrink-0 space-y-1">
           {/* Language Selector */}
           <div className="flex gap-1 mb-2 bg-[#EBE8E0] rounded-lg p-1">
               {(['en', 'ms', 'zh', 'ta', 'id'] as Language[]).map(lang => (
                   <button
                        key={lang}
                        onClick={() => onSetLanguage(lang)}
                        className={`
                            flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-colors
                            ${language === lang ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}
                        `}
                   >
                       {lang === 'en' && 'EN'}
                       {lang === 'ms' && 'BM'}
                       {lang === 'zh' && '中'}
                       {lang === 'ta' && 'TA'}
                       {lang === 'id' && 'ID'}
                   </button>
               ))}
           </div>

           {/* Incognito Toggle */}
           <button 
             onClick={onToggleIncognito}
             className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium mb-1
                ${incognitoMode ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}
             `}
           >
             {incognitoMode ? <Icons.CheckCircle2 size={16} /> : <Icons.Shield size={16} />}
             <span>{incognitoMode ? t.incognitoActive : t.incognito}</span>
           </button>
           
           {/* DIRECT DATA BUTTONS */}
           <div className="py-2">
             <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onBackup}
                  className="flex items-center justify-center gap-2 px-3 py-3 bg-white hover:bg-gray-50 text-gray-600 hover:text-green-600 rounded-xl transition-all border border-gray-200 group shadow-sm"
                  title="Download your data to a file"
                >
                    <Icons.Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-xs font-medium">{t.saveData}</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-3 py-3 bg-white hover:bg-gray-50 text-gray-600 hover:text-blue-600 rounded-xl transition-all border border-gray-200 group shadow-sm"
                  title="Load data from a file"
                >
                    <Icons.Upload size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-xs font-medium">{t.loadData}</span>
                </button>
             </div>
             {/* Hidden Input for Restore */}
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onRestore} 
                accept=".json"
                className="hidden" 
             />
           </div>
           
           {/* Sign Out (Safe Exit) and PIN */}
           <div className="flex gap-2 mb-2">
              <button 
                 onClick={onLock}
                 className="flex-[2] flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-lg transition-colors text-xs font-medium border border-gray-200 hover:border-red-100 group shadow-sm"
                 title="Encrypts data and returns to login screen."
               >
                 <Icons.LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                 <span>{t.signOut}</span>
               </button>
               <button 
                 onClick={onChangePin}
                 className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors text-xs font-medium"
                 title="Change PIN"
               >
                 <Icons.Key size={14} />
                 <span>{t.pin}</span>
               </button>
           </div>
           
           {/* Nuke */}
           <button 
             onClick={onNuke}
             className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-medium"
           >
             <Icons.Trash2 size={14} />
             <span>{t.resetApp}</span>
           </button>

           {/* Buy Me A Coffee - RE-ENGINEERED */}
           <a
              href="https://buymeacoffee.com/techlogix_io"
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden group w-full flex items-center justify-center gap-2 px-3 py-3 mt-2 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-xl transition-all shadow-md hover:shadow-lg font-bold border border-amber-500/50"
           >
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
               <Icons.HeartPulse size={16} className="animate-pulse fill-amber-900/10 text-amber-800" />
               <span className="relative z-10">{t.buyCoffee}</span>
           </a>

           <div className="flex gap-2 mt-1">
             <button 
               onClick={onShowSettings}
               className="flex-1 flex items-center justify-center gap-2 text-[10px] text-gray-500 hover:text-orange-600 px-2 pt-2 border-t border-gray-200 transition-colors"
               title={t.settings}
             >
               <Icons.Settings size={12} />
               <span>{t.settings}</span>
             </button>
             
             <button 
               onClick={onShowAbout}
               className="flex-1 flex items-center justify-center gap-2 text-[10px] text-gray-500 hover:text-blue-600 px-2 pt-2 border-t border-gray-200 transition-colors"
               title="App Info"
             >
               <Icons.Info size={12} />
               <span>{t.aboutPrivacy}</span>
             </button>
           </div>

          <div className="text-center pt-1 text-[9px] text-gray-400 font-medium">
             &copy; {new Date().getFullYear()} Orange Cat
          </div>
        </div>
      </aside>
    </>
  );
};
