// src/components/AdminRoute.tsx
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const isAuthenticated = authService.isAuthenticated();
  const rol = localStorage.getItem('userRol');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (rol !== 'admin') {
    return <Navigate to="/unauthorized" replace />;  
  }

  return <>{children}</>;
}