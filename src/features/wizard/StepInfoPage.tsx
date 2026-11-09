import { useEffect, useId, useState, type ReactNode } from 'react';
import { useFieldArray, useForm, useWatch, type Control, type FieldErrors, type Resolver, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applicantSchema } from '../../domain/schemas';
import type { Applicant } from '../../domain/types';
import { resolveDocuments } from '../../data/rules';
import { INCOME_REF, checkIncome, parseMoney } from '../../data/income';
import { MANIFESTS } from '../../templates/manifest';
import { isFieldUsed, usedApplicantPaths } from '../../templates/data';
import { useDraft, type Draft } from '../../state/draft-context';
import { StepShell } from './StepShell';
import { firstIncompleteBefore } from './progress';
import {
  APPLICANT_FIELDS,
  APPLICANT_K7_FIELDS,
  EMPTY_MEMBER,
  kinhGuiForms,
  SPOUSE_FIELDS,
  SPOUSE_K7_FIELDS,
  cleanApplicant,
  toFormValues,
  type FieldDef,
  type FormValues,
} from './applicant-fields';

const HINT = 'Để trống nếu muốn tự điền tay sau khi in.';
const inputCls = 'mt-1 w-full rounded border border-slate-300 px-3 py-2 aria-[invalid=true]:border-red-600';

function errorAt(errors: FieldErrors<FormValues>, name: string): string | undefined {
  let cur: unknown = errors;
  for (const seg of name.split('.')) cur = (cur as Record<string, unknown> | undefined)?.[seg];
  const msg = (cur as { message?: unknown } | undefined)?.message;
  return typeof msg === 'string' ? msg : undefined;
}

function Field({
  def,
  register,
  errors,
  hintId,
}: {
  def: FieldDef;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  hintId: string;
}) {
  const id = useId();
  const err = errorAt(errors, def.name);
  const describedBy = [hintId, err ? `${id}-err` : '', def.kind === 'money' ? `${id}-ex` : '', def.help ? `${id}-help` : '']
    .filter(Boolean)
    .join(' ');
  const common = {
    id,
    'aria-invalid': err ? true : undefined,
    'aria-describedby': describedBy,
    className: inputCls,
    ...register(def.name),
  };
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {def.label}
      </label>
      {def.kind === 'gioiTinh' ? (
        <select {...common}>
          <option value="">(Để trống)</option>
          <option value="nam">Nam</option>
          <option value="nu">Nữ</option>
        </select>
      ) : def.kind === 'yesNo' ? (
        <select {...common}>
          <option value="">(Để trống)</option>
          <option value="true">Có</option>
          <option value="false">Không</option>
        </select>
      ) : (
        <input
          {...common}
          type={def.kind === 'date' ? 'date' : def.kind === 'tel' ? 'tel' : 'text'}
          inputMode={def.kind === 'cccd' || def.kind === 'money' ? 'numeric' : undefined}
          maxLength={def.kind === 'cccd' ? 12 : undefined}
          autoComplete={def.autoComplete ?? 'off'}
        />
      )}
      {def.help && (
        <p id={`${id}-help`} className="mt-0.5 text-xs text-slate-500">
          {def.help}
        </p>
      )}
      {def.kind === 'money' && (
        <p id={`${id}-ex`} className="mt-0.5 text-xs text-slate-500">
          Ví dụ: 12.000.000
        </p>
      )}
      {err && (
        <p id={`${id}-err`} className="mt-0.5 text-sm text-red-700">
          {err}
        </p>
      )}
    </div>
  );
}

function Section({ title, hidden, children }: { title: string; hidden?: number; children: (hintId: string) => ReactNode }) {
  const hintId = useId();
  return (
    <fieldset className="rounded border border-slate-200 bg-white p-4">
      <legend className="px-1 font-semibold">{title}</legend>
      <p id={hintId} className="mb-3 text-sm text-slate-600">
        Mọi trường đều không bắt buộc. {HINT}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">{children(hintId)}</div>
      {hidden ? <p className="mt-2 text-xs text-slate-500">Đã ẩn {hidden} trường mà các mẫu của bạn không dùng.</p> : null}
    </fieldset>
  );
}

function IncomeWarning({ control, married }: { control: Control<FormValues, unknown, Applicant>; married: boolean }) {
  const [own, spouse, nuoiCon] = useWatch({
    control,
    name: ['thuNhapBinhQuanThang', 'voChong.thuNhap', 'nuoiConDuoiTuoiThanhNien'],
  });
  const w = checkIncome({
    tinhTrangHonNhan: married ? 'da_ket_hon' : undefined,
    thuNhapBinhQuanThang: parseMoney(own),
    voChong: { thuNhap: parseMoney(spouse) },
    nuoiConDuoiTuoiThanhNien: nuoiCon,
  });
  if (!w) return null;
  return (
    <div role="status" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
      <p className="font-semibold">Lưu ý về điều kiện thu nhập</p>
      <p>{w.message}</p>
      <p className="mt-1 text-slate-700">
        Theo {INCOME_REF}, bạn có thể không đủ điều kiện về thu nhập. Đây chỉ là cảnh báo, bạn vẫn có thể tiếp tục tạo hồ
        sơ.
      </p>
    </div>
  );
}

