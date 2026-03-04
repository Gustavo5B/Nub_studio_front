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
import DetalleObra from "../pages/public/DetalleObra";
import Artistas from "../pages/public/Artistas";
import DetalleArtistaPublico from "../pages/public/DetalleArtistaPublico";
import Register from "../pages/public/Register";
import ArtistaEnRevision from "../pages/public/ArtistaEnRevision";
import ActivarCuenta from "../pages/public/ActivarCuenta";
import VerificarEmail from "../pages/public/VerificarEmail";
import ForgotPassword from "../pages/public/ForgotPassword";

export default function PublicRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sobre-nosotros" element={<About />} />
        <Route path="/contacto" element={<Contact />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/obras/:slug" element={<DetalleObra />} />
        <Route path="/artistas" element={<Artistas />} />
        <Route path="/artistas/:id" element={<DetalleArtistaPublico />} />
        <Route path="/blog" element={<div>Blog - Próximamente</div>} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/two-factor-verify" element={<TwoFactorVerify />} />
      <Route path="/verify-email-code" element={<VerifyEmailCode />} />
      <Route path="/activar-cuenta" element={<ActivarCuenta />} />
      <Route path="/verificar-email" element={<VerificarEmail />} />
      <Route path="/artista/pendiente" element={<ArtistaEnRevision />} />
    </Routes>
  );
}