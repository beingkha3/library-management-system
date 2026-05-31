import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Breadcrumbs = ({ items = [] }) => {
  const visibleItems = items.filter(Boolean);

  if (!visibleItems.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
      {visibleItems.map((item, index) => {
        const isCurrent = index === visibleItems.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {index > 0 ? <ChevronRight size={14} className="text-slate-300" /> : null}
            {item.to && !isCurrent ? (
              <Link to={item.to} className="transition hover:text-academy-700">
                {item.label}
              </Link>
            ) : (
              <span aria-current={isCurrent ? 'page' : undefined} className={isCurrent ? 'text-slate-900' : undefined}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
};
