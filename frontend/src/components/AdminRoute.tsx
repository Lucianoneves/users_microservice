import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthRole, getAuthToken } from '../services/authApi';

type AdminRouteProps = {
  children: ReactNode;
};

export function AdminRoute({ children }: AdminRouteProps) {
  const token = getAuthToken();
  const role = getAuthRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/perfil" replace />;
  }

  return <>{children}</>;
}
