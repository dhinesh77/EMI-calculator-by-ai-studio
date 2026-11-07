import React, { useState } from 'react';
import {
  X,
  Scale,
  Trash2,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  TrendingDown,
  Info,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { ComparedLoan, Currency } from '../types';
import { formatIndianCurrency, formatIndianCompact } from '../utils/indianNumberFormat';
import { calculateEMI } from '../utils/financeCalculations';
import { copyToClipboard } from '../utils/clipboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LoanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: ComparedLoan[];
  onRemoveLoan: (id: string) => void;
  onClearLoans: () => void;
  currency: Currency;
  onSaveCalculation?: (name: string, data: any) => void;
}

export default function LoanComparisonModal({
  isOpen,
  onClose,
  loans,
  onRemoveLoan,
  onClearLoans,
  currency,
}: LoanComparisonModalProps) {
  // Start comparison state - only compares when "Compare Now" is clicked
  const [isComparing, setIsComparing] = useState(false);
  const [selectedLoanAId, setSelectedLoanAId] = useState<string>('');
  const [selectedLoanBId, setSelectedLoanBId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Fallback Loan B if user only has 1 loan added and wants to compare against an alternative
  const [customB, setCustomB] = useState<{
    amount: number;
    rate: number;
    tenure: number;
    isYears: boolean;
  }>({
    amount: 100000,
    rate: 8.0,
    tenure: 5,
    isYears: true,
  });

  // Sync selection when loans change or comparison starts
  React.useEffect(() => {
    if (loans.length >= 2) {
      if (!selectedLoanAId || !loans.find((l) => l.id === selectedLoanAId)) {
        setSelectedLoanAId(loans[0].id);
      }
      if (!selectedLoanBId || !loans.find((l) => l.id === selectedLoanBId)) {
        setSelectedLoanBId(loans[1].id);
      }
    } else if (loans.length === 1) {
      setSelectedLoanAId(loans[0].id);
      // Pre-populate customB based on loan 1 with competitive parameters
      setCustomB({
        amount: loans[0].amount,
        rate: Math.max(1, Number((loans[0].rate - 0.5).toFixed(2))),
        tenure: loans[0].tenure,
        isYears: loans[0].isYears,
      });
    }
  }, [loans, selectedLoanAId, selectedLoanBId]);

  if (!isOpen) return null;

  const formatVal = (val: number) => formatIndianCurrency(val);

  // Active comparison items
  const loanA = loans.find((l) => l.id === selectedLoanAId) || loans[0];

  let loanB: {
    name: string;
    amount: number;
    rate: number;
    tenure: number;
    isYears: boolean;
    emi: number;
    totalInterest: number;
    totalPayment: number;
  };

  if (loans.length >= 2) {
    const foundB = loans.find((l) => l.id === selectedLoanBId && l.id !== loanA?.id) || loans[1];
    loanB = foundB;
  } else if (loanA) {
    const monthsB = customB.isYears ? customB.tenure * 12 : customB.tenure;
    const emiB = calculateEMI(customB.amount, customB.rate, monthsB);
    const totalPaymentB = emiB * monthsB;
    const totalInterestB = Math.max(0, totalPaymentB - customB.amount);
    loanB = {
      name: 'Alternative Proposal B',
      amount: customB.amount,
      rate: customB.rate,
      tenure: customB.tenure,
      isYears: customB.isYears,
      emi: emiB,
      totalInterest: totalInterestB,
      totalPayment: totalPaymentB,
    };
  } else {
    loanB = {
      name: 'Proposal B',
      amount: 0,
      rate: 0,
      tenure: 0,
      isYears: true,
      emi: 0,
      totalInterest: 0,
      totalPayment: 0,
    };
  }

  // Differences
  const emiDiff = (loanA?.emi || 0) - loanB.emi;
  const interestDiff = (loanA?.totalInterest || 0) - loanB.totalInterest;
  const paymentDiff = (loanA?.totalPayment || 0) - loanB.totalPayment;

  const handleCopyComparison = async () => {
    if (!loanA) return;
    const text = `--- LOAN COMPARISON SUMMARY ---
LOAN A (${loanA.name}):
- Principal: ${formatVal(loanA.amount)}
- Interest Rate: ${loanA.rate}%
- Period: ${loanA.tenure} ${loanA.isYears ? 'Years' : 'Months'}
- Monthly EMI: ${formatVal(loanA.emi)}
- Total Interest: ${formatVal(loanA.totalInterest)}
- Total Payment: ${formatVal(loanA.totalPayment)}

LOAN B (${loanB.name}):
- Principal: ${formatVal(loanB.amount)}
- Interest Rate: ${loanB.rate}%
- Period: ${loanB.tenure} ${loanB.isYears ? 'Years' : 'Months'}
- Monthly EMI: ${formatVal(loanB.emi)}
- Total Interest: ${formatVal(loanB.totalInterest)}
- Total Payment: ${formatVal(loanB.totalPayment)}

DIFFERENCE:
- Monthly EMI: ${
      emiDiff > 0
        ? `${loanB.name} saves ${formatVal(Math.abs(emiDiff))} / month`
        : `${loanA.name} saves ${formatVal(Math.abs(emiDiff))} / month`
    }
- Total Interest: ${
      interestDiff > 0
        ? `${loanB.name} saves ${formatVal(Math.abs(interestDiff))} total interest`
        : `${loanA.name} saves ${formatVal(Math.abs(interestDiff))} total interest`
    }
--------------------------------`;

    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const chartData = loanA
    ? [
        {
          name: 'Monthly EMI',
          [loanA.name]: Math.round(loanA.emi),
          [loanB.name]: Math.round(loanB.emi),
        },
        {
          name: 'Total Interest',
          [loanA.name]: Math.round(loanA.totalInterest),
          [loanB.name]: Math.round(loanB.totalInterest),
        },
        {
          name: 'Total Payment',
          [loanA.name]: Math.round(loanA.totalPayment),
          [loanB.name]: Math.round(loanB.totalPayment),
        },
      ]
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      id="loan-comparison-modal"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col glass-creative rounded-3xl border border-white/15 shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:px-7 sm:py-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Scale size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Loan Comparison
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950 shadow">
                  {loans.length} {loans.length === 1 ? 'Loan' : 'Loans'} Added
                </span>
              </div>
              <p className="text-xs text-white/50">
                {isComparing
                  ? 'Side-by-side financial breakdown & interest savings'
                  : 'Proposals fetched and kept aside ready to compare'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isComparing && (
              <button
                type="button"
                onClick={() => setIsComparing(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>View List</span>
              </button>
            )}
            <button
              id="compare-modal-close"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* CASE 1: No loans added yet */}
          {loans.length === 0 && (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-white/40">
                <Layers size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Loans in Compare List</h3>
                <p className="text-sm text-white/50 max-w-md mx-auto">
                  Set your desired Amount, Rate, and Period in the EMI calculator, then click{' '}
                  <span className="text-emerald-400 font-semibold">"Add to Compare"</span> to save proposals aside.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl accent-pill text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all cursor-pointer"
              >
                Back to Calculator
              </button>
            </div>
          )}

          {/* CASE 2: Loans kept aside, user hasn't clicked "Compare Now" yet */}
          {loans.length > 0 && !isComparing && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/25 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Info size={15} className="text-emerald-400 shrink-0" />
                  <span>
                    The data below has been fetched and kept aside. Click{' '}
                    <strong className="text-white">Compare Now</strong> to launch the comparison.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClearLoans}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer self-end sm:self-auto"
                >
                  <Trash2 size={13} />
                  Clear All
                </button>
              </div>

              {/* Grid of loans kept aside */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loans.map((loan, idx) => (
                  <div
                    key={loan.id}
                    className="glass-dark rounded-2xl p-4 sm:p-5 border border-white/10 relative group hover:border-emerald-500/40 transition-all shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                          {idx + 1}
                        </span>
                        <h4 className="font-extrabold text-white text-sm truncate max-w-[200px]">
                          {loan.name}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveLoan(loan.id)}
                        title="Remove from compare list"
                        className="text-white/40 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 bg-black/30 rounded-xl text-center border border-white/5 text-xs mb-3">
                      <div>
                        <div className="text-white/40 text-[10px] uppercase font-semibold">Principal</div>
                        <div className="font-mono font-bold text-white text-xs mt-0.5">
                          {formatIndianCompact(loan.amount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-[10px] uppercase font-semibold">Rate</div>
                        <div className="font-mono font-bold text-emerald-400 text-xs mt-0.5">
                          {loan.rate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-[10px] uppercase font-semibold">Period</div>
                        <div className="font-mono font-bold text-white text-xs mt-0.5">
                          {loan.tenure} {loan.isYears ? 'Yr' : 'Mo'}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center px-1 text-xs">
                      <span className="text-white/60">Monthly EMI:</span>
                      <span className="font-mono font-extrabold text-white text-sm">
                        {formatVal(loan.emi)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Single Loan guidance */}
              {loans.length === 1 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs flex items-start gap-2.5">
                  <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>1 Proposal Added:</strong> You can click <strong>Compare Now</strong> to compare it
                    against an alternative competitive proposal, or close this window and change the values in the
                    calculator to add a second proposal!
                  </div>
                </div>
              )}

              {/* Bottom Actions: Add more vs Compare Now */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/15 text-white/80 hover:text-white hover:bg-white/5 text-xs font-bold transition-all cursor-pointer"
                >
                  + Add Another from Calculator
                </button>

                {/* THE "COMPARE NOW" BUTTON */}
                <button
                  id="btn-compare-now"
                  type="button"
                  onClick={() => setIsComparing(true)}
                  className="w-full sm:w-auto py-3 px-7 rounded-xl font-extrabold text-sm text-white accent-pill shadow-xl shadow-emerald-500/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Scale size={17} />
                  <span>Compare Now ({loans.length})</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* CASE 3: "Compare Now" was clicked - Full in-depth Side-by-Side Comparison */}
          {loans.length > 0 && isComparing && loanA && (
            <div className="space-y-6 animate-fadeIn">
              {/* Proposal Selectors (if > 2 loans) */}
              {loans.length > 2 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-black/30 rounded-2xl border border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white/70">Compare:</span>
                    <select
                      value={selectedLoanAId}
                      onChange={(e) => setSelectedLoanAId(e.target.value)}
                      className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-white font-semibold focus:outline-none"
                    >
                      {loans.map((l) => (
                        <option key={l.id} value={l.id} disabled={l.id === selectedLoanBId}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-white/40 font-bold uppercase">vs</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white/70">With:</span>
                    <select
                      value={selectedLoanBId}
                      onChange={(e) => setSelectedLoanBId(e.target.value)}
                      className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-white font-semibold focus:outline-none"
                    >
                      {loans.map((l) => (
                        <option key={l.id} value={l.id} disabled={l.id === selectedLoanAId}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Difference Highlight Banner */}
              <div className="glass-creative rounded-2xl p-5 border border-white/15 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-transparent">
                <div className="flex items-center gap-2.5 mb-2">
                  <Sparkles size={18} className="text-emerald-400" />
                  <h3 className="font-black text-white text-base">Comparison Analysis</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/35 border border-white/5">
                    <div className="text-white/60 mb-1">Monthly EMI Difference</div>
                    <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      {emiDiff !== 0 ? (
                        <>
                          <TrendingDown
                            size={16}
                            className={emiDiff > 0 ? 'text-cyan-400' : 'text-emerald-400'}
                          />
                          <span>
                            {emiDiff > 0 ? loanB.name : loanA.name} is cheaper by{' '}
                            <strong className="text-emerald-400 font-mono font-bold">
                              {formatVal(Math.abs(emiDiff))}
                            </strong>
                            /mo
                          </span>
                        </>
                      ) : (
                        <span>Both proposals have equal Monthly EMI</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/35 border border-white/5">
                    <div className="text-white/60 mb-1">Total Interest Difference</div>
                    <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      {interestDiff !== 0 ? (
                        <>
                          <TrendingDown
                            size={16}
                            className={interestDiff > 0 ? 'text-cyan-400' : 'text-emerald-400'}
                          />
                          <span>
                            {interestDiff > 0 ? loanB.name : loanA.name} saves{' '}
                            <strong className="text-emerald-400 font-mono font-bold">
                              {formatVal(Math.abs(interestDiff))}
                            </strong>{' '}
                            interest
                          </span>
                        </>
                      ) : (
                        <span>Both proposals accrue equal total interest</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card A */}
                <div className="glass-dark rounded-2xl p-5 border border-emerald-500/30 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                        A
                      </span>
                      <h4 className="font-extrabold text-white text-sm">{loanA.name}</h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Proposal A
                    </span>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-white/5">
                    <div className="flex justify-between py-1.5">
                      <span className="text-white/60">Principal Amount</span>
                      <span className="font-mono font-bold text-white">{formatVal(loanA.amount)}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-white/60">Interest Rate</span>
                      <span className="font-mono font-bold text-white">{loanA.rate}%</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-white/60">Period</span>
                      <span className="font-mono font-bold text-white">
                        {loanA.tenure} {loanA.isYears ? 'Years' : 'Months'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-white/80 font-semibold">Monthly EMI</span>
                      <span className="font-mono font-extrabold text-emerald-400 text-sm">
                        {formatVal(loanA.emi)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-white/60">Total Interest</span>
                      <span className="font-mono font-bold text-white">{formatVal(loanA.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 pt-2">
                      <span className="text-white font-bold">Total Payment</span>
                      <span className="font-mono font-black text-white text-sm">
                        {formatVal(loanA.totalPayment)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card B */}
                <div className="glass-dark rounded-2xl p-5 border border-cyan-500/30 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">
                        B
                      </span>
                      <h4 className="font-extrabold text-white text-sm">{loanB.name}</h4>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                      Proposal B
                    </span>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-white/5">
                    <div className="flex justify-between py-1.5">
                      <span className="text-white/60">Principal Amount</span>
                      <span className="font-mono font-bold text-white">{formatVal(loanB.amount)}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-white/60">Interest Rate</span>
                      <span className="font-mono font-bold text-white">{loanB.rate}%</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-white/60">Period</span>
                      <span className="font-mono font-bold text-white">
                        {loanB.tenure} {loanB.isYears ? 'Years' : 'Months'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-white/80 font-semibold">Monthly EMI</span>
                      <span className="font-mono font-extrabold text-cyan-400 text-sm">
                        {formatVal(loanB.emi)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-white/60">Total Interest</span>
                      <span className="font-mono font-bold text-white">{formatVal(loanB.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 pt-2">
                      <span className="text-white font-bold">Total Payment</span>
                      <span className="font-mono font-black text-white text-sm">
                        {formatVal(loanB.totalPayment)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bar Chart Visual Comparison */}
              <div className="glass-dark rounded-2xl p-5 border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  Visual Cost Comparison (₹)
                </h4>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
                      <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => formatIndianCompact(v)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: 'rgba(255,255,255,0.15)',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                        formatter={(val: number) => [formatIndianCurrency(val), '']}
                      />
                      <Legend />
                      <Bar dataKey={loanA.name} fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey={loanB.name} fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsComparing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Proposals List</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyComparison}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied Summary' : 'Copy Summary'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl accent-pill text-white text-xs font-extrabold shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
