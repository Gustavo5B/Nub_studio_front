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
import MisColecciones       from "../pages/private/artista/MisColecciones";
import NuevaColeccion       from "../pages/private/artista/NuevaColeccion";
import DetalleObraArtista   from "../pages/private/artista/DetalleObraArtista";
import MisBlogPosts         from "../pages/private/artista/MisBlogPosts";
import NuevoPost            from "../pages/private/artista/NuevoPost";
import RegistroArtista    from "../pages/public/RegistroArtista";
import VerificarEmail     from "../pages/public/VerificarEmail";
import NotFound           from "../pages/public/NotFound";
import Unauthorized       from "../pages/public/Unauthorized";
import AdminEstadisticas from "../pages/private/admin/AdminEstadisticas";
import AdminSobreNosotros from "../pages/private/admin/sobreNosotros";
import AdminColecciones   from "../pages/private/admin/AdminColecciones";
import AdminClientes      from "../pages/private/admin/AdminClientes";
import AdminVentas        from "../pages/private/admin/AdminVentas";
import AdminBlog          from "../pages/private/admin/AdminBlog";
import ClienteRoute       from "../components/ClienteRoute";
import MiCuenta           from "../pages/cliente/MiCuenta";
import Carrito            from "../pages/cliente/Carrito";
import MisPedidos         from "../pages/cliente/MisPedidos";
import MisFavoritos       from "../pages/cliente/MisFavoritos";

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
        <Route path="dashboard"                    element={<ArtistaDashboard />} />
        <Route path="nueva-obra"                   element={<NuevaObra />} />
        <Route path="mis-obras"                    element={<MisObras />} />
        <Route path="editar-obra/:id"              element={<EditarObraArtista />} />
        <Route path="perfil"                       element={<MiPerfilPage />} />
        <Route path="colecciones"                  element={<MisColecciones />} />
        <Route path="colecciones/nueva"            element={<NuevaColeccion />} />
        <Route path="colecciones/:id/editar"       element={<NuevaColeccion />} />
        <Route path="obra/:id"                     element={<DetalleObraArtista />} />
        <Route path="blog"                         element={<MisBlogPosts />} />
        <Route path="blog/nuevo"                   element={<NuevoPost />} />
        <Route path="blog/editar/:id"              element={<NuevoPost />} />
      </Route>

      <Route path="/registro-artista" element={<RegistroArtista />} />
      <Route path="/verificar-email"  element={<VerificarEmail />} />

      {/* ── Admin ── */}
      <Route path="/admin" element={
        <AdminRoute><AdminLayout /></AdminRoute>
      }>
        <Route path="estadisticas" element={<AdminEstadisticas />} />
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
        <Route path="colecciones"    element={<AdminColecciones />} />
        <Route path="sobre-nosotros" element={<AdminSobreNosotros />} />
        <Route path="clientes"       element={<AdminClientes />} />
        <Route path="ventas"         element={<AdminVentas />} />
        <Route path="blog"           element={<AdminBlog />} />
        <Route path="blog/nuevo"     element={<NuevoPost />} />
        <Route path="blog/editar/:id" element={<NuevoPost />} />
      </Route>

      {/* ── Cliente ── */}
      <Route path="/mi-cuenta" element={<ClienteRoute><MiCuenta /></ClienteRoute>} />
      <Route path="/mi-cuenta/carrito" element={<ClienteRoute><Carrito /></ClienteRoute>} />
      <Route path="/mi-cuenta/pedidos"    element={<ClienteRoute><MisPedidos /></ClienteRoute>} />
      <Route path="/mi-cuenta/favoritos" element={<ClienteRoute><MisFavoritos /></ClienteRoute>} />

      {/* ── Error pages ── */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*"             element={<NotFound />} />
    </Routes>
  );
}