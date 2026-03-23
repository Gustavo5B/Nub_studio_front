// src/components/PrivateRoute.tsx
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface PrivateRouteProps {
  readonly children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Si no está autenticado, redirigir a login
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, mostrar el componente
  return <>{children}</>;
}