import { useId, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDraft } from '../../state/draft-context';
import { STEPS, firstIncompleteBefore, type StepIndex } from './progress';

export function Stepper({ index }: { index: StepIndex }) {
  const { draft } = useDraft();
  return (
    <nav aria-label="Các bước" className="print:hidden">
      <ol className="grid grid-cols-4 gap-1 text-xs sm:text-sm">
        {STEPS.map((s, i) => {
          const current = i === index;
          const done = i < index;
          const reachable = firstIncompleteBefore(draft, i as StepIndex) === null;
          const cls = `block rounded border-b-4 px-1 py-1.5 text-center ${
            current
              ? 'border-red-800 font-semibold text-slate-900'
              : done
                ? 'border-red-300 text-slate-700'
                : 'border-slate-200 text-slate-500'
          }`;
          const content = (
            <>
              <span className="block font-semibold">{i + 1}</span>
              <span className="hidden sm:block">{s.short}</span>
              <span className="sr-only sm:hidden">{s.short}</span>
            </>
          );
          return (
            <li key={s.path}>
              {reachable && !current ? (
                <Link to={s.path} className={`${cls} hover:bg-slate-100`}>
                  {content}
                </Link>
              ) : (
                <span className={cls} aria-current={current ? 'step' : undefined}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Thông báo khi vào thẳng một bước mà bước trước chưa xong. */
export function StepGuard({ missing }: { missing: StepIndex }) {
  const s = STEPS[missing];
  return (
    <div role="alert" className="rounded border border-amber-300 bg-amber-50 p-4">
      <p className="font-semibold">Bạn chưa hoàn thành {s.title.split(':')[0]}.</p>
      <p className="mt-1 text-sm">Các lựa chọn ở bước đó quyết định bộ giấy tờ cần chuẩn bị.</p>
      <Link to={s.path} className="mt-3 inline-block rounded bg-red-800 px-4 py-2 text-white hover:bg-red-900">
        Đến {s.title.split(':')[0]}
      </Link>
    </div>
  );
}

interface StepShellProps {
  index: 0 | 1 | 2;
  children: ReactNode;
  /** Lỗi còn thiếu: nếu không rỗng, bấm Tiếp tục sẽ hiện lỗi và không chuyển bước. */
  errors?: string[];
  /** Gọi trước khi chuyển bước (lưu dữ liệu). Trả false để chặn. */
  onNext?: () => boolean | Promise<boolean>;
  onBack?: () => void;
}

export function StepShell({ index, children, errors = [], onNext, onBack }: StepShellProps) {
  const navigate = useNavigate();
  const { draft } = useDraft();
  const [showErrors, setShowErrors] = useState(false);
  const errId = useId();
  const step = STEPS[index];
  const prev = index === 0 ? '/' : (STEPS[index - 1]?.path ?? '/');
  const next = STEPS[index + 1]?.path ?? '/ket-qua';
  const missing = firstIncompleteBefore(draft, index);

  const goNext = async () => {
    if (errors.length > 0) {
      setShowErrors(true);
      return;
    }
    if (onNext && !(await onNext())) return;
    void navigate(next);
  };

  return (
    <div className="space-y-5">
      <Stepper index={index} />
      <h1 className="text-xl font-semibold sm:text-2xl">{step.title}</h1>
      {missing !== null ? (
        <StepGuard missing={missing} />
      ) : (
        <>
          {children}
          {showErrors && errors.length > 0 && (
            <div id={errId} role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
              <p className="font-semibold">Bạn cần hoàn thành trước khi tiếp tục:</p>
              <ul className="list-disc pl-5">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => {
                onBack?.();
                void navigate(prev);
              }}
              className="rounded border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={() => void goNext()}
              aria-describedby={showErrors && errors.length > 0 ? errId : undefined}
              className="rounded bg-red-800 px-5 py-2 font-medium text-white hover:bg-red-900"
            >
              Tiếp tục
            </button>
          </div>
        </>
      )}
    </div>
  );
}
