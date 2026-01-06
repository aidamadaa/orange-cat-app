import React, { useRef, useEffect, useState } from 'react';
import { Message, Language } from '../types';
import { MarkdownMessage } from './MarkdownMessage';
import { Icons } from './Icon';
import { translations, getDiscoveryPrompts } from '../utils/translations';
import { wrapDeepLink } from '../utils/deepLink';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onOpenSidebar: () => void;
  onNewChat: () => void;
  currentTitle: string;
  language: Language;
  hasCustomKey: boolean; 
  onOpenSettings: () => void; 
}

const MessageActions = ({ text, language }: { text: string, language: Language }) => {
  const [copied, setCopied] = useState(false);
  const t = translations[language];

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => console.error("Failed to copy", err));
  };

  const handleDownloadText = () => {
     const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
     downloadFile(text, `orange-cat-output-${timestamp}.md`, 'text/markdown');
  };

  // Simple Markdown Table to CSV Parser
  const extractTableToCSV = (text: string): string | null => {
    try {
        const lines = text.split('\n');
        // Identify lines that look like table rows (contain pipes)
        const tableLines = lines.filter(l => l.trim().startsWith('|') && l.trim().endsWith('|'));
        
        // Need at least header and one data row
        if (tableLines.length < 2) return null;

        // Remove separator lines (e.g. |---|---|)
        const dataLines = tableLines.filter(l => !l.includes('---'));
        
        if (dataLines.length === 0) return null;

        const csv = dataLines.map(line => {
            // Remove start/end pipe and split by internal pipes
            const row = line.trim();
            // Remove first and last char (pipes) then split
            const cells = row.substring(1, row.length - 1).split('|');
            
            return cells.map(cell => {
                // Clean whitespace and escape quotes
                const clean = cell.trim().replace(/"/g, '""'); 
                return `"${clean}"`;
            }).join(',');
        }).join('\n');
        
        return csv.length > 0 ? csv : null;
    } catch (e) {
        return null;
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const csvContent = extractTableToCSV(text);

  const handleDownloadCSV = () => {
    if (csvContent) {
        const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
        downloadFile(csvContent, `orange-cat-table-${timestamp}.csv`, 'text/csv');
    }
  };

  return (
    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-100 justify-end opacity-90">
       {/* CSV Download Button - Only visible if table detected */}
       {csvContent && (
         <button 
           onClick={handleDownloadCSV}
           className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-green-600 hover:bg-green-50 rounded transition-colors"
           title="Download Table as CSV"
         >
           <Icons.Table size={12} /> 
           <span>{t.saveCsv}</span>
         </button>
       )}
       
       <button 
          onClick={handleDownloadText}
          className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title="Download as Text File"
       >
          <Icons.FileText size={12} /> 
          <span>{t.saveText}</span>
       </button>
       
       <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors w-16 justify-center"
          title="Copy to Clipboard"
       >
          {copied ? (
             <>
               <Icons.Check size={12} className="text-green-600" />
               <span className="text-green-600">{t.copied}</span>
             </>
          ) : (
             <>
                <Icons.Copy size={12} />
                <span>{t.copy}</span>
             </>
          )}
       </button>
    </div>
  );
};

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onOpenSidebar,
  onNewChat,
  currentTitle,
  language,
  hasCustomKey,
  onOpenSettings
}) => {
  const [input, setInput] = useState('');
  const [showCommandDeck, setShowCommandDeck] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = translations[language];
  const discoveryPrompts = getDiscoveryPrompts(language);
  
  // Check shared key status from environment
  const hasSharedKey = (process.env.HAS_SHARED_KEY as unknown) as boolean;

  // Dynamic discovery items based on language
  const SHOPPING_DISCOVERY = [
    { icon: 'Flame', label: t.shopeeFlash, prompt: discoveryPrompts[0] },
    { icon: 'ShoppingBag', label: t.shopeeMall, prompt: discoveryPrompts[1] },
    { icon: 'Trophy', label: t.amazonBest, prompt: discoveryPrompts[2] },
    { icon: 'Sparkles', label: t.amazonNew, prompt: discoveryPrompts[3] },
    { icon: 'Truck', label: t.freeShip, prompt: discoveryPrompts[4] },
    { icon: 'Gift', label: t.giftIdeas, prompt: discoveryPrompts[5] },
  ];

  const PRODUCTIVITY_TOOLS = [
    { icon: 'Code', label: t.codeDebug, prompt: discoveryPrompts[6] },
    { icon: 'PenTool', label: t.creativeWrite, prompt: discoveryPrompts[7] },
    { icon: 'BookOpen', label: t.explainTopic, prompt: discoveryPrompts[8] },
    { icon: 'Compass', label: t.travelPlan, prompt: discoveryPrompts[9] },
  ];

  const COMMAND_DECK = [
      { icon: 'Search', label: t.cmdSearch, prompt: "Search Google for: ", color: "text-blue-500", bg: "bg-blue-50" },
      { icon: 'ShoppingCart', label: t.cmdShop, prompt: "Find the best price for ", color: "text-orange-500", bg: "bg-orange-50" },
      { icon: 'Code', label: t.cmdCode, prompt: "Write code to ", color: "text-green-600", bg: "bg-green-50" },
      { icon: 'PenTool', label: t.cmdWrite, prompt: "Write a professional ", color: "text-purple-500", bg: "bg-purple-50" },
      { icon: 'Compass', label: t.cmdTravel, prompt: "Plan a trip to ", color: "text-teal-500", bg: "bg-teal-50" },
      { icon: 'Eraser', label: t.cmdClear, action: "clear", color: "text-red-500", bg: "bg-red-50" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input);
    setInput('');
    setShowCommandDeck(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCommandClick = (cmd: typeof COMMAND_DECK[0]) => {
      if (cmd.action === 'clear') {
          setInput('');
      } else if (cmd.prompt) {
          setInput(cmd.prompt);
      }
      setShowCommandDeck(false);
      textareaRef.current?.focus();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FDFBF7] relative">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-[#E5E2D9] bg-[#FDFBF7]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <button 
            onClick={onOpenSidebar}
            className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Icons.Menu size={20} />
            <span className="text-xs font-medium">{t.history}</span>
          </button>
          <div className="flex items-center gap-2 overflow-hidden">
             <Icons.Cat size={24} className="md:hidden shrink-0 text-orange-600" />
             <h1 className="font-semibold text-gray-800 truncate">
               {currentTitle || t.newChat}
             </h1>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-1">
            <button 
                onClick={onNewChat}
                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2"
                title="Back to Main Page"
            >
                <span className="hidden sm:inline text-xs font-medium">{t.newChat}</span>
                <Icons.Plus size={22} />
            </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth relative">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-0 animate-fadeIn relative" style={{ animationFillMode: 'forwards', animationDuration: '0.5s' }}>
            
            {/* PAW BACKGROUND PATTERN FOR EMPTY STATE */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none overflow-hidden select-none">
                <Icons.PawPrint size={100} className="absolute top-[20%] left-[15%] rotate-12" />
                <Icons.PawPrint size={80} className="absolute bottom-[30%] right-[10%] -rotate-12" />
                <Icons.PawPrint size={120} className="absolute top-[40%] right-[30%] rotate-45" />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center">
                <div className="mb-4 mt-8 text-orange-600 drop-shadow-sm">
                  <Icons.Cat size={80} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.welcomeTitle}</h2>
                <p className="max-w-md text-center text-gray-500 mb-6 px-4">
                  {t.welcomeSubtitle}
                </p>

                {/* API KEY PROMPT BANNER - Shows ONLY if NO keys exist (Custom OR Shared) */}
                {!hasCustomKey && !hasSharedKey && (
                    <div 
                       onClick={onOpenSettings}
                       className="w-full max-w-md bg-red-50 border border-red-200 rounded-xl p-4 mb-8 cursor-pointer hover:border-red-300 transition-all flex items-center gap-4 group shadow-sm"
                    >
                        <div className="bg-red-100 p-3 rounded-lg text-red-600">
                            <Icons.Key size={24} />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-sm font-bold text-red-800 group-hover:text-red-900">Setup Required</h3>
                            <p className="text-xs text-red-700/80 mt-1">
                                No API Key detected. Add your free Gemini API Key to start chatting.
                            </p>
                        </div>
                        <Icons.Settings size={18} className="text-red-400 group-hover:text-red-600" />
                    </div>
                )}

                {/* Discovery Grid */}
                <div className="w-full max-w-4xl px-2 space-y-8 pb-10">
                    
                    {/* Shopping Trends Section */}
                    <div>
                         <div className="flex items-center justify-center gap-2 mb-4">
                             <Icons.ShoppingCart size={14} className="text-orange-500" />
                             <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.shopping}</p>
                         </div>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            {SHOPPING_DISCOVERY.map((item, i) => {
                                const Icon = Icons[item.icon as keyof typeof Icons];
                                return (
                                    <button 
                                        key={i}
                                        onClick={() => onSendMessage(item.prompt)}
                                        className="flex flex-col items-center p-3 bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-200 rounded-xl transition-all group text-center hover:shadow-md h-full justify-start"
                                    >
                                        <div className="p-2 bg-orange-100/50 rounded-lg mb-2 group-hover:scale-110 transition-transform text-orange-600">
                                            {Icon && <Icon size={18} />}
                                        </div>
                                        <span className="font-medium text-gray-700 text-xs leading-tight">{item.label}</span>
                                    </button>
                                );
                            })}
                         </div>
                    </div>

                    {/* Productivity Section */}
                    <div>
                        <div className="flex items-center justify-center gap-2 mb-4">
                             <Icons.Lightbulb size={14} className="text-blue-500" />
                             <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.creative}</p>
                         </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          {PRODUCTIVITY_TOOLS.map((item, i) => {
                            const Icon = Icons[item.icon as keyof typeof Icons];
                            return (
                              <button 
                                key={i}
                                onClick={() => onSendMessage(item.prompt)}
                                className="flex items-center gap-3 p-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl transition-all group text-left shadow-sm"
                              >
                                  <div className="p-2 bg-gray-100 rounded-lg group-hover:text-blue-600 text-gray-500 transition-colors">
                                    {Icon && <Icon size={18} />}
                                  </div>
                                  <div className="flex flex-col">
                                      <span className="text-sm font-medium text-gray-800">{item.label}</span>
                                      <span className="text-[10px] text-gray-500">Assistant Agent</span>
                                  </div>
                              </button>
                            )
                          })}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={msg.id || idx} 
              className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for Model */}
              {msg.role === 'model' && (
                <div className="mt-1 shrink-0 text-orange-600">
                  <Icons.Cat size={28} />
                </div>
              )}

              {/* Message Content */}
              <div 
                className={`
                  relative max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-orange-600 text-white rounded-tr-sm' 
                    : msg.isError 
                        ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm' // Error State
                        : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200' // Normal State
                  }
                `}
              >
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                ) : (
                  <>
                    <MarkdownMessage content={msg.text} />
                    
                    {/* Sources / Grounding - Only show if valid */}
                    {msg.sources && msg.sources.length > 0 && !msg.isError && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                          <Icons.Compass size={12} />
                          <span>{t.sources}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((source, idx) => (
                            <a 
                              key={idx}
                              href={wrapDeepLink(source.uri)} // APPLIED DEEP-LINK LOCKDOWN TO SOURCES
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-xs text-blue-600 px-2 py-1.5 rounded-md border border-gray-200 transition-colors max-w-full truncate"
                            >
                              <span className="truncate max-w-[150px]">{source.title || new URL(source.uri).hostname}</span>
                              <Icons.ExternalLink size={10} className="shrink-0 opacity-50" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Toolbar for AI Messages (Hide on Error) */}
                    {!msg.isError && <MessageActions text={msg.text} language={language} />}
                  </>
                )}
                
                {msg.isError && (
                  <div className="absolute -bottom-6 left-0 text-red-500 text-xs flex items-center gap-1 font-bold animate-pulse">
                     <Icons.X size={12} />
                     <span>{t.sendingFailed}</span>
                  </div>
                )}
              </div>

               {/* Avatar for User */}
               {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1 text-gray-500">
                  <Icons.User size={16} />
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-4 max-w-4xl mx-auto">
             <div className="mt-1 shrink-0 text-orange-600">
               <Icons.Cat size={28} />
             </div>
             <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 border border-gray-200 flex items-center gap-1 shadow-sm">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#FDFBF7] border-t border-[#E5E2D9] relative">
        <div className="max-w-4xl mx-auto relative">
          
          {/* COMMAND DECK POPOVER */}
          {showCommandDeck && (
            <div className="absolute bottom-full left-0 mb-3 w-full sm:w-80 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl p-3 z-30 animate-fadeIn">
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.cmdTools}</span>
                    <button onClick={() => setShowCommandDeck(false)} className="text-gray-400 hover:text-gray-900">
                        <Icons.X size={14} />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {COMMAND_DECK.map((cmd, idx) => {
                        const Icon = Icons[cmd.icon as keyof typeof Icons];
                        return (
                            <button
                                key={idx}
                                onClick={() => handleCommandClick(cmd)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all hover:bg-gray-100 border border-transparent hover:border-gray-200 text-left`}
                            >
                                <div className={`p-1.5 rounded-lg ${cmd.bg} ${cmd.color}`}>
                                    {Icon && <Icon size={16} />}
                                </div>
                                <span className="text-xs font-medium text-gray-700">{cmd.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
          )}

          {/* INPUT CONTAINER */}
          <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-orange-200 focus-within:border-orange-300 transition-all flex items-end">
              
              {/* TRIGGER BUTTON */}
              <button 
                onClick={() => setShowCommandDeck(!showCommandDeck)}
                className={`p-3 mb-0.5 rounded-xl transition-colors shrink-0 ${showCommandDeck ? 'text-orange-600 bg-orange-50' : 'text-gray-400 hover:text-orange-600 hover:bg-gray-50'}`}
                title="Command Deck"
              >
                  <Icons.Zap size={20} className={showCommandDeck ? 'fill-orange-600' : ''} />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.inputPlaceholder}
                className="w-full bg-transparent text-gray-900 py-3 pr-12 focus:outline-none resize-none max-h-[200px] overflow-y-auto placeholder-gray-400 text-base"
                style={{ minHeight: '48px' }}
              />
              
              <button
                onClick={() => handleSubmit()}
                disabled={!input.trim() || isLoading}
                className="p-2 mb-1.5 mr-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
              >
                <Icons.Send size={18} />
              </button>
          </div>

        </div>
        <div className="text-center mt-2 space-y-1">
            <p className="text-xs text-gray-500">{t.disclaimer}</p>
            <p className="text-[10px] text-gray-400 opacity-80">
              💡 Disclosure: Product links may earn us a commission through Amazon Associates and Shopee Affiliate programs at no extra cost to you.
            </p>
        </div>
      </div>
    </div>
  );
}