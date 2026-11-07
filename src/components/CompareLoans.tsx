import { useState, useEffect } from 'react';
import { Scale, ArrowLeftRight, Check, Copy, Save, Info, Sparkles } from 'lucide-react';
import { calculateEMI } from '../utils/financeCalculations';
import { Currency, SavedCalculation } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatIndianCurrency, formatIndianCompact, numberToIndianWords } from '../utils/indianNumberFormat';
import { copyToClipboard } from '../utils/clipboard';

interface CompareLoansProps {
  currency: Currency;
  onSaveCalculation: (name: string, data: any) => void;
  loadedItem: SavedCalculation | null;
  onClearLoadedItem: () => void;
}

export default function CompareLoans({ currency, onSaveCalculation, loadedItem, onClearLoadedItem }: CompareLoansProps) {
  // Loan A State (Indian standard e.g. 25 Lakhs)
  const [amountA, setAmountA] = useState<number>(2500000);
  const [rateA, setRateA] = useState<number>(8.5);
  const [tenureA, setTenureA] = useState<number>(15);
  const [isTenureYearsA, setIsTenureYearsA] = useState<boolean>(true);

  // Loan B State (e.g. 25 Lakhs with lower rate or tenure)
  const [amountB, setAmountB] = useState<number>(2500000);
  const [rateB, setRateB] = useState<number>(8.1);
  const [tenureB, setTenureB] = useState<number>(20);
  const [isTenureYearsB, setIsTenureYearsB] = useState<boolean>(true);

  const [copied, setCopied] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Load from saved item
  useEffect(() => {
    if (loadedItem && loadedItem.type === 'compare' && loadedItem.data) {
      const d = loadedItem.data;
      if (d.loanA) {
        if (d.loanA.amount !== undefined) setAmountA(d.loanA.amount);
        if (d.loanA.rate !== undefined) setRateA(d.loanA.rate);
        if (d.loanA.tenure !== undefined) setTenureA(d.loanA.tenure);
        if (d.loanA.isYears !== undefined) setIsTenureYearsA(d.loanA.isYears);
      }
      if (d.loanB) {
        if (d.loanB.amount !== undefined) setAmountB(d.loanB.amount);
        if (d.loanB.rate !== undefined) setRateB(d.loanB.rate);
        if (d.loanB.tenure !== undefined) setTenureB(d.loanB.tenure);
        if (d.loanB.isYears !== undefined) setIsTenureYearsB(d.loanB.isYears);
      }
      onClearLoadedItem();
    }
  }, [loadedItem, onClearLoadedItem]);

  // Computed values
  const monthsA = isTenureYearsA ? tenureA * 12 : tenureA;
  const emiA = calculateEMI(amountA, rateA, monthsA);
  const totalPaymentA = emiA * monthsA;
  const totalInterestA = Math.max(0, totalPaymentA - amountA);

  const monthsB = isTenureYearsB ? tenureB * 12 : tenureB;
  const emiB = calculateEMI(amountB, rateB, monthsB);
  const totalPaymentB = emiB * monthsB;
  const totalInterestB = Math.max(0, totalPaymentB - amountB);

  // Comparisons
  const emiDiff = emiA - emiB;
  const interestDiff = totalInterestA - totalInterestB;
  const paymentDiff = totalPaymentA - totalPaymentB;

  const formatVal = (val: number) => formatIndianCurrency(val);

  const handleCopy = async () => {
    const text = `--- LOAN COMPARISON (INDIAN FORMAT) ---
LOAN A:
Principal: ${formatVal(amountA)} (${formatIndianCompact(amountA)})
Interest Rate: ${rateA}%
Tenure: ${tenureA} ${isTenureYearsA ? 'Years' : 'Months'}
Monthly EMI: ${formatVal(emiA)}
Total Interest: ${formatVal(totalInterestA)}
Total Payment: ${formatVal(totalPaymentA)}

LOAN B:
Principal: ${formatVal(amountB)} (${formatIndianCompact(amountB)})
Interest Rate: ${rateB}%
Tenure: ${tenureB} ${isTenureYearsB ? 'Years' : 'Months'}
Monthly EMI: ${formatVal(emiB)}
Total Interest: ${formatVal(totalInterestB)}
Total Payment: ${formatVal(totalPaymentB)}

DIFFERENCE:
EMI Diff: Loan B is ${emiDiff > 0 ? 'cheaper by ' + formatVal(Math.abs(emiDiff)) : 'more expensive by ' + formatVal(Math.abs(emiDiff))} monthly
Total Interest Diff: Loan B saves ${interestDiff > 0 ? formatVal(Math.abs(interestDiff)) : 'costs extra ' + formatVal(Math.abs(interestDiff))} interest
------------------------`;

    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    onSaveCalculation(saveName, {
      loanA: { amount: amountA, rate: rateA, tenure: tenureA, isYears: isTenureYearsA, emi: emiA, totalInterest: totalInterestA, totalPayment: totalPaymentA },
      loanB: { amount: amountB, rate: rateB, tenure: tenureB, isYears: isTenureYearsB, emi: emiB, totalInterest: totalInterestB, totalPayment: totalPaymentB },
    });
    setSaveName('');
    setShowSaveModal(false);
  };

  // Bar Chart Data
  const chartData = [
    {
      name: 'Monthly EMI',
      'Loan A': Math.round(emiA),
      'Loan B': Math.round(emiB),
    },
    {
      name: 'Total Interest',
      'Loan A': Math.round(totalInterestA),
      'Loan B': Math.round(totalInterestB),
    },
    {
      name: 'Total Payment',
      'Loan A': Math.round(totalPaymentA),
      'Loan B': Math.round(totalPaymentB),
    },
  ];

  return (
    <div className="space-y-8" id="compare-loans-main">
      {/* Side-by-side Input Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loan A Card */}
        <div className="glass-creative rounded-2xl p-6 border border-white/10" id="compare-loan-a-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">A</span>
              <h3 className="font-bold text-white text-base">Loan Proposal A</h3>
            </div>
            <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
              {formatIndianCompact(amountA)}
            </span>
          </div>

          <div className="space-y-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Principal Amount</span>
                <span className="text-emerald-400 font-bold font-mono">{formatVal(amountA)}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">₹</span>
                <input
                  id="compare-amount-a"
                  type="number"
                  value={amountA}
                  onChange={(e) => setAmountA(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pl-8 pr-3 py-2 bg-black/30 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500 text-sm font-semibold"
                />
              </div>
              <p className="text-[11px] text-white/40 italic">
                {numberToIndianWords(amountA)} Rupees
              </p>
            </div>

            {/* Interest */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Interest Rate (Annual %)</span>
                <span className="text-white font-bold">{rateA}%</span>
              </div>
              <div className="relative">
                <input
                  id="compare-rate-a"
                  type="number"
                  step="0.1"
                  value={rateA}
                  onChange={(e) => setRateA(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500 text-sm font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">%</span>
              </div>
            </div>

            {/* Tenure */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Tenure</span>
                <span className="text-white font-bold">
                  {tenureA} {isTenureYearsA ? 'Years' : 'Months'}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  id="compare-tenure-a"
                  type="number"
                  value={tenureA}
                  onChange={(e) => setTenureA(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500 text-sm font-semibold"
                />
                <div className="flex glass-dark rounded-xl overflow-hidden p-0.5 border border-white/5">
                  <button
                    id="compare-tenure-yr-a"
                    type="button"
                    onClick={() => {
                      if (!isTenureYearsA) {
                        setTenureA(Math.max(1, Math.round(tenureA / 12)));
                        setIsTenureYearsA(true);
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                      isTenureYearsA ? 'accent-pill text-white shadow' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    Yr
                  </button>
                  <button
                    id="compare-tenure-mo-a"
                    type="button"
                    onClick={() => {
                      if (isTenureYearsA) {
                        setTenureA(tenureA * 12);
                        setIsTenureYearsA(false);
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                      !isTenureYearsA ? 'accent-pill text-white shadow' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    Mo
                  </button>
                </div>
              </div>
            </div>

            {/* Result preview */}
            <div className="p-3 bg-black/30 rounded-xl border border-white/5 flex justify-between items-center text-xs">
              <span className="text-white/50 font-bold uppercase">Proposal A EMI:</span>
              <span className="font-mono font-extrabold text-emerald-400 text-sm">{formatVal(emiA)}</span>
            </div>
          </div>
        </div>

        {/* Loan B Card */}
        <div className="glass-creative rounded-2xl p-6 border border-white/10" id="compare-loan-b-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs">B</span>
              <h3 className="font-bold text-white text-base">Loan Proposal B</h3>
            </div>
            <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full font-bold">
              {formatIndianCompact(amountB)}
            </span>
          </div>

          <div className="space-y-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Principal Amount</span>
                <span className="text-cyan-400 font-bold font-mono">{formatVal(amountB)}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-bold">₹</span>
                <input
                  id="compare-amount-b"
                  type="number"
                  value={amountB}
                  onChange={(e) => setAmountB(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pl-8 pr-3 py-2 bg-black/30 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                />
              </div>
              <p className="text-[11px] text-white/40 italic">
                {numberToIndianWords(amountB)} Rupees
              </p>
            </div>

            {/* Interest */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Interest Rate (Annual %)</span>
                <span className="text-white font-bold">{rateB}%</span>
              </div>
              <div className="relative">
                <input
                  id="compare-rate-b"
                  type="number"
                  step="0.1"
                  value={rateB}
                  onChange={(e) => setRateB(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">%</span>
              </div>
            </div>

            {/* Tenure */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Tenure</span>
                <span className="text-white font-bold">
                  {tenureB} {isTenureYearsB ? 'Years' : 'Months'}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  id="compare-tenure-b"
                  type="number"
                  value={tenureB}
                  onChange={(e) => setTenureB(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 text-sm font-semibold"
                />
                <div className="flex glass-dark rounded-xl overflow-hidden p-0.5 border border-white/5">
                  <button
                    id="compare-tenure-yr-b"
                    type="button"
                    onClick={() => {
                      if (!isTenureYearsB) {
                        setTenureB(Math.max(1, Math.round(tenureB / 12)));
                        setIsTenureYearsB(true);
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                      isTenureYearsB ? 'accent-pill text-white shadow' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    Yr
                  </button>
                  <button
                    id="compare-tenure-mo-b"
                    type="button"
                    onClick={() => {
                      if (isTenureYearsB) {
                        setTenureB(tenureB * 12);
                        setIsTenureYearsB(false);
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                      !isTenureYearsB ? 'accent-pill text-white shadow' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    Mo
                  </button>
                </div>
              </div>
            </div>

            {/* Result preview */}
            <div className="p-3 bg-black/30 rounded-xl border border-white/5 flex justify-between items-center text-xs">
              <span className="text-white/50 font-bold uppercase">Proposal B EMI:</span>
              <span className="font-mono font-extrabold text-cyan-400 text-sm">{formatVal(emiB)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side by side Breakdown Details */}
      <div className="glass-creative rounded-2xl overflow-hidden border border-white/10" id="compare-results-matrix">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-emerald-400" />
            Comparison Matrix (INR)
          </h3>
          <span className="text-xs text-white/50 font-medium">Auto calculated side-by-side</span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center pb-4 border-b border-white/10 font-bold text-sm text-white/50">
            <div className="text-left">Financial Parameter</div>
            <div className="text-emerald-400">Loan A</div>
            <div className="text-cyan-400">Loan B</div>
          </div>

          <div className="divide-y divide-white/5 text-sm font-mono">
            {/* Monthly EMI */}
            <div className="grid grid-cols-3 gap-4 py-4 text-center items-center">
              <div className="font-semibold text-white/80 text-left font-sans">Monthly EMI</div>
              <div className="text-white font-bold">{formatVal(emiA)}</div>
              <div className="text-white font-bold">{formatVal(emiB)}</div>
            </div>

            {/* Total Interest */}
            <div className="grid grid-cols-3 gap-4 py-4 text-center items-center">
              <div className="font-semibold text-white/80 text-left font-sans">Total Interest Paid</div>
              <div className="text-emerald-300 font-semibold">{formatVal(totalInterestA)}</div>
              <div className="text-cyan-300 font-semibold">{formatVal(totalInterestB)}</div>
            </div>

            {/* Total Payment */}
            <div className="grid grid-cols-3 gap-4 py-4 text-center items-center">
              <div className="font-semibold text-white/80 text-left font-sans">Total Payment Amount</div>
              <div className="text-white font-bold">{formatVal(totalPaymentA)}</div>
              <div className="text-white font-bold">{formatVal(totalPaymentB)}</div>
            </div>

            {/* Total Months */}
            <div className="grid grid-cols-3 gap-4 py-4 text-center items-center font-sans">
              <div className="font-semibold text-white/80 text-left">Total Payment Tenures</div>
              <div className="text-white/70">{monthsA} payments</div>
              <div className="text-white/70">{monthsB} payments</div>
            </div>
          </div>

          {/* Dynamic Saving Insights */}
          <div className="mt-6 glass-dark rounded-xl border border-white/5 p-4 space-y-3" id="comparison-savings-insight">
            <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-400 animate-pulse" />
              FINANCIAL DECISION INSIGHTS (INDIAN CURRENCY)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Monthly Savings Insight */}
              <div className="p-3.5 glass-dark rounded-xl border border-white/5">
                <span className="text-white/55 block mb-1">Monthly Installment (EMI) Difference:</span>
                {emiDiff === 0 ? (
                  <span className="text-white/80 font-semibold">Both loans have the exact same EMI.</span>
                ) : emiDiff > 0 ? (
                  <p className="text-white/90 leading-relaxed">
                    <strong className="text-cyan-400">Loan B</strong> is cheaper by{' '}
                    <strong className="text-cyan-400 font-mono">{formatVal(Math.abs(emiDiff))}</strong> per month.
                  </p>
                ) : (
                  <p className="text-white/90 leading-relaxed">
                    <strong className="text-emerald-400">Loan A</strong> is cheaper by{' '}
                    <strong className="text-emerald-400 font-mono">{formatVal(Math.abs(emiDiff))}</strong> per month.
                  </p>
                )}
              </div>

              {/* Total Interest Savings Insight */}
              <div className="p-3.5 glass-dark rounded-xl border border-white/5">
                <span className="text-white/55 block mb-1">Lifetime Cost (Total Interest) Difference:</span>
                {interestDiff === 0 ? (
                  <span className="text-white/80 font-semibold">Both loans cost the same in interest.</span>
                ) : interestDiff > 0 ? (
                  <p className="text-white/90 leading-relaxed">
                    Choosing <strong className="text-cyan-400">Loan B</strong> saves you{' '}
                    <strong className="text-cyan-400 font-mono">{formatVal(Math.abs(interestDiff))}</strong> in total interest.
                  </p>
                ) : (
                  <p className="text-white/90 leading-relaxed">
                    Choosing <strong className="text-emerald-400">Loan A</strong> saves you{' '}
                    <strong className="text-emerald-400 font-mono">{formatVal(Math.abs(interestDiff))}</strong> in total interest.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="glass-creative rounded-2xl p-6 border border-white/10" id="compare-chart-card">
        <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-6">Visual Cost Comparison (INR)</h4>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [formatVal(value), '']}
                contentStyle={{ backgroundColor: 'rgba(3, 7, 18, 0.95)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="Loan A" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Loan B" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action panel */}
      <div className="flex gap-4 justify-end">
        <button
          id="compare-btn-copy"
          onClick={handleCopy}
          className="px-6 py-3 glass-dark border border-white/10 hover:bg-white/5 rounded-xl font-bold text-white/80 text-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={16} className="text-emerald-400" />
              Copied Comparison!
            </>
          ) : (
            <>
              <Copy size={16} />
              Copy Side-by-Side Text
            </>
          )}
        </button>

        <button
          id="compare-btn-save-trigger"
          onClick={() => setShowSaveModal(true)}
          className="px-6 py-3 accent-pill text-white font-extrabold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Save size={16} />
          Save Comparison
        </button>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="glass-creative rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10 animate-scaleIn">
            <h3 className="text-lg font-bold text-white mb-2">Save Loan Comparison</h3>
            <p className="text-sm text-white/60 mb-4">Name this side-by-side comparison (e.g. SBI vs HDFC Home Loan).</p>
            <input
              id="compare-save-name-input"
              type="text"
              placeholder="e.g. SBI 8.5% vs ICICI 8.1%"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/30 border border-white/15 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm mb-6"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                id="compare-modal-cancel"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 glass-dark border border-white/10 rounded-xl text-white/70 hover:bg-white/5 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="compare-modal-save"
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
    </div>
  );
}
