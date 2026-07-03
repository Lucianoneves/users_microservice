import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute } from './components/AdminRoute';
import { AdminUsersPanel } from './components/AdminUsersPanel';
import { AppToastContainer } from './components/AppToastContainer';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { LoginForm } from './components/LoginForm';
import { PerfilForm } from './components/PerfilForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RegisterForm } from './components/RegisterForm';
import { ReactivateForm } from './components/ReactivateForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';

export function App() {
  return (
    <>
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/cadastro" element={<RegisterForm />} />
          <Route path="/reativar" element={<ReactivateForm />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordForm />} />
          <Route path="/redefinir-senha" element={<ResetPasswordForm />} />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <PerfilForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminUsersPanel />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
      <AppToastContainer />
    </>
  );
}
