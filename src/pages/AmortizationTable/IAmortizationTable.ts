export interface AmortizationRow {
  month: number;
  initialBalance: number;
  payment: number;
  insurance?: number;
  totalPayment: number;
  interest: number;
  principal: number;
  extraPayment: number;
  finalBalance: number;
}

export interface ExtraPayment {
  id: number;
  month: number;
  amount: number;
}
