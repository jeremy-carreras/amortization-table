import { Navigate, Route, Routes } from "react-router-dom";
import { AmortizationTable } from "./pages/AmortizationTable/AmortizationTable";

export const App = () => {
  return (
    <Routes>
      <Route path="" element={<Navigate to="amortization-table" />} />
      <Route path="amortization-table" element={<AmortizationTable />} />
    </Routes>
  );
};
