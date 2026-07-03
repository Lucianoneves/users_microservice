import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAuthRole, getAuthToken } from '../services/authApi';

type AdminRouteProps = {
  children: ReactNode;
};

export function AdminRoute({ children }: AdminRouteProps) {
  const token = getAuthToken();
  const role = getAuthRole();
  const isDenied = Boolean(token) && role !== 'admin';

  useEffect(() => {
    if (isDenied) {
      toast.error('Acesso negado. Apenas o administrador pode acessar esta página.');
    }
  }, [isDenied]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/perfil" replace />;
  }

  return <>{children}</>;
}
