import { Navigate, Route, Routes } from "react-router-dom";
import { AmortizationTable } from "./pages/AmortizationTable/AmortizationTable";

export const App = () => {
  return (
    <Routes>
      <Route path="" element={<Navigate to="main" />} />
      <Route path="main" element={<AmortizationTable />} />
    </Routes>
  );
};
