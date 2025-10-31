import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import "./AmortizationTable.scss";
import type { AmortizationRow, ExtraPayment } from "./IAmortizationTable";
import {
  calculateAmortization,
  currencyFormat,
} from "../../utils/amortizationHelpers";
import { InputSwitch } from "primereact/inputswitch";

export const AmortizationTable: React.FC = () => {
  const [annualRate, setAnnualRate] = useState<number>(10.95);
  const [totalLoan, setTotalLoan] = useState<number>(3285000);
  const [months, setMonths] = useState<number>(240);
  const [table, setTable] = useState<AmortizationRow[]>([]);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [showInsurance, setShowInsurance] = useState<boolean>(false);
  const [insurance, setInsurance] = useState<number>(0);

  const [payments, setPayments] = useState<ExtraPayment[]>([]);
  const [newPaymentMonth, setNewPaymentMonth] = useState<number>(3);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(35000);
  const [nextPaymentId, setNextPaymentId] = useState<number>(1);

  const calculateAmortizationProcess = () => {
    calculateAmortization(
      totalLoan,
      months,
      annualRate,
      payments,
      insurance,
      setTable,
      setShowTable
    );
  };

  // ⚡ Auto recalculation when modifying payments, rate, amount, or months
  useEffect(() => {
    if (showTable) {
      calculateAmortizationProcess();
    }
  }, [payments, annualRate, totalLoan, months]);

  /** ➕ Add a new extra payment */
  const addPayment = () => {
    if (
      newPaymentAmount <= 0 ||
      newPaymentMonth < 1 ||
      newPaymentMonth > months
    )
      return;
    setPayments((prev) => [
      ...prev,
      { id: nextPaymentId, month: newPaymentMonth, amount: newPaymentAmount },
    ]);
    setNextPaymentId((prev) => prev + 1);
  };

  /** 🗑️ Delete an existing payment */
  const deletePayment = (id: number) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  /** ✏️ Update an existing payment */
  const updatePayment = (
    id: number,
    field: "month" | "amount",
    value: number
  ) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  return (
    <div className="amortization-card">
      {/* Main input section */}
      <div className="section-inputs">
        <div className="input-grid">
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
            <label htmlFor="months">Months</label>
            <InputNumber
              id="months"
              value={months}
              onValueChange={(e) => setMonths(e.value ?? 0)}
              showButtons
              min={1}
            />
          </div>

          <div className="input-group">
            <label>Insurance</label>
            <InputSwitch
              checked={showInsurance}
              onChange={(e) => setShowInsurance(e.value)}
            />
            {showInsurance && (
              <InputNumber
                id="insurance"
                value={insurance}
                onValueChange={(e) => setInsurance(e.value ?? 0)}
                suffix="%"
                minFractionDigits={2}
                maxFractionDigits={10}
              />
            )}
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

      {/* Results Table */}
      {/* 💰 Extra Payments Section */}
      {showTable && (
        <>
          <div className="extra-payments-section">
            <h3>Extra Payments</h3>

            {/* ➕ Add new extra payment */}
            <div className="input-grid">
              <div className="input-group">
                <label htmlFor="extraPaymentMonth">Extra Payment Month</label>
                <InputNumber
                  id="extraPaymentMonth"
                  value={newPaymentMonth}
                  onValueChange={(e) => setNewPaymentMonth(e.value ?? 0)}
                  showButtons
                  min={1}
                  max={months}
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

              <div className="flex items-end">
                <Button
                  label="Add Payment"
                  icon="pi pi-plus"
                  className="p-button-raised p-button-success w-full"
                  onClick={addPayment}
                />
              </div>
            </div>
          </div>

          {/* 🧾 Existing payments list */}
          {payments.length > 0 && (
            <div className="payments-section">
              <h3>Registered Extra Payments</h3>
              <div className="payment-grid">
                {payments.map((p) => (
                  <div key={p.id} className="payment-card">
                    <div className="payment-row">
                      <InputNumber
                        value={p.month}
                        onValueChange={(e) =>
                          updatePayment(p.id, "month", e.value ?? p.month)
                        }
                        min={1}
                        max={months}
                        inputClassName="w-full"
                      />
                      <InputNumber
                        value={p.amount}
                        onValueChange={(e) =>
                          updatePayment(p.id, "amount", e.value ?? p.amount)
                        }
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                        inputClassName="w-full"
                      />
                      <Button
                        label="Delete"
                        icon="pi pi-trash"
                        className="p-button-raised p-button-danger mt-1 w-full sm:w-auto"
                        onClick={() => deletePayment(p.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 📊 Amortization Table */}
          <h2 className="table-title">Amortization Table</h2>

          <DataTable
            value={table}
            responsiveLayout="scroll"
            stripedRows
            showGridlines
          >
            <Column field="month" header="Month" />
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
                body={(d: AmortizationRow) => currencyFormat(d.insurance ?? 0)}
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
            <Column
              field="extraPayment"
              header="Extra Payment"
              body={(d: AmortizationRow) => currencyFormat(d.extraPayment)}
            />
            <Column
              field="finalBalance"
              header="Final Balance"
              body={(d: AmortizationRow) => currencyFormat(d.finalBalance)}
            />
          </DataTable>
        </>
      )}
    </div>
  );
};
