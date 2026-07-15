import { useState, useEffect } from 'react';
import { TrendingUp, Coins, Landmark, Calendar, Save, Copy, Check, Info } from 'lucide-react';
import { calculateSIP, calculateFD, calculateRD } from '../utils/financeCalculations';
import { Currency, SavedCalculation } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface InvestmentCalculatorsProps {
  currency: Currency;
  onSaveCalculation: (name: string, data: any) => void;
  loadedItem: SavedCalculation | null;
  onClearLoadedItem: () => void;
}

type InvestmentType = 'sip' | 'fd' | 'rd';

export default function InvestmentCalculators({ currency, onSaveCalculation, loadedItem, onClearLoadedItem }: InvestmentCalculatorsProps) {
  const [activeTab, setActiveTab] = useState<InvestmentType>('sip');
  const [copied, setCopied] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Common/Calculators states
  // SIP States
  const [sipMonthly, setSipMonthly] = useState<number>(500);
  const [sipRate, setSipRate] = useState<number>(12);
  const [sipYears, setSipYears] = useState<number>(15);

  // FD States
  const [fdPrincipal, setFdPrincipal] = useState<number>(10000);
  const [fdRate, setFdRate] = useState<number>(6.5);
  const [fdYears, setFdYears] = useState<number>(5);
  const [fdCompounding, setFdCompounding] = useState<number>(4); // Quarterly default

  // RD States
  const [rdMonthly, setRdMonthly] = useState<number>(300);
  const [rdRate, setRdRate] = useState<number>(6.8);
  const [rdYears, setRdYears] = useState<number>(3);

  // Load from saved item
  useEffect(() => {
    if (loadedItem && ['sip', 'fd', 'rd'].includes(loadedItem.type) && loadedItem.data) {
      const d = loadedItem.data;
      const type = loadedItem.type as InvestmentType;
      setActiveTab(type);
      
      if (type === 'sip') {
        if (d.sipMonthly !== undefined) setSipMonthly(d.sipMonthly);
        if (d.sipRate !== undefined) setSipRate(d.sipRate);
        if (d.sipYears !== undefined) setSipYears(d.sipYears);
      } else if (type === 'fd') {
        if (d.fdPrincipal !== undefined) setFdPrincipal(d.fdPrincipal);
        if (d.fdRate !== undefined) setFdRate(d.fdRate);
        if (d.fdYears !== undefined) setFdYears(d.fdYears);
        if (d.fdCompounding !== undefined) setFdCompounding(d.fdCompounding);
      } else if (type === 'rd') {
        if (d.rdMonthly !== undefined) setRdMonthly(d.rdMonthly);
        if (d.rdRate !== undefined) setRdRate(d.rdRate);
        if (d.rdYears !== undefined) setRdYears(d.rdYears);
      }
      onClearLoadedItem();
    }
  }, [loadedItem, onClearLoadedItem]);

  // Calculations
  const sipResult = calculateSIP(sipMonthly, sipRate, sipYears);
  const fdResult = calculateFD(fdPrincipal, fdRate, fdYears, fdCompounding);
  const rdResult = calculateRD(rdMonthly, rdRate, rdYears);

  const formatVal = (val: number) => {
    return currency.symbol + ' ' + Math.round(val).toLocaleString();
  };

  const handleCopy = () => {
    let text = '';
    if (activeTab === 'sip') {
      text = `--- SIP PLANNER SUMMARY ---
Monthly SIP Deposit: ${formatVal(sipMonthly)}
Expected Return Rate: ${sipRate}% p.a.
Period: ${sipYears} Years
---------------------------
Total Invested Amount: ${formatVal(sipResult.investedAmount)}
Wealth Gained (Returns): ${formatVal(sipResult.estReturns)}
Maturity Value: ${formatVal(sipResult.totalValue)}`;
    } else if (activeTab === 'fd') {
      text = `--- FIXED DEPOSIT (FD) SUMMARY ---
FD Deposit Amount: ${formatVal(fdPrincipal)}
Interest Rate: ${fdRate}% p.a.
Period: ${fdYears} Years
Compounding: ${fdCompounding === 12 ? 'Monthly' : fdCompounding === 4 ? 'Quarterly' : fdCompounding === 2 ? 'Half-Yearly' : 'Yearly'}
---------------------------
Total Invested Amount: ${formatVal(fdResult.investedAmount)}
Estimated Interest Earned: ${formatVal(fdResult.estInterest)}
Total Maturity Value: ${formatVal(fdResult.maturityValue)}`;
    } else {
      text = `--- RECURRING DEPOSIT (RD) SUMMARY ---
Monthly RD Deposit: ${formatVal(rdMonthly)}
Interest Rate: ${rdRate}% p.a.
Period: ${rdYears} Years
---------------------------
Total Invested Amount: ${formatVal(rdResult.investedAmount)}
Estimated Interest Earned: ${formatVal(rdResult.estInterest)}
Total Maturity Value: ${formatVal(rdResult.maturityValue)}`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    
    let saveData: any = {};
    if (activeTab === 'sip') {
      saveData = { sipMonthly, sipRate, sipYears, result: sipResult };
    } else if (activeTab === 'fd') {
      saveData = { fdPrincipal, fdRate, fdYears, fdCompounding, result: fdResult };
    } else {
      saveData = { rdMonthly, rdRate, rdYears, result: rdResult };
    }

    onSaveCalculation(saveName, {
      investmentType: activeTab,
      ...saveData,
    });
    
    setSaveName('');
    setShowSaveModal(false);
  };

  // Select result variables based on active calculator tab and unify property names
  const investedAmount =
    activeTab === 'sip'
      ? sipResult.investedAmount
      : activeTab === 'fd'
      ? fdResult.investedAmount
      : rdResult.investedAmount;

  const estReturns =
    activeTab === 'sip'
      ? sipResult.estReturns
      : activeTab === 'fd'
      ? fdResult.estInterest
      : rdResult.estInterest;

  const totalValue =
    activeTab === 'sip'
      ? sipResult.totalValue
      : activeTab === 'fd'
      ? fdResult.maturityValue
      : rdResult.maturityValue;

  const progressData =
    activeTab === 'sip'
      ? sipResult.yearlyProgress
      : activeTab === 'fd'
      ? fdResult.yearlyProgress
      : rdResult.yearlyProgress;

  const chartData = progressData.map((p: any) => ({
    year: p.year,
    invested: p.invested,
    returns: p.returns !== undefined ? p.returns : p.interest,
    total: p.total,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="investments-container">
      {/* Sub-tabs & inputs */}
      <div className="lg:col-span-7 glass rounded-2xl p-6 flex flex-col justify-between" id="investment-inputs-panel">
        <div>
          {/* Planner Selector */}
          <div className="flex glass-dark p-1 rounded-xl gap-1 mb-8" id="investment-type-switcher">
            <button
              id="tab-sip"
              onClick={() => setActiveTab('sip')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sip'
                  ? 'accent-pill text-white shadow-md shadow-indigo-500/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <TrendingUp size={14} />
              SIP Planner
            </button>
            <button
              id="tab-fd"
              onClick={() => setActiveTab('fd')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'fd'
                  ? 'accent-pill text-white shadow-md shadow-indigo-500/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Landmark size={14} />
              Fixed Deposit (FD)
            </button>
            <button
              id="tab-rd"
              onClick={() => setActiveTab('rd')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'rd'
                  ? 'accent-pill text-white shadow-md shadow-indigo-500/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Coins size={14} />
              Recurring Deposit (RD)
            </button>
          </div>

          {/* Form Fields depend on selected calculator */}
          <div className="space-y-6">
            {activeTab === 'sip' && (
              <>
                {/* Monthly SIP Amount */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-white/80">Monthly SIP Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold">{currency.symbol}</span>
                      <input
                        id="sip-amount-input"
                        type="number"
                        value={sipMonthly}
                        onChange={(e) => setSipMonthly(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-32 pl-8 pr-3 py-1 bg-black/20 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 text-right text-sm"
                      />
                    </div>
                  </div>
                  <input
                    id="sip-amount-slider"
                    type="range"
                    min="10"
                    max="10000"
                    step="50"
                    value={sipMonthly}
                    onChange={(e) => setSipMonthly(parseInt(e.target.value))}
                    className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>{currency.symbol}10</span>
                    <span>{currency.symbol}10,000</span>
                  </div>
                </div>

                {/* Return Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-white/80">Expected Annual Returns (p.a. %)</label>
                    <div className="relative">
                      <input
                        id="sip-rate-input"
                        type="number"
                        step="0.1"
                        value={sipRate}
                        onChange={(e) => setSipRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-24 px-3 py-1 bg-black/20 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 text-right text-sm"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">%</span>
                    </div>
                  </div>
                  <input
                    id="sip-rate-slider"
                    type="range"
                    min="1"
                    max="30"
                    step="0.5"
                    value={sipRate}
                    onChange={(e) => setSipRate(parseFloat(e.target.value))}
                    className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>1%</span>
                    <span>30%</span>
                  </div>
                </div>

                {/* Investment Horizon */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-white/80">Investment Horizon (Years)</label>
                    <div className="relative">
                      <input
                        id="sip-years-input"
                        type="number"
                        value={sipYears}
                        onChange={(e) => setSipYears(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-3 py-1 bg-black/20 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 text-right text-sm"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-bold">Yrs</span>
                    </div>
                  </div>
                  <input
                    id="sip-years-slider"
                    type="range"
                    min="1"
                    max="40"
                    step="1"
                    value={sipYears}
                    onChange={(e) => setSipYears(parseInt(e.target.value))}
                    className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>1 Year</span>
                    <span>40 Years</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'fd' && (
              <>
                {/* FD Principal */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-white/80">Lump Sum Deposit</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold">{currency.symbol}</span>
                      <input
                        id="fd-amount-input"
                        type="number"
                        value={fdPrincipal}
                        onChange={(e) => setFdPrincipal(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-32 pl-8 pr-3 py-1 bg-black/20 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 text-right text-sm"
                      />
                    </div>
                  </div>
                  <input
                    id="fd-amount-slider"
                    type="range"
                    min="500"
                    max="100000"
                    step="500"
                    value={fdPrincipal}
                    onChange={(e) => setFdPrincipal(parseInt(e.target.value))}
                    className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>{currency.symbol}500</span>
                    <span>{currency.symbol}100,000</span>
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-white/80">FD Rate of Interest (p.a. %)</label>
                    <div className="relative">
                      <input
                        id="fd-rate-input"
                        type="number"
                        step="0.1"
                        value={fdRate}
                        onChange={(e) => setFdRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-24 px-3 py-1 bg-black/20 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 text-right text-sm"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">%</span>
                    </div>
                  </div>
                  <input
                    id="fd-rate-slider"
                    type="range"
                    min="1"
                    max="15"
                    step="0.1"
                    value={fdRate}
                    onChange={(e) => setFdRate(parseFloat(e.target.value))}
                    className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>1%</span>
                    <span>15%</span>
                  </div>
                </div>

                {/* Horizon */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-white/80">FD Tenure (Years)</label>
                    <div className="relative">
                      <input
                        id="fd-years-input"
                        type="number"
                        value={fdYears}
                        onChange={(e) => setFdYears(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-3 py-1 bg-black/20 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 text-right text-sm"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-bold">Yrs</span>
                    </div>
                  </div>
                  <input
                    id="fd-years-slider"
                    type="range"
                    min="1"
                    max="25"
                    step="1"
                    value={fdYears}
                    onChange={(e) => setFdYears(parseInt(e.target.value))}
                    className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>1 Year</span>
                    <span>25 Years</span>
                  </div>
                </div>

                {/* Compounding Selection */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block">Compounding Interval</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Monthly', val: 12 },
                      { label: 'Quarterly', val: 4 },
                      { label: 'Half-Yr', val: 2 },
                      { label: 'Yearly', val: 1 },
                    ].map((comp) => (
                      <button
                        id={`fd-compounding-${comp.label.toLowerCase()}`}
                        key={comp.val}
                        onClick={() => setFdCompounding(comp.val)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          fdCompounding === comp.val
                            ? 'accent-pill text-white shadow shadow-indigo-500/10'
                            : 'glass-dark text-white/50 border border-white/5 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {comp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'rd' && (
              <>
                {/* Monthly RD Investment */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-white/80">Monthly RD Contribution</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold">{currency.symbol}</span>
                      <input
                        id="rd-amount-input"
                        type="number"
                        value={rdMonthly}
                        onChange={(e) => setRdMonthly(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-32 pl-8 pr-3 py-1 bg-black/20 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 text-right text-sm"
                      />
                    </div>
                  </div>
                  <input
                    id="rd-amount-slider"
                    type="range"
                    min="10"
                    max="5000"
                    step="50"
                    value={rdMonthly}
                    onChange={(e) => setRdMonthly(parseInt(e.target.value))}
                    className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>{currency.symbol}10</span>
                    <span>{currency.symbol}5,005</span>
                  </div>
                </div>

                {/* Return Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-white/80">Interest Rate (p.a. %)</label>
                    <div className="relative">
                      <input
                        id="rd-rate-input"
                        type="number"
                        step="0.1"
                        value={rdRate}
                        onChange={(e) => setRdRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-24 px-3 py-1 bg-black/20 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 text-right text-sm"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">%</span>
                    </div>
                  </div>
                  <input
                    id="rd-rate-slider"
                    type="range"
                    min="1"
                    max="15"
                    step="0.1"
                    value={rdRate}
                    onChange={(e) => setRdRate(parseFloat(e.target.value))}
                    className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>1%</span>
                    <span>15%</span>
                  </div>
                </div>

                {/* Years */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-white/80">Period (Years)</label>
                    <div className="relative">
                      <input
                        id="rd-years-input"
                        type="number"
                        value={rdYears}
                        onChange={(e) => setRdYears(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-3 py-1 bg-black/20 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 text-right text-sm"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-bold">Yrs</span>
                    </div>
                  </div>
                  <input
                    id="rd-years-slider"
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={rdYears}
                    onChange={(e) => setRdYears(parseInt(e.target.value))}
                    className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>1 Year</span>
                    <span>15 Years</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Save/Copy actions */}
        <div className="mt-8 flex gap-3 border-t border-white/10 pt-4">
          <button
            id="investment-btn-copy"
            onClick={handleCopy}
            className="flex-1 py-2.5 glass-dark border border-white/5 rounded-xl text-white/80 font-semibold hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={16} className="text-indigo-400" />
                Copied plan!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Summary
              </>
            )}
          </button>

          <button
            id="investment-btn-save-trigger"
            onClick={() => setShowSaveModal(true)}
            className="flex-1 py-2.5 accent-pill text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Save size={16} />
            Save Calculation
          </button>
        </div>
      </div>

      {/* Visual results & Growth Chart */}
      <div className="lg:col-span-5 flex flex-col gap-6" id="investment-results-panel">
        <div className="glass rounded-2xl p-6 shadow-xl" id="investment-out-cards">
          <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Maturity Statistics</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-dark rounded-xl p-4 border border-white/5">
              <span className="text-[11px] text-white/50 block mb-1">TOTAL INVESTED</span>
              <span className="text-base font-extrabold text-white">{formatVal(investedAmount)}</span>
            </div>
            <div className="glass-dark rounded-xl p-4 border border-white/5">
              <span className="text-[11px] text-white/50 block mb-1">EST. RETURNS</span>
              <span className="text-base font-extrabold text-indigo-400">+{formatVal(estReturns)}</span>
            </div>
          </div>

          <div className="accent-pill rounded-xl p-4 mt-4 flex items-center justify-between shadow-lg shadow-indigo-500/25">
            <div>
              <span className="text-[10px] text-white/75 uppercase font-bold tracking-wider block">ESTIMATED TOTAL VALUE</span>
              <span className="text-xl font-black text-white">{formatVal(totalValue)}</span>
            </div>
            <div className="p-2 bg-white/15 text-white rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        {/* Wealth Accumulation Chart */}
        <div className="glass rounded-2xl p-6 flex flex-col h-64 shadow-xl" id="investment-progress-chart">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-xs font-bold text-white/50 uppercase tracking-wider">Wealth Accumulation</h5>
            <span className="text-[10px] glass-dark border border-white/5 px-2 py-0.5 rounded text-white/60 font-mono">Yearly Growth</span>
          </div>
          
          <div className="w-full h-full text-xs">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" stroke="#94a3b8" tickFormatter={(v) => `Yr ${v}`} />
                  <YAxis stroke="#94a3b8" tickFormatter={(v) => currency.symbol + (v / 1000 >= 1 ? `${v / 1000}k` : v)} />
                  <Tooltip
                    formatter={(value: number) => [formatVal(value), '']}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                  <Area type="monotone" dataKey="invested" name="Invested Principal" stroke="#c084fc" fillOpacity={1} fill="url(#colorInvested)" stacked />
                  <Area type="monotone" dataKey="returns" name="Interest / Wealth Gained" stroke="#818cf8" fillOpacity={1} fill="url(#colorReturns)" stacked />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/40 text-xs">
                <Info size={16} className="mr-1" /> No progress data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm px-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="text-lg font-bold text-white mb-2">Save Investment Calculation</h3>
            <p className="text-sm text-white/60 mb-4">Provide a name to save this {activeTab.toUpperCase()} planner configuration.</p>
            <input
              id="investment-save-name-input"
              type="text"
              placeholder={`e.g. My Retirment SIP, 5Yr FD plan`}
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/15 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm mb-6"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                id="investment-modal-cancel"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 glass-dark border border-white/10 rounded-xl text-white/70 hover:bg-white/5 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="investment-modal-save"
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="px-5 py-2 accent-pill text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 text-sm transition-all cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
