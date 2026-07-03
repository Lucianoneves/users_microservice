import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormErrors,
  type ForgotPasswordFormInput,
} from '../schemas/forgotPassword.schema';
import { ApiError, requestPasswordReset } from '../services/authApi';
import { AuthCard } from './AuthCard';
import { FormField } from './FormField';

const initialValues: ForgotPasswordFormInput = {
  email: '',
};

export function ForgotPasswordForm() {
  const [values, setValues] = useState<ForgotPasswordFormInput>(initialValues);
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (field: keyof ForgotPasswordFormInput, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = forgotPasswordFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: ForgotPasswordFormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ForgotPasswordFormInput;
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
      const response = await requestPasswordReset(result.data.email);
      setIsSubmitted(true);
      toast.success(response.message);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="ACME Corp — Users Service"
      footer="Em desenvolvimento, o link de redefinição aparece nos logs do backend."
    >
      {isSubmitted ? (
        <div className="space-y-5 text-center">
          <p className="text-sm text-slate-600">
            Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.
          </p>
          <Link
            to="/login"
            className="inline-block text-sm font-medium text-teal-600 transition hover:text-teal-700 hover:underline"
          >
            Voltar ao login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <p className="text-sm text-slate-600">
            Informe o e-mail da sua conta. Enviaremos um link para criar uma nova senha.
          </p>

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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 active:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>

          <p className="text-center text-xs text-slate-500">
            Lembrou a senha?{' '}
            <Link
              to="/login"
              className="font-medium text-teal-600 transition hover:text-teal-700 hover:underline"
            >
              Entrar
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
