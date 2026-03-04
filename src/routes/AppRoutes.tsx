// src/routes/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import PublicRoutes       from "./PublicRoutes";
import NuBDashboard       from "../pages/private/NuBDashboard";
import AdminDashboard     from "../pages/private/admin/AdminDashboard";
import CrearObra          from "../pages/private/admin/CrearObra";
import ListaObras         from "../pages/private/admin/ListaObras";
import EditarObra         from "../pages/private/admin/EditarObra";
import ListaArtistas      from "../pages/private/admin/ListaArtistas";
import CrearArtista       from "../pages/private/admin/CrearArtista";
import EditarArtista      from "../pages/private/admin/EditarArtista";
import DetalleArtista     from "../pages/private/admin/DetalleArtista";
import PrivateRoute       from "../components/PrivateRoute";
import AdminRoute         from "../components/AdminRoute";
import ArtistaRoute       from "../components/ArtistaRoute";
import ArtistaDashboard   from "../pages/private/artista/ArtistaDashboard";
import RegistroArtista    from "../pages/public/RegistroArtista";
import NuevaObra          from "../pages/private/artista/NuevaObra";
import MisObras           from "../pages/private/artista/MisObras";
import EditarObraArtista  from "../pages/private/artista/EditarObra";

// Páginas de error
import NotFound     from "../pages/public/NotFound";
import Unauthorized from "../pages/public/Unauthorized";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/*" element={<PublicRoutes />} />

      <Route path="/dashboard" element={
        <PrivateRoute><NuBDashboard /></PrivateRoute>
      } />

      {/* ── Artista ── */}
      <Route path="/artista/dashboard" element={
        <ArtistaRoute><ArtistaDashboard /></ArtistaRoute>
      } />
      <Route path="/artista/nueva-obra" element={
        <ArtistaRoute><NuevaObra /></ArtistaRoute>
      } />
      <Route path="/artista/mis-obras" element={
        <ArtistaRoute><MisObras /></ArtistaRoute>
      } />
      <Route path="/artista/editar-obra/:id" element={
        <ArtistaRoute><EditarObraArtista /></ArtistaRoute>
      } />

      <Route path="/registro-artista" element={<RegistroArtista />} />

      {/* ── Admin ── */}
      <Route path="/admin" element={
        <AdminRoute><AdminDashboard /></AdminRoute>
      } />
      <Route path="/admin/obras" element={
        <AdminRoute><ListaObras /></AdminRoute>
      } />
      <Route path="/admin/obras/crear" element={
        <AdminRoute><CrearObra /></AdminRoute>
      } />
      <Route path="/admin/obras/editar/:id" element={
        <AdminRoute><EditarObra /></AdminRoute>
      } />
      <Route path="/admin/artistas" element={
        <AdminRoute><ListaArtistas /></AdminRoute>
      } />
      <Route path="/admin/artistas/crear" element={
        <AdminRoute><CrearArtista /></AdminRoute>
      } />
      <Route path="/admin/artistas/editar/:id" element={
        <AdminRoute><EditarArtista /></AdminRoute>
      } />
      <Route path="/admin/artistas/:id" element={
        <AdminRoute><DetalleArtista /></AdminRoute>
      } />

      {/* ── Error pages (siempre al final) ── */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*"             element={<NotFound />} />
    </Routes>
  );
}