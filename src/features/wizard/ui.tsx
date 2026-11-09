import type { ReactNode } from 'react';

/** Nhóm câu hỏi dạng radio/checkbox có tiêu đề (fieldset + legend cho trình đọc màn hình). */
export function Fieldset({ legend, hint, children }: { legend: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="rounded border border-slate-200 bg-white p-4">
      <legend className="px-1 font-semibold">{legend}</legend>
      {hint && <p className="mb-2 text-sm text-slate-600">{hint}</p>}
      <div className="space-y-2">{children}</div>
    </fieldset>
  );
}

export function Choice({
  type = 'radio',
  name,
  checked,
  onChange,
  label,
  description,
  badge,
}: {
  type?: 'radio' | 'checkbox';
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded border p-3 ${
        checked ? 'border-red-700 bg-red-50' : 'border-slate-200 hover:bg-slate-50'
      }`}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-red-800"
      />
      <span>
        <span className="font-medium">{label}</span>
        {badge && (
          <span className="ml-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
            {badge}
          </span>
        )}
        {description && <span className="mt-0.5 block text-sm text-slate-600">{description}</span>}
      </span>
    </label>
  );
}
