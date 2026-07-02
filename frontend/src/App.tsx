import { Navigate, Route, Routes } from 'react-router-dom';
import { AppToastContainer } from './components/AppToastContainer';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';

export function App() {
  return (
    <>
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/cadastro" element={<RegisterForm />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
      <AppToastContainer />
    </>
  );
}
