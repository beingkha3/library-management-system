export const SectionCard = ({ title, description, action, children, className = '' }) => (
  <section className={`rounded-[26px] border border-slate-200 bg-white p-5 shadow-card sm:p-6 ${className}`}>
    {(title || action) && (
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          {title ? <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h3> : null}
          {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    )}
    {children}
  </section>
);
