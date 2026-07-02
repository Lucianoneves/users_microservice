import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  registerFormSchema,
  type RegisterFormErrors,
  type RegisterFormInput,
} from '../schemas/register.schema';
import { ApiError, registerUser, saveAuthToken } from '../services/authApi';
import { AuthCard } from './AuthCard';
import { FormField } from './FormField';

const initialValues: RegisterFormInput = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user',
};

export function RegisterForm() {
  const [values, setValues] = useState<RegisterFormInput>(initialValues);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof RegisterFormInput, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = registerFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: RegisterFormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof RegisterFormInput;
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
      const { username, email, password, role } = result.data;
      const auth = await registerUser({ username, email, password, role });
      saveAuthToken(auth.token);
      toast.success(`Conta criada! ID: ${auth.id}`);
      setValues(initialValues);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          toast.error('E-mail ou nome de usuário já cadastrado.');
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
      title="Criar conta"
      subtitle="ACME Corp — Users Service"
      footer="Cadastro integrado com a API em http://localhost:3000"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField
          id="username"
          label="Nome de usuário"
          value={values.username}
          error={errors.username}
          placeholder="ex: maria_silva"
          autoComplete="username"
          onChange={(value) => handleChange('username', value)}
        />

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
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          onChange={(value) => handleChange('password', value)}
        />

        <FormField
          id="confirmPassword"
          label="Confirmar senha"
          type="password"
          value={values.confirmPassword}
          error={errors.confirmPassword}
          placeholder="Repita a senha"
          autoComplete="new-password"
          onChange={(value) => handleChange('confirmPassword', value)}
        />

        <div className="space-y-1.5">
          <label htmlFor="field-role" className="block text-sm font-medium text-slate-700">
            Perfil
          </label>
          <select
            id="field-role"
            name="role"
            value={values.role}
            onChange={(e) =>
              handleChange('role', e.target.value as RegisterFormInput['role'])
            }
            className="w-full rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:ring-offset-1"
          >
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
          {errors.role && (
            <p className="text-xs text-red-600" role="alert">
              {errors.role}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 active:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
        </button>

        <p className="text-center text-xs text-slate-500">
          Já tem uma conta?{' '}
          <Link
            to="/login"
            className="font-medium text-teal-600 transition hover:text-teal-700 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
