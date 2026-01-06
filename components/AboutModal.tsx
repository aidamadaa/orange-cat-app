import React from 'react';
import { Icons } from './Icon';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white border border-gray-100 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
        >
          <Icons.X size={20} />
        </button>
        
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <Icons.Cat size={64} className="text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t.welcomeTitle}
          </h2>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6">
            Pet of Gemini • Secure AI
          </p>
          
          <div className="space-y-4 text-left bg-gray-50 p-6 rounded-xl border border-gray-100">
             <div className="flex gap-3">
                <Icons.Shield className="text-green-600 shrink-0" size={18} />
                <div>
                    <h3 className="text-sm font-semibold text-gray-800">{t.zeroServer}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mt-1">
                        {t.zeroServerDesc}
                    </p>
                </div>
             </div>
             
             <div className="flex gap-3">
                <Icons.Lock className="text-amber-500 shrink-0" size={18} />
                <div>
                    <h3 className="text-sm font-semibold text-gray-800">{t.encryption}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mt-1">
                        {t.encryptionDesc}
                    </p>
                </div>
             </div>

             <div className="flex gap-3">
                <Icons.Bot className="text-blue-500 shrink-0" size={18} />
                <div>
                    <h3 className="text-sm font-semibold text-gray-800">{t.freeTier}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mt-1">
                        {t.freeTierDesc}
                    </p>
                </div>
             </div>
          </div>

          <div className="mt-6 space-y-3">
             {/* Buy Me A Coffee Button */}
             <a
               href="https://buymeacoffee.com/techlogix_io"
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-2 w-full py-3 bg-yellow-400 text-gray-900 hover:bg-yellow-300 rounded-xl font-bold transition-colors shadow-lg shadow-yellow-400/20"
             >
                 <Icons.Coffee size={18} />
                 <span>{t.buyCoffee}</span>
             </a>

             <button
               onClick={onClose}
               className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition-colors border border-gray-200"
             >
               {t.close}
             </button>
          </div>
          
          <div className="mt-4 text-[10px] text-gray-400">
             &copy; {new Date().getFullYear()} Orange Cat • v3.0 Secure
          </div>
        </div>
      </div>
    </div>
  );
};