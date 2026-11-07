import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Save,
  Copy,
  Check,
  Search,
  Download,
  Share2,
  Sparkles,
  Info,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  ArrowLeftRight,
  ArrowRight,
  Plus,
  Eye,
  Sliders
} from 'lucide-react';
import {
  calculateEMI,
  generateMonthlyAmortizationSchedule,
  generateYearlyAmortizationSchedule,
  calculatePrincipal,
  calculateTenure,
  calculateInterestRate,
  calculateExtraRepaymentImpact
} from '../utils/financeCalculations';
import { Currency, SavedCalculation, ComparedLoan, ExtraRepaymentConfig, RepaymentFrequency } from '../types';
import {
  formatIndianCurrency,
  formatIndianCompact
} from '../utils/indianNumberFormat';
import { exportAmortizationPDF } from '../utils/pdfExport';
import { copyToClipboard } from '../utils/clipboard';
import LoanComparisonModal from './LoanComparisonModal';

interface LoanEMICalculatorProps {
  currency: Currency;
  onSaveCalculation: (name: string, data: any) => void;
  loadedItem: SavedCalculation | null;
  onClearLoadedItem: () => void;
  onAddToCompare?: (data: { amount: number; rate: number; tenure: number; isYears: boolean }) => void;
}

type TargetParameter = 'emi' | 'amount' | 'rate' | 'tenure';

