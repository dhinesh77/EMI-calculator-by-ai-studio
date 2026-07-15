import { useState, useEffect } from 'react';
import { CURRENCIES, Currency, SavedCalculation } from './types';
import LoanEMICalculator from './components/LoanEMICalculator';
import CompareLoans from './components/CompareLoans';
import InvestmentCalculators from './components/InvestmentCalculators';
import GstCalculator from './components/GstCalculator';
import SavedCalculations from './components/SavedCalculations';
import FinancialGlossary from './components/FinancialGlossary';
import { Landmark, ArrowLeftRight, Coins, Percent, BookOpen, Save, Calculator, HelpCircle, ChevronRight, Globe } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'loan' | 'compare' | 'invest' | 'gst' | 'glossary'>('loan');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(CURRENCIES[0]); // Default USD $
  const [savedItems, setSavedItems] = useState<SavedCalculation[]>([]);
  
  // Loaded items hook to communicate parameters to components
  const [loadedItem, setLoadedItem] = useState<SavedCalculation | null>(null);

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
  }, []);

  // Save a new calculation
  const handleSaveCalculation = (name: string, data: any) => {
    // Determine type
    let type: SavedCalculation['type'] = 'loan';
    if (activeTab === 'compare') type = 'compare';
    else if (activeTab === 'gst') type = 'gst';
    else if (activeTab === 'invest') {
      type = data.investmentType; // 'sip' | 'fd' | 'rd'
    }

    const newItem: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
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
    
    // Switch active tab appropriately
    if (item.type === 'loan') {
      setActiveTab('loan');
    } else if (item.type === 'compare') {
      setActiveTab('compare');
    } else if (item.type === 'gst') {
      setActiveTab('gst');
    } else if (['sip', 'fd', 'rd'].includes(item.type)) {
      setActiveTab('invest');
    }

    // Scroll back to top smoothly so they can see the populated calculator
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Radial Glowing Mesh Background */}
      <div className="mesh-bg"></div>
      
      {/* Header Bar */}
      <header className="glass border-t-0 border-x-0 border-b sticky top-0 z-40 bg-slate-950/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 accent-pill text-white rounded-xl shadow-lg shadow-indigo-500/20">
              <Calculator size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">EMI & Finance Planner</h1>
                <span className="text-[10px] accent-pill text-white font-extrabold px-1.5 py-0.5 rounded shadow">
                  PRO
                </span>
              </div>
              <p className="text-xs text-white/60">Professional loan, mortgage, tax, and investment suite</p>
            </div>
          </div>

          {/* Right Header: Currency Selector */}
          <div className="flex items-center gap-3 glass-dark rounded-xl px-3.5 py-1.5">
            <Globe size={15} className="text-indigo-400" />
            <span className="text-xs text-white/60 font-semibold hidden sm:inline">Active Currency:</span>
            <select
              id="currency-selector"
              value={selectedCurrency.code}
              onChange={(e) => {
                const found = CURRENCIES.find((c) => c.code === e.target.value);
                if (found) setSelectedCurrency(found);
              }}
              className="bg-transparent text-xs font-bold text-slate-100 focus:outline-none cursor-pointer pr-1"
            >
              {CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code} className="bg-slate-900 text-slate-200">
                  {cur.code} ({cur.symbol}) - {cur.name}
                </option>
              ))}
            </select>
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
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'loan'
                ? 'accent-pill text-white shadow-lg shadow-indigo-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Landmark size={16} />
            Loan EMI Calculator
          </button>
          
          <button
            id="tab-btn-compare"
            onClick={() => {
              setActiveTab('compare');
              setLoadedItem(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'compare'
                ? 'accent-pill text-white shadow-lg shadow-indigo-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowLeftRight size={16} />
            Compare Loans
          </button>

          <button
            id="tab-btn-invest"
            onClick={() => {
              setActiveTab('invest');
              setLoadedItem(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'invest'
                ? 'accent-pill text-white shadow-lg shadow-indigo-500/20'
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
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'gst'
                ? 'accent-pill text-white shadow-lg shadow-indigo-500/20'
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
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'glossary'
                ? 'accent-pill text-white shadow-lg shadow-indigo-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen size={16} />
            Financial Smart Guide
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

      {/* Footer bar */}
      <footer className="glass-dark py-5 px-6 rounded-2xl border border-white/5 max-w-7xl w-full mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-6 items-center text-[11px] text-white/40 font-medium uppercase tracking-widest">
          <span className="flex items-center gap-2">
            System: Online
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
          </span>
          <span>•</span>
          <span>Cloud Sync: Active</span>
          <span>•</span>
          <span>Offline Persistence: Enabled</span>
        </div>
        <div className="text-[11px] text-white/30 font-medium">
          © 2026 EMI & Finance Planner • Frosted Glass Edition
        </div>
      </footer>

    </div>
  );
}
