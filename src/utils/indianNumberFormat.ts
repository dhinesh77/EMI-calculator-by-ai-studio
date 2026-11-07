/**
 * Indian Numbering System Utilities
 * Formats numbers in Units, Tens, Hundreds, Thousands, Lakhs, and Crores
 */

/**
 * Formats a number according to the Indian numbering system (e.g. 12,34,567.89)
 */
export function formatIndianCurrency(
  amount: number,
  options?: {
    decimals?: number;
    showSymbol?: boolean;
  }
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return options?.showSymbol !== false ? '₹ 0' : '0';
  }

  const decimals = options?.decimals !== undefined ? options.decimals : 0;
  const showSymbol = options?.showSymbol !== false;

  const isNegative = amount < 0;
  const absVal = Math.abs(amount);

  // Format with en-IN locale
  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const prefix = isNegative ? '-' : '';
  const sym = showSymbol ? '₹ ' : '';

  return `${prefix}${sym}${formatted}`;
}

/**
 * Returns compact Indian representation (e.g. ₹ 15 Lakh, ₹ 1.25 Cr, ₹ 50 K)
 */
export function formatIndianCompact(
  amount: number,
  showSymbol: boolean = true
): string {
  if (isNaN(amount) || amount === 0) return (showSymbol ? '₹ ' : '') + '0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const sym = showSymbol ? '₹ ' : '';

  if (abs >= 10000000) {
    // 1 Crore = 1,00,00,000
    const cr = abs / 10000000;
    return `${sign}${sym}${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
  } else if (abs >= 100000) {
    // 1 Lakh = 1,00,000
    const lakh = abs / 100000;
    return `${sign}${sym}${lakh % 1 === 0 ? lakh : lakh.toFixed(2)} Lakh`;
  } else if (abs >= 1000) {
    // 1 Thousand = 1,000
    const k = abs / 1000;
    return `${sign}${sym}${k % 1 === 0 ? k : k.toFixed(1)} K`;
  }
  return `${sign}${sym}${abs.toLocaleString('en-IN')}`;
}

/**
 * Converts a number to verbal Indian words (Units, Tens, Hundreds, Thousands, Lakhs, Crores)
 * e.g., 1500000 -> "Fifteen Lakh Rupees"
 */
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToIndianWords(Math.abs(num));

  const integerPart = Math.floor(num);

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return units[n];
    const ten = Math.floor(n / 10);
    const rest = n % 10;
    return (tens[ten] + (rest !== 0 ? ' ' + units[rest] : '')).trim();
  }

  function convertThreeDigits(n: number): string {
    if (n === 0) return '';
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let str = '';
    if (hundred > 0) {
      str += units[hundred] + ' Hundred';
    }
    if (rest > 0) {
      if (str.length > 0) str += ' and ';
      str += convertTwoDigits(rest);
    }
    return str.trim();
  }

  // Indian format sections:
  // [Crores] [Lakhs] [Thousands] [Hundreds/Tens/Units]
  // 1,00,00,000
  let n = integerPart;
  const parts: string[] = [];

  const crores = Math.floor(n / 10000000);
  n %= 10000000;

  const lakhs = Math.floor(n / 100000);
  n %= 100000;

  const thousands = Math.floor(n / 1000);
  n %= 1000;

  const remainder = n;

  if (crores > 0) {
    parts.push(numberToIndianWords(crores) + ' Crore' + (crores > 1 ? 's' : ''));
  }
  if (lakhs > 0) {
    parts.push(convertTwoDigits(lakhs) + ' Lakh' + (lakhs > 1 ? 's' : ''));
  }
  if (thousands > 0) {
    parts.push(convertTwoDigits(thousands) + ' Thousand');
  }
  if (remainder > 0) {
    parts.push(convertThreeDigits(remainder));
  }

  return parts.join(' ').trim();
}

/**
 * Returns a breakdown of Indian denominations: Units, Tens, Hundreds, Thousands, Lakhs, Crores
 */
export interface IndianDenominationBreakdown {
  crores: number;
  lakhs: number;
  thousands: number;
  hundreds: number;
  tens: number;
  units: number;
  readableSummary: string;
}

export function getIndianDenominationBreakdown(value: number): IndianDenominationBreakdown {
  const v = Math.max(0, Math.floor(value));
  const crores = Math.floor(v / 10000000);
  const lakhs = Math.floor((v % 10000000) / 100000);
  const thousands = Math.floor((v % 100000) / 1000);
  const hundreds = Math.floor((v % 1000) / 100);
  const tens = Math.floor((v % 100) / 10);
  const units = v % 10;

  const summaryParts: string[] = [];
  if (crores > 0) summaryParts.push(`${crores} Cr`);
  if (lakhs > 0) summaryParts.push(`${lakhs} Lakh`);
  if (thousands > 0) summaryParts.push(`${thousands} K`);
  if (hundreds > 0 || tens > 0 || units > 0) {
    summaryParts.push(`${(hundreds * 100) + (tens * 10) + units}`);
  }

  return {
    crores,
    lakhs,
    thousands,
    hundreds,
    tens,
    units,
    readableSummary: summaryParts.length > 0 ? summaryParts.join(' ') : '0',
  };
}