export default function LoanEMICalculator({
  currency,
  onSaveCalculation,
  loadedItem,
  onClearLoadedItem,
  onAddToCompare
}: LoanEMICalculatorProps) {
  // Target parameter being calculated: emi, amount, rate, tenure
  const [targetParameter, setTargetParameter] = useState<TargetParameter>('emi');

  // Input states (default matching the screenshot: 1,00,000 @ 8.5% for 5 Years => EMI 2,051.65)
  const [amountInput, setAmountInput] = useState<number>(100000);
  const [rateInput, setRateInput] = useState<number>(8.5);
  const [tenureInput, setTenureInput] = useState<number>(5);
  const [emiInput, setEmiInput] = useState<number>(2051.65);
  const [isYears, setIsYears] = useState<boolean>(true);

  // Comparison state: fetched loans kept aside until "Compare Now" is clicked
  const [comparedLoans, setComparedLoans] = useState<ComparedLoan[]>(() => {
    try {
      const saved = localStorage.getItem('loan_compare_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareToast, setCompareToast] = useState<string | null>(null);

  // Advanced Extra Repayment state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [extraAmount, setExtraAmount] = useState<number>(0);
  const [extraFrequency, setExtraFrequency] = useState<RepaymentFrequency>('monthly');
  const [customMonth, setCustomMonth] = useState<number>(10);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  // UI / Calculation states
  const [scheduleView, setScheduleView] = useState<'yearly' | 'monthly'>('yearly');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const scheduleRef = useRef<HTMLDivElement>(null);

  // Load from saved item if available
  useEffect(() => {
    if (loadedItem && loadedItem.type === 'loan' && loadedItem.data) {
      const d = loadedItem.data;
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
      if (d.extraAmount !== undefined) {
        setExtraAmount(d.extraAmount);
        setShowAdvanced(d.extraAmount > 0);
      }
      if (d.extraFrequency !== undefined) setExtraFrequency(d.extraFrequency);
      if (d.customMonth !== undefined) setCustomMonth(d.customMonth);
      if (d.isRecurring !== undefined) setIsRecurring(d.isRecurring);
      onClearLoadedItem();
    }
  }, [loadedItem, onClearLoadedItem]);

  // Synchronize inputs when target parameter changes
  useEffect(() => {
    if (amountInput <= 0 || rateInput <= 0 || tenureInput <= 0) return;
    const currentMonths = isYears ? tenureInput * 12 : tenureInput;
    if (targetParameter === 'amount') {
      const calculated = calculateEMI(amountInput, rateInput, currentMonths);
      setEmiInput(Number(calculated.toFixed(2)));
    } else if (targetParameter === 'rate' || targetParameter === 'tenure') {
      const calculated = calculateEMI(amountInput, rateInput, currentMonths);
      setEmiInput(Number(calculated.toFixed(2)));
    }
  }, [targetParameter]);

  // Perform Calculations
  let amount = amountInput;
  let rate = rateInput;
  let tenure = tenureInput;
  let emi = emiInput;
  let months = isYears ? tenureInput * 12 : tenureInput;
  let isTenureInfinite = false;
  let isEmiTooLow = false;

  if (targetParameter === 'emi') {
    months = isYears ? tenureInput * 12 : tenureInput;
    emi = amountInput > 0 && rateInput > 0 && months > 0
      ? calculateEMI(amountInput, rateInput, months)
      : 0;
    amount = amountInput;
    rate = rateInput;
    tenure = tenureInput;
  } else if (targetParameter === 'amount') {
    months = isYears ? tenureInput * 12 : tenureInput;
    amount = emiInput > 0 && rateInput > 0 && months > 0
      ? calculatePrincipal(emiInput, rateInput, months)
      : 0;
    emi = emiInput;
    rate = rateInput;
    tenure = tenureInput;
  } else if (targetParameter === 'rate') {
    months = isYears ? tenureInput * 12 : tenureInput;
    rate = amountInput > 0 && emiInput > 0 && months > 0
      ? calculateInterestRate(amountInput, emiInput, months)
      : 0;
    amount = amountInput;
    emi = emiInput;
    tenure = tenureInput;
    if (emiInput > 0 && amountInput > 0 && months > 0 && emiInput < amountInput / months) {
      isEmiTooLow = true;
    }
  } else if (targetParameter === 'tenure') {
    if (amountInput > 0 && emiInput > 0 && rateInput > 0) {
      const calcMonths = calculateTenure(amountInput, emiInput, rateInput);
      if (calcMonths === Infinity) {
        isTenureInfinite = true;
        months = 0;
        tenure = 0;
      } else {
        months = calcMonths;
        tenure = isYears ? Number((months / 12).toFixed(1)) : Number(months.toFixed(1));
      }
    } else {
      months = 0;
      tenure = 0;
    }
    amount = amountInput;
    emi = emiInput;
    rate = rateInput;
  }

  // Repayment totals (no processing fees)
  const totalInterest = isTenureInfinite || isEmiTooLow || amount <= 0 || months <= 0
    ? 0
    : Math.max(0, emi * months - amount);
  const totalPayment = isTenureInfinite || isEmiTooLow || amount <= 0
    ? 0
    : amount + totalInterest;

  // Extra Repayment Configuration
  const extraRepaymentConfig: ExtraRepaymentConfig = {
    enabled: extraAmount > 0,
    amount: extraAmount,
    frequency: extraFrequency,
    customMonth: extraFrequency === 'custom' ? (customMonth > 0 ? customMonth : 1) : undefined,
    isRecurring: extraFrequency === 'custom' ? isRecurring : undefined,
  };

  // Comparative metrics with extra repayment
  const extraImpact = calculateExtraRepaymentImpact(amount, rate, months, extraRepaymentConfig);
  const displayTotalInterest = extraRepaymentConfig.enabled ? extraImpact.actualTotalInterest : totalInterest;
  const displayTotalPayment = extraRepaymentConfig.enabled ? extraImpact.actualTotalPayment : totalPayment;
  const hasSavings = extraRepaymentConfig.enabled && (extraImpact.interestSaved > 0 || extraImpact.monthsSaved > 0);

  // Formatter matching screenshot with exact 2 decimals
  const formatVal = (val: number, decimals: number = 2) =>
    formatIndianCurrency(val, { decimals, showSymbol: true });

  // Reset Handler: Nullify all values to 0/blank
  const handleReset = () => {
    setAmountInput(0);
    setRateInput(0);
    setTenureInput(0);
    setEmiInput(0);
    setExtraAmount(0);
    setExtraFrequency('monthly');
    setCustomMonth(10);
    setIsRecurring(false);
  };

  // Add to Compare Handler: Fetch current loan data and keep it aside
  const handleAddToCompareClick = () => {
    if (amount <= 0 || rate <= 0 || tenure <= 0) {
      alert('Please enter a valid loan amount, interest rate, and period before adding to comparison.');
      return;
    }

    const calcMonths = isYears ? tenure * 12 : tenure;
    const calcEmi = emi > 0 ? emi : calculateEMI(amount, rate, calcMonths);
    const calcInterest = displayTotalInterest > 0 ? displayTotalInterest : Math.max(0, calcEmi * calcMonths - amount);
    const calcPayment = displayTotalPayment > 0 ? displayTotalPayment : amount + calcInterest;

    const newLoan: ComparedLoan = {
      id: String(Date.now()),
      name: `Proposal ${comparedLoans.length + 1} (${formatIndianCompact(amount)} @ ${rate}%)`,
      amount: Math.round(amount),
      rate: Number(rate.toFixed(2)),
      tenure: Number(tenure.toFixed(1)),
      isYears,
      emi: Number(calcEmi.toFixed(2)),
      totalInterest: Number(calcInterest.toFixed(2)),
      totalPayment: Number(calcPayment.toFixed(2)),
      timestamp: Date.now(),
    };

    const updated = [...comparedLoans, newLoan];
    setComparedLoans(updated);
    try {
      localStorage.setItem('loan_compare_queue', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setCompareToast(`Added to comparison list (${updated.length} kept aside)`);
    setTimeout(() => {
      setCompareToast(null);
    }, 3500);
  };

  const handleRemoveComparedLoan = (id: string) => {
    const updated = comparedLoans.filter((l) => l.id !== id);
    setComparedLoans(updated);
    try {
      localStorage.setItem('loan_compare_queue', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearComparedLoans = () => {
    setComparedLoans([]);
    try {
      localStorage.removeItem('loan_compare_queue');
    } catch {
      // ignore
    }
  };

  // View Details: Smooth scroll to the Amortization schedule
  const handleViewDetails = () => {
    if (scheduleRef.current) {
      scheduleRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Amortization Schedules
  const yearlySchedule =
    isTenureInfinite || isEmiTooLow || amount <= 0 || months <= 0 || months > 1200
      ? []
      : generateYearlyAmortizationSchedule(amount, rate, months, extraRepaymentConfig);

  const monthlySchedule =
    isTenureInfinite || isEmiTooLow || amount <= 0 || months <= 0 || months > 1200
      ? []
      : generateMonthlyAmortizationSchedule(amount, rate, months, extraRepaymentConfig);

  const displayedSchedule = scheduleView === 'yearly' ? yearlySchedule : monthlySchedule;
  const filteredSchedule = displayedSchedule.filter((row) => {
    if (!searchTerm.trim()) return true;
    return row.period.toString() === searchTerm;
  });

  // Copy Summary
  const handleCopySummary = async () => {
    const text = `--- EMI CALCULATOR SUMMARY (INR) ---
Loan Amount: ${formatVal(amount)}
Interest Rate: ${rate.toFixed(2)}%
Period: ${tenure} ${isYears ? 'Years' : 'Months'}
Monthly EMI: ${formatVal(emi)}
${extraAmount > 0 ? `Extra Repayment: ${formatVal(extraAmount)} (${extraFrequency}${extraFrequency === 'custom' ? ` Month ${customMonth}${isRecurring ? ' Recurring' : ' One-Time'}` : ''})
Revised Total Interest: ${formatVal(displayTotalInterest)} (Saved ${formatVal(extraImpact.interestSaved)})
Time Saved: ${extraImpact.monthsSaved} Months
Revised Total Payment: ${formatVal(displayTotalPayment)}` : `Total Interest: ${formatVal(totalInterest)}
Total Payment: ${formatVal(totalPayment)}`}
-------------------------------------`;

    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Save Loan
  const handleSave = () => {
    if (!saveName.trim()) return;
    onSaveCalculation(saveName, {
      category: 'custom',
      targetParameter,
      amount,
      rate,
      tenure,
      isYears,
      emi,
      totalInterest: displayTotalInterest,
      totalPayment: displayTotalPayment,
      extraAmount: extraAmount > 0 ? extraAmount : undefined,
      extraFrequency: extraAmount > 0 ? extraFrequency : undefined,
      customMonth: extraAmount > 0 && extraFrequency === 'custom' ? customMonth : undefined,
      isRecurring: extraAmount > 0 && extraFrequency === 'custom' ? isRecurring : undefined,
    });
    setSaveName('');
    setShowSaveModal(false);
  };

  // PDF Export
  const handleExportPDF = async (action: 'download' | 'share') => {
    if (isTenureInfinite || isEmiTooLow || months <= 0 || amount <= 0) {
      alert('Cannot export PDF without valid loan parameters.');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setPdfStatus(action === 'share' ? 'Preparing PDF for sharing...' : 'Generating PDF report...');

      await exportAmortizationPDF(
        {
          loanCategory: 'custom',
          targetParameter,
          principal: amount,
          annualRate: rate,
          tenureYearsOrMonths: `${tenure} ${
            isYears ? (tenure === 1 ? 'Year' : 'Years') : tenure === 1 ? 'Month' : 'Months'
          }`,
          emi,
          totalInterest: displayTotalInterest,
          totalPayment: displayTotalPayment,
          scheduleType: scheduleView,
          schedule: scheduleView === 'yearly' ? yearlySchedule : monthlySchedule,
          extraRepayment: extraAmount > 0 ? {
            amount: extraAmount,
            frequency: extraFrequency === 'custom'
              ? `Month ${customMonth}${isRecurring ? ' (Recurring)' : ' (One-Time)'}`
              : extraFrequency === 'monthly' ? 'Monthly'
              : extraFrequency === 'quarterly' ? 'Quarterly'
              : extraFrequency === 'half_yearly' ? 'Half Yearly'
              : 'Annually',
            customMonth,
            isRecurring,
            interestSaved: extraImpact.interestSaved,
            monthsSaved: extraImpact.monthsSaved,
            actualTenure: `${(extraImpact.actualTenureMonths / 12).toFixed(1)} Yrs (${extraImpact.actualTenureMonths} Mos)`,
          } : undefined
        },
        action
      );

      setPdfStatus(action === 'share' ? 'PDF shared successfully!' : 'PDF downloaded successfully!');
      setTimeout(() => setPdfStatus(null), 3500);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setPdfStatus('Failed to generate PDF. Please retry.');
      setTimeout(() => setPdfStatus(null), 3000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Ratio of Principal vs Interest for the Arc Gauge
  const principalRatio = displayTotalPayment > 0 ? (amount / displayTotalPayment) * 100 : 0;
  const interestRatio = displayTotalPayment > 0 ? (displayTotalInterest / displayTotalPayment) * 100 : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto" id="loan-emi-calculator-main">
      {/* PDF status toast */}
      {pdfStatus && (
        <div
          className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs flex items-center justify-between animate-fadeIn shadow-lg shadow-emerald-500/10"
          id="pdf-status-banner"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400 animate-pulse" />
            <span className="font-semibold">{pdfStatus}</span>
          </div>
          <button
            onClick={() => setPdfStatus(null)}
            className="text-white/60 hover:text-white text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Form & Results Grid (Styled precisely like user screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left / Upper: The 5 Rows of Inputs + Reset & Calculate buttons */}
        <div
          className="md:col-span-7 glass-creative rounded-3xl p-6 sm:p-7 space-y-4 border border-white/10 shadow-2xl"
          id="loan-form-card"
        >
          {/* Header Title Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-lg font-bold text-white tracking-wide">EMI Calculator</h2>
            <span className="text-[11px] text-white/50 font-medium font-mono">Select parameter to calculate</span>
          </div>

          {/* Row 1: Amount */}
          <div className="flex items-center justify-between gap-3 py-1">
            <label
              htmlFor="loan-amount-input"
              onClick={() => setTargetParameter('amount')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              {/* Radio Circle */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  targetParameter === 'amount'
                    ? 'border-emerald-400 bg-emerald-500/20'
                    : 'border-white/40 group-hover:border-white/70'
                }`}
              >
                {targetParameter === 'amount' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                )}
              </div>
              <span className="font-semibold text-white/90 text-sm sm:text-base">Amount</span>
            </label>

            {/* Input on Right */}
            <div className="relative w-44 sm:w-56">
              <input
                id="loan-amount-input"
                type={targetParameter === 'amount' ? 'text' : 'number'}
                disabled={targetParameter === 'amount'}
                placeholder="0"
                value={
                  targetParameter === 'amount'
                    ? amount === 0 ? '' : Math.round(amount).toLocaleString('en-IN')
                    : amountInput === 0
                    ? ''
                    : amountInput
                }
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, '');
                  if (raw === '') {
                    setAmountInput(0);
                  } else {
                    const val = parseInt(raw, 10);
                    setAmountInput(isNaN(val) ? 0 : Math.max(0, val));
                  }
                }}
                className={`w-full pl-3.5 pr-8 py-2.5 rounded-xl font-mono text-sm font-semibold transition-all focus:outline-none ${
                  targetParameter === 'amount'
                    ? 'bg-emerald-500/10 border border-emerald-400/50 text-emerald-300 shadow-inner'
                    : 'bg-black/35 border border-white/15 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                }`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 text-sm font-semibold pointer-events-none">
                ₹
              </span>
            </div>
          </div>

          {/* Row 2: Interest */}
          <div className="flex items-center justify-between gap-3 py-1">
            <label
              htmlFor="loan-rate-input"
              onClick={() => setTargetParameter('rate')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              {/* Radio Circle */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  targetParameter === 'rate'
                    ? 'border-emerald-400 bg-emerald-500/20'
                    : 'border-white/40 group-hover:border-white/70'
                }`}
              >
                {targetParameter === 'rate' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                )}
              </div>
              <span className="font-semibold text-white/90 text-sm sm:text-base">Interest</span>
            </label>

            {/* Input on Right */}
            <div className="relative w-44 sm:w-56">
              <input
                id="loan-rate-input"
                type="number"
                step="0.01"
                disabled={targetParameter === 'rate'}
                placeholder="0"
                value={
                  targetParameter === 'rate'
                    ? rate === 0 ? '' : Number(rate.toFixed(2))
                    : rateInput === 0
                    ? ''
                    : rateInput
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setRateInput(0);
                  } else {
                    const val = parseFloat(raw);
                    setRateInput(isNaN(val) ? 0 : Math.max(0, val));
                  }
                }}
                className={`w-full pl-3.5 pr-8 py-2.5 rounded-xl font-mono text-sm font-semibold transition-all focus:outline-none ${
                  targetParameter === 'rate'
                    ? 'bg-emerald-500/10 border border-emerald-400/50 text-emerald-300 shadow-inner'
                    : 'bg-black/35 border border-white/15 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                }`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 text-sm font-semibold pointer-events-none">
                %
              </span>
            </div>
          </div>

          {/* Row 3: Period with Years | Months toggle inside */}
          <div className="flex items-center justify-between gap-3 py-1">
            <label
              htmlFor="loan-tenure-input"
              onClick={() => setTargetParameter('tenure')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              {/* Radio Circle */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  targetParameter === 'tenure'
                    ? 'border-emerald-400 bg-emerald-500/20'
                    : 'border-white/40 group-hover:border-white/70'
                }`}
              >
                {targetParameter === 'tenure' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                )}
              </div>
              <span className="font-semibold text-white/90 text-sm sm:text-base">Period</span>
            </label>

            {/* Input on Right with internal Years | Months toggle */}
            <div className="relative w-44 sm:w-56 flex items-center">
              <input
                id="loan-tenure-input"
                type="number"
                step="1"
                disabled={targetParameter === 'tenure'}
                placeholder="0"
                value={
                  targetParameter === 'tenure'
                    ? tenure === 0 ? '' : Number(tenure.toFixed(1))
                    : tenureInput === 0
                    ? ''
                    : tenureInput
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setTenureInput(0);
                  } else {
                    const val = parseInt(raw, 10);
                    setTenureInput(isNaN(val) ? 0 : Math.max(0, val));
                  }
                }}
                className={`w-full pl-3.5 pr-28 py-2.5 rounded-xl font-mono text-sm font-semibold transition-all focus:outline-none ${
                  targetParameter === 'tenure'
                    ? 'bg-emerald-500/10 border border-emerald-400/50 text-emerald-300 shadow-inner'
                    : 'bg-black/35 border border-white/15 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                }`}
              />
              
              {/* In-field Years | Months Switcher as in screenshot */}
              <div className="absolute right-2.5 flex items-center gap-1 text-xs select-none">
                <button
                  type="button"
                  id="toggle-unit-years"
                  onClick={() => {
                    if (!isYears) {
                      setIsYears(true);
                      if (targetParameter !== 'tenure' && tenureInput > 0) {
                        setTenureInput(Math.max(1, Math.round(tenureInput / 12)));
                      }
                    }
                  }}
                  className={`font-bold transition-colors cursor-pointer ${
                    isYears ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Years
                </button>
                <span className="text-white/30">|</span>
                <button
                  type="button"
                  id="toggle-unit-months"
                  onClick={() => {
                    if (isYears) {
                      setIsYears(false);
                      if (targetParameter !== 'tenure' && tenureInput > 0) {
                        setTenureInput(Math.max(1, tenureInput * 12));
                      }
                    }
                  }}
                  className={`font-bold transition-colors cursor-pointer ${
                    !isYears ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Months
                </button>
              </div>
            </div>
          </div>

          {/* Row 4: EMI */}
          <div className="flex items-center justify-between gap-3 py-1">
            <label
              htmlFor="loan-emi-input"
              onClick={() => setTargetParameter('emi')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              {/* Radio Circle */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  targetParameter === 'emi'
                    ? 'border-emerald-400 bg-emerald-500/20'
                    : 'border-white/40 group-hover:border-white/70'
                }`}
              >
                {targetParameter === 'emi' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                )}
              </div>
              <span className="font-semibold text-white/90 text-sm sm:text-base">EMI</span>
            </label>

            {/* Input on Right */}
            <div className="relative w-44 sm:w-56">
              <input
                id="loan-emi-input"
                type={targetParameter === 'emi' ? 'text' : 'number'}
                step="0.01"
                disabled={targetParameter === 'emi'}
                placeholder="0"
                value={
                  targetParameter === 'emi'
                    ? emi === 0 ? '' : Math.round(emi).toLocaleString('en-IN')
                    : emiInput === 0
                    ? ''
                    : emiInput
                }
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, '');
                  if (raw === '') {
                    setEmiInput(0);
                  } else {
                    const val = parseFloat(raw);
                    setEmiInput(isNaN(val) ? 0 : Math.max(0, val));
                  }
                }}
                className={`w-full pl-3.5 pr-8 py-2.5 rounded-xl font-mono text-sm font-semibold transition-all focus:outline-none ${
                  targetParameter === 'emi'
                    ? 'bg-emerald-500/10 border border-emerald-400/50 text-emerald-300 shadow-inner'
                    : 'bg-black/35 border border-white/15 text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                }`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 text-sm font-semibold pointer-events-none">
                ₹
              </span>
            </div>
          </div>

          {/* Advanced Options Toggle Button (Below EMI) */}
          <div className="pt-1">
            <button
              id="loan-btn-advanced-toggle"
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                showAdvanced
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/10'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders size={15} className={showAdvanced ? 'text-emerald-400' : 'text-white/60'} />
                <span>Advanced</span>
                {extraAmount > 0 && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    +₹{extraAmount.toLocaleString('en-IN')} ({extraFrequency})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-white/40">{showAdvanced ? 'Hide' : 'Extra Prepayment'}</span>
                <ChevronDown size={15} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180 text-emerald-400' : 'text-white/40'}`} />
              </div>
            </button>
          </div>

          {/* Advanced Extra Repayment Card */}
          {showAdvanced && (
            <div
              id="advanced-repayment-card"
              className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-4 shadow-xl shadow-black/40 animate-fadeIn"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-400" />
                  <h4 className="text-xs sm:text-sm font-extrabold text-white">Extra Repayment / Prepayment</h4>
                </div>
                {extraAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setExtraAmount(0);
                      setExtraFrequency('monthly');
                      setCustomMonth(10);
                      setIsRecurring(false);
                    }}
                    className="text-[11px] text-white/50 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Clear Extra
                  </button>
                )}
              </div>

              {/* 1. Number input for providing extra repayment value */}
              <div className="space-y-1.5">
                <label htmlFor="extra-repayment-amount" className="text-xs font-semibold text-white/80 flex items-center justify-between">
                  <span>Extra Repayment Value</span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {extraAmount > 0 ? `₹${extraAmount.toLocaleString('en-IN')}` : 'Optional'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="extra-repayment-amount"
                    type="text"
                    placeholder="0 (e.g. 5,000)"
                    value={extraAmount === 0 ? '' : extraAmount.toLocaleString('en-IN')}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (raw === '') {
                        setExtraAmount(0);
                      } else {
                        const val = parseInt(raw, 10);
                        setExtraAmount(isNaN(val) ? 0 : Math.max(0, val));
                      }
                    }}
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl font-mono text-sm font-semibold bg-black/40 border border-white/15 text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 text-sm font-semibold pointer-events-none">
                    ₹
                  </span>
                </div>
                {/* Quick helper chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-white/40">Quick:</span>
                  {[1000, 2500, 5000, 10000, 25000, 50000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExtraAmount(preset)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 font-mono cursor-pointer transition-colors"
                    >
                      +₹{formatIndianCompact(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Frequency Dropdown: monthly, quarterly, half yearly, annually, custom */}
              <div className="space-y-1.5">
                <label htmlFor="extra-repayment-frequency" className="text-xs font-semibold text-white/80 block">
                  Frequency
                </label>
                <select
                  id="extra-repayment-frequency"
                  value={extraFrequency}
                  onChange={(e) => setExtraFrequency(e.target.value as RepaymentFrequency)}
                  className="w-full px-3.5 py-2.5 rounded-xl font-sans text-sm font-semibold bg-black/50 border border-white/15 text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer transition-all"
                >
                  <option value="monthly" className="bg-slate-900 text-white">Monthly (Month on month)</option>
                  <option value="quarterly" className="bg-slate-900 text-white">Quarterly (Every 3 months)</option>
                  <option value="half_yearly" className="bg-slate-900 text-white">Half Yearly (Every 6 months)</option>
                  <option value="annually" className="bg-slate-900 text-white">Annually (Every 12 months)</option>
                  <option value="custom" className="bg-slate-900 text-white">Custom</option>
                </select>
              </div>

              {/* On click custom it further opens number input box, and one check box named recurring */}
              {extraFrequency === 'custom' && (
                <div className="p-3.5 rounded-xl bg-black/35 border border-white/10 space-y-3 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label htmlFor="extra-repayment-custom-month" className="text-xs font-semibold text-white/80 block">
                      Custom Month
                    </label>
                    <div className="relative">
                      <input
                        id="extra-repayment-custom-month"
                        type="number"
                        min="1"
                        max={months > 0 ? months : 360}
                        placeholder="e.g. 10"
                        value={customMonth === 0 ? '' : customMonth}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setCustomMonth(isNaN(val) ? 1 : Math.max(1, val));
                        }}
                        className="w-full pl-3.5 pr-16 py-2 rounded-lg font-mono text-sm font-semibold bg-black/40 border border-white/15 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-xs font-medium pointer-events-none">
                        Month
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50">
                      {isRecurring
                        ? `Repayment will be applied every ${customMonth} months (Month ${customMonth}, ${customMonth * 2}, ${customMonth * 3}...)`
                        : `One-time repayment will be applied only on Month ${customMonth}`}
                    </p>
                  </div>

                  {/* Checkbox named "Recurring" */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none group pt-1">
                    <input
                      id="extra-repayment-recurring-checkbox"
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 rounded border-white/30 bg-black/40 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-white/90 group-hover:text-white">
                      Recurring
                    </span>
                    <span className="text-[11px] text-white/40">
                      (Calculate on every {customMonth} month)
                    </span>
                  </label>
                </div>
              )}

              {/* Live Savings Impact Card inside Advanced when extraAmount > 0 */}
              {extraAmount > 0 && hasSavings && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs space-y-1 animate-fadeIn">
                  <div className="flex items-center justify-between font-bold text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-400" />
                      Early Payoff Impact
                    </span>
                    <span className="bg-emerald-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                      {extraImpact.monthsSaved} Months Saved!
                    </span>
                  </div>
                  <p className="text-white/80">
                    You save <strong className="text-emerald-300">{formatVal(extraImpact.interestSaved)}</strong> in interest and close loan in <strong className="text-cyan-300">{extraImpact.actualTenureMonths} months</strong>!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons: Reset & Single button with two actions */}
          <div className="space-y-2 pt-3">
            <div className="flex gap-2.5 sm:gap-3 items-stretch">
              <button
                id="loan-btn-reset"
                type="button"
                onClick={handleReset}
                className="py-3 px-3.5 sm:px-5 rounded-xl font-bold text-xs sm:text-sm text-white/80 bg-white/10 hover:bg-white/15 border border-white/10 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>

              {/* One cohesive button with two actions */}
              <div className="flex-1 flex rounded-xl shadow-lg shadow-emerald-500/25 border border-white/10 accent-pill relative select-none">
                {/* First half: Add the loan (Left side plus icon) */}
                <button
                  id="loan-btn-add-half"
                  type="button"
                  onClick={handleAddToCompareClick}
                  title="Add current loan to comparison list"
                  className="w-1/2 py-3 px-2 sm:px-3 font-extrabold text-xs sm:text-sm text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 rounded-l-xl"
                >
                  <Plus size={16} className="text-emerald-100 shrink-0" />
                  <span className="truncate">Add to Compare</span>
                </button>

                {/* Divider between the two halves */}
                <div className="w-[1px] bg-white/20 self-stretch my-2" />

                {/* Next half: Show comparison (Right side eye icon) with notification bubble */}
                <button
                  id="loan-btn-view-half"
                  type="button"
                  onClick={() => setShowCompareModal(true)}
                  title={comparedLoans.length > 0 ? `Show ${comparedLoans.length} Loans Comparison` : 'Show Comparison'}
                  className="relative w-1/2 py-3 px-2 sm:px-3 font-extrabold text-xs sm:text-sm text-white bg-black/20 hover:bg-black/35 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 rounded-r-xl"
                >
                  <Eye size={16} className="text-cyan-200 shrink-0" />
                  <span className="truncate">Compare</span>

                  {/* Notification Bubble Counter */}
                  {comparedLoans.length > 0 && (
                    <span
                      id="compare-notification-bubble"
                      className="absolute -top-2.5 -right-2 min-w-[22px] h-[22px] px-1 bg-amber-400 text-slate-950 font-black text-[11px] rounded-full flex items-center justify-center shadow-lg border-2 border-slate-950 animate-bounce z-10"
                    >
                      {comparedLoans.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Quick feedback banner when loan is added */}
            {compareToast && (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs animate-fadeIn">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Check size={14} className="text-emerald-400" />
                  <span>{compareToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCompareModal(true)}
                  className="underline font-bold text-white hover:text-emerald-200 cursor-pointer flex items-center gap-1"
                >
                  <Eye size={13} />
                  <span>Show Comparison</span>
                </button>
              </div>
            )}
          </div>

          {/* Warnings */}
          {isTenureInfinite && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex gap-2 items-start mt-2">
              <Info size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Infinite Tenure</strong>
                Monthly EMI is too low to cover interest. Increase EMI or reduce loan amount.
              </div>
            </div>
          )}
          {isEmiTooLow && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex gap-2 items-start mt-2">
              <Info size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">EMI Too Low</strong>
                Specified EMI cannot pay off the principal within {tenure} {isYears ? 'years' : 'months'}.
              </div>
            </div>
          )}
        </div>

        {/* Right / Lower: Result Table + Arc Gauge (matching screenshot) */}
        <div className="md:col-span-5 flex flex-col gap-4" id="loan-result-panel">
          <div className="glass-creative rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col justify-between transition-all duration-300">
            <div>
              {/* Result Header with "View Details" link */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                <h3 className="text-base font-extrabold text-white">Result</h3>
                <button
                  id="btn-view-details"
                  type="button"
                  onClick={handleViewDetails}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  View Details
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Clean 3-Row Result Table */}
              <div className="rounded-2xl overflow-hidden border border-white/15 divide-y divide-white/10 text-sm font-sans bg-black/25">
                {/* Row 1: Monthly EMI */}
                <div className="grid grid-cols-2 p-3.5 hover:bg-white/5 transition-colors">
                  <span className="font-medium text-white/80">Monthly EMI</span>
                  <span className="font-bold text-right font-mono text-white text-base">
                    {formatVal(emi, 2)}
                  </span>
                </div>

                {/* Row 2: Total Interest */}
                <div className="grid grid-cols-2 p-3.5 hover:bg-white/5 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-medium text-white/80">Total Interest</span>
                    {hasSavings && (
                      <span className="text-[10px] text-emerald-400 font-bold font-mono">
                        Saved {formatVal(extraImpact.interestSaved, 2)}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-right font-mono text-cyan-300 text-base">
                    {formatVal(displayTotalInterest, 2)}
                  </span>
                </div>

                {/* Row 3: Total Payment */}
                <div className="grid grid-cols-2 p-3.5 hover:bg-white/5 transition-colors bg-white/5">
                  <span className="font-bold text-white">Total Payment</span>
                  <span className="font-extrabold text-right font-mono text-emerald-400 text-base">
                    {formatVal(displayTotalPayment, 2)}
                  </span>
                </div>
              </div>

              {/* Early Payoff & Savings Banner if extra repayment active */}
              {hasSavings && (
                <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 border border-emerald-500/30 text-xs space-y-1.5 shadow-lg shadow-emerald-500/5 animate-fadeIn">
                  <div className="flex items-center justify-between font-extrabold text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-400" />
                      Early Payoff Benefit
                    </span>
                    <span className="bg-emerald-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                      {extraImpact.monthsSaved} Months Earlier
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/10 text-[11px]">
                    <div>
                      <span className="text-white/60 block">Interest Saved</span>
                      <span className="font-bold text-emerald-300 font-mono text-xs sm:text-sm">
                        {formatVal(extraImpact.interestSaved, 2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/60 block">Revised Tenure</span>
                      <span className="font-bold text-cyan-300 font-mono text-xs sm:text-sm">
                        {extraImpact.actualTenureMonths} Mos ({(extraImpact.actualTenureMonths / 12).toFixed(1)} Yrs)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Curved Half-Circle Arc Gauge (Principal vs Interest) matching the screenshot */}
              <div className="mt-6 flex flex-col items-center justify-center">
                <div className="relative w-44 h-24 flex items-end justify-center overflow-hidden">
                  <svg viewBox="0 0 200 100" className="w-full h-full">
                    {/* Background track */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />
                    {/* Principal Segment (Teal/Emerald) */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="20"
                      strokeDasharray="251.2"
                      strokeDashoffset={`${251.2 * (1 - principalRatio / 100)}`}
                      strokeLinecap="round"
                    />
                    {/* Interest Segment (Amber/Orange) */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="20"
                      strokeDasharray="251.2"
                      strokeDashoffset="0"
                      style={{
                        strokeDashoffset: `${251.2 * (principalRatio / 100)}`,
                        transformOrigin: '100px 100px'
                      }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute bottom-1 text-center font-mono">
                    <span className="text-xs font-bold text-white block">
                      {formatIndianCompact(totalPayment)}
                    </span>
                    <span className="text-[10px] text-white/50">Total Payable</span>
                  </div>
                </div>

                {/* Gauge Legend */}
                <div className="flex items-center justify-center gap-5 mt-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-white/70">Principal: {principalRatio.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-white/70">Interest: {interestRatio.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions at bottom of result card */}
            <div className="mt-5 pt-4 border-t border-white/10 flex gap-2">
              <button
                id="btn-copy-summary"
                type="button"
                onClick={handleCopySummary}
                className="flex-1 py-2.5 glass-dark rounded-xl text-white/80 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>

              <button
                id="btn-save-plan"
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="flex-1 py-2.5 accent-pill text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Save size={14} />
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Amortization Repayment Schedule (Smooth scrolled into by "View Details") */}
      <div
        ref={scheduleRef}
        className="glass-creative rounded-3xl overflow-hidden shadow-2xl border border-white/10 pt-2"
        id="amortization-table-card"
      >
        {/* Header Section */}
        <div className="px-6 py-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Calendar size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Amortization Schedule Details</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  PDF Ready
                </span>
              </div>
              <p className="text-xs text-white/60">Breakdown of principal & interest payments over time</p>
            </div>
          </div>

          {/* Share & Download Actions + Toggle & Search */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="share-schedule-pdf-btn"
              type="button"
              disabled={isGeneratingPdf || isTenureInfinite || isEmiTooLow}
              onClick={() => handleExportPDF('share')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
            >
              <Share2 size={14} className="text-emerald-400" />
              <span>Share PDF</span>
            </button>

            <button
              id="download-schedule-pdf-btn"
              type="button"
              disabled={isGeneratingPdf || isTenureInfinite || isEmiTooLow}
              onClick={() => handleExportPDF('download')}
              className="flex items-center gap-1.5 px-3.5 py-2 glass-dark hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={14} className="text-cyan-400" />
              <span>Download PDF</span>
            </button>

            {/* Yearly / Monthly Toggle */}
            <div className="flex glass-dark p-1 rounded-xl border border-white/5" id="amortization-period-toggle">
              <button
                id="schedule-view-yr"
                type="button"
                onClick={() => setScheduleView('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scheduleView === 'yearly' ? 'accent-pill text-white shadow' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Yearly
              </button>
              <button
                id="schedule-view-mo"
                type="button"
                onClick={() => setScheduleView('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                placeholder={scheduleView === 'yearly' ? 'Year...' : 'Month...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-28 pl-8 pr-3 py-1.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/80">
            <thead className="glass-dark text-[10px] text-emerald-400 uppercase tracking-wider font-extrabold border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-center">{scheduleView === 'yearly' ? 'Year' : 'Month'}</th>
                <th className="px-6 py-4">{extraAmount > 0 ? 'Total Installment' : 'EMI Installment'}</th>
                {extraAmount > 0 && <th className="px-6 py-4 text-cyan-300">Extra Prepayment</th>}
                <th className="px-6 py-4">Principal Paid</th>
                <th className="px-6 py-4">Interest Paid</th>
                <th className="px-6 py-4">Total Interest Paid</th>
                <th className="px-6 py-4 text-right">Remaining Balance (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredSchedule.length === 0 ? (
                <tr>
                  <td colSpan={extraAmount > 0 ? 7 : 6} className="text-center py-8 text-white/40 text-xs font-sans">
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
                      <td className="px-6 py-4 font-extrabold text-white text-center bg-white/5 font-sans">
                        {row.period}
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        {formatVal(row.payment, 2)}
                      </td>
                      {extraAmount > 0 && (
                        <td className="px-6 py-4 text-cyan-300 font-bold">
                          {row.extraPayment ? formatVal(row.extraPayment, 2) : '—'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-emerald-300">
                        {formatVal(row.principal, 2)}
                      </td>
                      <td className="px-6 py-4 text-cyan-300">
                        {formatVal(row.interest, 2)}
                      </td>
                      <td className="px-6 py-4 text-white/50">
                        {formatVal(row.totalInterestPaid, 2)}
                      </td>
                      <td className="px-6 py-4 text-right bg-white/5">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-white">{formatVal(row.remainingBalance, 2)}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="glass-creative rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10 animate-scaleIn">
            <h3 className="text-lg font-bold text-white mb-2">Save EMI Plan</h3>
            <p className="text-sm text-white/60 mb-4">
              Enter a name to save this loan calculation for future reference.
            </p>
            <input
              id="loan-save-name-input"
              type="text"
              placeholder="e.g. Home Loan 5 Years, SBI Car Loan"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/30 border border-white/15 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm mb-6"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                id="loan-modal-cancel"
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 glass-dark border border-white/10 rounded-xl text-white/70 hover:bg-white/5 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="loan-modal-save"
                type="button"
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="px-5 py-2 accent-pill text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 text-sm transition-all cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Loan Comparison Modal */}
      <LoanComparisonModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        loans={comparedLoans}
        onRemoveLoan={handleRemoveComparedLoan}
        onClearLoans={handleClearComparedLoans}
        currency={currency}
        onSaveCalculation={onSaveCalculation}
      />
    </div>
  );
}
