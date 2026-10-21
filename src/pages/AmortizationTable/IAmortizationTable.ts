export interface AmortizationRow {
  period: number;
  initialBalance: number;
  payment: number;
  insurance: number;
  totalPayment: number;
  interest: number;
  principal: number;
  extraPayment: number;
  finalBalance: number;
  insuranceBreakdown?: InsuranceBreakdown;
}

export interface InsuranceBreakdown {
  fixed?: number;
  percentageOfBalance?: number;
  percentageOfPayment?: number;
  total: number;
}

/**
 * Type of extra payment:
 * - "extra": `amount` is an additional payment on top of the normal payment for that period.
 * - "exact": `amount` is the EXACT total the user wants to pay that period;
 *   the extra payment is derived as `amount - normalTotalPayment`.
 */
export type ExtraPaymentType = "extra" | "exact";

export interface ExtraPayment {
  id: number;
  period: number;
  amount: number;
  type: ExtraPaymentType;
}

export interface InsuranceConfig {
  enabled: boolean;
  fixedAmount: number;
  percentageOfBalance: number;
  percentageOfPayment: number;
}

export type PaymentFrequency = "monthly" | "biweekly" | "weekly";

/**
 * Strategy for handling extra capital payments:
 * - "reduceQuota": always reduce the monthly payment (keep term)
 * - "reduceTerm": always reduce the remaining term (keep payment)
 * - "auto": if extra payment < current payment → reduce term; if >= current payment → reduce quota
 */
export type ExtraPaymentStrategy = "reduceQuota" | "reduceTerm" | "auto";

export interface LoanConfig {
  annualRate: number;
  totalLoan: number;
  totalPeriods: number;
  paymentFrequency: PaymentFrequency;
  insurance: InsuranceConfig;
}
