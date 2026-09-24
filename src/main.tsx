import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// ── Interceptor global de fetch — manejo automático de sesión expirada ──
const _originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const response = await _originalFetch(...args);

  if (response.status === 401) {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    // Solo actuar si el usuario CREÍA estar autenticado
    if (token) {
      // Limpiar sesión
      [
        "access_token", "token", "isLoggedIn",
        "userEmail", "userName", "userId", "userRol",
        "temp_correo_2fa", "artistaFoto",
      ].forEach((k) => localStorage.removeItem(k));

      // Avisar a la app para mostrar toast y redirigir
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    }
  }

  return response; // siempre devolver la respuesta original
};

// ── Registro del Service Worker (PWA) ──────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[PWA] Service Worker registrado ✓", reg.scope);
      })
      .catch((err) => {
        console.error("[PWA] Error al registrar SW:", err);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
