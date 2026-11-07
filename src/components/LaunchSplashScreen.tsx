import React, { useState, useEffect } from 'react';
import { Landmark, Sparkles } from 'lucide-react';

interface LaunchSplashScreenProps {
  onDismiss?: () => void;
  autoHideDuration?: number; // ms, default 1800
}

export default function LaunchSplashScreen({
  onDismiss,
  autoHideDuration = 1800,
}: LaunchSplashScreenProps) {
  const [mounted, setMounted] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fade-out slightly before unmounting
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, Math.max(800, autoHideDuration - 400));

    // Complete unmount
    const unmountTimer = setTimeout(() => {
      setMounted(false);
      if (onDismiss) onDismiss();
    }, autoHideDuration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [autoHideDuration, onDismiss]);

  const handleSkip = () => {
    setIsFading(true);
    setTimeout(() => {
      setMounted(false);
      if (onDismiss) onDismiss();
    }, 200);
  };

  if (!mounted) return null;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 select-none cursor-pointer transition-all duration-500 ease-out ${
        isFading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: '#030712',
        backgroundImage: `
          radial-gradient(circle at 50% 35%, rgba(16, 185, 129, 0.16) 0%, transparent 60%),
          radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 50%),
          radial-gradient(circle at 20% 70%, rgba(6, 182, 212, 0.12) 0%, transparent 50%)
        `,
      }}
      aria-label="App Launch Screen"
    >
      {/* Top subtle badge */}
      <div className="pt-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          Indian Rupee (INR) Standard
        </span>
      </div>

      {/* Main Center Branding */}
      <div className="flex flex-col items-center text-center max-w-md px-4">
        {/* Glowing Logo Icon */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/30 via-cyan-500/20 to-indigo-500/30 rounded-3xl blur-xl animate-pulse"></div>
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-white/20 shadow-2xl flex items-center justify-center">
            <Landmark className="w-10 h-10 text-emerald-400" />
            <Sparkles className="w-4 h-4 text-cyan-300 absolute -top-1.5 -right-1.5 animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display mb-2">
          EMI & Finance Planner
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-400 font-medium mb-6">
          Advanced Loan Intelligence & Financial Scheduling
        </p>

        {/* Loading Progress Bar */}
        <div className="w-48 sm:w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
          <div className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 rounded-full animate-[progress_1.6s_ease-in-out_infinite]"></div>
        </div>
      </div>

      {/* Launch Watermark / Attribution Section */}
      <div className="pb-6 flex flex-col items-center gap-2 text-center">
        <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 font-medium">
          Designed and Developed by
        </span>
        <div className="flex items-center gap-2.5 px-5 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/30 shadow-lg shadow-indigo-950/40 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-indigo-400 animate-pulse"></div>
          <span className="text-sm sm:text-base font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-indigo-400 font-display">
            DDWORLDS
          </span>
        </div>
        <span className="text-[10px] text-slate-500 mt-1">Tap anywhere to enter</span>
      </div>
    </div>
  );
}
