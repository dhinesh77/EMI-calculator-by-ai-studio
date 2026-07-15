import { useState, useEffect } from 'react';
import { Percent, Info, Copy, Check, Save } from 'lucide-react';
import { calculateGST } from '../utils/financeCalculations';
import { Currency, SavedCalculation } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface GstCalculatorProps {
  currency: Currency;
  onSaveCalculation: (name: string, data: any) => void;
  loadedItem: SavedCalculation | null;
  onClearLoadedItem: () => void;
}

export default function GstCalculator({ currency, onSaveCalculation, loadedItem, onClearLoadedItem }: GstCalculatorProps) {
  const [amount, setAmount] = useState<number>(10000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [isInclusive, setIsInclusive] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Load from saved item
  useEffect(() => {
    if (loadedItem && loadedItem.type === 'gst' && loadedItem.data) {
      const d = loadedItem.data;
      if (d.amount !== undefined) setAmount(d.amount);
      if (d.gstRate !== undefined) setGstRate(d.gstRate);
      if (d.isInclusive !== undefined) setIsInclusive(d.isInclusive);
      onClearLoadedItem();
    }
  }, [loadedItem, onClearLoadedItem]);

  const result = calculateGST(amount, gstRate, isInclusive);

  // Formats currency nicely
  const formatVal = (val: number) => {
    return currency.symbol + ' ' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCopy = () => {
    const text = `--- GST Calculation ---
Initial Amount: ${formatVal(amount)}
GST Rate: ${gstRate}% (${isInclusive ? 'Inclusive' : 'Exclusive'})
------------------------
Pre-Tax Net Amount: ${formatVal(result.originalAmount)}
GST Tax Amount: ${formatVal(result.gstAmount)}
  - CGST (50%): ${formatVal(result.cgst)}
  - SGST (50%): ${formatVal(result.sgst)}
Total Gross Amount: ${formatVal(result.finalAmount)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    onSaveCalculation(saveName, {
      amount,
      gstRate,
      isInclusive,
      result,
    });
    setSaveName('');
    setShowSaveModal(false);
  };

  // Pie chart data (using theme colors purple and indigo)
  const chartData = [
    { name: 'Net Price (Pre-Tax)', value: result.originalAmount, color: '#c084fc' },
    { name: 'GST Tax', value: result.gstAmount, color: '#818cf8' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="gst-calculator-main">
      {/* Input panel */}
      <div className="lg:col-span-7 glass rounded-2xl p-6 flex flex-col justify-between" id="gst-inputs-card">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Percent size={18} className="text-indigo-400" />
              GST Calculator
            </h3>
            <button
              id="gst-btn-inclusive-toggle"
              onClick={() => setIsInclusive(!isInclusive)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                isInclusive
                  ? 'accent-pill text-white shadow shadow-indigo-500/10'
                  : 'glass-dark text-white/50 border border-white/5 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isInclusive ? 'Tax Inclusive' : 'Tax Exclusive'}
            </button>
          </div>

          <div className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-white/80">Base Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold">{currency.symbol}</span>
                  <input
                    id="gst-amount-input"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-36 pl-8 pr-3 py-1 bg-black/20 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 text-right text-sm"
                  />
                </div>
              </div>
              <input
                id="gst-amount-slider"
                type="range"
                min="100"
                max="1000000"
                step="500"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-white/40">
                <span>{currency.symbol}100</span>
                <span>{currency.symbol}1,000,000</span>
              </div>
            </div>

            {/* GST Rate Preset Buttons */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/80">GST Rate (%)</label>
              <div className="grid grid-cols-5 gap-2">
                {[5, 12, 18, 28].map((rate) => (
                  <button
                    id={`gst-preset-${rate}`}
                    key={rate}
                    onClick={() => setGstRate(rate)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      gstRate === rate
                        ? 'accent-pill text-white shadow-lg shadow-indigo-500/20'
                        : 'glass-dark text-white/50 border border-white/5 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
                <div className="relative">
                  <input
                    id="gst-custom-rate-input"
                    type="number"
                    placeholder="Custom"
                    value={gstRate}
                    onChange={(e) => setGstRate(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                    className="w-full py-2 bg-black/20 border border-white/10 rounded-xl text-center text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/40">%</span>
                </div>
              </div>
            </div>

            {/* Slider for GST rate */}
            <div className="pt-2">
              <input
                id="gst-rate-slider"
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={gstRate}
                onChange={(e) => setGstRate(parseFloat(e.target.value))}
                className="w-full accent-indigo-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-white/40 mt-1">
                <span>0%</span>
                <span>50%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3 border-t border-white/10 pt-4">
          <button
            id="gst-btn-copy"
            onClick={handleCopy}
            className="flex-1 py-2.5 glass-dark border border-white/5 rounded-xl text-white/80 font-semibold hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={16} className="text-indigo-400 animate-scaleIn" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Summary
              </>
            )}
          </button>

          <button
            id="gst-btn-save-trigger"
            onClick={() => setShowSaveModal(true)}
            className="flex-1 py-2.5 accent-pill text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Save size={16} />
            Save Calculation
          </button>
        </div>
      </div>

      {/* Results panel */}
      <div className="lg:col-span-5 flex flex-col gap-6" id="gst-results-panel">
        <div className="glass rounded-2xl p-6 shadow-xl" id="gst-summary-card">
          <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Calculation Summary</h4>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-white/50">Pre-Tax Amount (Net)</span>
              <span className="font-semibold text-white">{formatVal(result.originalAmount)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-white/50 flex items-center gap-1.5">
                GST Tax Amount
                <span className="text-[10px] bg-white/15 text-white px-1.5 py-0.5 rounded font-bold">
                  {gstRate}%
                </span>
              </span>
              <span className="font-semibold text-indigo-400">{formatVal(result.gstAmount)}</span>
            </div>

            {/* Split */}
            <div className="pl-4 border-l-2 border-white/10 py-1 space-y-1.5 text-xs text-white/50">
              <div className="flex justify-between">
                <span>Central GST (CGST - 50%)</span>
                <span>{formatVal(result.cgst)}</span>
              </div>
              <div className="flex justify-between">
                <span>State GST (SGST - 50%)</span>
                <span>{formatVal(result.sgst)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-3 accent-pill rounded-xl px-4 mt-4 shadow-md shadow-indigo-500/20 border-t border-white/10">
              <span className="text-sm font-bold text-white/80">Gross Price (Total)</span>
              <span className="text-xl font-black text-white">{formatVal(result.finalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Mini Doughnut Chart */}
        <div className="glass rounded-2xl p-6 flex flex-col justify-center items-center h-52 shadow-xl">
          {result.gstAmount > 0 ? (
            <div className="w-full h-full flex flex-row items-center justify-between">
              <div className="w-[120px] h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={50}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatVal(value), '']}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 pl-4 space-y-2 text-xs">
                {chartData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-white/50">{entry.name}:</span>
                    <span className="font-bold text-white">
                      {((entry.value / result.finalAmount) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-white/40 text-xs">
              <Info size={24} className="mx-auto mb-2 text-white/30" />
              Increase tax rate to view chart distribution
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm px-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn">
            <h3 className="text-lg font-bold text-white mb-2">Save GST Calculation</h3>
            <p className="text-sm text-white/60 mb-4">Give your calculation a clear name to reload it later from Saved Calculations.</p>
            <input
              id="gst-save-name-input"
              type="text"
              placeholder="e.g. Macbook Pro GST, Office Stationery"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/15 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm mb-6"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                id="gst-modal-cancel"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 glass-dark border border-white/10 rounded-xl text-white/70 hover:bg-white/5 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="gst-modal-save"
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
