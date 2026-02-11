import type {
  AmortizationRow,
  ExtraPayment,
  InsuranceConfig,
  PaymentFrequency,
  InsuranceBreakdown,
} from "../pages/AmortizationTable/IAmortizationTable";

export const currencyFormat = (value: number): string =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

/**
 * Get the number of periods per year based on payment frequency
 */
export const getPeriodsPerYear = (frequency: PaymentFrequency): number => {
  switch (frequency) {
    case "weekly":
      return 52;
    case "biweekly":
      return 26;
    case "monthly":
    default:
      return 12;
  }
};

/**
 * Get the label for the period based on payment frequency
 */
export const getPeriodLabel = (frequency: PaymentFrequency): string => {
  switch (frequency) {
    case "weekly":
      return "Week";
    case "biweekly":
      return "Period";
    case "monthly":
    default:
      return "Month";
  }
};

/**
 * Calculate insurance for a given period
 */
const calculateInsurance = (
  balance: number,
  payment: number,
  config: InsuranceConfig,
): InsuranceBreakdown => {
  const fixed = config.enabled ? config.fixedAmount : 0;
  const percentageOfBalance = config.enabled
    ? (balance * config.percentageOfBalance) / 100
    : 0;
  const percentageOfPayment = config.enabled
    ? (payment * config.percentageOfPayment) / 100
    : 0;

  return {
    fixed,
    percentageOfBalance,
    percentageOfPayment,
    total: fixed + percentageOfBalance + percentageOfPayment,
  };
};

/**
 * Calculate amortization schedule with flexible payment frequency and insurance types
 */
export const calculateAmortization = (
  totalLoan: number,
  totalPeriods: number,
  annualRate: number,
  paymentFrequency: PaymentFrequency,
  payments: ExtraPayment[],
  insuranceConfig: InsuranceConfig,
  setTable: (table: AmortizationRow[]) => void,
  setShowTable: (value: boolean) => void,
) => {
  let balance = totalLoan;
  let remainingPeriods = totalPeriods;
  const rows: AmortizationRow[] = [];
  let currentPeriod = 1;

  const periodsPerYear = getPeriodsPerYear(paymentFrequency);
  const periodRate = annualRate / 100 / periodsPerYear;

  while (currentPeriod <= totalPeriods && balance > 0) {
    const payment =
      (balance * periodRate) /
      (1 - Math.pow(1 + periodRate, -remainingPeriods));

    const interest = balance * periodRate;
    const principal = payment - interest;

    const insuranceBreakdown = calculateInsurance(
      balance,
      payment,
      insuranceConfig,
    );

    const extraPayment = payments
      .filter((p) => p.period === currentPeriod)
      .reduce((sum, p) => sum + p.amount, 0);

    const finalBalance = balance - principal - extraPayment;
    const totalPayment = payment + insuranceBreakdown.total;

    rows.push({
      period: currentPeriod,
      initialBalance: balance,
      payment,
      insurance: insuranceBreakdown.total,
      totalPayment,
      interest,
      principal,
      extraPayment,
      finalBalance: finalBalance < 0 ? 0 : finalBalance,
      insuranceBreakdown,
    });

    balance = finalBalance;
    remainingPeriods--;
    currentPeriod++;

    if (balance <= 0) break;
  }

  setTable(rows);
  setShowTable(true);
};

/**
 * Export amortization table to CSV
 */
