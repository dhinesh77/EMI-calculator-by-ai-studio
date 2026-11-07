import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AmortizationRow } from '../types';
import { formatIndianCurrency } from './indianNumberFormat';

export interface PDFExportOptions {
  loanCategory: string;
  targetParameter: string;
  principal: number;
  annualRate: number;
  tenureYearsOrMonths: string;
  emi: number;
  totalInterest: number;
  totalPayment: number;
  scheduleType: 'monthly' | 'yearly';
  schedule: AmortizationRow[];
  extraRepayment?: {
    amount: number;
    frequency: string;
    customMonth?: number;
    isRecurring?: boolean;
    interestSaved?: number;
    monthsSaved?: number;
    actualTenure?: string;
  };
}

/**
 * Generates and shares or downloads the Loan Amortization Schedule PDF
 */
export async function exportAmortizationPDF(options: PDFExportOptions, action: 'download' | 'share' = 'download'): Promise<void> {
  const {
    loanCategory,
    targetParameter,
    principal,
    annualRate,
    tenureYearsOrMonths,
    emi,
    totalInterest,
    totalPayment,
    scheduleType,
    schedule,
    extraRepayment,
  } = options;

  const hasExtra = Boolean(extraRepayment && extraRepayment.amount > 0);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Creative Header Banner
  doc.setFillColor(15, 23, 42); // Deep slate #0f172a
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Vibrant creative gradient accent bar (Emerald to Cyan to Indigo)
  doc.setFillColor(16, 185, 129); // Emerald
  doc.rect(0, 42, pageWidth * 0.35, 2.5, 'F');
  doc.setFillColor(6, 182, 212); // Cyan
  doc.rect(pageWidth * 0.35, 42, pageWidth * 0.35, 2.5, 'F');
  doc.setFillColor(99, 102, 241); // Indigo
  doc.rect(pageWidth * 0.70, 42, pageWidth * 0.30, 2.5, 'F');

  // App & Document Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('LOAN EMI AMORTIZATION REPORT', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`Category: ${loanCategory.toUpperCase()} LOAN  |  Calculated Parameter: ${targetParameter.toUpperCase()}`, 14, 26);
  doc.text(`Generated on: ${today}  |  Currency: INR (Indian Rupee / Rs.)`, 14, 32);

  // Summary Metrics Box (Extended if extra repayment is active)
  const boxHeight = hasExtra ? 56 : 42;
  const startYTable = hasExtra ? 109 : 96;

  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(14, 48, pageWidth - 28, boxHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('KEY LOAN SUMMARY METRICS (INR / Rs.)', 20, 55.5);

  // Row 1: Principal, Interest Rate, Base Tenure
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139); // Muted label
  doc.text('LOAN PRINCIPAL', 20, 63);
  doc.text('INTEREST RATE', 80, 63);
  doc.text('BASE TENURE', 145, 63);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // Value
  doc.text(`Rs. ${formatIndianCurrency(principal, { showSymbol: false })}`, 20, 69);
  doc.text(`${annualRate.toFixed(2)}% p.a.`, 80, 69);
  doc.text(tenureYearsOrMonths, 145, 69);

  // Row 2: Monthly EMI, Total Interest, Total Repayment
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('BASE MONTHLY EMI', 20, 77);
  doc.text(hasExtra ? 'REVISED TOTAL INTEREST' : 'TOTAL INTEREST', 80, 77);
  doc.text(hasExtra ? 'REVISED TOTAL PAYMENT' : 'TOTAL REPAYMENT', 145, 77);

  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // Emerald for EMI
  doc.text(`Rs. ${formatIndianCurrency(emi, { showSymbol: false })}`, 20, 83);

  doc.setFontSize(10.5);
  doc.setTextColor(217, 70, 239); // Fuchsia for Interest
  doc.text(`Rs. ${formatIndianCurrency(totalInterest, { showSymbol: false })}`, 80, 83);

  doc.setTextColor(30, 41, 59);
  doc.text(`Rs. ${formatIndianCurrency(totalPayment, { showSymbol: false })}`, 145, 83);

  // Row 3 (Conditional on Extra Repayment): Extra Amount & Frequency, Interest Saved, Time Saved
  if (hasExtra && extraRepayment) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('EXTRA REPAYMENT', 20, 91);
    doc.text('TOTAL INTEREST SAVED', 80, 91);
    doc.text('TIME SAVED / PAYOFF', 145, 91);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 116, 144); // Cyan 700
    doc.text(`Rs. ${formatIndianCurrency(extraRepayment.amount, { showSymbol: false })} (${extraRepayment.frequency})`, 20, 97);

    doc.setTextColor(16, 185, 129); // Emerald for Interest Saved
    doc.text(`Rs. ${formatIndianCurrency(extraRepayment.interestSaved || 0, { showSymbol: false })}`, 80, 97);

    doc.setTextColor(79, 70, 229); // Indigo 600
    const timeSavedStr = `${extraRepayment.monthsSaved || 0} Mos Early${extraRepayment.actualTenure ? ` (${extraRepayment.actualTenure})` : ''}`;
    doc.text(timeSavedStr, 145, 97);
  }

  // Amortization Schedule Table
  // Values are clean formatted numbers aligned with explicit column settings
  const tableData = hasExtra
    ? schedule.map((row) => [
        scheduleType === 'yearly' ? `Year ${row.period}` : `Month ${row.period}`,
        formatIndianCurrency(Math.max(0, row.payment - (row.extraPayment || 0)), { showSymbol: false }),
        formatIndianCurrency(row.extraPayment || 0, { showSymbol: false }),
        formatIndianCurrency(row.principal, { showSymbol: false }),
        formatIndianCurrency(row.interest, { showSymbol: false }),
        formatIndianCurrency(row.totalInterestPaid, { showSymbol: false }),
        formatIndianCurrency(Math.max(0, row.remainingBalance), { showSymbol: false }),
      ])
    : schedule.map((row) => [
        scheduleType === 'yearly' ? `Year ${row.period}` : `Month ${row.period}`,
        formatIndianCurrency(row.payment, { showSymbol: false }),
        formatIndianCurrency(row.principal, { showSymbol: false }),
        formatIndianCurrency(row.interest, { showSymbol: false }),
        formatIndianCurrency(row.totalInterestPaid, { showSymbol: false }),
        formatIndianCurrency(Math.max(0, row.remainingBalance), { showSymbol: false }),
      ]);

  const tableHead = hasExtra
    ? [[
        { content: scheduleType === 'yearly' ? 'Year' : 'Month', styles: { halign: 'center' as const } },
        { content: 'Regular EMI (Rs.)', styles: { halign: 'right' as const } },
        { content: 'Extra Paid (Rs.)', styles: { halign: 'right' as const } },
        { content: 'Principal Paid (Rs.)', styles: { halign: 'right' as const } },
        { content: 'Interest Paid (Rs.)', styles: { halign: 'right' as const } },
        { content: 'Total Interest (Rs.)', styles: { halign: 'right' as const } },
        { content: 'Balance (Rs.)', styles: { halign: 'right' as const } },
      ]]
    : [[
        { content: scheduleType === 'yearly' ? 'Year' : 'Month', styles: { halign: 'center' as const } },
        { content: 'EMI (Rs.)', styles: { halign: 'right' as const } },
        { content: 'Principal Paid (Rs.)', styles: { halign: 'right' as const } },
        { content: 'Interest Paid (Rs.)', styles: { halign: 'right' as const } },
        { content: 'Total Interest (Rs.)', styles: { halign: 'right' as const } },
        { content: 'Balance (Rs.)', styles: { halign: 'right' as const } },
      ]];

  const columnStyles: { [key: number]: { cellWidth: number; halign: 'center' | 'right'; fontStyle?: 'bold' | 'normal' } } = hasExtra
    ? {
        0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 27, halign: 'right' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 27, halign: 'right' },
        4: { cellWidth: 27, halign: 'right' },
        5: { cellWidth: 28, halign: 'right' },
        6: { cellWidth: 28, halign: 'right' },
      }
    : {
        0: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 32, halign: 'right' },
        2: { cellWidth: 32, halign: 'right' },
        3: { cellWidth: 32, halign: 'right' },
        4: { cellWidth: 32, halign: 'right' },
        5: { cellWidth: 32, halign: 'right' },
      };

  autoTable(doc, {
    startY: startYTable,
    head: tableHead,
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: { top: 2.0, bottom: 2.0, left: 1.5, right: 1.5 },
      valign: 'middle',
      font: 'helvetica',
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      valign: 'middle',
      cellPadding: { top: 2.6, bottom: 2.6, left: 1.5, right: 1.5 },
    },
    columnStyles,
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 22 },
    didDrawPage: (data) => {
      const pageHeight = doc.internal.pageSize.getHeight();

      // Bottom separator line
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

      // Report metadata & Page numbering
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(
        'EMI & Finance Planner • Generated with Indian Numbering System (INR)',
        14,
        pageHeight - 11
      );

      const pageStr = `Page ${doc.getNumberOfPages()}`;
      doc.text(
        pageStr,
        pageWidth - 14,
        pageHeight - 11,
        { align: 'right' }
      );

      // Bottom Watermark Pill & Attribution: "Designed and Developed by DDWORLDS"
      const badgeWidth = 92;
      const badgeHeight = 5.5;
      const badgeX = (pageWidth - badgeWidth) / 2;
      const badgeY = pageHeight - 8.5;

      // Soft styled badge container
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'F');

      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setLineWidth(0.2);
      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'S');

      // Watermark text in bold Indigo
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(67, 56, 202); // Indigo 700
      doc.text(
        'Designed and Developed by DDWORLDS',
        pageWidth / 2,
        pageHeight - 4.8,
        { align: 'center' }
      );
    },
  });

  const fileName = `Loan_Amortization_Schedule_${loanCategory}_${today.replace(/\s+/g, '_')}.pdf`;

  if (action === 'share' && navigator.share && navigator.canShare) {
    try {
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Loan Amortization Schedule',
          text: `Here is the ${loanCategory.toUpperCase()} loan amortization schedule with monthly EMI ${formatIndianCurrency(emi)}.`,
        });
        return;
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        // User deliberately cancelled the share prompt
        return;
      }
      console.warn('Navigator share error, falling back to download:', e);
    }
  }

  // Download directly
  doc.save(fileName);
}
