// src/components/ClienteRoute.tsx
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface ClienteRouteProps {
  readonly children: React.ReactNode;
}

export default function ClienteRoute({ children }: ClienteRouteProps) {
  const isAuthenticated = authService.isAuthenticated();
  const rol = localStorage.getItem('userRol');

  // No autenticado o sin rol guardado → login
  if (!isAuthenticated || !rol) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado pero con otro rol → redirigir a su dashboard correcto
  if (rol === 'admin') return <Navigate to="/admin" replace />;
  if (rol === 'artista') return <Navigate to="/artista/dashboard" replace />;
  if (rol !== 'cliente') return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
