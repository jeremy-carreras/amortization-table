import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { Panel } from "primereact/panel";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Divider } from "primereact/divider";
import "./AmortizationTable.scss";
import type {
  AmortizationRow,
  ExtraPayment,
  PaymentFrequency,
  InsuranceConfig,
} from "./IAmortizationTable";
import {
  calculateAmortization,
  currencyFormat,
  getPeriodLabel,
  exportToCSV,
  exportToExcel,
  exportToPDF,
} from "../../utils/amortizationHelpers";

export const AmortizationTable: React.FC = () => {
  // Loan configuration
  const [annualRate, setAnnualRate] = useState<number>(14.99);
  const [totalLoan, setTotalLoan] = useState<number>(400000);
  const [totalPeriods, setTotalPeriods] = useState<number>(24);
  const [paymentFrequency, setPaymentFrequency] =
    useState<PaymentFrequency>("monthly");

  // Results
  const [table, setTable] = useState<AmortizationRow[]>([]);
  const [showTable, setShowTable] = useState<boolean>(false);

  // Insurance configuration
  const [showInsurance, setShowInsurance] = useState<boolean>(false);
  const [insurance, setInsurance] = useState<InsuranceConfig>({
    enabled: false,
    fixedAmount: 0,
    percentageOfBalance: 0,
    percentageOfPayment: 0,
  });

  // Extra payments
  const [showExtraPayments, setShowExtraPayments] = useState<boolean>(false);
  const [payments, setPayments] = useState<ExtraPayment[]>([]);
  const [newPaymentPeriod, setNewPaymentPeriod] = useState<number>(3);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(35000);
  const [nextPaymentId, setNextPaymentId] = useState<number>(1);
  const [paymentsCollapsed, setPaymentsCollapsed] = useState<boolean>(false);

  // Payment frequency options
  const frequencyOptions = [
    { label: "Monthly", value: "monthly" as PaymentFrequency },
    { label: "Bi-weekly", value: "biweekly" as PaymentFrequency },
    { label: "Weekly", value: "weekly" as PaymentFrequency },
  ];

  const periodLabel = getPeriodLabel(paymentFrequency);

  const calculateAmortizationProcess = () => {
    calculateAmortization(
      totalLoan,
      totalPeriods,
      annualRate,
      paymentFrequency,
      showExtraPayments ? payments : [],
      { ...insurance, enabled: showInsurance },
      setTable,
      setShowTable,
    );
  };

  // Auto recalculation when modifying parameters
  useEffect(() => {
    if (showTable) {
      calculateAmortizationProcess();
    }
  }, [
    payments,
    annualRate,
    totalLoan,
    totalPeriods,
    paymentFrequency,
    insurance,
    showInsurance,
    showExtraPayments,
  ]);

  /** Add a new extra payment */
  const addPayment = () => {
    if (
      newPaymentAmount <= 0 ||
      newPaymentPeriod < 1 ||
      newPaymentPeriod > totalPeriods
    )
      return;
    setPayments((prev) => [
      ...prev,
      {
        id: nextPaymentId,
        period: newPaymentPeriod,
        amount: newPaymentAmount,
      },
    ]);
    setNextPaymentId((prev) => prev + 1);
  };

  /** Delete an existing payment */
  const deletePayment = (id: number) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  /** Update an existing payment */
  const updatePayment = (
    id: number,
    field: "period" | "amount",
    value: number,
  ) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  /** Export handlers */
  const handleExportCSV = () => {
    exportToCSV(table, periodLabel, showInsurance, showExtraPayments);
  };

  const handleExportExcel = async () => {
    await exportToExcel(
      table,
      periodLabel,
      showInsurance,
      showExtraPayments,
      totalLoan,
      annualRate,
      totalPeriods,
      paymentFrequency,
    );
  };

  const handleExportPDF = async () => {
    await exportToPDF(
      table,
      periodLabel,
      showInsurance,
      showExtraPayments,
      totalLoan,
      annualRate,
      totalPeriods,
      paymentFrequency,
    );
  };

  return (
    <div className="amortization-card">
      {/* Main Configuration Section */}
      <Panel header="Loan Configuration" toggleable>
        <div className="section-inputs">
          <div className="input-grid-4">
            <div className="input-group">
              <label htmlFor="rate">Annual Rate (%)</label>
              <InputNumber
                id="rate"
                value={annualRate}
                onValueChange={(e) => setAnnualRate(e.value ?? 0)}
                suffix="%"
                minFractionDigits={2}
                maxFractionDigits={2}
              />
            </div>

            <div className="input-group">
              <label htmlFor="loan">Total Loan</label>
              <InputNumber
                id="loan"
                value={totalLoan}
                onValueChange={(e) => setTotalLoan(e.value ?? 0)}
                mode="currency"
                currency="USD"
                locale="en-US"
              />
            </div>

            <div className="input-group">
              <label htmlFor="periods">{periodLabel}s</label>
              <InputNumber
                id="periods"
                value={totalPeriods}
                onValueChange={(e) => setTotalPeriods(e.value ?? 0)}
                showButtons
                min={1}
              />
            </div>

            <div className="input-group">
              <label htmlFor="frequency">Payment Frequency</label>
              <Dropdown
                id="frequency"
                value={paymentFrequency}
                options={frequencyOptions}
                onChange={(e) => setPaymentFrequency(e.value)}
                placeholder="Select frequency"
              />
            </div>
          </div>

          <div className="calculate-btn">
            <Button
              label="Calculate Amortization"
              icon="pi pi-calculator"
              className="p-button-raised p-button-primary"
              onClick={calculateAmortizationProcess}
            />
          </div>
        </div>
      </Panel>

      {/* Insurance Configuration Section */}
      <Panel
        header="Insurance Configuration"
        toggleable
        collapsed={!showInsurance}
        className="mt-3"
      >
        <div className="insurance-toggle">
          <label>Enable Insurance</label>
          <InputSwitch
            checked={showInsurance}
            onChange={(e) => setShowInsurance(e.value)}
          />
        </div>

        {showInsurance && (
          <>
            <Divider />
            <div className="insurance-grid">
              <div className="input-group">
                <label htmlFor="fixedInsurance">
                  Fixed Amount per {periodLabel}
                </label>
                <InputNumber
                  id="fixedInsurance"
                  value={insurance.fixedAmount}
                  onValueChange={(e) =>
                    setInsurance((prev) => ({
                      ...prev,
                      fixedAmount: e.value ?? 0,
                    }))
                  }
                  mode="currency"
                  currency="USD"
                  locale="en-US"
                />
              </div>

              <div className="input-group">
                <label htmlFor="percentageBalance">Balance percent</label>
                <InputNumber
                  id="percentageBalance"
                  value={insurance.percentageOfBalance}
                  onValueChange={(e) =>
                    setInsurance((prev) => ({
                      ...prev,
                      percentageOfBalance: e.value ?? 0,
                    }))
                  }
                  suffix="%"
                  minFractionDigits={2}
                  maxFractionDigits={4}
                />
              </div>

              <div className="input-group">
                <label htmlFor="percentagePayment">Payment percent</label>
                <InputNumber
                  id="percentagePayment"
                  value={insurance.percentageOfPayment}
                  onValueChange={(e) =>
                    setInsurance((prev) => ({
                      ...prev,
                      percentageOfPayment: e.value ?? 0,
                    }))
                  }
                  suffix="%"
                  minFractionDigits={2}
                  maxFractionDigits={4}
                />
              </div>
            </div>
          </>
        )}
      </Panel>

      {/* Extra Payments Section */}
      <Panel
        header="Extra Payments"
        toggleable
        collapsed={!showExtraPayments}
        className="mt-3"
      >
        <div className="insurance-toggle">
          <label>Enable Extra Payments</label>
          <InputSwitch
            checked={showExtraPayments}
            onChange={(e) => setShowExtraPayments(e.value)}
          />
        </div>

        {showExtraPayments && (
          <>
            <Divider />
            {/* Add new extra payment */}
            <div className="extra-payment-grid">
              <div className="input-group">
                <label htmlFor="extraPaymentPeriod">
                  Extra Payment {periodLabel}
                </label>
                <InputNumber
                  size={4}
                  id="extraPaymentPeriod"
                  value={newPaymentPeriod}
                  onValueChange={(e) => setNewPaymentPeriod(e.value ?? 0)}
                  showButtons
                  min={1}
                  max={totalPeriods}
                />
              </div>

              <div className="input-group">
                <label htmlFor="extraPaymentAmount">Extra Payment Amount</label>
                <InputNumber
                  id="extraPaymentAmount"
                  value={newPaymentAmount}
                  onValueChange={(e) => setNewPaymentAmount(e.value ?? 0)}
                  mode="currency"
                  currency="USD"
                  locale="en-US"
                />
              </div>

              <div className="button-wrapper">
                <Button
                  label="Add Payment"
                  icon="pi pi-plus"
                  className="p-button-raised p-button-success"
                  onClick={addPayment}
                  style={{ padding: "0.5rem 1.5rem" }}
                />
              </div>
            </div>

            {/* Existing payments list */}
            {payments.length > 0 && (
              <div className="payments-section">
                <div className="payments-header">
                  <h3>
                    Registered Extra Payments ({payments.length}){" "}
                    {payments.length > 3 && (
                      <Button
                        icon={
                          paymentsCollapsed
                            ? "pi pi-angle-down"
                            : "pi pi-angle-up"
                        }
                        className="p-button-text p-button-sm"
                        onClick={() => setPaymentsCollapsed(!paymentsCollapsed)}
                      />
                    )}
                  </h3>
                  {payments.length > 0 && (
                    <Button
                      label="Clear All"
                      icon="pi pi-trash"
                      className="p-button-text p-button-danger p-button-sm"
                      onClick={() => setPayments([])}
                    />
                  )}
                </div>

                {(!paymentsCollapsed || payments.length <= 3) && (
                  <div className="payment-grid">
                    {payments.map((p) => (
                      <div key={p.id} className="payment-card">
                        <div className="payment-row">
                          <div className="payment-field">
                            <label>{periodLabel}</label>
                            <InputNumber
                              value={p.period}
                              onValueChange={(e) =>
                                updatePayment(
                                  p.id,
                                  "period",
                                  e.value ?? p.period,
                                )
                              }
                              min={1}
                              max={totalPeriods}
                            />
                          </div>
                          <div className="payment-field">
                            <label>Amount</label>
                            <InputNumber
                              value={p.amount}
                              onValueChange={(e) =>
                                updatePayment(
                                  p.id,
                                  "amount",
                                  e.value ?? p.amount,
                                )
                              }
                              mode="currency"
                              currency="USD"
                              locale="en-US"
                            />
                          </div>
                          <Button
                            icon="pi pi-trash"
                            className="p-button-raised p-button-danger p-button-sm"
                            onClick={() => deletePayment(p.id)}
                            tooltip="Delete payment"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {paymentsCollapsed && payments.length > 3 && (
                  <div className="collapsed-info">
                    <i className="pi pi-info-circle"></i> {payments.length}{" "}
                    extra payments configured. Click to expand.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Panel>

      {/* Results Table */}
      {showTable && (
        <>
          <Divider />

          {/* Export Buttons */}
          <div className="export-section">
            <h3>Export Options</h3>
            <div className="export-buttons">
              <Button
                label="Export to CSV"
                icon="pi pi-file"
                className="p-button-outlined"
                onClick={handleExportCSV}
              />
              <Button
                label="Export to Excel"
                icon="pi pi-file-excel"
                className="p-button-outlined p-button-success"
                onClick={handleExportExcel}
              />
              <Button
                label="Export to PDF"
                icon="pi pi-file-pdf"
                className="p-button-outlined p-button-danger"
                onClick={handleExportPDF}
              />
            </div>
          </div>

          <Divider />

          {/* Summary Statistics */}
          <div className="summary-section">
            <h3>Summary</h3>
            <div className="summary-grid">
              <div className="summary-card">
                <span className="summary-label">Total Interest</span>
                <span className="summary-value">
                  {currencyFormat(
                    table.reduce((sum, row) => sum + row.interest, 0),
                  )}
                </span>
              </div>
              {showInsurance && (
                <div className="summary-card">
                  <span className="summary-label">Total Insurance</span>
                  <span className="summary-value">
                    {currencyFormat(
                      table.reduce((sum, row) => sum + row.insurance, 0),
                    )}
                  </span>
                </div>
              )}
              {showExtraPayments && (
                <div className="summary-card">
                  <span className="summary-label">Total Extra Payments</span>
                  <span className="summary-value">
                    {currencyFormat(
                      table.reduce((sum, row) => sum + row.extraPayment, 0),
                    )}
                  </span>
                </div>
              )}
              <div className="summary-card highlight">
                <span className="summary-label">Total Amount Paid</span>
                <span className="summary-value">
                  {currencyFormat(
                    table.reduce(
                      (sum, row) => sum + row.totalPayment + row.extraPayment,
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>
          </div>

          <Divider />

          {/* Amortization Table */}
          <h2 className="table-title">Amortization Schedule</h2>

          <DataTable
            value={table}
            responsiveLayout="scroll"
            stripedRows
            showGridlines
            paginator
            rows={12}
            rowsPerPageOptions={[12, 24, 50, 100]}
          >
            <Column field="period" header={periodLabel} />
            <Column
              field="initialBalance"
              header="Initial Balance"
              body={(d: AmortizationRow) => currencyFormat(d.initialBalance)}
            />
            <Column
              field="payment"
              header="Payment"
              body={(d: AmortizationRow) => currencyFormat(d.payment)}
            />
            {showInsurance && (
              <Column
                field="insurance"
                header="Insurance"
                body={(d: AmortizationRow) => currencyFormat(d.insurance)}
              />
            )}
            <Column
              field="totalPayment"
              header="Total Payment"
              body={(d: AmortizationRow) => currencyFormat(d.totalPayment)}
            />
            <Column
              field="interest"
              header="Interest"
              body={(d: AmortizationRow) => currencyFormat(d.interest)}
            />
            <Column
              field="principal"
              header="Principal"
              body={(d: AmortizationRow) => currencyFormat(d.principal)}
            />
            {showExtraPayments && (
              <Column
                field="extraPayment"
                header="Extra Payment"
                body={(d: AmortizationRow) => currencyFormat(d.extraPayment)}
              />
            )}
            <Column
              field="finalBalance"
              header="Final Balance"
              body={(d: AmortizationRow) => currencyFormat(d.finalBalance)}
            />
          </DataTable>

          {/* Detailed Insurance Breakdown (Expandable) */}
          {showInsurance && (
            <Accordion className="mt-3">
              <AccordionTab header="Detailed Insurance Breakdown">
                <DataTable
                  value={table}
                  responsiveLayout="scroll"
                  stripedRows
                  showGridlines
                  paginator
                  rows={12}
                >
                  <Column field="period" header={periodLabel} />
                  <Column
                    header="Fixed Insurance"
                    body={(d: AmortizationRow) =>
                      currencyFormat(d.insuranceBreakdown?.fixed || 0)
                    }
                  />
                  <Column
                    header="Balance percent"
                    body={(d: AmortizationRow) =>
                      currencyFormat(
                        d.insuranceBreakdown?.percentageOfBalance || 0,
                      )
                    }
                  />
                  <Column
                    header="Payment percent"
                    body={(d: AmortizationRow) =>
                      currencyFormat(
                        d.insuranceBreakdown?.percentageOfPayment || 0,
                      )
                    }
                  />
                  <Column
                    header="Total Insurance"
                    body={(d: AmortizationRow) =>
                      currencyFormat(d.insuranceBreakdown?.total || 0)
                    }
                  />
                </DataTable>
              </AccordionTab>
            </Accordion>
          )}
        </>
      )}
    </div>
  );
};
