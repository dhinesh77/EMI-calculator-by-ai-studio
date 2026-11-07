import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Share2, Copy, Check, Sparkles, ShieldCheck, Zap, WifiOff } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
}

export default function InstallAppModal({ isOpen, onClose, deferredPrompt }: InstallAppModalProps) {
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('android');
  const [copied, setCopied] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detect OS automatically
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setPlatform('ios');
    } else if (/android/i.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
    } else {
      // If deferredPrompt isn't available, show OS instructions
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(window.location.href);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'EMI Calculator & Finance Planner',
          text: 'Use this free Indian EMI, Loan Comparison, SIP, and GST Calculator with PDF Export!',
          url: window.location.href,
        });
      } catch (err: any) {
        // If user cancelled or dismissed the share prompt, don't fallback to copy or error out
        if (err?.name === 'AbortError') {
          return;
        }
        await handleCopyLink();
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleDownloadLauncher = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>EMI & Finance Planner</title>
  <meta http-equiv="refresh" content="0; url=${window.location.href}">
  <script>window.location.href = "${window.location.href}";</script>
</head>
<body style="background:#030712;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Launching EMI & Finance Planner...</p>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'EMI-Finance-Planner.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="glass-creative rounded-3xl p-6 sm:p-8 w-full max-w-lg border border-white/15 shadow-2xl relative animate-scaleIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full glass-dark text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 accent-pill text-white rounded-2xl shadow-lg shadow-emerald-500/25">
            <Download size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-white">Download & Install App</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                PWA / Offline
              </span>
            </div>
            <p className="text-xs text-white/60">Install on your phone or desktop for instant full-screen offline access</p>
          </div>
        </div>

        {/* PWA Prompt Direct Action (if supported by browser) */}
        {deferredPrompt ? (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles size={16} className="text-emerald-400" />
                One-Click Installation Ready!
              </h4>
              <p className="text-xs text-white/70">Click below to add directly to your home screen or desktop.</p>
            </div>
            <button
              onClick={handleInstallClick}
              disabled={installed}
              className="accent-pill text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-all cursor-pointer whitespace-nowrap"
            >
              {installed ? 'Installed!' : 'Install Now'}
            </button>
          </div>
        ) : null}

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="p-2.5 glass-dark rounded-xl border border-white/5">
            <Zap size={18} className="mx-auto mb-1 text-emerald-400" />
            <span className="text-[10px] font-bold text-white block">Fast & Lightweight</span>
            <span className="text-[9px] text-white/40">Zero lag loading</span>
          </div>
          <div className="p-2.5 glass-dark rounded-xl border border-white/5">
            <WifiOff size={18} className="mx-auto mb-1 text-cyan-400" />
            <span className="text-[10px] font-bold text-white block">100% Offline</span>
            <span className="text-[9px] text-white/40">No internet needed</span>
          </div>
          <div className="p-2.5 glass-dark rounded-xl border border-white/5">
            <ShieldCheck size={18} className="mx-auto mb-1 text-emerald-400" />
            <span className="text-[10px] font-bold text-white block">Safe & Private</span>
            <span className="text-[9px] text-white/40">Stored on device</span>
          </div>
        </div>

        {/* OS Platform Tabs */}
        <div className="flex glass-dark p-1 rounded-xl mb-5 border border-white/5">
          <button
            onClick={() => setPlatform('android')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              platform === 'android'
                ? 'accent-pill text-white shadow shadow-emerald-500/20'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Smartphone size={14} />
            Android
          </button>
          <button
            onClick={() => setPlatform('ios')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              platform === 'ios'
                ? 'accent-pill text-white shadow shadow-emerald-500/20'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Smartphone size={14} />
            iPhone / iPad
          </button>
          <button
            onClick={() => setPlatform('desktop')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              platform === 'desktop'
                ? 'accent-pill text-white shadow shadow-emerald-500/20'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Monitor size={14} />
            PC / Mac
          </button>
        </div>

        {/* Step by Step Instructions based on platform */}
        <div className="glass-dark rounded-2xl p-4 mb-6 border border-white/5 space-y-2.5 text-xs text-white/80">
          {platform === 'android' && (
            <>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <span><strong>Instant WebAPK (Recommended):</strong> Tap the <strong>three dots menu (⋮)</strong> in Chrome on Android and tap <strong>"Install app"</strong>. Android automatically builds and installs a standalone APK directly into your app drawer with offline support.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <span><strong>Download Standalone .APK File:</strong> You can package this web app into a raw downloadable signed <code>.apk</code> or <code>.aab</code> using <strong>PWABuilder</strong> with this live URL.</span>
              </div>
              <div className="pt-2">
                <a
                  href={`https://www.pwabuilder.com?url=${encodeURIComponent(window.location.origin)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md shadow-emerald-500/20"
                >
                  <Download size={14} />
                  Generate Downloadable .APK on PWABuilder ↗
                </a>
              </div>
            </>
          )}

          {platform === 'ios' && (
            <>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <span>Open this website in <strong>Safari</strong> on your iPhone or iPad.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <span>Tap the <strong>Share</strong> button (the square with an arrow pointing up) in the bottom toolbar.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</span>
                <span>Tap <strong>Add</strong> in the top right to complete installation.</span>
              </div>
            </>
          )}

          {platform === 'desktop' && (
            <>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <span>In <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>, look at the address bar on the top right.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <span>Click the <strong>Install icon</strong> (computer monitor with a down arrow) in the address bar.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <span>Click <strong>Install</strong> to launch as a standalone desktop app window.</span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons: Download Launcher & Share Link */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownloadLauncher}
            className="flex-1 py-2.5 glass-dark border border-white/10 rounded-xl text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Download size={15} className="text-emerald-400" />
            Download App Shortcut (.html)
          </button>

          <button
            onClick={handleNativeShare}
            className="flex-1 py-2.5 accent-pill text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 text-xs shadow shadow-emerald-500/20 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={15} className="text-white" />
                Link Copied!
              </>
            ) : (
              <>
                <Share2 size={15} />
                Share / Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
