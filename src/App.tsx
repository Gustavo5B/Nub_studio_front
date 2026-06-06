import AppRoutes from "./routes/AppRoutes";
import { ToastProvider } from "./context/ToastContext";
import { CartProvider } from "./context/CartContext";
import { ToastContainer } from "./components/ui/Toast";

function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <AppRoutes />
        <ToastContainer />
      </CartProvider>
    </ToastProvider>
  );
}

export default App;