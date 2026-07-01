import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  loginFormSchema,
  type LoginFormErrors,
  type LoginFormInput,
} from '../schemas/login.schema';
import { AuthCard } from './AuthCard';
import { FormField } from './FormField';

const initialValues: LoginFormInput = {
  email: '',
  password: '',
};

export function LoginForm() {
  const [values, setValues] = useState<LoginFormInput>(initialValues);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: keyof LoginFormInput, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitted) setSubmitted(false);
  };

  const handleSubmit = (e: FormEvent) => {
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
      return;
    }

    setErrors({});
    setSubmitted(true);
  };

  return (
    <AuthCard
      title="Entrar"
      subtitle="ACME Corp — Users Service"
      footer="Validação local com Zod — sem envio ao servidor"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {submitted && (
          <div
            className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800"
            role="status"
          >
            Formulário válido! A integração com o backend será feita em seguida.
          </div>
        )}

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
          className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 active:bg-teal-800"
        >
          Entrar
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
