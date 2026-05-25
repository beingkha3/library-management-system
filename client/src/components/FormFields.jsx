export const Field = ({ label, children, hint }) => (
  <label className="block space-y-2">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    {children}
    {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
  </label>
);

export const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-academy-500 focus:ring-4 focus:ring-academy-100';

export const PrimaryButton = ({ className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center rounded-2xl bg-academy-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-academy-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
  />
);

export const SecondaryButton = ({ className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-academy-200 hover:text-academy-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
  />
);
