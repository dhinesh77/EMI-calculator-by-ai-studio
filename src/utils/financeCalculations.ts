import { AmortizationRow } from '../types';

/**
 * Calculates the monthly Equal Monthly Installment (EMI)
 */
export function calculateEMI(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  if (annualRate === 0) return principal / months;

  const r = annualRate / 12 / 100; // Monthly interest rate
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Number(emi.toFixed(2));
}

/**
 * Generates an amortization schedule (monthly details)
 */
export function generateMonthlyAmortizationSchedule(
  principal: number,
  annualRate: number,
  months: number
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  if (principal <= 0 || months <= 0) return schedule;

  const emi = calculateEMI(principal, annualRate, months);
  const r = annualRate / 12 / 100;
  let remainingBalance = principal;
  let totalInterestPaid = 0;

  for (let i = 1; i <= months; i++) {
    const interest = remainingBalance * r;
    const principalPaid = emi - interest;
    remainingBalance = Math.max(0, remainingBalance - principalPaid);
    totalInterestPaid += interest;

    schedule.push({
      period: i,
      payment: emi,
      principal: Number(principalPaid.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      remainingBalance: Number(remainingBalance.toFixed(2)),
      totalInterestPaid: Number(totalInterestPaid.toFixed(2)),
    });
  }

  return schedule;
}

/**
 * Generates a yearly amortization schedule (aggregated)
 */
export function generateYearlyAmortizationSchedule(
  principal: number,
  annualRate: number,
  months: number
): AmortizationRow[] {
  const monthly = generateMonthlyAmortizationSchedule(principal, annualRate, months);
  const yearly: AmortizationRow[] = [];
  
  let yearNum = 1;
  let yearlyPayment = 0;
  let yearlyPrincipal = 0;
  let yearlyInterest = 0;
  let lastBalance = principal;

  for (let i = 0; i < monthly.length; i++) {
    const row = monthly[i];
    yearlyPayment += row.payment;
    yearlyPrincipal += row.principal;
    yearlyInterest += row.interest;
    lastBalance = row.remainingBalance;

    if ((i + 1) % 12 === 0 || i === monthly.length - 1) {
      yearly.push({
        period: yearNum,
        payment: Number(yearlyPayment.toFixed(2)),
        principal: Number(yearlyPrincipal.toFixed(2)),
        interest: Number(yearlyInterest.toFixed(2)),
        remainingBalance: Number(lastBalance.toFixed(2)),
        totalInterestPaid: Number(monthly[i].totalInterestPaid.toFixed(2)),
      });
      yearNum++;
      yearlyPayment = 0;
      yearlyPrincipal = 0;
      yearlyInterest = 0;
    }
  }

  return yearly;
}

/**
 * Calculates Systematic Investment Plan (SIP) returns
 */
export function calculateSIP(monthlyInvestment: number, annualRate: number, years: number) {
  const months = years * 12;
  const i = annualRate / 12 / 100; // Periodic rate
  
  if (monthlyInvestment <= 0 || years <= 0) {
    return { investedAmount: 0, estReturns: 0, totalValue: 0, yearlyProgress: [] };
  }

  let totalValue = 0;
  const yearlyProgress: { year: number; invested: number; returns: number; total: number }[] = [];
  
  if (i === 0) {
    totalValue = monthlyInvestment * months;
  } else {
    // Formula for SIP (Annuity Due): P * [((1 + i)^n - 1) / i] * (1 + i)
    totalValue = monthlyInvestment * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
  }

  const investedAmount = monthlyInvestment * months;
  const estReturns = Math.max(0, totalValue - investedAmount);

  // Generate Year-by-Year progress for chart
  for (let y = 1; y <= years; y++) {
    const yMonths = y * 12;
    let yTotal = 0;
    if (i === 0) {
      yTotal = monthlyInvestment * yMonths;
    } else {
      yTotal = monthlyInvestment * ((Math.pow(1 + i, yMonths) - 1) / i) * (1 + i);
    }
    const yInvested = monthlyInvestment * yMonths;
    yearlyProgress.push({
      year: y,
      invested: Math.round(yInvested),
      returns: Math.round(Math.max(0, yTotal - yInvested)),
      total: Math.round(yTotal),
    });
  }

  return {
    investedAmount: Math.round(investedAmount),
    estReturns: Math.round(estReturns),
    totalValue: Math.round(totalValue),
    yearlyProgress,
  };
}

/**
 * Calculates Fixed Deposit (FD) returns
 * compounding: 12 (Monthly), 4 (Quarterly), 2 (Half-Yearly), 1 (Yearly)
 */
export function calculateFD(principal: number, annualRate: number, years: number, compoundingFrequency = 4) {
  if (principal <= 0 || years <= 0) {
    return { investedAmount: 0, estInterest: 0, maturityValue: 0, yearlyProgress: [] };
  }

  const r = annualRate / 100;
  const n = compoundingFrequency;
  const t = years;

  // A = P * (1 + r/n)^(n*t)
  const maturityValue = principal * Math.pow(1 + r / n, n * t);
  const estInterest = maturityValue - principal;

  const yearlyProgress: { year: number; invested: number; interest: number; total: number }[] = [];
  for (let y = 1; y <= years; y++) {
    const yValue = principal * Math.pow(1 + r / n, n * y);
    yearlyProgress.push({
      year: y,
      invested: principal,
      interest: Math.round(yValue - principal),
      total: Math.round(yValue),
    });
  }

  return {
    investedAmount: Math.round(principal),
    estInterest: Math.round(estInterest),
    maturityValue: Math.round(maturityValue),
    yearlyProgress,
  };
}

/**
 * Calculates Recurring Deposit (RD) returns compounded quarterly (standard Indian bank method)
 * or compounded monthly
 */
export function calculateRD(monthlyDeposit: number, annualRate: number, years: number) {
  const months = years * 12;
  if (monthlyDeposit <= 0 || years <= 0) {
    return { investedAmount: 0, estInterest: 0, maturityValue: 0, yearlyProgress: [] };
  }

  const r = annualRate / 100;
  let maturityValue = 0;

  // Accurate formula using monthly compounding: Sum over j = 1 to months of P * (1 + r/12)^j
  const monthlyRate = r / 12;
  for (let j = 1; j <= months; j++) {
    maturityValue += monthlyDeposit * Math.pow(1 + monthlyRate, j);
  }

  const investedAmount = monthlyDeposit * months;
  const estInterest = maturityValue - investedAmount;

  const yearlyProgress: { year: number; invested: number; interest: number; total: number }[] = [];
  for (let y = 1; y <= years; y++) {
    const yMonths = y * 12;
    let yValue = 0;
    for (let j = 1; j <= yMonths; j++) {
      yValue += monthlyDeposit * Math.pow(1 + monthlyRate, j);
    }
    yearlyProgress.push({
      year: y,
      invested: monthlyDeposit * yMonths,
      interest: Math.round(Math.max(0, yValue - (monthlyDeposit * yMonths))),
      total: Math.round(yValue),
    });
  }

  return {
    investedAmount: Math.round(investedAmount),
    estInterest: Math.round(estInterest),
    maturityValue: Math.round(maturityValue),
    yearlyProgress,
  };
}

/**
 * Calculates GST (Goods & Services Tax)
 */
export function calculateGST(amount: number, rate: number, isInclusive: boolean) {
  if (amount <= 0 || rate < 0) {
    return { originalAmount: amount, gstAmount: 0, finalAmount: amount, cgst: 0, sgst: 0 };
  }

  let gstAmount = 0;
  let originalAmount = amount;
  let finalAmount = amount;

  if (isInclusive) {
    // Amount already includes GST: GST = Amount - [Amount * (100 / (100 + rate))]
    originalAmount = amount * (100 / (100 + rate));
    gstAmount = amount - originalAmount;
    finalAmount = amount;
  } else {
    // Amount is exclusive of GST: GST = Amount * (rate / 100)
    originalAmount = amount;
    gstAmount = amount * (rate / 100);
    finalAmount = amount + gstAmount;
  }

  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  return {
    originalAmount: Number(originalAmount.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    finalAmount: Number(finalAmount.toFixed(2)),
    cgst: Number(cgst.toFixed(2)),
    sgst: Number(sgst.toFixed(2)),
  };
}

/**
 * Calculates the Loan Principal (Amount) given EMI, Rate, and Months
 */
export function calculatePrincipal(emi: number, annualRate: number, months: number): number {
  if (emi <= 0 || months <= 0) return 0;
  if (annualRate <= 0) return emi * months;

  const r = annualRate / 12 / 100;
  const principal = (emi * (Math.pow(1 + r, months) - 1)) / (r * Math.pow(1 + r, months));
  return Number(principal.toFixed(2));
}

/**
 * Calculates the Loan Tenure in months given Principal, EMI, and Rate
 */
export function calculateTenure(principal: number, emi: number, annualRate: number): number {
  if (principal <= 0 || emi <= 0) return 0;
  if (annualRate <= 0) return principal / emi;

  const r = annualRate / 12 / 100;
  // If EMI is less than or equal to the monthly interest accrued, the loan can never be paid off
  if (emi <= principal * r) {
    return Infinity;
  }

  const months = Math.log(emi / (emi - principal * r)) / Math.log(1 + r);
  return Number(months.toFixed(2));
}

/**
 * Calculates the Loan Annual Interest Rate (%) given Principal, EMI, and Months
 */
export function calculateInterestRate(principal: number, emi: number, months: number): number {
  if (principal <= 0 || emi <= 0 || months <= 0) return 0;
  if (emi < principal / months) return 0; // Impossible with positive interest rate
  if (emi === principal / months) return 0;

  let low = 0; // 0% per month
  let high = 100; // 100% per month (1200% p.a.)
  const tolerance = 0.00001;
  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const r = mid / 100; // monthly decimal rate
    const calcEmi = r <= 0 ? (principal / months) : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    
    if (Math.abs(calcEmi - emi) < tolerance) {
      return Number((mid * 12).toFixed(4));
    }
    
    if (calcEmi > emi) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return Number(((low + high) / 2 * 12).toFixed(4));
}

