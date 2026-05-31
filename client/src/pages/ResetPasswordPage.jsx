import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { authApi } from '../api/services';
import { Field, PrimaryButton, SecondaryButton, inputClassName } from '../components/FormFields';
import { LogoLockup } from '../components/LogoLockup';
import { useAuth } from '../hooks/useAuth';

export const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setSubmitting(false);
      return;
    }

    try {
      await authApi.resetPassword(token, { password });
      setMessage('Password reset successful. You can now sign in with your new password.');
      window.setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Unable to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <LogoLockup publicMode />
          <Link to="/login" className="text-sm font-medium text-academy-700 transition hover:text-academy-600">
            Back to sign in
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reset password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter a new password for your library account. This page is linked from your password reset email.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <Field label="New password" hint="Use at least 8 characters.">
              <div className="relative">
                <input
                  className={`${inputClassName} pr-12`}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <Field label="Confirm password">
              <div className="relative">
                <input
                  className={`${inputClassName} pr-12`}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <PrimaryButton type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Please wait...' : 'Update password'}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={() => navigate('/login')}>
                Cancel
              </SecondaryButton>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
