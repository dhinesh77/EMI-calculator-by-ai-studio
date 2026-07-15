import { useState, useEffect } from 'react';
import { Scale, ArrowLeftRight, Check, Copy, Save, Info, Sparkles } from 'lucide-react';
import { calculateEMI } from '../utils/financeCalculations';
import { Currency, SavedCalculation } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CompareLoansProps {
  currency: Currency;
  onSaveCalculation: (name: string, data: any) => void;
  loadedItem: SavedCalculation | null;
  onClearLoadedItem: () => void;
}

export default function CompareLoans({ currency, onSaveCalculation, loadedItem, onClearLoadedItem }: CompareLoansProps) {
  // Loan A State
  const [amountA, setAmountA] = useState<number>(50000);
  const [rateA, setRateA] = useState<number>(8.5);
  const [tenureA, setTenureA] = useState<number>(5);
  const [isTenureYearsA, setIsTenureYearsA] = useState<boolean>(true);

  // Loan B State
  const [amountB, setAmountB] = useState<number>(50000);
  const [rateB, setRateB] = useState<number>(7.9);
  const [tenureB, setTenureB] = useState<number>(6);
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

  const formatVal = (val: number) => {
    return currency.symbol + ' ' + Math.round(val).toLocaleString();
  };

  const handleCopy = () => {
    const text = `--- LOAN COMPARISON ---
LOAN A:
Principal: ${formatVal(amountA)}
Interest Rate: ${rateA}%
Tenure: ${tenureA} ${isTenureYearsA ? 'Years' : 'Months'}
Monthly EMI: ${formatVal(emiA)}
Total Interest: ${formatVal(totalInterestA)}
Total Payment: ${formatVal(totalPaymentA)}

LOAN B:
Principal: ${formatVal(amountB)}
Interest Rate: ${rateB}%
Tenure: ${tenureB} ${isTenureYearsB ? 'Years' : 'Months'}
Monthly EMI: ${formatVal(emiB)}
Total Interest: ${formatVal(totalInterestB)}
Total Payment: ${formatVal(totalPaymentB)}

DIFFERENCE:
EMI Diff: Loan B is ${emiDiff > 0 ? 'cheaper by ' + formatVal(Math.abs(emiDiff)) : 'more expensive by ' + formatVal(Math.abs(emiDiff))} monthly
Total Interest Diff: Loan B saves ${interestDiff > 0 ? formatVal(Math.abs(interestDiff)) : 'costs extra ' + formatVal(Math.abs(interestDiff))} interest
------------------------`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      name: 'Total Outflow',
      'Loan A': Math.round(totalPaymentA),
      'Loan B': Math.round(totalPaymentB),
    },
  ];

  return (
    <div className="space-y-8" id="compare-loans-main">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loan A Card */}
        <div className="glass rounded-2xl p-6 animate-fadeIn" id="compare-loan-a-card">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">A</span>
            <h3 className="font-bold text-white text-base">Loan Proposal A</h3>
          </div>

          <div className="space-y-5">
            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Principal Amount</span>
                <span className="text-white font-bold">{formatVal(amountA)}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">{currency.symbol}</span>
                <input
                  id="compare-amount-a"
                  type="number"
                  value={amountA}
                  onChange={(e) => setAmountA(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pl-8 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold"
                />
              </div>
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
                  className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold"
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
                  className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold"
                />
                <div className="flex glass-dark rounded-xl overflow-hidden p-0.5">
                  <button
                    id="compare-tenure-yr-a"
                    type="button"
                    onClick={() => {
                      if (!isTenureYearsA) {
                        setTenureA(Math.max(1, Math.round(tenureA / 12)));
                        setIsTenureYearsA(true);
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
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
                    className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                      !isTenureYearsA ? 'accent-pill text-white shadow' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    Mo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loan B Card */}
        <div className="glass rounded-2xl p-6 animate-fadeIn" id="compare-loan-b-card">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">B</span>
            <h3 className="font-bold text-white text-base">Loan Proposal B</h3>
          </div>

          <div className="space-y-5">
            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Principal Amount</span>
                <span className="text-white font-bold">{formatVal(amountB)}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">{currency.symbol}</span>
                <input
                  id="compare-amount-b"
                  type="number"
                  value={amountB}
                  onChange={(e) => setAmountB(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pl-8 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm font-semibold"
                />
              </div>
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
                  className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm font-semibold"
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
                  className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm font-semibold"
                />
                <div className="flex glass-dark rounded-xl overflow-hidden p-0.5">
                  <button
                    id="compare-tenure-yr-b"
                    type="button"
                    onClick={() => {
                      if (!isTenureYearsB) {
                        setTenureB(Math.max(1, Math.round(tenureB / 12)));
                        setIsTenureYearsB(true);
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
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
                    className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                      !isTenureYearsB ? 'accent-pill text-white shadow' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    Mo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side by side Breakdown Details */}
      <div className="glass rounded-2xl overflow-hidden" id="compare-results-matrix">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-indigo-400" />
            Comparison Matrix
          </h3>
          <span className="text-xs text-white/50 font-medium">Auto calculated side-by-side</span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center pb-4 border-b border-white/10 font-bold text-sm text-white/50">
            <div>Parameter</div>
            <div className="text-indigo-400">Loan A</div>
            <div className="text-purple-400">Loan B</div>
          </div>

          <div className="divide-y divide-white/5 text-sm">
            {/* Monthly EMI */}
            <div className="grid grid-cols-3 gap-4 py-4 text-center items-center">
              <div className="font-semibold text-white/80 text-left">Monthly EMI</div>
              <div className="text-white font-mono font-bold">{formatVal(emiA)}</div>
              <div className="text-white font-mono font-bold">{formatVal(emiB)}</div>
            </div>

            {/* Total Interest */}
            <div className="grid grid-cols-3 gap-4 py-4 text-center items-center">
              <div className="font-semibold text-white/80 text-left">Total Interest Paid</div>
              <div className="text-white/90 font-mono font-semibold">{formatVal(totalInterestA)}</div>
              <div className="text-white/90 font-mono font-semibold">{formatVal(totalInterestB)}</div>
            </div>

            {/* Total Payment */}
            <div className="grid grid-cols-3 gap-4 py-4 text-center items-center">
              <div className="font-semibold text-white/80 text-left">Total Payment Amount</div>
              <div className="text-white font-mono font-bold">{formatVal(totalPaymentA)}</div>
              <div className="text-white font-mono font-bold">{formatVal(totalPaymentB)}</div>
            </div>

            {/* Total Months */}
            <div className="grid grid-cols-3 gap-4 py-4 text-center items-center">
              <div className="font-semibold text-white/80 text-left">Total Payments</div>
              <div className="text-white/70">{monthsA} payments</div>
              <div className="text-white/70">{monthsB} payments</div>
            </div>
          </div>

          {/* Dynamic Saving Insights */}
          <div className="mt-6 glass-dark rounded-xl border border-white/5 p-4 space-y-3" id="comparison-savings-insight">
            <h4 className="text-xs font-bold text-white/50 flex items-center gap-1">
              <Sparkles size={14} className="text-indigo-400 animate-pulse" />
              FINANCIAL DECISION INSIGHTS
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Monthly Savings Insight */}
              <div className="p-3 glass-dark rounded-xl border border-white/5">
                <span className="text-white/55 block mb-1">Monthly Installment (EMI) Difference:</span>
                {emiDiff === 0 ? (
                  <span className="text-white/80 font-semibold">Both loans have the exact same EMI.</span>
                ) : emiDiff > 0 ? (
                  <p className="text-white/90 leading-relaxed">
                    <strong className="text-purple-400">Loan B</strong> is cheaper by{' '}
                    <strong className="text-purple-400 font-mono">{formatVal(Math.abs(emiDiff))}</strong> per month.
                  </p>
                ) : (
                  <p className="text-white/90 leading-relaxed">
                    <strong className="text-indigo-400">Loan A</strong> is cheaper by{' '}
                    <strong className="text-indigo-400 font-mono">{formatVal(Math.abs(emiDiff))}</strong> per month.
                  </p>
                )}
              </div>

              {/* Total Interest Savings Insight */}
              <div className="p-3 glass-dark rounded-xl border border-white/5">
                <span className="text-white/55 block mb-1">Lifetime Cost (Total Interest) Difference:</span>
                {interestDiff === 0 ? (
                  <span className="text-white/80 font-semibold">Both loans cost the same in interest.</span>
                ) : interestDiff > 0 ? (
                  <p className="text-white/90 leading-relaxed">
                    Choosing <strong className="text-purple-400">Loan B</strong> saves you{' '}
                    <strong className="text-purple-400 font-mono">{formatVal(Math.abs(interestDiff))}</strong> in total interest.
                  </p>
                ) : (
                  <p className="text-white/90 leading-relaxed">
                    Choosing <strong className="text-indigo-400">Loan A</strong> saves you{' '}
                    <strong className="text-indigo-400 font-mono">{formatVal(Math.abs(interestDiff))}</strong> in total interest.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="glass rounded-2xl p-6" id="compare-chart-card">
        <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-6">Visual Cost Breakdown</h4>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [formatVal(value), '']}
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="Loan A" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Loan B" fill="#c084fc" radius={[4, 4, 0, 0]} />
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
              <Check size={16} className="text-indigo-400" />
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
          className="px-6 py-3 accent-pill text-white font-extrabold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          <Save size={16} />
          Save Comparison
        </button>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm px-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="text-lg font-bold text-white mb-2">Save Loan Comparison</h3>
            <p className="text-sm text-white/60 mb-4">Name this side-by-side comparison (e.g. Wells Fargo vs Bank of America).</p>
            <input
              id="compare-save-name-input"
              type="text"
              placeholder="e.g. BOA Rate Lock vs Chase Bank"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/15 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm mb-6"
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
