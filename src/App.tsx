import { useState, useEffect } from 'react';
import { INR_CURRENCY, Currency, SavedCalculation } from './types';
import LoanEMICalculator from './components/LoanEMICalculator';
import CompareLoans from './components/CompareLoans';
import InvestmentCalculators from './components/InvestmentCalculators';
import GstCalculator from './components/GstCalculator';
import SavedCalculations from './components/SavedCalculations';
import FinancialGlossary from './components/FinancialGlossary';
import InstallAppModal from './components/InstallAppModal';
import LaunchSplashScreen from './components/LaunchSplashScreen';
import { Landmark, ArrowLeftRight, Coins, Percent, BookOpen, Calculator, Download, Palette } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'loan' | 'compare' | 'invest' | 'gst' | 'glossary'>('loan');
  const [selectedCurrency] = useState<Currency>(INR_CURRENCY);
  const [savedItems, setSavedItems] = useState<SavedCalculation[]>([]);
  
  // Theme state: aurora (default), amethyst, solar
  const [theme, setTheme] = useState<'aurora' | 'amethyst' | 'solar'>('aurora');

  // PWA & Install app state
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Loaded items hook to communicate parameters to components
  const [loadedItem, setLoadedItem] = useState<SavedCalculation | null>(null);

  // Listen for beforeinstallprompt event for PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Load calculations on mount
  useEffect(() => {
    const raw = localStorage.getItem('emi_planner_saved_calcs');
    if (raw) {
      try {
        setSavedItems(JSON.parse(raw));
      } catch (e) {
        console.error('Failed to parse saved items from localStorage', e);
      }
    }
    const savedTheme = localStorage.getItem('emi_planner_theme') as 'aurora' | 'amethyst' | 'solar';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (newTheme: 'aurora' | 'amethyst' | 'solar') => {
    setTheme(newTheme);
    localStorage.setItem('emi_planner_theme', newTheme);
  };

  // Save a new calculation
  const handleSaveCalculation = (name: string, data: any) => {
    let type: SavedCalculation['type'] = 'loan';
    if (activeTab === 'compare') type = 'compare';
    else if (activeTab === 'gst') type = 'gst';
    else if (activeTab === 'invest') {
      type = data.sipMonthly !== undefined ? 'sip' : data.fdPrincipal !== undefined ? 'fd' : 'rd';
    }

    const newItem: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      data,
    };

    const updated = [newItem, ...savedItems];
    setSavedItems(updated);
    localStorage.setItem('emi_planner_saved_calcs', JSON.stringify(updated));
  };

  // Delete a saved calculation
  const handleDeleteItem = (id: string) => {
    const updated = savedItems.filter((item) => item.id !== id);
    setSavedItems(updated);
    localStorage.setItem('emi_planner_saved_calcs', JSON.stringify(updated));
  };

  // Load calculation back into view
  const handleLoadItem = (item: SavedCalculation) => {
    setLoadedItem(item);
    
    if (item.type === 'loan') {
      setActiveTab('loan');
    } else if (item.type === 'compare') {
      setActiveTab('compare');
    } else if (item.type === 'gst') {
      setActiveTab('gst');
    } else if (['sip', 'fd', 'rd'].includes(item.type)) {
      setActiveTab('invest');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add loan to comparison and switch to Compare Loans tab
  const handleAddToCompare = (loanData: { amount: number; rate: number; tenure: number; isYears: boolean }) => {
    setLoadedItem({
      id: String(Date.now()),
      name: 'Current Loan Calculation',
      type: 'compare',
      timestamp: Date.now(),
      data: {
        loanA: {
          amount: loanData.amount,
          rate: loanData.rate,
          tenure: loanData.tenure,
          isYears: loanData.isYears,
        }
      }
    });
    setActiveTab('compare');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const themeClass = theme === 'amethyst' ? 'theme-amethyst' : theme === 'solar' ? 'theme-solar' : 'theme-aurora';

  return (
    <div className={`min-h-screen text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative ${themeClass}`}>
      {/* Radial Glowing Creative Mesh Canvas */}
      <div className="mesh-bg"></div>
      
      {/* Header Bar */}
      <header className="glass border-t-0 border-x-0 border-b sticky top-0 z-40 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 accent-pill text-white rounded-xl shadow-lg shadow-emerald-500/20">
                <Calculator size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">EMI & Finance Planner</h1>
                  <span className="text-[10px] accent-pill text-white font-extrabold px-1.5 py-0.5 rounded shadow">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-white/60">Indian Banking, Loans, Investments & GST Suite</p>
              </div>
            </div>

            {/* Mobile install trigger */}
            <button
              id="mobile-btn-download-app"
              onClick={() => setShowInstallModal(true)}
              className="md:hidden p-2 accent-pill text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Download size={15} />
              <span>App</span>
            </button>
          </div>

          {/* Right Header Actions: Theme & Download App & Currency Badge */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* Indian Currency Pill */}
            <div className="flex items-center gap-1.5 glass-dark px-3 py-1.5 rounded-xl border border-white/5 text-xs">
              <span className="text-sm">🇮🇳</span>
              <span className="font-bold text-white font-mono">INR (₹)</span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase">Active</span>
            </div>

            {/* Creative Theme Picker */}
            <div className="flex items-center glass-dark rounded-xl p-1 border border-white/5 gap-1">
              <span className="text-[10px] text-white/40 px-1 font-semibold flex items-center gap-1">
                <Palette size={12} />
              </span>
              <button
                id="theme-btn-aurora"
                onClick={() => handleThemeChange('aurora')}
                title="Aurora Emerald Theme"
                className={`w-5 h-5 rounded-lg transition-all cursor-pointer ${
                  theme === 'aurora'
                    ? 'ring-2 ring-white scale-110 bg-gradient-to-br from-emerald-400 to-cyan-500'
                    : 'opacity-50 hover:opacity-100 bg-gradient-to-br from-emerald-400 to-cyan-500'
                }`}
              />
              <button
                id="theme-btn-amethyst"
                onClick={() => handleThemeChange('amethyst')}
                title="Cosmic Amethyst Theme"
                className={`w-5 h-5 rounded-lg transition-all cursor-pointer ${
                  theme === 'amethyst'
                    ? 'ring-2 ring-white scale-110 bg-gradient-to-br from-purple-400 to-pink-500'
                    : 'opacity-50 hover:opacity-100 bg-gradient-to-br from-purple-400 to-pink-500'
                }`}
              />
              <button
                id="theme-btn-solar"
                onClick={() => handleThemeChange('solar')}
                title="Solar Amber Theme"
                className={`w-5 h-5 rounded-lg transition-all cursor-pointer ${
                  theme === 'solar'
                    ? 'ring-2 ring-white scale-110 bg-gradient-to-br from-amber-400 to-orange-500'
                    : 'opacity-50 hover:opacity-100 bg-gradient-to-br from-amber-400 to-orange-500'
                }`}
              />
            </div>

            {/* Desktop Download App Button */}
            <button
              id="header-btn-download-app"
              onClick={() => setShowInstallModal(true)}
              className="hidden md:flex items-center gap-1.5 accent-pill text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Download App</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Navigation Switcher */}
        <div className="flex overflow-x-auto glass p-1.5 rounded-2xl gap-1.5 scrollbar-thin" id="main-tab-switcher">
          <button
            id="tab-btn-loan"
            onClick={() => {
              setActiveTab('loan');
              setLoadedItem(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === 'loan'
                ? 'accent-pill text-white shadow-lg shadow-emerald-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Landmark size={16} />
            Loan EMI Calculator
          </button>

          <button
            id="tab-btn-invest"
            onClick={() => {
              setActiveTab('invest');
              setLoadedItem(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === 'invest'
                ? 'accent-pill text-white shadow-lg shadow-emerald-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Coins size={16} />
            Investment Planners
          </button>

          <button
            id="tab-btn-gst"
            onClick={() => {
              setActiveTab('gst');
              setLoadedItem(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === 'gst'
                ? 'accent-pill text-white shadow-lg shadow-emerald-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Percent size={16} />
            GST Tax Calculator
          </button>

          <button
            id="tab-btn-glossary"
            onClick={() => {
              setActiveTab('glossary');
              setLoadedItem(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === 'glossary'
                ? 'accent-pill text-white shadow-lg shadow-emerald-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen size={16} />
            Financial Guide
          </button>
        </div>

        {/* Dynamic Calculator Content render */}
        <div className="min-h-[400px]">
          {activeTab === 'loan' && (
            <LoanEMICalculator
              currency={selectedCurrency}
              onSaveCalculation={handleSaveCalculation}
              loadedItem={loadedItem}
              onClearLoadedItem={() => setLoadedItem(null)}
              onAddToCompare={handleAddToCompare}
            />
          )}

          {activeTab === 'compare' && (
            <CompareLoans
              currency={selectedCurrency}
              onSaveCalculation={handleSaveCalculation}
              loadedItem={loadedItem}
              onClearLoadedItem={() => setLoadedItem(null)}
            />
          )}

          {activeTab === 'invest' && (
            <InvestmentCalculators
              currency={selectedCurrency}
              onSaveCalculation={handleSaveCalculation}
              loadedItem={loadedItem}
              onClearLoadedItem={() => setLoadedItem(null)}
            />
          )}

          {activeTab === 'gst' && (
            <GstCalculator
              currency={selectedCurrency}
              onSaveCalculation={handleSaveCalculation}
              loadedItem={loadedItem}
              onClearLoadedItem={() => setLoadedItem(null)}
            />
          )}

          {activeTab === 'glossary' && (
            <FinancialGlossary />
          )}
        </div>

        {/* Saved calculations and listings */}
        <SavedCalculations
          savedItems={savedItems}
          onLoadItem={handleLoadItem}
          onDeleteItem={handleDeleteItem}
        />

      </main>

      {/* Footer bar with download link and DDWORLDS attribution */}
      <footer className="glass-dark py-5 px-6 rounded-2xl border border-white/5 max-w-7xl w-full mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4 items-center text-[11px] text-white/50 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block animate-pulse"></span>
            Indian Banking Slabs
          </span>
          <span>•</span>
          <span>Offline Calculation Ready</span>
          <span>•</span>
          <button
            onClick={() => setShowInstallModal(true)}
            className="text-emerald-400 hover:text-emerald-300 underline font-bold cursor-pointer"
          >
            Download / Install App
          </button>
        </div>

        {/* Branding Attribution */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
          <span className="text-white/40 text-[11px]">Designed & Developed by</span>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-indigo-400 font-display tracking-wide">
            DDWORLDS
          </span>
        </div>

        <div className="text-[11px] text-white/40 font-mono">
          © 2026 EMI & Finance Planner • Indian Rupees (INR)
        </div>
      </footer>

      {/* App Launch Screen */}
      <LaunchSplashScreen />

      {/* Install App Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
      />
    </div>
  );
}
