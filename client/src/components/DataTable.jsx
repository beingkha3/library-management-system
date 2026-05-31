export const DataTable = ({ columns, rows, emptyMessage = 'No records found.' }) => {
  const gridTemplate = columns.map((col) => col.width ?? '1fr').join(' ');

  if (!rows?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
      <div
        className="hidden border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 md:grid"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {columns.map((column) => (
          <div key={column.key}>{column.label}</div>
        ))}
      </div>
      <div className="divide-y divide-slate-200">
        {rows.map((row, index) => (
          <div
            key={row._id || row.id || index}
            className="px-5 py-4 transition hover:bg-slate-50/70 md:grid md:items-center md:gap-3"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {columns.map((column) => (
              <div key={column.key} className="mb-4 text-sm text-slate-700 last:mb-0 md:mb-0">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                  {column.label}
                </div>
                {column.render ? column.render(row) : row[column.key]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
