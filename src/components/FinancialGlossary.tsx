import { useState } from 'react';
import { BookOpen, Search, HelpCircle, ChevronDown, ChevronUp, Landmark, LineChart, ShieldAlert } from 'lucide-react';

interface GlossaryItem {
  term: string;
  category: string;
  definition: string;
  formula?: string;
  example: string;
}

const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: 'EMI (Equated Monthly Installment)',
    category: 'Loan',
    definition: 'A fixed monthly payment made by a borrower to a lender. It consists of both principal and interest components designed to pay off the loan in full over a specified tenure.',
    formula: 'EMI = [P x r x (1+r)^n] / [(1+r)^n - 1]',
    example: 'A $10,000 loan at 8% annual interest for 3 years (36 months) results in an EMI of $313.36 per month.'
  },
  {
    term: 'Amortization',
    category: 'Loan',
    definition: 'The visual process of reducing the loan balance over time by making regular payments of both principal and interest. Early payments mostly cover interest, while later payments pay off the principal.',
    example: 'An amortization table shows exactly how much of your $313 EMI goes to principal vs interest each month.'
  },
  {
    term: 'Reducing Balance Interest Rate',
    category: 'Loan',
    definition: 'An interest calculation method where the interest is charged only on the outstanding loan balance. As you pay off the principal, the interest amount decreases.',
    example: 'In month 1, interest is 8% of $10,000. In month 12, interest is 8% of the remaining $7,000 balance.'
  },
  {
    term: 'Flat Interest Rate',
    category: 'Loan',
    definition: 'A method where interest is calculated on the original loan amount throughout the entire tenure, regardless of how much principal has been repaid. This is significantly more expensive than a reducing rate.',
    example: 'A 10% flat rate on a 5-year loan of $10,000 means you pay $1,000 interest every year ($5,000 total), regardless of repayments.'
  },
  {
    term: 'SIP (Systematic Investment Plan)',
    category: 'Investment',
    definition: 'An investment strategy where you invest a fixed amount of money regularly (typically monthly) into mutual funds or other assets, benefiting from compounding and rupee-cost averaging.',
    formula: 'FV = P x [((1 + i)^n - 1) / i] x (1 + i)',
    example: 'Investing $100 monthly at 12% annual return for 10 years accumulates $23,004 (Invested: $12,000, Gain: $11,004).'
  },
  {
    term: 'Compound Interest',
    category: 'Investment',
    definition: 'Interest calculated on the initial principal as well as the accumulated interest from previous periods. It is essentially "interest on interest" which accelerates wealth growth.',
    formula: 'A = P x (1 + r/n)^(n*t)',
    example: 'A $1,000 Fixed Deposit at 6% compounded quarterly grows faster than standard simple interest.'
  },
  {
    term: 'GST (Goods and Services Tax)',
    category: 'Tax',
    definition: 'An indirect tax applied to the manufacture, sale, and consumption of goods and services. Calculations usually add GST to net prices or extract GST from gross prices.',
    example: 'Extracting 18% GST from a $118 item yields a pre-tax amount of $100 and $18 tax.'
  },
  {
    term: 'Rupee Cost Averaging',
    category: 'Investment',
    definition: 'The mechanism of investing a fixed sum at regular intervals. When prices are low, you buy more units; when prices are high, you buy fewer units, lowering the average cost per unit over time.',
    example: 'In a volatile market, an SIP automated monthly purchase ensures you never time the market incorrectly.'
  }
];

export default function FinancialGlossary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const categories = ['All', 'Loan', 'Investment', 'Tax'];

  const filteredItems = GLOSSARY_ITEMS.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl" id="glossary-section">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
          <BookOpen size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Financial Smart Guide</h2>
          <p className="text-sm text-slate-400">Master financial terminology, formulas, and calculations</p>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="glossary-search"
            type="text"
            placeholder="Search financial terms (e.g. EMI, Compound)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              id={`cat-${cat.toLowerCase()}`}
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/15'
                  : 'bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-850'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <HelpCircle size={32} className="mx-auto mb-2 text-slate-600 animate-pulse" />
            <p className="text-sm">No matching terms found. Try another search query.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedItem === item.term;
            return (
              <div
                key={item.term}
                className="bg-slate-950/50 hover:bg-slate-950/80 rounded-xl border border-slate-800/60 overflow-hidden transition-colors"
                id={`glossary-item-${item.term.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <button
                  id={`btn-expand-${item.term.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setExpandedItem(isExpanded ? null : item.term)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                        item.category === 'Loan'
                          ? 'bg-blue-500/10 text-blue-400'
                          : item.category === 'Investment'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {item.category}
                    </span>
                    <h3 className="font-semibold text-slate-200 text-sm md:text-base">{item.term}</h3>
                  </div>
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-850 pt-3 text-sm text-slate-300 space-y-3 animate-fadeIn">
                    <p className="leading-relaxed text-slate-300">{item.definition}</p>
                    
                    {item.formula && (
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                        <span className="text-[10px] text-emerald-400 font-mono block mb-1">MATHEMATICAL FORMULA</span>
                        <code className="text-emerald-300 font-mono text-xs md:text-sm break-all">{item.formula}</code>
                      </div>
                    )}

                    <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-850/60">
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">PRACTICAL EXAMPLE</span>
                      <p className="text-slate-300 italic text-xs leading-relaxed">{item.example}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
