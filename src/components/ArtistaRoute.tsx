// src/components/ArtistaRoute.tsx
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface ArtistaRouteProps {
  children: React.ReactNode;
}

export default function ArtistaRoute({ children }: ArtistaRouteProps) {
  const isAuthenticated = authService.isAuthenticated();
  const rol = localStorage.getItem('userRol');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (rol !== 'artista') {
    return <Navigate to="/unauthorized" replace />;  
  }

  return <>{children}</>;
}