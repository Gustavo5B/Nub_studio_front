// src/routes/PublicRoutes.tsx
import { Routes, Route } from "react-router-dom";
import PublicLayout from "../layout/PublicLayout";
import Home from "../pages/public/Home";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import Login from "../pages/public/Login";
import TwoFactorVerify from "../pages/public/TwoFactorVerify";
import VerifyEmailCode from "../pages/public/VerifyEmailCode";
import Catalogo from "../pages/public/Catalogo";
import DetalleObra from "../pages/public/DetalleObra"; // ← NUEVO
import Artistas from "../pages/public/Artistas";
import DetalleArtistaPublico from "../pages/public/DetalleArtistaPublico";
import Register from "../pages/public/Register";  // ← agregar import
import ArtistaEnRevision from "../pages/public/ArtistaEnRevision"

export default function PublicRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sobre-nosotros" element={<About />} />
        <Route path="/contacto" element={<Contact />} />
        <Route path="/artistas" element={<div>Artistas - Próximamente</div>} />
        <Route path="/blog" element={<div>Blog - Próximamente</div>} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/obras/:slug" element={<DetalleObra />} /> {/* ← NUEVO */}
        <Route path="/artistas" element={<Artistas />} />
        <Route path="/artistas/:id" element={<DetalleArtistaPublico />} />
       
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />  {/* ← AGREGAR */}
      <Route path="/two-factor-verify" element={<TwoFactorVerify />} />
      <Route path="/verify-email-code" element={<VerifyEmailCode />} />
       <Route path="/artista/pendiente" element={<ArtistaEnRevision />} />
    </Routes>
  );
}