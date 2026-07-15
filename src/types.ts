export type Currency = {
  symbol: string;
  code: string;
  name: string;
};

export const CURRENCIES: Currency[] = [
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
];

export interface SavedCalculation {
  id: string;
  name: string;
  type: 'loan' | 'compare' | 'sip' | 'fd' | 'rd' | 'gst';
  date: string;
  data: any;
}

export interface AmortizationRow {
  period: number; // Month or Year number
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  totalInterestPaid: number;
}
