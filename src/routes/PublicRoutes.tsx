// src/routes/PublicRoutes.tsx (SIN NAVBAR EN ARTISTAS, CATÁLOGO, ETC.)
import { Routes, Route } from "react-router-dom";
import PublicLayout           from "../layout/PublicLayout";
import Home                   from "../pages/public/Home";
import About                  from "../pages/public/About";
import Contact                from "../pages/public/Contact";
import Login                  from "../pages/public/Login";
import TwoFactorVerify        from "../pages/public/TwoFactorVerify";
import VerifyEmailCode        from "../pages/public/VerifyEmailCode";
import Catalogo               from "../pages/public/Catalogo";
import DetalleObra            from "../pages/public/DetalleObra";
import Artistas               from "../pages/public/Artistas";
import DetalleArtistaPublico  from "../pages/public/DetalleArtistaPublico";
import DetalleColeccionPublico from "../pages/public/DetalleColeccionPublico"; // 👈 NUEVA IMPORTACIÓN
import Register               from "../pages/public/Register";
import ArtistaEnRevision      from "../pages/public/ArtistaEnRevision";
import ActivarCuenta          from "../pages/public/ActivarCuenta";
import VerificarEmail         from "../pages/public/VerificarEmail";
import ForgotPassword         from "../pages/public/ForgotPassword";
import Blog                   from "../pages/public/Blog";
import BlogDetalle             from "../pages/public/BlogDetalle";

// Página de error
import NotFound from "../pages/public/NotFound";

export default function PublicRoutes() {
  return (
    <Routes>
      {/* Páginas CON layout (HOME, BLOG, SOBRE NOSOTROS) */}
      <Route element={<PublicLayout />}>
        <Route path="/"                element={<Home />} />
      </Route>

      {/* Páginas SIN navbar */}
      <Route path="/catalogo"           element={<Catalogo />} />
      <Route path="/obras/:slug"        element={<DetalleObra />} />
      <Route path="/artistas"           element={<Artistas />} />
      <Route path="/artistas/:matricula" element={<DetalleArtistaPublico />} />
      <Route path="/colecciones/:slug"  element={<DetalleColeccionPublico />} /> {/* 👈 NUEVA RUTA */}
      <Route path="/blog"               element={<Blog />} />
      <Route path="/blog/:slug"         element={<BlogDetalle />} />
      <Route path="/sobre-nosotros"     element={<About />} />

      {/* Contacto SIN layout */}
      <Route path="/contacto" element={<Contact />} />

      {/* Rutas de autenticación SIN layout */}
      <Route path="/login"              element={<Login />} />
      <Route path="/forgot-password"    element={<ForgotPassword />} />
      <Route path="/register"           element={<Register />} />
      <Route path="/two-factor-verify"  element={<TwoFactorVerify />} />
      <Route path="/verify-email-code"  element={<VerifyEmailCode />} />
      <Route path="/activar-cuenta"     element={<ActivarCuenta />} />
      <Route path="/verificar-email"    element={<VerificarEmail />} />
      <Route path="/artista/pendiente"  element={<ArtistaEnRevision />} />

      {/* Cualquier ruta pública no reconocida → 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}