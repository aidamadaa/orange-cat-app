import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icon';
import { AUTH_DATA_KEY } from '../constants';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface LockScreenProps {
  mode: 'setup' | 'unlock';
  onSetup: (email: string, pin: string) => Promise<string>;
  onLogin: (pin: string, remember: boolean) => Promise<boolean>;
  onRecover: (email: string, recoveryCode: string, newPin: string) => Promise<boolean>;
  language: Language;
  onSetLanguage: (lang: Language) => void;
}

type ScreenState = 'landing' | 'login' | 'setup_details' | 'setup_recovery_show' | 'forgot_email' | 'forgot_code' | 'forgot_new_pin';

export const LockScreen: React.FC<LockScreenProps> = ({ mode, onSetup, onLogin, onRecover, language, onSetLanguage }) => {
  const [screenState, setScreenState] = useState<ScreenState>(mode === 'setup' ? 'landing' : 'login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareText, setShareText] = useState(translations[language].shareApp);
  
  const t = translations[language];
  const prevModeRef = useRef(mode);

  useEffect(() => {
    if (prevModeRef.current !== mode) {
        if (mode === 'unlock') {
            setScreenState(currentState => 
                currentState === 'setup_recovery_show' ? 'setup_recovery_show' : 'login'
            );
        } else if (mode === 'setup') {
            setScreenState('landing');
        }
        prevModeRef.current = mode;
    }
  }, [mode]);

  // Form States
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [generatedRecoveryCode, setGeneratedRecoveryCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (screenState !== 'landing' && screenState !== 'setup_recovery_show') {
        inputRef.current?.focus();
    }
  }, [screenState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await onLogin(pin, rememberMe);
    if (!success) {
         setPin('');
         const hasData = localStorage.getItem(AUTH_DATA_KEY);
         if (hasData) {
             setError('Incorrect PIN');
         } else {
             const storageCount = localStorage.length;
             if (storageCount === 0) {
                // If storage is magically empty but mode was unlock, reload to reset state
                window.location.reload();
             } else {
                setError('No account found. Please Reset App.');
             }
         }
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    
    setIsSubmitting(true);
    try {
        const code = await onSetup(email, pin);
        setGeneratedRecoveryCode(code);
        setScreenState('setup_recovery_show');
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Setup failed. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRecoveryEmail = (e: React.FormEvent) => {
      e.preventDefault();
      if(!email) return;
      setScreenState('forgot_code');
      setError('');
  }
  
  const handleRecoveryCode = (e: React.FormEvent) => {
      e.preventDefault();
      if(!recoveryCode) return;
      setScreenState('forgot_new_pin');
      setError('');
  }

  const handleRecoveryFinal = async (e: React.FormEvent) => {
      e.preventDefault();
      if (pin.length < 4) {
          setError('PIN must be at least 4 digits');
          return;
      }
      if (pin !== confirmPin) {
          setError('PINs do not match');
          return;
      }
      const success = await onRecover(email, recoveryCode, pin);
      if (!success) {
         setError('Recovery failed. Check details.');
      }
  };

  const handleResetApp = () => {
      if(window.confirm("This will clear all Orange Cat data from this device to fix account issues. Continue?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleShare = async () => {
    const cleanUrl = window.location.origin;
    const shareData = {
      title: 'Orange Cat',
      text: 'Just met Orange Cat. Secure. Private. Intelligent.',
      url: cleanUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`).then(() => {
        setShareText(t.copied + '!');
        setTimeout(() => setShareText(t.shareApp), 2000);
      });
    }
  };

  // RECOVERY CODE DISPLAY
  if (screenState === 'setup_recovery_show') {
      return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4 animate-fadeIn relative overflow-hidden">
            {/* Background Blob */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-200/40 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl p-10 text-center">
                 <div className="mb-6 mx-auto flex justify-center">
                    <Icons.Cat size={80} className="text-orange-600 drop-shadow-lg" />
                 </div>
                 <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Account Created</h2>
                 <p className="text-gray-600 text-sm mb-8 leading-relaxed">
                     We don't have servers. This Recovery Code is the <strong className="text-orange-600">only way</strong> to restore your access if you lose your PIN.
                 </p>
                 
                 <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-8 relative group cursor-pointer hover:border-orange-300 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedRecoveryCode);
                        alert("Code copied!");
                      }}
                 >
                     <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] mb-3">Recovery Key</p>
                     <code className="text-2xl font-mono text-gray-800 tracking-wider break-all select-all">
                         {generatedRecoveryCode}
                     </code>
                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icons.Copy size={14} className="text-gray-400" />
                     </div>
                 </div>

                 <button
                    onClick={async () => {
                        setIsSubmitting(true);
                        const success = await onLogin(pin, true);
                        setIsSubmitting(false);
                        if (!success) setError("Could not log in automatically.");
                    }} 
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-gray-900 text-white hover:bg-black rounded-2xl transition-all font-bold text-sm tracking-wide shadow-lg"
                 >
                    {isSubmitting ? 'Verifying...' : 'I have saved this code'}
                 </button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* --- CAT PAW BACKGROUND PATTERN --- */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none overflow-hidden select-none">
          <Icons.PawPrint size={140} className="absolute top-[10%] left-[10%] rotate-12 text-gray-900" />
          <Icons.PawPrint size={100} className="absolute top-[30%] right-[15%] -rotate-12 text-gray-900" />
          <Icons.PawPrint size={120} className="absolute bottom-[20%] left-[20%] rotate-45 text-gray-900" />
          <Icons.PawPrint size={80} className="absolute bottom-[10%] right-[30%] -rotate-6 text-gray-900" />
          <Icons.PawPrint size={160} className="absolute top-[-5%] right-[-5%] rotate-[30deg] text-gray-900" />
      </div>

      {/* --- SILICON VALLEY ANIMATED BACKGROUND BLURS --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/30 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '7s' }}></div>
      
      {/* Language Selector (Floating Glass) */}
      <div className="absolute top-6 right-6 flex gap-1 bg-white/60 p-1 rounded-full backdrop-blur-md border border-white/50 shadow-sm z-20">
           {(['en', 'ms', 'zh', 'ta', 'id'] as Language[]).map(lang => (
               <button
                    key={lang}
                    onClick={() => onSetLanguage(lang)}
                    className={`
                        w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-bold uppercase transition-all
                        ${language === lang ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-black'}
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

      {/* MAIN CARD */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-2xl shadow-gray-200/50 p-8 sm:p-10 animate-fadeIn relative z-10">
        
        {/* Branding */}
        <div className="flex flex-col items-center mb-10">
          <button 
            onClick={() => { 
                // Only allow navigating to landing if NOT in unlock mode
                if (mode === 'setup') {
                    setScreenState('landing'); 
                    setError('');
                }
            }}
            className={`mb-8 transition-transform duration-300 drop-shadow-md text-orange-600 ${mode === 'setup' ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
          >
            <Icons.Cat size={90} />
          </button>
          
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
            Orange Cat
          </h1>
          {/* UPDATED TAGLINE */}
          <p className="text-gray-500 font-medium tracking-wide text-xs uppercase bg-white/50 px-3 py-1 rounded-full border border-gray-100">Pet of Gemini</p>
        </div>

        {/* LANDING STATE (Only accessible if mode === 'setup') */}
        {screenState === 'landing' && (
             <div className="space-y-4 text-center animate-fadeIn">
                 <p className="text-gray-600 text-sm leading-relaxed px-4 mb-6">
                     {language === 'en' && 'Zero servers. 100% Client-side Encryption. The privacy-first AI companion.'}
                     {language === 'ms' && 'Tiada pelayan. Enkripsi 100% di sisi klien.'}
                     {language === 'zh' && '零服务器。100% 客户端加密。'}
                     {language === 'ta' && 'சேவையகங்கள் இல்லை. 100% கிளையண்ட் பக்க குறியாக்கம்.'}
                     {language === 'id' && 'Tanpa server. Enkripsi 100% Sisi Klien.'}
                 </p>
                 <button 
                    onClick={() => setScreenState('setup_details')}
                    className="w-full bg-gray-900 text-white hover:bg-black font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.01] shadow-lg shadow-gray-200"
                 >
                     {t.createAccount}
                 </button>
                 <button 
                    onClick={() => setScreenState('login')}
                    className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium py-4 rounded-2xl transition-all border border-gray-200 shadow-sm"
                 >
                     {t.loginAccount}
                 </button>
                 
                 <div className="mt-8 pt-6 border-t border-gray-100">
                     <button onClick={handleResetApp} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider font-semibold">
                        Reset Application Data
                     </button>
                 </div>
             </div>
        )}

        {/* FORMS */}
        {screenState !== 'landing' && (
        <form onSubmit={
            screenState === 'login' ? handleLogin :
            screenState === 'setup_details' ? handleSetup :
            screenState === 'forgot_email' ? handleRecoveryEmail :
            screenState === 'forgot_code' ? handleRecoveryCode :
            handleRecoveryFinal
        } className="space-y-6 animate-fadeIn">
            
            {/* LOGIN INPUT */}
            {screenState === 'login' && (
                <div className="group">
                  <input
                    ref={inputRef}
                    type="password"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setError(''); }}
                    className="w-full bg-white text-center text-4xl tracking-[0.5em] text-gray-900 rounded-2xl px-4 py-6 border border-gray-200 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-100 transition-all placeholder-gray-300 shadow-inner"
                    placeholder="••••"
                    inputMode="numeric"
                    maxLength={8}
                    autoFocus
                  />
                  
                  <div className="flex items-center justify-center mt-6 gap-2 opacity-60 hover:opacity-100 transition-opacity">
                    <input 
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded-md border-gray-300 bg-white text-orange-500 focus:ring-offset-0 focus:ring-0"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-gray-500 select-none cursor-pointer font-medium">
                        {t.keepLoggedIn}
                    </label>
                  </div>
                </div>
            )}

            {/* SETUP INPUTS */}
            {screenState === 'setup_details' && (
                <div className="space-y-4">
                     <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white text-gray-900 rounded-xl px-5 py-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all placeholder-gray-400"
                            placeholder="Email (Identity)"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full bg-white text-center text-xl tracking-widest text-gray-900 rounded-xl px-2 py-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all placeholder-gray-400"
                            placeholder="PIN"
                            maxLength={8}
                        />
                        <input
                            type="password"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            className="w-full bg-white text-center text-xl tracking-widest text-gray-900 rounded-xl px-2 py-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all placeholder-gray-400"
                            placeholder="Confirm"
                            maxLength={8}
                        />
                     </div>
                </div>
            )}

            {/* RECOVERY INPUTS */}
            {screenState === 'forgot_email' && (
                 <input
                    ref={inputRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white text-gray-900 rounded-xl px-5 py-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="Enter your email"
                />
            )}
            
            {screenState === 'forgot_code' && (
                 <input
                    ref={inputRef}
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                    className="w-full bg-white text-center text-xl font-mono text-gray-900 rounded-xl px-5 py-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 uppercase placeholder-gray-300"
                    placeholder="XXXX-XXXX-XXXX"
                />
            )}

            {screenState === 'forgot_new_pin' && (
                <div className="grid grid-cols-2 gap-4">
                    <input
                        ref={inputRef}
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full bg-white text-center text-xl tracking-widest text-gray-900 rounded-xl px-2 py-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 placeholder-gray-400"
                        placeholder="New PIN"
                        maxLength={8}
                    />
                    <input
                        type="password"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        className="w-full bg-white text-center text-xl tracking-widest text-gray-900 rounded-xl px-2 py-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 placeholder-gray-400"
                        placeholder="Confirm"
                        maxLength={8}
                    />
                 </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
            <div className="flex flex-col items-center justify-center gap-1 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-100 animate-fadeIn">
               <span>{error}</span>
            </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-900 text-white hover:bg-black font-bold py-4 rounded-2xl transition-all shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
            >
            {isSubmitting ? 'Processing...' : (
                <>
                {screenState === 'login' && 'Unlock'}
                {screenState === 'setup_details' && 'Create Secure ID'}
                {screenState === 'forgot_email' && 'Find Account'}
                {screenState === 'forgot_code' && 'Verify Code'}
                {screenState === 'forgot_new_pin' && 'Set New PIN'}
                </>
            )}
            </button>
        </form>
        )}
        
        {/* NAV LINKS */}
        {screenState === 'login' && (
             <div className="mt-8 flex flex-col items-center gap-4">
                <button 
                    onClick={() => { setScreenState('forgot_email'); setError(''); }}
                    className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                    {t.forgotPin}
                </button>
                
                {/* Only show 'Back to Home' if user is in setup mode (hasn't created account yet) */}
                {mode === 'setup' && (
                    <button 
                        onClick={() => { setScreenState('landing'); setError(''); }}
                        className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        {t.backHome}
                    </button>
                )}
                
                {/* For existing users (unlock mode), show a hard reset option instead of navigation */}
                {mode === 'unlock' && (
                     <button onClick={handleResetApp} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider font-semibold mt-4">
                        Reset Application
                     </button>
                )}
             </div>
        )}
        
        {screenState !== 'landing' && screenState !== 'login' && screenState !== 'setup_recovery_show' && (
             <div className="mt-6 text-center">
                 <button 
                    onClick={() => { 
                        // If user is already set up, canceling goes back to login
                        if (mode === 'unlock') {
                            setScreenState('login');
                        } else {
                            setScreenState('landing');
                        }
                        setError(''); 
                    }}
                    className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                    Cancel
                </button>
             </div>
        )}
      </div>
      
      {/* MINIMAL FOOTER */}
      <footer className="mt-10 text-center text-[10px] text-gray-600 font-medium tracking-wider uppercase animate-fadeIn relative z-10">
        <button 
          onClick={handleShare}
          className="flex items-center justify-center gap-2 mx-auto mb-4 px-4 py-2 bg-white/50 hover:bg-white text-gray-500 hover:text-gray-900 rounded-full border border-gray-200 transition-colors shadow-sm"
        >
          <Icons.Share size={10} />
          <span>{shareText}</span>
        </button>
        <p>Encrypted on Device • Zero Knowledge</p>
      </footer>
    </div>
  );
};