const MEMBER_FIELDS: { key: keyof typeof EMPTY_MEMBER; label: (i: number) => string; kind: 'text' | 'cccd' | 'date' }[] = [
  { key: 'hoTen', label: (i) => `Họ và tên (thành viên ${i + 1})`, kind: 'text' },
  { key: 'quanHe', label: () => 'Quan hệ với người đứng đơn', kind: 'text' },
  { key: 'soDinhDanh', label: () => 'Số định danh cá nhân', kind: 'cccd' },
  { key: 'ngayCap', label: () => 'Ngày cấp CCCD', kind: 'date' },
  { key: 'noiCap', label: () => 'Nơi cấp CCCD', kind: 'text' },
];

function KinhGuiSection({ draft, setDraft }: { draft: Draft; setDraft: (u: (d: Draft) => Draft) => void }) {
  const hintId = useId();
  const baseId = useId();
  if (!draft.doiTuong || !draft.dieuKienNhaO) return null;
  const forms = kinhGuiForms(resolveDocuments({ ...draft, doiTuong: draft.doiTuong, dieuKienNhaO: draft.dieuKienNhaO }), MANIFESTS);
  if (forms.length === 0) return null;
  const set = (id: string, value: string) =>
    setDraft((d) => {
      const kinhGui = { ...d.kinhGui };
      if (value.trim() === '') delete kinhGui[id];
      else kinhGui[id] = value;
      const next: Draft = { ...d, kinhGui };
      if (Object.keys(kinhGui).length === 0) delete next.kinhGui;
      return next;
    });
  return (
    <fieldset className="rounded border border-slate-200 bg-white p-4">
      <legend className="px-1 font-semibold">Nơi gửi / cơ quan xác nhận (không bắt buộc)</legend>
      <p id={hintId} className="mb-3 text-sm text-slate-600">
        Ghi vào dòng &quot;Kính gửi&quot; của từng mẫu. {HINT}
      </p>
      <div className="grid gap-3">
        {forms.map((f) => {
          const id = `${baseId}-${f.id}`;
          return (
            <div key={f.id}>
              <label htmlFor={id} className="block text-sm font-medium">
                {f.title}
              </label>
              <input
                id={id}
                type="text"
                value={draft.kinhGui?.[f.id] ?? ''}
                placeholder={f.certifiedBy ? `VD: ${f.certifiedBy}` : undefined}
                aria-describedby={f.spouseToo ? `${hintId} ${id}-sp` : hintId}
                onChange={(e) => set(f.id, e.target.value)}
                className={inputCls}
              />
              {f.spouseToo && (
                <p id={`${id}-sp`} className="mt-0.5 text-xs text-slate-500">
                  Dùng cho cả bản khai của vợ/chồng. Nếu vợ/chồng gửi nơi khác, hãy để trống và điền tay.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

function MembersSection({
  control,
  register,
  errors,
}: {
  control: Control<FormValues, unknown, Applicant>;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'thanhVienHo' });
  const hintId = useId();
  const baseId = useId();
  return (
    <fieldset className="rounded border border-slate-200 bg-white p-4">
      <legend className="px-1 font-semibold">Thành viên hộ gia đình (không bắt buộc)</legend>
      <p id={hintId} className="mb-3 text-sm text-slate-600">
        {HINT}
      </p>
      <ul className="space-y-3">
        {fields.map((f, i) => (
          <li key={f.id} className="grid gap-2 rounded border border-slate-200 p-3 sm:grid-cols-3">
            {MEMBER_FIELDS.map((mf) => {
              const name = `thanhVienHo.${i}.${mf.key}` as const;
              const id = `${baseId}-${i}-${mf.key}`;
              const err = errorAt(errors, name);
              return (
                <div key={mf.key}>
                  <label htmlFor={id} className="block text-sm font-medium">
                    {mf.label(i)}
                  </label>
                  <input
                    id={id}
                    type={mf.kind === 'date' ? 'date' : 'text'}
                    inputMode={mf.kind === 'cccd' ? 'numeric' : undefined}
                    maxLength={mf.kind === 'cccd' ? 12 : undefined}
                    aria-invalid={err ? true : undefined}
                    aria-describedby={err ? `${hintId} ${id}-err` : hintId}
                    className={inputCls}
                    {...register(name)}
                  />
                  {err && (
                    <p id={`${id}-err`} className="mt-0.5 text-sm text-red-700">
                      {err}
                    </p>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => remove(i)}
              className="justify-self-start text-sm text-red-700 underline sm:col-span-3"
            >
              Xoá thành viên {i + 1}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => append({ ...EMPTY_MEMBER })}
        className="mt-3 rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
      >
        Thêm thành viên
      </button>
    </fieldset>
  );
}

function InfoForm({ draft, setDraft }: { draft: Draft & Required<Pick<Draft, 'doiTuong' | 'dieuKienNhaO'>>; setDraft: (u: (d: Draft) => Draft) => void }) {
  const married = draft.applicant.tinhTrangHonNhan === 'da_ket_hon';
  const [showAll, setShowAll] = useState(false);
  const [defaultValues] = useState(() => toFormValues(draft.applicant));
  const form = useForm<FormValues, unknown, Applicant>({
    defaultValues,
    mode: 'onBlur',
    resolver: zodResolver(applicantSchema) as unknown as Resolver<FormValues, unknown, Applicant>,
  });
  const { register, control, formState, trigger, setFocus } = form;

  // Lưu vào bộ nhớ mỗi khi dữ liệu hợp lệ (chỉ trong trình duyệt).
  const tinhTrang = draft.applicant.tinhTrangHonNhan;
  useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        const r = applicantSchema.safeParse(values);
        if (r.success) setDraft((d) => ({ ...d, applicant: cleanApplicant(r.data, tinhTrang) }));
      },
    });
  }, [form, setDraft, tinhTrang]);

  const used = usedApplicantPaths(resolveDocuments(draft), MANIFESTS);
  const filter = showAll ? null : used;
  const k7 = draft.doiTuong === 'k7';
  const applicantFields = [...APPLICANT_FIELDS.filter((f) => isFieldUsed(f.name, filter)), ...(k7 ? APPLICANT_K7_FIELDS : [])];
  const spouseFields = [...SPOUSE_FIELDS.filter((f) => isFieldUsed(f.name, filter)), ...(k7 ? SPOUSE_K7_FIELDS : [])];
  const showMembers = isFieldUsed('thanhVienHo', filter);

  const onNext = async () => {
    const ok = await trigger();
    if (!ok) {
      const first = [...APPLICANT_FIELDS, ...APPLICANT_K7_FIELDS, ...SPOUSE_FIELDS, ...SPOUSE_K7_FIELDS].find((f) => errorAt(form.formState.errors, f.name));
      if (first) setFocus(first.name);
      return false;
    }
    const r = applicantSchema.safeParse(form.getValues());
    if (r.success) setDraft((d) => ({ ...d, applicant: cleanApplicant(r.data, tinhTrang) }));
    return r.success;
  };

  return (
    <StepShell index={2} onNext={onNext}>
      <p className="text-sm text-slate-700">
        Thông tin nhập một lần và được điền vào mọi biểu mẫu liên quan. Không có trường nào bắt buộc: trường để trống sẽ
        giữ nguyên dòng chấm trong mẫu để bạn điền tay.
      </p>
      {used !== null && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="h-4 w-4" />
          Hiện tất cả các trường (kể cả trường các mẫu của bạn không dùng)
        </label>
      )}
      <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-4" aria-label="Thông tin cá nhân">
        <Section title="Người đứng đơn" hidden={APPLICANT_FIELDS.length - (applicantFields.length - (k7 ? APPLICANT_K7_FIELDS.length : 0))}>
          {(hintId) => (
            <>
              {applicantFields.map((def) => (
                <Field key={def.name} def={def} register={register} errors={formState.errors} hintId={hintId} />
              ))}
              {!married && (
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" className="h-4 w-4" {...register('nuoiConDuoiTuoiThanhNien')} />
                  Tôi đang nuôi con dưới tuổi thành niên (dùng để so ngưỡng thu nhập)
                </label>
              )}
            </>
          )}
        </Section>

        {married && spouseFields.length > 0 && (
          <Section title="Vợ hoặc chồng" hidden={SPOUSE_FIELDS.length - (spouseFields.length - (k7 ? SPOUSE_K7_FIELDS.length : 0))}>
            {(hintId) =>
              spouseFields.map((def) => (
                <Field key={def.name} def={def} register={register} errors={formState.errors} hintId={hintId} />
              ))
            }
          </Section>
        )}

        {showMembers && <MembersSection control={control} register={register} errors={formState.errors} />}

        <IncomeWarning control={control} married={married} />
      </form>
      <KinhGuiSection draft={draft} setDraft={setDraft} />
    </StepShell>
  );
}

export function StepInfoPage() {
  const { draft, setDraft } = useDraft();
  if (firstIncompleteBefore(draft, 2) !== null || !draft.doiTuong || !draft.dieuKienNhaO) {
    return <StepShell index={2}>{null}</StepShell>;
  }
  return <InfoForm draft={{ ...draft, doiTuong: draft.doiTuong, dieuKienNhaO: draft.dieuKienNhaO }} setDraft={setDraft} />;
}
