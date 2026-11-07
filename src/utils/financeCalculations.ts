import { AmortizationRow, ExtraRepaymentConfig } from '../types';

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
 * Checks whether an extra prepayment is scheduled for a given month number (1-indexed)
 */
export function isExtraPaymentDue(month: number, config?: ExtraRepaymentConfig): boolean {
  if (!config || !config.enabled || config.amount <= 0 || month <= 0) return false;

  switch (config.frequency) {
    case 'monthly':
      // Month on month repayment
      return true;
    case 'quarterly':
      // Every 3 months
      return month % 3 === 0;
    case 'half_yearly':
      // Every 6 months
      return month % 6 === 0;
    case 'annually':
      // Every 12 months
      return month % 12 === 0;
    case 'custom': {
      const cMonth = config.customMonth && config.customMonth > 0 ? config.customMonth : 1;
      if (config.isRecurring) {
        // If recurring check box is clicked, calculate on every Nth month
        return month % cMonth === 0;
      } else {
        // If not recurring, calculate as one-time repayment only on month N
        return month === cMonth;
      }
    }
    default:
      return false;
  }
}

/**
 * Generates an amortization schedule (monthly details) optionally considering extra repayment
 */
export function generateMonthlyAmortizationSchedule(
  principal: number,
  annualRate: number,
  months: number,
  extraRepayment?: ExtraRepaymentConfig
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  if (principal <= 0 || months <= 0) return schedule;

  const emi = calculateEMI(principal, annualRate, months);
  const r = annualRate / 12 / 100;
  let remainingBalance = principal;
  let totalInterestPaid = 0;

  for (let i = 1; i <= months; i++) {
    if (remainingBalance <= 0.005) break;

    const interest = remainingBalance * r;
    const normalPrincipal = emi - interest;

    // Check if extra payment is due in this month
    const extraDue = isExtraPaymentDue(i, extraRepayment);
    const configuredExtra = extraDue && extraRepayment ? extraRepayment.amount : 0;

    let actualPrincipalPaid = 0;
    let actualExtraPaid = 0;
    let totalPayment = 0;

    if (remainingBalance + interest <= emi) {
      // Regular EMI clears or exceeds the entire remaining balance + interest
      totalPayment = remainingBalance + interest;
      actualPrincipalPaid = remainingBalance;
      actualExtraPaid = 0;
      remainingBalance = 0;
    } else {
      // Normal principal is paid
      const principalPortion = Math.min(remainingBalance, normalPrincipal);
      const balanceAfterNormal = Math.max(0, remainingBalance - principalPortion);

      if (configuredExtra > 0 && balanceAfterNormal > 0) {
        // Apply extra prepayment against remaining balance
        actualExtraPaid = Math.min(configuredExtra, balanceAfterNormal);
      }

      actualPrincipalPaid = principalPortion + actualExtraPaid;
      totalPayment = interest + actualPrincipalPaid;
      remainingBalance = Math.max(0, remainingBalance - actualPrincipalPaid);
    }

    totalInterestPaid += interest;

    schedule.push({
      period: i,
      payment: Number(totalPayment.toFixed(2)),
      principal: Number(actualPrincipalPaid.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      remainingBalance: Number(Math.max(0, remainingBalance).toFixed(2)),
      totalInterestPaid: Number(totalInterestPaid.toFixed(2)),
      extraPayment: actualExtraPaid > 0 ? Number(actualExtraPaid.toFixed(2)) : undefined,
    });

    if (remainingBalance <= 0.005) {
      break;
    }
  }

  return schedule;
}

/**
 * Generates a yearly amortization schedule (aggregated) optionally considering extra repayment
 */
export function generateYearlyAmortizationSchedule(
  principal: number,
  annualRate: number,
  months: number,
  extraRepayment?: ExtraRepaymentConfig
): AmortizationRow[] {
  const monthly = generateMonthlyAmortizationSchedule(principal, annualRate, months, extraRepayment);
  const yearly: AmortizationRow[] = [];
  
  let yearNum = 1;
  let yearlyPayment = 0;
  let yearlyPrincipal = 0;
  let yearlyInterest = 0;
  let yearlyExtra = 0;
  let lastBalance = principal;

  for (let i = 0; i < monthly.length; i++) {
    const row = monthly[i];
    yearlyPayment += row.payment;
    yearlyPrincipal += row.principal;
    yearlyInterest += row.interest;
    if (row.extraPayment) yearlyExtra += row.extraPayment;
    lastBalance = row.remainingBalance;

    if ((i + 1) % 12 === 0 || i === monthly.length - 1) {
      yearly.push({
        period: yearNum,
        payment: Number(yearlyPayment.toFixed(2)),
        principal: Number(yearlyPrincipal.toFixed(2)),
        interest: Number(yearlyInterest.toFixed(2)),
        remainingBalance: Number(lastBalance.toFixed(2)),
        totalInterestPaid: Number(monthly[i].totalInterestPaid.toFixed(2)),
        extraPayment: yearlyExtra > 0 ? Number(yearlyExtra.toFixed(2)) : undefined,
      });
      yearNum++;
      yearlyPayment = 0;
      yearlyPrincipal = 0;
      yearlyInterest = 0;
      yearlyExtra = 0;
    }
  }

  return yearly;
}

export interface ExtraRepaymentImpact {
  originalTenureMonths: number;
  actualTenureMonths: number;
  monthsSaved: number;
  originalTotalInterest: number;
  actualTotalInterest: number;
  interestSaved: number;
  originalTotalPayment: number;
  actualTotalPayment: number;
  totalExtraPaid: number;
}

/**
 * Calculates comparative metrics between standard schedule and extra repayment schedule
 */
export function calculateExtraRepaymentImpact(
  principal: number,
  annualRate: number,
  months: number,
  extraRepayment?: ExtraRepaymentConfig
): ExtraRepaymentImpact {
  const emi = calculateEMI(principal, annualRate, months);
  const baselineSchedule = generateMonthlyAmortizationSchedule(principal, annualRate, months);
  const baselineTotalInterest = baselineSchedule.length > 0
    ? baselineSchedule[baselineSchedule.length - 1].totalInterestPaid
    : Math.max(0, emi * months - principal);
  const baselineTotalPayment = principal + baselineTotalInterest;

  if (!extraRepayment || !extraRepayment.enabled || extraRepayment.amount <= 0) {
    return {
      originalTenureMonths: months,
      actualTenureMonths: months,
      monthsSaved: 0,
      originalTotalInterest: Number(baselineTotalInterest.toFixed(2)),
      actualTotalInterest: Number(baselineTotalInterest.toFixed(2)),
      interestSaved: 0,
      originalTotalPayment: Number(baselineTotalPayment.toFixed(2)),
      actualTotalPayment: Number(baselineTotalPayment.toFixed(2)),
      totalExtraPaid: 0,
    };
  }

  const newSchedule = generateMonthlyAmortizationSchedule(principal, annualRate, months, extraRepayment);
  const actualMonths = newSchedule.length;
  const actualTotalInterest = actualMonths > 0
    ? newSchedule[actualMonths - 1].totalInterestPaid
    : 0;

  let totalExtraPaid = 0;
  for (const row of newSchedule) {
    if (row.extraPayment) totalExtraPaid += row.extraPayment;
  }

  const actualTotalPayment = principal + actualTotalInterest;
  const interestSaved = Math.max(0, baselineTotalInterest - actualTotalInterest);
  const monthsSaved = Math.max(0, months - actualMonths);

  return {
    originalTenureMonths: months,
    actualTenureMonths: actualMonths,
    monthsSaved,
    originalTotalInterest: Number(baselineTotalInterest.toFixed(2)),
    actualTotalInterest: Number(actualTotalInterest.toFixed(2)),
    interestSaved: Number(interestSaved.toFixed(2)),
    originalTotalPayment: Number(baselineTotalPayment.toFixed(2)),
    actualTotalPayment: Number(actualTotalPayment.toFixed(2)),
    totalExtraPaid: Number(totalExtraPaid.toFixed(2)),
  };
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

