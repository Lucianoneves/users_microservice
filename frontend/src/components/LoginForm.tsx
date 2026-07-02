import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  loginFormSchema,
  type LoginFormErrors,
  type LoginFormInput,
} from '../schemas/login.schema';
import { ApiError, loginUser, saveAuthToken } from '../services/authApi';
import { AuthCard } from './AuthCard';
import { FormField } from './FormField';

const initialValues: LoginFormInput = {
  email: '',
  password: '',
};

export function LoginForm() {
  const [values, setValues] = useState<LoginFormInput>(initialValues);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof LoginFormInput, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = loginFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: LoginFormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginFormInput;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      toast.error('Verifique os campos do formulário.');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const auth = await loginUser(result.data);
      saveAuthToken(auth.token);
      toast.success(`Login realizado! Bem-vindo(a), usuário #${auth.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          toast.error('E-mail ou senha incorretos.');
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Entrar"
      subtitle="ACME Corp — Users Service"
      footer="Login integrado com a API em http://localhost:3000"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField
          id="email"
          label="E-mail"
          type="email"
          value={values.email}
          error={errors.email}
          placeholder="voce@empresa.com"
          autoComplete="email"
          onChange={(value) => handleChange('email', value)}
        />

        <FormField
          id="password"
          label="Senha"
          type="password"
          value={values.password}
          error={errors.password}
          placeholder="Sua senha"
          autoComplete="current-password"
          onChange={(value) => handleChange('password', value)}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 active:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-center text-xs text-slate-500">
          Não tem uma conta?{' '}
          <Link
            to="/cadastro"
            className="font-medium text-teal-600 transition hover:text-teal-700 hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
