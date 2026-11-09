import { DOI_TUONG, DOI_TUONG_LABEL, TINH_TRANG_HON_NHAN, type DoiTuong } from '../../domain/types';
import { CAU_HOI_GOI_Y, DOI_TUONG_GIAI_THICH, HON_NHAN_LABEL, goiYNhom, type CauHoiGoiY } from '../../data/doi-tuong';
import { FORMS, groupRuleFor, hinhThucPolicy } from '../../data/rules';
import { useDraft, type Draft } from '../../state/draft-context';
import { StepShell } from './StepShell';
import { Choice, Fieldset } from './ui';
import { step1Errors } from './progress';

function selectGroup(d: Draft, k: DoiTuong, k5?: CauHoiGoiY['k5']): Draft {
  const next: Draft = { ...d, doiTuong: k };
  if (k === 'k5') {
    if (k5) {
      next.coHopDongLaoDong = k5.coHopDongLaoDong;
      next.coLuongHuu = k5.coLuongHuu;
    }
  } else {
    delete next.coHopDongLaoDong;
    delete next.coLuongHuu;
  }
  // Điều 77 Luật Nhà ở: bỏ hình thức không còn được phép; chỉ có một lựa chọn (K11: thuê) thì chọn sẵn.
  const { allowed } = hinhThucPolicy(k);
  if (allowed.length === 1) next.hinhThuc = allowed[0];
  else if (next.hinhThuc && !allowed.includes(next.hinhThuc)) delete next.hinhThuc;
  return next;
}

const yesNo = [
  { v: true, label: 'Có' },
  { v: false, label: 'Không' },
] as const;

export function StepGroupPage() {
  const { draft, setDraft } = useDraft();
  const goiY = draft.goiY ?? [];
  const suggestions = goiYNhom(goiY);
  const k5Answered =
    draft.doiTuong === 'k5' &&
    (draft.coHopDongLaoDong === true || (draft.coHopDongLaoDong === false && draft.coLuongHuu !== undefined));
  const k5Rule = k5Answered
    ? groupRuleFor({ doiTuong: 'k5', coHopDongLaoDong: draft.coHopDongLaoDong, coLuongHuu: draft.coLuongHuu })
    : null;

  const toggleQuestion = (id: string, on: boolean) =>
    setDraft((d) => {
      const cur = d.goiY ?? [];
      return { ...d, goiY: on ? [...cur.filter((x) => x !== id), id] : cur.filter((x) => x !== id) };
    });

  return (
    <StepShell index={0} errors={step1Errors(draft)}>
      <details className="rounded border border-slate-200 bg-white p-4" open={goiY.length > 0 || !draft.doiTuong}>
        <summary className="cursor-pointer font-semibold">Chưa chắc? Trả lời vài câu hỏi để được gợi ý</summary>
        <p className="mt-2 text-sm text-slate-600">Đánh dấu những câu đúng với bạn.</p>
        <div className="mt-2 space-y-2">
          {CAU_HOI_GOI_Y.map((q) => (
            <Choice
              key={q.id}
              type="checkbox"
              name={`goi-y-${q.id}`}
              checked={goiY.includes(q.id)}
              onChange={(on) => toggleQuestion(q.id, on)}
              label={q.label}
            />
          ))}
        </div>
        {suggestions.length > 0 && (
          <div role="status" className="mt-4 rounded bg-slate-100 p-3">
            <p className="font-semibold">Nhóm có thể phù hợp với bạn:</p>
            {suggestions.length > 1 && (
              <p className="text-sm text-slate-600">
                Bạn có thể thuộc nhiều nhóm. Mỗi hồ sơ chỉ chọn một nhóm, thường là nhóm có giấy tờ dễ chứng minh nhất.
              </p>
            )}
            <ul className="mt-2 space-y-2">
              {suggestions.map(({ doiTuong, tu }) => (
                <li key={doiTuong} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm">{DOI_TUONG_LABEL[doiTuong]}</span>
                  <button
                    type="button"
                    onClick={() => setDraft((d) => selectGroup(d, doiTuong, tu.k5))}
                    className="rounded border border-red-800 px-3 py-1 text-sm text-red-800 hover:bg-red-50"
                  >
                    Chọn khoản {doiTuong.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </details>

      <Fieldset
        legend="Nhóm đối tượng (Điều 76 Luật Nhà ở 2023)"
        hint="Khoản 12 (doanh nghiệp, hợp tác xã) không áp dụng cho cá nhân nên không có trong danh sách."
      >
        {DOI_TUONG.map((k) => (
          <Choice
            key={k}
            name="doiTuong"
            checked={draft.doiTuong === k}
            onChange={() => setDraft((d) => selectGroup(d, k))}
            label={DOI_TUONG_LABEL[k]}
            description={DOI_TUONG_GIAI_THICH[k]}
          />
        ))}
      </Fieldset>

      {draft.doiTuong === 'k5' && (
        <div className="space-y-4">
          <Fieldset legend="Khoản 5: Bạn có hợp đồng lao động không?">
            <div className="flex gap-2">
              {yesNo.map(({ v, label }) => (
                <Choice
                  key={label}
                  name="coHopDongLaoDong"
                  checked={draft.coHopDongLaoDong === v}
                  onChange={() =>
                    setDraft((d) => {
                      const next = { ...d, coHopDongLaoDong: v };
                      if (v) delete next.coLuongHuu;
                      return next;
                    })
                  }
                  label={label}
                />
              ))}
            </div>
          </Fieldset>
          {draft.coHopDongLaoDong === false && (
            <Fieldset legend="Khoản 5: Bạn có đang hưởng lương hưu không?">
              <div className="flex gap-2">
                {yesNo.map(({ v, label }) => (
                  <Choice
                    key={label}
                    name="coLuongHuu"
                    checked={draft.coLuongHuu === v}
                    onChange={() => setDraft((d) => ({ ...d, coLuongHuu: v }))}
                    label={label}
                  />
                ))}
              </div>
            </Fieldset>
          )}
          {k5Rule?.kind === 'template' && (
            <p role="status" className="text-sm text-slate-700">
              Bạn sẽ dùng: <strong>{FORMS[k5Rule.form].legalRef.split(' ban hành')[0]}</strong>
              {k5Rule.certifiedBy && <> (xác nhận: {k5Rule.certifiedBy})</>}.
            </p>
          )}
        </div>
      )}

      <Fieldset legend="Tình trạng hôn nhân" hint="Nếu đã kết hôn, vợ/chồng của bạn cũng phải khai một số mẫu.">
        {TINH_TRANG_HON_NHAN.map((t) => (
          <Choice
            key={t}
            name="tinhTrangHonNhan"
            checked={draft.applicant.tinhTrangHonNhan === t}
            onChange={() => setDraft((d) => ({ ...d, applicant: { ...d.applicant, tinhTrangHonNhan: t } }))}
            label={HON_NHAN_LABEL[t]}
          />
        ))}
      </Fieldset>
    </StepShell>
  );
}
