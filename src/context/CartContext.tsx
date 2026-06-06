// src/context/CartContext.tsx
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authService } from "../services/authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface CartContextValue {
  cartCount: number;
  refreshCart: () => void;
}

const CartContext = createContext<CartContextValue>({ cartCount: 0, refreshCart: () => {} });

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = useCallback(async () => {
    const token = authService.getToken();
    const rol   = localStorage.getItem("userRol");
    // Solo clientes tienen carrito
    if (!token || (rol && rol !== "cliente")) {
      setCartCount(0);
      return;
    }
    try {
      const res  = await fetch(`${API_URL}/api/carrito`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCartCount(data.data.length);
      else setCartCount(0);
    } catch {
      // silencioso — no interrumpir la UI por un fallo de red
      setCartCount(0);
    }
  }, []);

  // Cargar al montar y cuando el usuario haga login/logout
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Escuchar el evento personalizado que dispara Carrito cuando cambia
  useEffect(() => {
    const handler = () => refreshCart();
    window.addEventListener("cartUpdated", handler);
    return () => window.removeEventListener("cartUpdated", handler);
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

/** Emite el evento para que el Navbar actualice el contador */
export function emitCartUpdate() {
  window.dispatchEvent(new CustomEvent("cartUpdated"));
}
