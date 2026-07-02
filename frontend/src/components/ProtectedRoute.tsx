import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthToken } from '../services/authApi';

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
