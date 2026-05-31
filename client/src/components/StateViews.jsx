export const LoadingState = ({ label = 'Loading data...' }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-card">
    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-academy-500" />
    <p className="text-sm text-slate-500">{label}</p>
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-card">
    <p className="font-semibold">Something went wrong</p>
    <p className="mt-2">{message}</p>
    {onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-2xl bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700"
      >
        Retry
      </button>
    ) : null}
  </div>
);

export const BackendUnavailableState = ({ action }) => (
  <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-card">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
        <span className="text-base font-bold">!</span>
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">Server unavailable</h3>
        <p className="mt-1 text-sm leading-6 text-amber-800">Could not connect to the library server. Showing sample data.</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  </div>
);

export const EmptyState = ({ title, description, action }) => (
  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-card">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mt-2 text-sm text-slate-500">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);
