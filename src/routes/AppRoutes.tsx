import { Routes, Route } from "react-router-dom";
import PublicRoutes       from "./PublicRoutes";
import NuBDashboard       from "../pages/private/NuBDashboard";
import AdminDashboard     from "../pages/private/admin/AdminDashboard";
import ListaObras         from "../pages/private/admin/ListaObras";
import EditarObra         from "../pages/private/admin/EditarObra";
import ListaArtistas      from "../pages/private/admin/ListaArtistas";
import CrearArtista       from "../pages/private/admin/CrearArtista";
import EditarArtista      from "../pages/private/admin/EditarArtista";
import DetalleArtista     from "../pages/private/admin/DetalleArtista";
import Backups            from "../pages/private/admin/Backups";
import AdminReportes      from "../pages/private/admin/AdminReportes";
import AdminImportar      from "../pages/private/admin/AdminImportar";
import AdminMonitoreo     from "../pages/private/admin/AdminMonitoreo";  // ← nuevo
import AdminLayout        from "../layout/AdminLayout";
import ArtistaLayout      from "../layout/ArtistaLayout";
import PrivateRoute       from "../components/PrivateRoute";
import AdminRoute         from "../components/AdminRoute";
import ArtistaRoute       from "../components/ArtistaRoute";
import ArtistaDashboard   from "../pages/private/artista/ArtistaDashboard";
import NuevaObra          from "../pages/private/artista/NuevaObra";
import MisObras           from "../pages/private/artista/MisObras";
import EditarObraArtista  from "../pages/private/artista/EditarObra";
import MiPerfilPage       from "../pages/private/artista/MiPerfilPage";
import RegistroArtista    from "../pages/public/RegistroArtista";
import VerificarEmail     from "../pages/public/VerificarEmail";
import NotFound           from "../pages/public/NotFound";
import Unauthorized       from "../pages/public/Unauthorized";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/*" element={<PublicRoutes />} />

      <Route path="/dashboard" element={
        <PrivateRoute><NuBDashboard /></PrivateRoute>
      } />

      {/* ── Artista ── */}
      <Route path="/artista" element={
        <ArtistaRoute><ArtistaLayout /></ArtistaRoute>
      }>
        <Route path="dashboard"       element={<ArtistaDashboard />} />
        <Route path="nueva-obra"      element={<NuevaObra />} />
        <Route path="mis-obras"       element={<MisObras />} />
        <Route path="editar-obra/:id" element={<EditarObraArtista />} />
        <Route path="perfil"          element={<MiPerfilPage />} />
      </Route>

      <Route path="/registro-artista" element={<RegistroArtista />} />
      <Route path="/verificar-email"  element={<VerificarEmail />} />

      {/* ── Admin ── */}
      <Route path="/admin" element={
        <AdminRoute><AdminLayout /></AdminRoute>
      }>
        <Route index                      element={<AdminDashboard />} />
        <Route path="obras"               element={<ListaObras />} />
        <Route path="obras/editar/:id"    element={<EditarObra />} />
        <Route path="artistas"            element={<ListaArtistas />} />
        <Route path="artistas/crear"      element={<CrearArtista />} />
        <Route path="artistas/editar/:id" element={<EditarArtista />} />
        <Route path="artistas/:id"        element={<DetalleArtista />} />
        <Route path="backups"             element={<Backups />} />
        <Route path="reportes"            element={<AdminReportes />} />
        <Route path="importar"            element={<AdminImportar />} />
        <Route path="monitoreo"           element={<AdminMonitoreo />} />  {/* ← nuevo */}
      </Route>

      {/* ── Error pages ── */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*"             element={<NotFound />} />
    </Routes>
  );
}