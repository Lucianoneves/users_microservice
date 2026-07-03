import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  resetPasswordFormSchema,
  type ResetPasswordFormErrors,
  type ResetPasswordFormInput,
} from '../schemas/resetPassword.schema';
import { ApiError, resetPassword } from '../services/authApi';
import { AuthCard } from './AuthCard';
import { FormField } from './FormField';

const initialValues: ResetPasswordFormInput = {
  password: '',
  confirmPassword: '',
};

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [values, setValues] = useState<ResetPasswordFormInput>(initialValues);
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof ResetPasswordFormInput, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Link inválido. Solicite uma nova recuperação de senha.');
      return;
    }

    const result = resetPasswordFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: ResetPasswordFormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ResetPasswordFormInput;
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
      await resetPassword({ token, password: result.data.password });
      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          toast.error('Link expirado ou inválido. Solicite uma nova recuperação.');
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

  if (!token) {
    return (
      <AuthCard title="Redefinir senha" subtitle="ACME Corp — Users Service">
        <div className="space-y-5 text-center">
          <p className="text-sm text-slate-600">
            Este link é inválido ou está incompleto.
          </p>
          <Link
            to="/recuperar-senha"
            className="inline-block text-sm font-medium text-teal-600 transition hover:text-teal-700 hover:underline"
          >
            Solicitar nova recuperação
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Nova senha"
      subtitle="ACME Corp — Users Service"
      footer="Defina uma senha com pelo menos 8 caracteres."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField
          id="password"
          label="Nova senha"
          type="password"
          value={values.password}
          error={errors.password}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          onChange={(value) => handleChange('password', value)}
        />

        <FormField
          id="confirmPassword"
          label="Confirmar nova senha"
          type="password"
          value={values.confirmPassword}
          error={errors.confirmPassword}
          placeholder="Repita a senha"
          autoComplete="new-password"
          onChange={(value) => handleChange('confirmPassword', value)}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 active:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
        </button>

        <p className="text-center text-xs text-slate-500">
          <Link
            to="/login"
            className="font-medium text-teal-600 transition hover:text-teal-700 hover:underline"
          >
            Voltar ao login
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
