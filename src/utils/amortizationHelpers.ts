import type {
  AmortizationRow,
  ExtraPayment,
} from "../pages/AmortizationTable/IAmortizationTable";

export const currencyFormat = (value: number): string =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const calculateAmortization = (
  totalLoan: number,
  months: number,
  annualRate: number,
  payments: ExtraPayment[],
  insuranceRate: number,
  setTable: (table: AmortizationRow[]) => void,
  setShowTable: (value: boolean) => void
) => {
  let balance = totalLoan;
  let remainingMonths = months;
  const rows: AmortizationRow[] = [];
  let currentMonth = 1;

  const monthlyRate = annualRate / 100 / 12;

  while (currentMonth <= months && balance > 0) {
    const payment =
      (balance * monthlyRate) /
      (1 - Math.pow(1 + monthlyRate, -remainingMonths));

    const interest = balance * monthlyRate;
    const principal = payment - interest;

    const extraPayment = payments
      .filter((p) => p.month === currentMonth)
      .reduce((sum, p) => sum + p.amount, 0);

    const finalBalance = balance - principal - extraPayment;
    const insurance = balance * insuranceRate;
    const totalPayment = payment + insurance;

    rows.push({
      month: currentMonth,
      initialBalance: balance,
      payment,
      totalPayment,
      interest,
      principal,
      extraPayment,
      finalBalance: finalBalance < 0 ? 0 : finalBalance,
      ...(insurance ? { insurance } : {}),
    });

    balance = finalBalance;
    remainingMonths--;
    currentMonth++;

    if (balance <= 0) break;
  }

  setTable(rows);
  setShowTable(true);
};
