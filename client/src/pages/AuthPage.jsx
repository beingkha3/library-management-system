import { Eye, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { Breadcrumbs } from '../components/Breadcrumbs';
import { Field, PrimaryButton, SecondaryButton, inputClassName } from '../components/FormFields';
import { LogoLockup } from '../components/LogoLockup';
import { useAuth } from '../hooks/useAuth';

const authCopy = {
  login: {
    title: 'Sign in',
    subtitle: 'Access your library account to borrow books, track due dates, and manage fines.',
    primary: 'Sign In',
    alternateLabel: 'Need an account?',
    alternateTo: '/register',
    alternateText: 'Create one'
  },
  register: {
    title: 'Create account',
    subtitle: 'Create a library member account to borrow books and track your reading activity.',
    primary: 'Create Account',
    alternateLabel: 'Already have an account?',
    alternateTo: '/login',
    alternateText: 'Sign in'
  }
};

const roleLandingMap = {
  member: '/app',
  librarian: '/staff',
  admin: '/admin'
};

const memberAccessNotes = [
  'Borrow and reserve books',
  'Track due dates and fines',
  'View reading history and reviews'
];

export const AuthPage = ({ mode }) => {
  const { isAuthenticated, user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const copy = authCopy[mode];

  const redirectTo = useMemo(() => {
    if (user?.role) {
      return roleLandingMap[user.role] || '/app';
    }

    return location.state?.from || '/app';
  }, [location.state?.from, user?.role]);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let nextAuth;

      if (mode === 'login') {
        nextAuth = await login({ email: form.email, password: form.password });
      } else {
        nextAuth = await register(form);
      }

      navigate(location.state?.from || roleLandingMap[nextAuth.user.role] || '/app');
    } catch (err) {
      setError(err.message || 'Unable to continue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center justify-between border-b border-slate-200 bg-white px-1 py-4 sm:px-0">
          <div className="flex items-center gap-3">
            <LogoLockup compact />
            <div>
              <p className="text-sm font-semibold text-slate-900">Library Management System</p>
              <p className="text-xs text-slate-500">Library member access</p>
            </div>
          </div>
          <Link to="/" className="text-sm font-semibold text-academy-700">
            Back to home
          </Link>
        </div>

        <div className="mb-5">
          <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: copy.title }]} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-card">
            <h2 className="text-2xl font-semibold text-slate-900">Library member access</h2>
            <div className="mt-5 grid gap-3">
              {memberAccessNotes.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-card sm:p-7">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{copy.title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">{copy.subtitle}</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {mode === 'register' ? (
                <Field label="Name">
                  <input
                    className={inputClassName}
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Aarav Sharma"
                    required
                  />
                </Field>
              ) : null}

              <Field label="Email">
                <input
                  className={inputClassName}
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="member@example.com"
                  required
                />
              </Field>

              <Field label="Password">
                <div className="relative">
                  <input
                    className={`${inputClassName} pr-12`}
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Enter password"
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

              {mode === 'register' ? (
                <>
                  <Field label="Phone">
                    <input
                      className={inputClassName}
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      placeholder="9876543210"
                    />
                  </Field>
                  <Field label="Address">
                    <textarea
                      className={`${inputClassName} min-h-28 resize-y`}
                      value={form.address}
                      onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                      placeholder="Campus hostel or residential address"
                    />
                  </Field>
                </>
              ) : null}

              {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <PrimaryButton type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Please wait...' : copy.primary}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={() => setForm({ name: '', email: '', password: '', phone: '', address: '' })}>
                  Reset
                </SecondaryButton>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <p>
                  {copy.alternateLabel}{' '}
                  <Link to={copy.alternateTo} className="font-semibold text-academy-700">
                    {copy.alternateText}
                  </Link>
                </p>
                {mode === 'login' ? <button type="button" className="font-semibold text-academy-700">Forgot password</button> : null}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
