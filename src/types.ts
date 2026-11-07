export type Currency = {
  symbol: string;
  code: string;
  name: string;
};

export const INR_CURRENCY: Currency = {
  symbol: '₹',
  code: 'INR',
  name: 'Indian Rupee',
};

export const CURRENCIES: Currency[] = [
  INR_CURRENCY,
];

export interface SavedCalculation {
  id: string;
  name: string;
  type: 'loan' | 'compare' | 'sip' | 'fd' | 'rd' | 'gst';
  date: string;
  data: any;
}

export type RepaymentFrequency = 'monthly' | 'quarterly' | 'half_yearly' | 'annually' | 'custom';

export interface ExtraRepaymentConfig {
  enabled: boolean;
  amount: number;
  frequency: RepaymentFrequency;
  customMonth?: number; // e.g. 10
  isRecurring?: boolean; // if custom: true = every 10 months, false = once on month 10
}

export interface AmortizationRow {
  period: number; // Month or Year number
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  totalInterestPaid: number;
  extraPayment?: number;
}

export interface ComparedLoan {
  id: string;
  name: string;
  amount: number;
  rate: number;
  tenure: number;
  isYears: boolean;
  emi: number;
  totalInterest: number;
  totalPayment: number;
  timestamp: number;
}
