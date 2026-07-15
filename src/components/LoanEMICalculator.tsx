import { useState, useEffect } from 'react';
import { Landmark, Calendar, Percent, Info, Save, Copy, Check, ChevronDown, ChevronUp, Search, Download } from 'lucide-react';
import {
  calculateEMI,
  generateMonthlyAmortizationSchedule,
  generateYearlyAmortizationSchedule,
  calculatePrincipal,
  calculateTenure,
  calculateInterestRate
} from '../utils/financeCalculations';
import { Currency, AmortizationRow, SavedCalculation } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface LoanEMICalculatorProps {
  currency: Currency;
  onSaveCalculation: (name: string, data: any) => void;
  loadedItem: SavedCalculation | null;
  onClearLoadedItem: () => void;
}

type LoanCategory = 'home' | 'car' | 'personal' | 'custom';
type TargetParameter = 'emi' | 'amount' | 'rate' | 'tenure';

export default function LoanEMICalculator({ currency, onSaveCalculation, loadedItem, onClearLoadedItem }: LoanEMICalculatorProps) {
  const [loanCategory, setLoanCategory] = useState<LoanCategory>('custom');
  const [targetParameter, setTargetParameter] = useState<TargetParameter>('emi');

  // Interactive Loan inputs (used when active or synchronized)
  const [amountInput, setAmountInput] = useState<number>(100000);
  const [rateInput, setRateInput] = useState<number>(7.5);
  const [tenureInput, setTenureInput] = useState<number>(15);
  const [emiInput, setEmiInput] = useState<number>(927);
  const [isYears, setIsYears] = useState<boolean>(true);

  // Amortization table states
  const [scheduleView, setScheduleView] = useState<'yearly' | 'monthly'>('yearly');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Load from saved item if type is loan
  useEffect(() => {
    if (loadedItem && loadedItem.type === 'loan' && loadedItem.data) {
      const d = loadedItem.data;
      if (d.category) setLoanCategory(d.category);
      if (d.targetParameter !== undefined) {
        setTargetParameter(d.targetParameter as TargetParameter);
      } else {
        setTargetParameter('emi');
      }
      if (d.amount !== undefined) setAmountInput(d.amount);
      if (d.rate !== undefined) setRateInput(d.rate);
      if (d.tenure !== undefined) setTenureInput(d.tenure);
      if (d.emi !== undefined) setEmiInput(d.emi);
      if (d.isYears !== undefined) setIsYears(d.isYears);
      onClearLoadedItem();
    }
  }, [loadedItem, onClearLoadedItem]);

  // Synchronize inputs when target parameter changes to prevent abrupt jumps
  useEffect(() => {
    const currentMonths = isYears ? tenureInput * 12 : tenureInput;
    if (targetParameter === 'emi') {
      // Currently calculating EMI. Preserve inputs.
    } else if (targetParameter === 'amount') {
      const currentEmi = calculateEMI(amountInput, rateInput, currentMonths);
      setEmiInput(currentEmi);
    } else if (targetParameter === 'rate') {
      const currentEmi = calculateEMI(amountInput, rateInput, currentMonths);
      setEmiInput(currentEmi);
    } else if (targetParameter === 'tenure') {
      const currentEmi = calculateEMI(amountInput, rateInput, currentMonths);
      setEmiInput(currentEmi);
    }
  }, [targetParameter]);

  // Auto pre-populate when changing preset categories
  useEffect(() => {
    if (loanCategory === 'home') {
      setTargetParameter('emi');
      setAmountInput(250000);
      setRateInput(6.8);
      setTenureInput(30);
      setIsYears(true);
    } else if (loanCategory === 'car') {
      setTargetParameter('emi');
      setAmountInput(35000);
      setRateInput(5.2);
      setTenureInput(5);
      setIsYears(true);
    } else if (loanCategory === 'personal') {
      setTargetParameter('emi');
      setAmountInput(15000);
      setRateInput(10.5);
      setTenureInput(3);
      setIsYears(true);
    }
  }, [loanCategory]);

  // Handle manual input or sliders based on target parameter mode
  let amount = amountInput;
  let rate = rateInput;
  let tenure = tenureInput;
  let emi = emiInput;
  let months = isYears ? tenureInput * 12 : tenureInput;
  let isTenureInfinite = false;
  let isEmiTooLow = false;

  if (targetParameter === 'emi') {
    months = isYears ? tenureInput * 12 : tenureInput;
    emi = calculateEMI(amountInput, rateInput, months);
    amount = amountInput;
    rate = rateInput;
    tenure = tenureInput;
  } else if (targetParameter === 'amount') {
    months = isYears ? tenureInput * 12 : tenureInput;
    amount = calculatePrincipal(emiInput, rateInput, months);
    emi = emiInput;
    rate = rateInput;
    tenure = tenureInput;
  } else if (targetParameter === 'rate') {
    months = isYears ? tenureInput * 12 : tenureInput;
    rate = calculateInterestRate(amountInput, emiInput, months);
    amount = amountInput;
    emi = emiInput;
    tenure = tenureInput;
    if (emiInput < amountInput / months) {
      isEmiTooLow = true;
    }
  } else if (targetParameter === 'tenure') {
    const calcMonths = calculateTenure(amountInput, emiInput, rateInput);
    if (calcMonths === Infinity) {
      isTenureInfinite = true;
      months = 0;
      tenure = 0;
    } else {
      months = calcMonths;
      tenure = isYears ? Number((months / 12).toFixed(1)) : Number(months.toFixed(1));
    }
    amount = amountInput;
    emi = emiInput;
    rate = rateInput;
  }

  const totalPayment = isTenureInfinite || isEmiTooLow ? 0 : emi * months;
  const totalInterest = isTenureInfinite || isEmiTooLow ? 0 : Math.max(0, totalPayment - amount);

  // Amortization Schedules with performance limit checks
  const yearlySchedule = isTenureInfinite || isEmiTooLow || months <= 0 || months > 1200
    ? []
    : generateYearlyAmortizationSchedule(amount, rate, months);

  const monthlySchedule = isTenureInfinite || isEmiTooLow || months <= 0 || months > 1200
    ? []
    : generateMonthlyAmortizationSchedule(amount, rate, months);

  const formatVal = (val: number) => {
    return currency.symbol + ' ' + Math.round(val).toLocaleString();
  };

  const handleCopySummary = () => {
    const text = `--- LOAN EMI SUMMARY (${loanCategory.toUpperCase()}) ---
Target Parameter: ${targetParameter.toUpperCase()}
Principal Amount: ${formatVal(amount)}
Interest Rate: ${rate.toFixed(2)}% p.a.
Loan Tenure: ${tenure.toFixed(1)} ${isYears ? 'Years' : 'Months'}
-------------------------------------------------
Monthly EMI: ${formatVal(emi)}
Total Interest Payable: ${formatVal(totalInterest)}
Total Payment Amount: ${formatVal(totalPayment)}
-------------------------------------------------`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    onSaveCalculation(saveName, {
      category: loanCategory,
      targetParameter,
      amount,
      rate,
      tenure,
      isYears,
      emi,
      totalInterest,
      totalPayment,
    });
    setSaveName('');
    setShowSaveModal(false);
  };

  // Pie chart data
  const chartData = [
    { name: 'Principal Amount', value: amount, color: '#818cf8' },
    { name: 'Interest Payable', value: totalInterest, color: '#c084fc' },
  ];

  // Filtering schedules
  const displayedSchedule = scheduleView === 'yearly' ? yearlySchedule : monthlySchedule;
  const filteredSchedule = displayedSchedule.filter((row) => {
    if (!searchTerm.trim()) return true;
    return row.period.toString() === searchTerm;
  });

  return (
    <div className="space-y-8" id="loan-emi-calculator-main">
      {/* Upper Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Sliders & Inputs */}
        <div className="lg:col-span-7 glass rounded-2xl p-6 space-y-6" id="loan-inputs-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Landmark size={20} className="text-indigo-400" />
                EMI Loan Planner
              </h3>
              <p className="text-xs text-white/60">Choose which parameter to calculate based on other inputs</p>
            </div>

            {/* Quick Category Presets */}
            <div className="flex flex-wrap gap-1.5" id="preset-group">
              {(['home', 'car', 'personal', 'custom'] as LoanCategory[]).map((cat) => (
                <button
                  id={`preset-btn-${cat}`}
                  key={cat}
                  onClick={() => setLoanCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    loanCategory === cat
                      ? 'accent-pill text-white shadow-md shadow-indigo-500/20'
                      : 'glass-dark text-white/70 border border-white/5 hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Target Parameter Selector */}
          <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/5" id="target-parameter-selector">
            <label className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider block">
              Parameter to Calculate (Target):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { val: 'emi', label: 'Monthly EMI' },
                { val: 'amount', label: 'Loan Amount' },
                { val: 'rate', label: 'Interest Rate' },
                { val: 'tenure', label: 'Loan Tenure' }
              ].map((item) => (
                <button
                  id={`calc-target-${item.val}`}
                  key={item.val}
                  type="button"
                  onClick={() => {
                    setLoanCategory('custom');
                    setTargetParameter(item.val as TargetParameter);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    targetParameter === item.val
                      ? 'accent-pill text-white shadow-md shadow-indigo-500/15'
                      : 'glass-dark text-white/50 border border-white/5 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Amount Input Block */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-white/80 flex items-center gap-1.5">
                  Loan Principal Amount
                  {targetParameter === 'amount' && (
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded uppercase font-extrabold">
                      Calculated
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-bold">{currency.symbol}</span>
                  <input
                    id="loan-amount-input"
                    type="number"
                    disabled={targetParameter === 'amount'}
                    value={targetParameter === 'amount' ? Math.round(amount) : amountInput}
                    onChange={(e) => {
                      setLoanCategory('custom');
                      setAmountInput(Math.max(0, parseInt(e.target.value) || 0));
                    }}
                    className={`w-36 pl-8 pr-3 py-1.5 rounded-xl font-bold focus:outline-none text-right text-sm transition-all ${
                      targetParameter === 'amount'
                        ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
                        : 'bg-black/20 border border-white/10 text-white focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>
              {targetParameter !== 'amount' && (
                <>
                  <input
                    id="loan-amount-slider"
                    type="range"
                    min="5000"
                    max="2000000"
                    step="5000"
                    value={amountInput}
                    onChange={(e) => {
                      setLoanCategory('custom');
                      setAmountInput(parseInt(e.target.value));
                    }}
                    className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>{currency.symbol}5,000</span>
                    <span>{currency.symbol}2,000,000</span>
                  </div>
                </>
              )}
            </div>

            {/* Interest Rate Input Block */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-white/80 flex items-center gap-1.5">
                  Interest Rate (Annual % p.a.)
                  {targetParameter === 'rate' && (
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded uppercase font-extrabold">
                      Calculated
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id="loan-rate-input"
                    type="number"
                    step="0.1"
                    disabled={targetParameter === 'rate'}
                    value={targetParameter === 'rate' ? Number(rate.toFixed(2)) : rateInput}
                    onChange={(e) => {
                      setLoanCategory('custom');
                      setRateInput(Math.max(0, parseFloat(e.target.value) || 0));
                    }}
                    className={`w-24 px-3 py-1.5 rounded-xl font-bold focus:outline-none text-right text-sm transition-all ${
                      targetParameter === 'rate'
                        ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
                        : 'bg-black/20 border border-white/10 text-white focus:border-indigo-500'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">%</span>
                </div>
              </div>
              {targetParameter !== 'rate' && (
                <>
                  <input
                    id="loan-rate-slider"
                    type="range"
                    min="1"
                    max="25"
                    step="0.1"
                    value={rateInput}
                    onChange={(e) => {
                      setLoanCategory('custom');
                      setRateInput(parseFloat(e.target.value));
                    }}
                    className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>1%</span>
                    <span>25%</span>
                  </div>
                </>
              )}
            </div>

            {/* Loan Tenure Input Block */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-white/80 flex items-center gap-1.5">
                  Loan Tenure
                  {targetParameter === 'tenure' && (
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded uppercase font-extrabold">
                      Calculated
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="loan-tenure-input"
                    type="number"
                    disabled={targetParameter === 'tenure'}
                    value={targetParameter === 'tenure' ? Number(tenure.toFixed(1)) : tenureInput}
                    onChange={(e) => {
                      setLoanCategory('custom');
                      setTenureInput(Math.max(1, parseInt(e.target.value) || 1));
                    }}
                    className={`w-20 px-3 py-1.5 rounded-xl font-bold focus:outline-none text-right text-sm transition-all ${
                      targetParameter === 'tenure'
                        ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
                        : 'bg-black/20 border border-white/10 text-white focus:border-indigo-500'
                    }`}
                  />
                  
                  {/* Years / Months Selection Pill */}
                  <div className="flex glass-dark rounded-xl p-0.5" id="tenure-unit-pill">
                    <button
                      id="tenure-unit-yr"
                      type="button"
                      onClick={() => {
                        if (!isYears) {
                          setLoanCategory('custom');
                          if (targetParameter === 'tenure') {
                            setIsYears(true);
                          } else {
                            setTenureInput(Math.max(1, Math.round(tenureInput / 12)));
                            setIsYears(true);
                          }
                        }
                      }}
                      className={`px-3 py-1 text-[10px] font-extrabold rounded-lg uppercase transition-colors cursor-pointer ${
                        isYears ? 'accent-pill text-white shadow' : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      Years
                    </button>
                    <button
                      id="tenure-unit-mo"
                      type="button"
                      onClick={() => {
                        if (isYears) {
                          setLoanCategory('custom');
                          if (targetParameter === 'tenure') {
                            setIsYears(false);
                          } else {
                            setTenureInput(tenureInput * 12);
                            setIsYears(false);
                          }
                        }
                      }}
                      className={`px-3 py-1 text-[10px] font-extrabold rounded-lg uppercase transition-colors cursor-pointer ${
                        !isYears ? 'accent-pill text-white shadow' : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      Months
                    </button>
                  </div>
                </div>
              </div>
              {targetParameter !== 'tenure' && (
                <>
                  <input
                    id="loan-tenure-slider"
                    type="range"
                    min="1"
                    max={isYears ? 40 : 480}
                    step="1"
                    value={tenureInput}
                    onChange={(e) => {
                      setLoanCategory('custom');
                      setTenureInput(parseInt(e.target.value));
                    }}
                    className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>1 {isYears ? 'Yr' : 'Mo'}</span>
                    <span>{isYears ? '40 Yrs' : '480 Mos'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Monthly EMI Input Block */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-white/80 flex items-center gap-1.5">
                  Monthly EMI Payment
                  {targetParameter === 'emi' && (
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded uppercase font-extrabold">
                      Calculated
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-bold">{currency.symbol}</span>
                  <input
                    id="loan-emi-input"
                    type="number"
                    disabled={targetParameter === 'emi'}
                    value={targetParameter === 'emi' ? Math.round(emi) : emiInput}
                    onChange={(e) => {
                      setLoanCategory('custom');
                      setEmiInput(Math.max(1, parseInt(e.target.value) || 0));
                    }}
                    className={`w-36 pl-8 pr-3 py-1.5 rounded-xl font-bold focus:outline-none text-right text-sm transition-all ${
                      targetParameter === 'emi'
                        ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
                        : 'bg-black/20 border border-white/10 text-white focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>
              {targetParameter !== 'emi' && (
                <>
                  <input
                    id="loan-emi-slider"
                    type="range"
                    min="100"
                    max="100000"
                    step="100"
                    value={emiInput}
                    onChange={(e) => {
                      setLoanCategory('custom');
                      setEmiInput(parseInt(e.target.value));
                    }}
                    className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>{currency.symbol}100</span>
                    <span>{currency.symbol}100,000</span>
                  </div>
                </>
              )}
            </div>

            {/* Constraint Warnings */}
            {isTenureInfinite && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex gap-2 items-start animate-scaleIn" id="tenure-infinite-warning">
                <Info size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block mb-1">Infinite Loan Tenure Detected</strong>
                  The specified Monthly EMI ({formatVal(emiInput)}) is less than or equal to the monthly interest accrued ({formatVal(amountInput * (rateInput / 12 / 100))}). The loan can never be paid off! Please increase the EMI or reduce the Loan Amount/Interest Rate.
                </div>
              </div>
            )}
            {isEmiTooLow && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex gap-2 items-start animate-scaleIn" id="emi-too-low-warning">
                <Info size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block mb-1">EMI Payment Too Low</strong>
                  The specified Monthly EMI ({formatVal(emiInput)}) is too low to repay the Loan Principal ({formatVal(amountInput)}) within {tenureInput} {isYears ? 'years' : 'months'}, even at a 0% interest rate. Please increase the EMI or increase the loan tenure.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Key outputs & Doughnut Pie chart */}
        <div className="lg:col-span-5 flex flex-col gap-6" id="loan-outputs-panel">
          <div className="glass rounded-2xl p-6 flex flex-col justify-between shadow-xl h-full" id="loan-metrics-card">
            <div>
              <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Repayment Metrics</h4>
              
              <div className="glass-dark rounded-xl px-4 py-4 text-center mb-4 border border-white/5">
                <span className="text-[10px] text-indigo-300 font-bold block uppercase mb-1">
                  {{
                    emi: 'Equated Monthly Installment (EMI)',
                    amount: 'Calculated Loan Principal',
                    rate: 'Calculated Interest Rate',
                    tenure: 'Calculated Loan Tenure'
                  }[targetParameter]}
                </span>
                <span className="text-3xl font-black text-indigo-400 font-mono tracking-tight block">
                  {{
                    emi: formatVal(emi),
                    amount: formatVal(amount),
                    rate: isEmiTooLow ? 'Too Low' : `${rate.toFixed(2)}% p.a.`,
                    tenure: isTenureInfinite ? 'Infinite' : `${tenure} ${isYears ? (tenure === 1 ? 'Year' : 'Years') : (tenure === 1 ? 'Month' : 'Months')}`
                  }[targetParameter]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 glass-dark rounded-xl border border-white/5">
                  <span className="text-[10px] text-white/50 block mb-1 uppercase font-bold">TOTAL INTEREST</span>
                  <span className="text-sm font-bold text-white">
                    {isTenureInfinite || isEmiTooLow ? 'N/A' : formatVal(totalInterest)}
                  </span>
                </div>
                <div className="p-3 glass-dark rounded-xl border border-white/5">
                  <span className="text-[10px] text-white/50 block mb-1 uppercase font-bold">TOTAL PAYMENT</span>
                  <span className="text-sm font-bold text-white">
                    {isTenureInfinite || isEmiTooLow ? 'N/A' : formatVal(totalPayment)}
                  </span>
                </div>
              </div>
            </div>

            {/* Micro Actions */}
            <div className="mt-6 flex gap-2 border-t border-white/10 pt-4">
              <button
                id="loan-copy-btn"
                onClick={handleCopySummary}
                className="flex-1 py-2.5 glass-dark rounded-xl text-white/80 hover:bg-white/5 border border-white/5 transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-indigo-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Summary
                  </>
                )}
              </button>

              <button
                id="loan-save-btn"
                onClick={() => setShowSaveModal(true)}
                className="flex-1 py-2.5 accent-pill text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                <Save size={14} />
                Save Loan
              </button>
            </div>
          </div>

          {/* Visual Doughnut Chart */}
          <div className="glass rounded-2xl p-6 flex flex-col justify-center items-center h-48 shadow-xl" id="loan-visual-doughnut">
            {totalInterest > 0 && !isTenureInfinite && !isEmiTooLow ? (
              <div className="w-full h-full flex items-center justify-between animate-fadeIn">
                <div className="w-[120px] h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#818cf8' : '#c084fc'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatVal(value), '']}
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex-1 pl-4 space-y-2 text-xs">
                  {chartData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: idx === 0 ? '#818cf8' : '#c084fc' }} />
                      <span className="text-white/60">{entry.name}:</span>
                      <span className="font-bold text-white">
                        {((entry.value / totalPayment) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-white/40 text-xs py-4">
                <Info size={24} className="mx-auto mb-2 text-white/30" />
                {isTenureInfinite || isEmiTooLow
                  ? 'Repayment breakdown unavailable due to calculation constraints'
                  : 'Provide rate and amount to view breakdown graph'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Amortization Schedule Repayment Section */}
      <div className="glass rounded-2xl overflow-hidden shadow-xl" id="amortization-table-card">
        {/* Header Repayment Section */}
        <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Amortization Repayment Schedule</h3>
              <p className="text-xs text-white/60">Track structural reductions of principal & interest payments</p>
            </div>
          </div>

          {/* Toggle Tab View & Search */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex glass-dark p-1 rounded-xl" id="amortization-period-toggle">
              <button
                id="schedule-view-yr"
                onClick={() => setScheduleView('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scheduleView === 'yearly' ? 'accent-pill text-white shadow' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Yearly
              </button>
              <button
                id="schedule-view-mo"
                onClick={() => setScheduleView('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scheduleView === 'monthly' ? 'accent-pill text-white shadow' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Monthly
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="schedule-search"
                type="number"
                placeholder={scheduleView === 'yearly' ? 'Search Year...' : 'Search Month...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-36 pl-8 pr-3 py-1.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Repayment Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/80">
            <thead className="glass-dark text-[10px] text-white/50 uppercase tracking-wider font-extrabold border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-center">{scheduleView === 'yearly' ? 'Year' : 'Month'}</th>
                <th className="px-6 py-4">EMI Installment</th>
                <th className="px-6 py-4">Principal Paid</th>
                <th className="px-6 py-4">Interest Paid</th>
                <th className="px-6 py-4">Total Interest Paid</th>
                <th className="px-6 py-4 text-right">Remaining Loan Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSchedule.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-white/40 text-xs">
                    No results matched your schedule search.
                  </td>
                </tr>
              ) : (
                filteredSchedule.map((row) => {
                  const percentPaid = ((amount - row.remainingBalance) / amount) * 100;
                  return (
                    <tr
                      key={row.period}
                      className="hover:bg-white/5 transition-colors text-xs md:text-sm"
                      id={`amortization-row-${scheduleView}-${row.period}`}
                    >
                      <td className="px-6 py-4 font-extrabold text-white text-center bg-white/5">
                        {row.period}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-white">
                        {formatVal(row.payment)}
                      </td>
                      <td className="px-6 py-4 font-mono text-white/80">
                        {formatVal(row.principal)}
                      </td>
                      <td className="px-6 py-4 font-mono text-indigo-400/90">
                        {formatVal(row.interest)}
                      </td>
                      <td className="px-6 py-4 font-mono text-white/50">
                        {formatVal(row.totalInterestPaid)}
                      </td>
                      <td className="px-6 py-4 text-right bg-white/5">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-bold text-white">{formatVal(row.remainingBalance)}</span>
                          {/* Mini Progress Bar showing percentage of principal paid */}
                          <div className="w-24 bg-white/10 h-1 rounded-full mt-1 overflow-hidden">
                            <div
                              className="accent-pill h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, percentPaid))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm px-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="text-lg font-bold text-white mb-2">Save EMI Plan</h3>
            <p className="text-sm text-white/60 mb-4">Provide a descriptive label to easily retrieve this loan scenario from Saved Calculations.</p>
            <input
              id="loan-save-name-input"
              type="text"
              placeholder="e.g. My Dream House Mortgage, Toyota Camry APR"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/15 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm mb-6"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                id="loan-modal-cancel"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 glass-dark border border-white/10 rounded-xl text-white/70 hover:bg-white/5 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="loan-modal-save"
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
