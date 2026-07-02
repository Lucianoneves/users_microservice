import type { ReactNode } from 'react';

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function AuthCard({ title, subtitle, children, footer, className }: AuthCardProps) {
  return (
    <div className={`w-full ${className ?? 'max-w-md'}`}>
      <div className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-card">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-bold text-white">
              A
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">{title}</h1>
              {subtitle && <p className="text-sm text-teal-100">{subtitle}</p>}
            </div>
          </div>
        </div>

        <div className="px-8 py-7">{children}</div>
      </div>

      {footer && (
        <p className="mt-6 text-center text-xs text-slate-400">{footer}</p>
      )}
    </div>
  );
}
