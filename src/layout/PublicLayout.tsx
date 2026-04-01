// src/layout/PublicLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "../styles/layout.css";

export default function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="layout">
      {!isHome && <Navbar />}

      <main className="main">
        <Outlet />
      </main>

      {!isHome && <Footer />}
    </div>
  );
}