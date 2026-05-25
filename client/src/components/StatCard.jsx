export const StatCard = ({ label, value, tone = 'default', hint }) => {
  const toneMap = {
    default: 'bg-white border-slate-200',
    navy: 'bg-academy-900 border-academy-900 text-white',
    blue: 'bg-academy-500 border-academy-500 text-white',
    green: 'bg-emerald-50 border-emerald-200',
    amber: 'bg-amber-50 border-amber-200'
  };

  const labelToneMap = {
    default: 'text-slate-500',
    navy: 'text-slate-300',
    blue: 'text-blue-100',
    green: 'text-emerald-700',
    amber: 'text-amber-700'
  };

  const hintToneMap = {
    default: 'text-slate-400',
    navy: 'text-slate-400',
    blue: 'text-blue-100/80',
    green: 'text-emerald-700/80',
    amber: 'text-amber-700/80'
  };

  return (
    <div className={`rounded-[24px] border px-5 py-4 shadow-card ${toneMap[tone] || toneMap.default}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${labelToneMap[tone] || labelToneMap.default}`}>{label}</p>
      <p className="mt-3 text-[28px] font-semibold tracking-tight">{value}</p>
      {hint ? <p className={`mt-2 text-sm ${hintToneMap[tone] || hintToneMap.default}`}>{hint}</p> : null}
    </div>
  );
};