export const exportToCSV = (
  data: AmortizationRow[],
  periodLabel: string,
  showInsurance: boolean,
  showExtraPayments: boolean,
) => {
  const headers = [
    periodLabel,
    "Initial Balance",
    "Payment",
    ...(showInsurance
      ? ["Fixed Insurance", "% of Balance", "% of Payment", "Total Insurance"]
      : []),
    "Total Payment",
    "Interest",
    "Principal",
    ...(showExtraPayments ? ["Extra Payment"] : []),
    "Final Balance",
  ];

  const rows = data.map((row) => [
    row.period,
    row.initialBalance.toFixed(2),
    row.payment.toFixed(2),
    ...(showInsurance && row.insuranceBreakdown
      ? [
          (row.insuranceBreakdown.fixed || 0).toFixed(2),
          (row.insuranceBreakdown.percentageOfBalance || 0).toFixed(2),
          (row.insuranceBreakdown.percentageOfPayment || 0).toFixed(2),
          row.insurance.toFixed(2),
        ]
      : []),
    row.totalPayment.toFixed(2),
    row.interest.toFixed(2),
    row.principal.toFixed(2),
    ...(showExtraPayments ? [row.extraPayment.toFixed(2)] : []),
    row.finalBalance.toFixed(2),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `amortization_${new Date().getTime()}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export amortization table to Excel
 */
export const exportToExcel = async (
  data: AmortizationRow[],
  periodLabel: string,
  showInsurance: boolean,
  showExtraPayments: boolean,
  loanAmount: number,
  annualRate: number,
  totalPeriods: number,
  paymentFrequency: PaymentFrequency,
) => {
  // Dynamic import to avoid bundling xlsx unless needed
  const XLSX = await import("xlsx");

  // Summary sheet
  const summary = [
    ["Loan Amortization Summary"],
    [""],
    ["Loan Amount", loanAmount],
    ["Annual Interest Rate", `${annualRate}%`],
    [`Total ${periodLabel}s`, totalPeriods],
    ["Payment Frequency", paymentFrequency],
    [""],
    ["Total Interest Paid", data.reduce((sum, row) => sum + row.interest, 0)],
    ["Total Insurance Paid", data.reduce((sum, row) => sum + row.insurance, 0)],
    [
      "Total Extra Payments",
      data.reduce((sum, row) => sum + row.extraPayment, 0),
    ],
    [
      "Total Amount Paid",
      data.reduce((sum, row) => sum + row.totalPayment + row.extraPayment, 0),
    ],
  ];

  // Amortization schedule headers
  const headers = [
    periodLabel,
    "Initial Balance",
    "Payment",
    ...(showInsurance
      ? ["Fixed Insurance", "% of Balance", "% of Payment", "Total Insurance"]
      : []),
    "Total Payment",
    "Interest",
    "Principal",
    ...(showExtraPayments ? ["Extra Payment"] : []),
    "Final Balance",
  ];

  // Amortization schedule data
  const scheduleData = data.map((row) => [
    row.period,
    row.initialBalance,
    row.payment,
    ...(showInsurance && row.insuranceBreakdown
      ? [
          row.insuranceBreakdown.fixed || 0,
          row.insuranceBreakdown.percentageOfBalance || 0,
          row.insuranceBreakdown.percentageOfPayment || 0,
          row.insurance,
        ]
      : []),
    row.totalPayment,
    row.interest,
    row.principal,
    ...(showExtraPayments ? [row.extraPayment] : []),
    row.finalBalance,
  ]);

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Add summary sheet
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Add schedule sheet
  const wsSchedule = XLSX.utils.aoa_to_sheet([headers, ...scheduleData]);
  XLSX.utils.book_append_sheet(wb, wsSchedule, "Amortization Schedule");

  // Write file
  XLSX.writeFile(wb, `amortization_${new Date().getTime()}.xlsx`);
};

/**
 * Generate PDF of amortization table
 */
export const exportToPDF = async (
  data: AmortizationRow[],
  periodLabel: string,
  showInsurance: boolean,
  showExtraPayments: boolean,
  loanAmount: number,
  annualRate: number,
  totalPeriods: number,
  paymentFrequency: PaymentFrequency,
) => {
  const jsPDF = (await import("jspdf")).default;
  await import("jspdf-autotable");

  const doc = new jsPDF();

  // Title
  doc.setFontSize(14);
  doc.text("Loan Amortization Schedule", 14, 18);

  // ---- Totals ----
  const totalInterest = data.reduce((sum, row) => sum + row.interest, 0);
  const totalInsurance = data.reduce((sum, row) => sum + row.insurance, 0);
  const totalExtra = data.reduce((sum, row) => sum + row.extraPayment, 0);
  const totalPaid = data.reduce(
    (sum, row) => sum + row.totalPayment + row.extraPayment,
    0,
  );

  const startY = 24;

  // ---- LEFT SUMMARY TABLE ----
  const leftSummary = [
    ["Loan Amount", currencyFormat(loanAmount)],
    ["Annual Rate", `${annualRate}%`],
    [`Total ${periodLabel}s`, totalPeriods.toString()],
    ["Payment Frequency", paymentFrequency],
  ];

  (doc as any).autoTable({
    startY,
    margin: { left: 14 },
    tableWidth: 90,
    body: leftSummary,
    theme: "grid",
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45 },
      1: { cellWidth: 45 },
    },
  });

  const leftFinalY = (doc as any).lastAutoTable.finalY;

  // ---- RIGHT SUMMARY TABLE ----
  const rightSummary = [
    ["Total Interest", currencyFormat(totalInterest)],
    ["Total Insurance", currencyFormat(totalInsurance)],
    ["Total Extra Payments", currencyFormat(totalExtra)],
    ["Total Paid", currencyFormat(totalPaid)],
  ];

  (doc as any).autoTable({
    startY,
    margin: { left: 110 }, // Positioned to the right
    tableWidth: 90,
    body: rightSummary,
    theme: "grid",
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45 },
      1: { cellWidth: 45 },
    },
  });

  const rightFinalY = (doc as any).lastAutoTable.finalY;

  // Calculate lower Y between both tables
  const finalY = Math.max(leftFinalY, rightFinalY) + 6;

  // ---- Amortization table headers ----
  const headers = [
    periodLabel,
    "Initial Balance",
    "Payment",
    ...(showInsurance ? ["Insurance"] : []),
    "Total Payment",
    "Interest",
    "Principal",
    ...(showExtraPayments ? ["Extra"] : []),
    "Final Balance",
  ];

  const tableData = data.map((row) => [
    row.period,
    currencyFormat(row.initialBalance),
    currencyFormat(row.payment),
    ...(showInsurance ? [currencyFormat(row.insurance)] : []),
    currencyFormat(row.totalPayment),
    currencyFormat(row.interest),
    currencyFormat(row.principal),
    ...(showExtraPayments ? [currencyFormat(row.extraPayment)] : []),
    currencyFormat(row.finalBalance),
  ]);

  (doc as any).autoTable({
    head: [headers],
    body: tableData,
    startY: finalY,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
  });

  doc.save(`amortization_${new Date().getTime()}.pdf`);
};

