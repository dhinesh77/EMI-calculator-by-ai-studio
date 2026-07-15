import { SavedCalculation } from '../types';
import { Save, Trash2, ArrowUpRight, Coins, Percent, Landmark, ArrowLeftRight, HelpCircle } from 'lucide-react';

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
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        };
      case 'compare':
        return {
          icon: <ArrowLeftRight size={14} />,
          text: 'Comparison',
          color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        };
      case 'sip':
      case 'fd':
      case 'rd':
        return {
          icon: <Coins size={14} />,
          text: type.toUpperCase() + ' Investment',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'gst':
        return {
          icon: <Percent size={14} />,
          text: 'GST Tax',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      default:
        return {
          icon: <HelpCircle size={14} />,
          text: 'Calculation',
          color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        };
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl" id="saved-calculations-section">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Save size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Saved Calculatons & Scenarios</h2>
            <p className="text-sm text-slate-400">Recall your stored simulations instantly without re-keying parameters</p>
          </div>
        </div>
        <span className="text-xs bg-slate-950 px-2.5 py-1 rounded-lg text-slate-400 border border-slate-850 font-bold">
          {savedItems.length} Stored
        </span>
      </div>

      {savedItems.length === 0 ? (
        <div className="text-center py-12 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
          <Save size={36} className="mx-auto mb-3 text-slate-600 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-300">No calculations stored yet</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            Build any calculation (e.g., Loan EMI, SIP, FD, or GST) and hit "Save Calculation" to record it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="saved-items-grid">
          {savedItems.map((item) => {
            const badge = getTypeBadge(item.type);
            return (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-850/80 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between group"
                id={`saved-item-${item.id}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${badge.color}`}>
                      {badge.icon}
                      {badge.text}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">{item.date}</span>
                  </div>

                  <h3 className="font-bold text-slate-200 text-sm mb-1 group-hover:text-slate-100 transition-colors">
                    {item.name}
                  </h3>

                  {/* Summary Preview Metrics of calculation */}
                  <div className="mt-3 py-2 px-3 bg-slate-900/50 rounded-lg border border-slate-850 text-xs text-slate-400 space-y-1">
                    {item.type === 'loan' && (
                      <>
                        <div className="flex justify-between">
                          <span>Principal:</span>
                          <span className="font-semibold text-slate-200">
                            {item.data.amount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate / Tenure:</span>
                          <span className="font-semibold text-slate-200">
                            {item.data.rate}% / {item.data.tenure} {item.data.isYears ? 'Yrs' : 'Mos'}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-850/50 pt-1 mt-1 font-semibold text-emerald-400">
                          <span>EMI:</span>
                          <span>{item.data.emi?.toLocaleString()}</span>
                        </div>
                      </>
                    )}

                    {item.type === 'compare' && (
                      <>
                        <div className="flex justify-between">
                          <span>Loan A Principal:</span>
                          <span className="font-semibold text-slate-200">
                            {item.data.loanA?.amount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Loan B Principal:</span>
                          <span className="font-semibold text-slate-200">
                            {item.data.loanB?.amount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-850/50 pt-1 mt-1 font-semibold text-indigo-400">
                          <span>Rates A vs B:</span>
                          <span>
                            {item.data.loanA?.rate}% vs {item.data.loanB?.rate}%
                          </span>
                        </div>
                      </>
                    )}

                    {(item.type === 'sip' || item.type === 'fd' || item.type === 'rd') && (
                      <>
                        <div className="flex justify-between">
                          <span>Contrib Amount:</span>
                          <span className="font-semibold text-slate-200">
                            {(item.data.sipMonthly || item.data.fdPrincipal || item.data.rdMonthly)?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration / Return:</span>
                          <span className="font-semibold text-slate-200">
                            {item.data.sipYears || item.data.fdYears || item.data.rdYears} Yrs / {item.data.sipRate || item.data.fdRate || item.data.rdRate}%
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-850/50 pt-1 mt-1 font-semibold text-emerald-400">
                          <span>Maturity Value:</span>
                          <span>
                            {(item.data.result?.totalValue || item.data.result?.maturityValue)?.toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}

                    {item.type === 'gst' && (
                      <>
                        <div className="flex justify-between">
                          <span>Base Amount:</span>
                          <span className="font-semibold text-slate-200">
                            {item.data.amount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax Rate:</span>
                          <span className="font-semibold text-slate-200">
                            {item.data.gstRate}%
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-850/50 pt-1 mt-1 font-semibold text-amber-400">
                          <span>Gross Price:</span>
                          <span>{item.data.result?.finalAmount?.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Card footer buttons */}
                <div className="mt-4 pt-3 border-t border-slate-850/40 flex items-center justify-between gap-2">
                  <button
                    id={`btn-del-${item.id}`}
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 bg-slate-900 hover:bg-rose-500/10 rounded-lg border border-slate-850 hover:border-rose-500/20 transition-all text-xs flex items-center justify-center"
                    title="Delete saved calculation"
                  >
                    <Trash2 size={14} />
                  </button>

                  <button
                    id={`btn-load-${item.id}`}
                    onClick={() => onLoadItem(item)}
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-indigo-500 hover:text-slate-950 text-indigo-400 border border-slate-850 hover:border-indigo-500 font-bold rounded-lg transition-all text-xs flex items-center justify-center gap-1"
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
