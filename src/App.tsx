import AppRoutes from "./routes/AppRoutes";
import { ToastProvider } from "./context/ToastContext";
import { CartProvider } from "./context/CartContext";
import { ToastContainer } from "./components/ui/Toast";
import OfflineBanner from "./components/pwa/OfflineBanner";
import PwaSensor from "./components/pwa/PwaSensor";
import SessionGuard from "./components/auth/SessionGuard";

function App() {
  return (
    <ToastProvider>
      <CartProvider>
        {/* PWA: notificación de estado offline/online */}
        <OfflineBanner />
        {/* PWA: sensor GPS — se activa automáticamente */}
        <PwaSensor />
        {/* Auth: cierre automático de sesión cuando el token expira */}
        <SessionGuard />
        <AppRoutes />
        <ToastContainer />
      </CartProvider>
    </ToastProvider>
  );
}

export default App;
