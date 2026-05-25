import { Link } from 'react-router-dom';

export const UnauthorizedPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div className="max-w-lg rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-academy-500">Access restricted</p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-900">You do not have access to this page.</h1>
      <p className="mt-3 text-sm text-slate-500">
        Your account is signed in, but this route requires a different role or a higher permission level.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
          Back home
        </Link>
        <Link to="/login" className="rounded-2xl bg-academy-500 px-5 py-3 text-sm font-semibold text-white">
          Sign in again
        </Link>
      </div>
    </div>
  </div>
);
