import { useId, useState } from 'react';
import { DIEU_KIEN_NHA_O, HINH_THUC, HINH_THUC_LABEL, type DieuKienNhaO, type DuAn, type NhaO } from '../../domain/types';
import { optionalArea } from '../../domain/schemas';
import { HOUSING_RULES, hinhThucPolicy } from '../../data/rules';
import { useDraft, type Draft } from '../../state/draft-context';
import { StepShell } from './StepShell';
import { Choice, Fieldset } from './ui';
import { step2Errors } from './progress';

const HINT = 'Để trống nếu muốn tự điền tay sau khi in.';
const inputCls = 'mt-1 w-full rounded border border-slate-300 px-3 py-2 aria-[invalid=true]:border-red-600';

const NHA_O: Record<DieuKienNhaO, { label: string; description: string; badge?: string }> = {
  chua_co_nha: {
    label: 'Chưa có nhà ở thuộc sở hữu của mình',
    description: 'Bạn (và vợ/chồng nếu có) chưa có nhà ở tại tỉnh/thành nơi có dự án.',
  },
  duoi_15m2: {
    label: 'Có nhà ở nhưng diện tích bình quân dưới 15 m² sàn/người',
    description: 'Tính theo người đứng đơn, vợ/chồng, cha mẹ và con có thường trú tại căn nhà đó.',
  },
  xa_noi_lam_viec: {
    label: 'Có nhà ở nhưng ở xa nơi làm việc',
    description: 'Theo Nghị quyết 201/2025/QH15 và quyết định riêng của từng tỉnh/thành. Giấy tờ sẽ chỉ có trong danh sách cần chuẩn bị.',
    badge: 'chưa hỗ trợ tạo mẫu',
  },
};

type DuAnTextKey = keyof DuAn;

const DU_AN_FIELDS: { key: DuAnTextKey; label: string; placeholder?: string }[] = [
  { key: 'ten', label: 'Tên dự án' },
  { key: 'chuDauTu', label: 'Chủ đầu tư' },
  { key: 'diaChi', label: 'Địa chỉ dự án' },
  { key: 'tinh', label: 'Tỉnh/thành phố nơi có dự án' },
  { key: 'coQuanXacNhanNhaO', label: 'Cơ quan cấp Giấy chứng nhận (nơi xác nhận Mẫu 02)', placeholder: `VD: ${HOUSING_RULES.chua_co_nha.certifiedBy}` },
];

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input id={id} type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

/** Ô diện tích: giữ chuỗi người dùng gõ (VD "25,"), chỉ lưu số khi hợp lệ. */
function AreaInput({ value, onChange }: { value: number | undefined; onChange: (v: number | undefined) => void }) {
  const id = useId();
  const [raw, setRaw] = useState(() => (value === undefined ? '' : String(value).replace('.', ',')));
  const parsed = optionalArea.safeParse(raw);
  const err = parsed.success ? undefined : parsed.error.issues[0]?.message;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        Diện tích sàn sử dụng nhà ở (m²)
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={raw}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? `${id}-err` : undefined}
        onChange={(e) => {
          setRaw(e.target.value);
          const r = optionalArea.safeParse(e.target.value);
          if (r.success) onChange(r.data);
        }}
        className={inputCls}
      />
      {err && (
        <p id={`${id}-err`} className="mt-0.5 text-sm text-red-700">
          {err}
        </p>
      )}
    </div>
  );
}

export function StepHousingPage() {
  const { draft, setDraft } = useDraft();
  const policy = draft.doiTuong ? hinhThucPolicy(draft.doiTuong) : null;
  const options = HINH_THUC.filter((h) => !policy || policy.allowed.includes(h));

  const setDuAn = (key: DuAnTextKey, value: string) =>
    setDraft((d) => {
      const duAn: DuAn = { ...d.duAn };
      if (value.trim() === '') delete duAn[key];
      else duAn[key] = value;
      return { ...d, duAn };
    });

  const setNhaO = <K extends keyof NhaO>(key: K, value: NhaO[K] | undefined) =>
    setDraft((d) => {
      const nhaO: NhaO = { ...d.nhaO };
      if (value === undefined || (typeof value === 'string' && value.trim() === '')) delete nhaO[key];
      else nhaO[key] = value;
      const next: Draft = { ...d, nhaO };
      if (Object.keys(nhaO).length === 0) delete next.nhaO;
      return next;
    });

  return (
    <StepShell index={1} errors={step2Errors(draft)}>
      <Fieldset legend="Điều kiện nhà ở hiện tại">
        {DIEU_KIEN_NHA_O.map((k) => (
          <Choice
            key={k}
            name="dieuKienNhaO"
            checked={draft.dieuKienNhaO === k}
            onChange={() => setDraft((d) => ({ ...d, dieuKienNhaO: k }))}
            label={NHA_O[k].label}
            description={NHA_O[k].description}
            badge={NHA_O[k].badge}
          />
        ))}
      </Fieldset>

      {draft.dieuKienNhaO === 'duoi_15m2' && (
        <Fieldset legend="Nhà ở hiện có (không bắt buộc)" hint={`Dùng cho Giấy xác nhận điều kiện nhà ở (Mẫu 03). ${HINT}`}>
          <TextInput
            label="Số Giấy chứng nhận quyền sử dụng đất, quyền sở hữu nhà ở"
            value={draft.nhaO?.soGiayChungNhan ?? ''}
            onChange={(v) => setNhaO('soGiayChungNhan', v)}
          />
          <AreaInput value={draft.nhaO?.dienTichSan} onChange={(v) => setNhaO('dienTichSan', v)} />
        </Fieldset>
      )}

      <Fieldset legend="Hình thức">
        <div className="flex flex-wrap gap-2">
          {options.map((h) => (
            <Choice
              key={h}
              name="hinhThuc"
              checked={draft.hinhThuc === h}
              onChange={() => setDraft((d) => ({ ...d, hinhThuc: h }))}
              label={HINH_THUC_LABEL[h]}
            />
          ))}
        </div>
        {policy?.warning && (
          <div role="note" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
            <p>{policy.warning}</p>
            <p className="mt-1 text-xs text-slate-600">Căn cứ: {policy.legalRef}</p>
          </div>
        )}
      </Fieldset>

      <Fieldset legend="Dự án đăng ký (không bắt buộc)" hint={HINT}>
        {DU_AN_FIELDS.map(({ key, label, placeholder }) => (
          <TextInput key={key} label={label} placeholder={placeholder} value={draft.duAn?.[key] ?? ''} onChange={(v) => setDuAn(key, v)} />
        ))}
      </Fieldset>
    </StepShell>
  );
}
