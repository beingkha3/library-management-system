export const PageHeader = ({ eyebrow, title, description, actions, metadata = [] }) => (
  <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-card sm:px-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-academy-500">{eyebrow}</p> : null}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
        {metadata.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {metadata.map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3 xl:justify-end">{actions}</div> : null}
    </div>
  </div>
);
