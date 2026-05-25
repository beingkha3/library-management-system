export const LoadingState = ({ label = 'Loading data...' }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-card">
    {label}
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

export const BackendUnavailableState = ({ apiUrl, action }) => (
  <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 shadow-card">
    <h3 className="text-lg font-semibold text-slate-900">Unable to connect to the server. Please make sure the backend is running.</h3>
    <p className="mt-2 text-sm leading-6 text-amber-800">Expected API URL: {apiUrl}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

export const EmptyState = ({ title, description, action }) => (
  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-card">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mt-2 text-sm text-slate-500">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);
