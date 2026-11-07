import { SavedCalculation } from '../types';
import { Save, Trash2, ArrowUpRight, Coins, Percent, Landmark, ArrowLeftRight, HelpCircle } from 'lucide-react';
import { formatIndianCurrency, formatIndianCompact } from '../utils/indianNumberFormat';

interface SavedCalculationsProps {
  savedItems: SavedCalculation[];
  onLoadItem: (item: SavedCalculation) => void;
  onDeleteItem: (id: string) => void;
}

export default function SavedCalculations({ savedItems, onLoadItem, onDeleteItem }: SavedCalculationsProps) {
  // Map types to icons & colors
  const getTypeBadge = (type: SavedCalculation['type']) => {
    switch (type) {
      case 'loan':
        return {
          icon: <Landmark size={14} />,
          text: 'Loan EMI',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'compare':
        return {
          icon: <ArrowLeftRight size={14} />,
          text: 'Loan Comparison',
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        };
      case 'sip':
      case 'fd':
      case 'rd':
        return {
          icon: <Coins size={14} />,
          text: type.toUpperCase() + ' Investment',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'gst':
        return {
          icon: <Percent size={14} />,
          text: 'GST Tax',
          color: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        };
      default:
        return {
          icon: <HelpCircle size={14} />,
          text: 'Calculation',
          color: 'bg-white/10 text-white/70 border-white/20',
        };
    }
  };

  return (
    <div className="glass-creative rounded-2xl border border-white/10 p-6 shadow-xl" id="saved-calculations-section">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Save size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Saved Calculations & Scenarios</h2>
            <p className="text-xs text-white/60">Recall your stored simulations instantly without re-keying parameters</p>
          </div>
        </div>
        <span className="text-xs bg-black/40 px-3 py-1 rounded-lg text-emerald-400 border border-emerald-500/30 font-bold font-mono">
          {savedItems.length} Stored
        </span>
      </div>

      {savedItems.length === 0 ? (
        <div className="text-center py-12 bg-black/20 border border-dashed border-white/15 rounded-2xl">
          <Save size={36} className="mx-auto mb-3 text-white/30 animate-pulse" />
          <h3 className="text-sm font-bold text-white/80">No calculations stored yet</h3>
          <p className="text-xs text-white/50 max-w-xs mx-auto mt-1">
            Build any calculation (Loan EMI, Loan Comparison, SIP, FD, or GST) and tap "Save Calculation" to record it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="saved-items-grid">
          {savedItems.map((item) => {
            const badge = getTypeBadge(item.type);
            return (
              <div
                key={item.id}
                className="glass-dark border border-white/10 rounded-xl p-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                id={`saved-item-${item.id}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.color}`}>
                      {badge.icon}
                      {badge.text}
                    </span>
                    <span className="text-[10px] text-white/40 font-medium font-mono">{item.date}</span>
                  </div>

                  <h3 className="font-bold text-white text-sm mb-1 group-hover:text-emerald-300 transition-colors">
                    {item.name}
                  </h3>

                  {/* Summary Preview Metrics of calculation in Indian format */}
                  <div className="mt-3 py-2 px-3 bg-black/30 rounded-lg border border-white/5 text-xs text-white/60 space-y-1 font-mono">
                    {item.type === 'loan' && (
                      <>
                        <div className="flex justify-between">
                          <span>Principal:</span>
                          <span className="font-semibold text-white">
                            {formatIndianCurrency(item.data.amount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate / Tenure:</span>
                          <span className="font-semibold text-white">
                            {item.data.rate}% / {item.data.tenure} {item.data.isYears ? 'Yrs' : 'Mos'}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-1 mt-1 font-semibold text-emerald-400">
                          <span>Monthly EMI:</span>
                          <span>{formatIndianCurrency(item.data.emi || 0)}</span>
                        </div>
                      </>
                    )}

                    {item.type === 'compare' && (
                      <>
                        <div className="flex justify-between">
                          <span>Loan A:</span>
                          <span className="font-semibold text-white">
                            {formatIndianCompact(item.data.loanA?.amount || 0)} @ {item.data.loanA?.rate}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Loan B:</span>
                          <span className="font-semibold text-white">
                            {formatIndianCompact(item.data.loanB?.amount || 0)} @ {item.data.loanB?.rate}%
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-1 mt-1 font-semibold text-cyan-400">
                          <span>EMI Diff:</span>
                          <span>
                            {item.data.diffEMI !== undefined ? formatIndianCurrency(item.data.diffEMI) : '-'}
                          </span>
                        </div>
                      </>
                    )}

                    {(item.type === 'sip' || item.type === 'fd' || item.type === 'rd') && (
                      <>
                        <div className="flex justify-between">
                          <span>Deposit:</span>
                          <span className="font-semibold text-white">
                            {formatIndianCurrency(item.data.sipMonthly || item.data.fdPrincipal || item.data.rdMonthly || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Horizon / Rate:</span>
                          <span className="font-semibold text-white">
                            {item.data.sipYears || item.data.fdYears || item.data.rdYears} Yrs @ {item.data.sipRate || item.data.fdRate || item.data.rdRate}%
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-1 mt-1 font-semibold text-emerald-400">
                          <span>Total Maturity:</span>
                          <span>
                            {formatIndianCurrency(item.data.result?.totalValue || item.data.result?.maturityValue || 0)}
                          </span>
                        </div>
                      </>
                    )}

                    {item.type === 'gst' && (
                      <>
                        <div className="flex justify-between">
                          <span>Base Amount:</span>
                          <span className="font-semibold text-white">
                            {formatIndianCurrency(item.data.amount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST Slab:</span>
                          <span className="font-semibold text-white">
                            {item.data.gstRate}%
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-1 mt-1 font-semibold text-emerald-400">
                          <span>Gross Total:</span>
                          <span>{formatIndianCurrency(item.data.result?.finalAmount || 0)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Card footer buttons */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    id={`btn-del-${item.id}`}
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 text-white/40 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg border border-white/5 hover:border-rose-500/20 transition-all text-xs flex items-center justify-center cursor-pointer"
                    title="Delete saved calculation"
                  >
                    <Trash2 size={14} />
                  </button>

                  <button
                    id={`btn-load-${item.id}`}
                    onClick={() => onLoadItem(item)}
                    className="flex-1 py-1.5 bg-white/5 hover:accent-pill text-emerald-400 hover:text-white border border-white/10 hover:border-transparent font-bold rounded-lg transition-all text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Load Calculation
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
