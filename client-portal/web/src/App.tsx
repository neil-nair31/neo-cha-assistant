import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { Dashboard } from "./Dashboard";
import { Login } from "./Login";
import { OpsBoard } from "./OpsBoard";
import { OpsLogin } from "./OpsLogin";
import { OpsShipment } from "./OpsShipment";
import { Shell } from "./Shell";
import { ShipmentDetail } from "./ShipmentDetail";
import { TrackHome } from "./TrackHome";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/app">
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<TrackHome />} />
            <Route path="login" element={<Login />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="shipments/:id" element={<ShipmentDetail />} />
            <Route path="ops/login" element={<OpsLogin />} />
            <Route path="ops" element={<OpsBoard />} />
            <Route path="ops/shipments/:id" element={<OpsShipment />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
