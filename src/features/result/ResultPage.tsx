import { useState } from 'react';
import { Link } from 'react-router';
import { DOI_TUONG_LABEL, HINH_THUC_LABEL, type Application } from '../../domain/types';
import { GENERAL_NOTES, resolveDocuments, type DocItem, type Person } from '../../data/rules';
import { MANIFESTS } from '../../templates/manifest';
import { docFileName, findManifest } from '../../templates/data';
import { useDraft, type Draft } from '../../state/draft-context';
import { Stepper, StepGuard } from '../wizard/StepShell';
import { STEPS, firstIncompleteBefore } from '../wizard/progress';

const PERSON_TITLE: Record<Person, string> = {
  applicant: 'Giấy tờ của người đứng đơn',
  spouse: 'Giấy tờ của vợ hoặc chồng',
};

const NHA_O_LABEL = {
  chua_co_nha: 'Chưa có nhà ở',
  duoi_15m2: 'Có nhà ở, diện tích bình quân dưới 15 m² sàn/người',
  xa_noi_lam_viec: 'Có nhà ở nhưng ở xa nơi làm việc',
} as const;

const btn = 'rounded px-3 py-1.5 text-sm font-medium';

function toApplication(d: Draft): Partial<Application> {
  const rest: Draft = { ...d };
  delete rest.goiY;
  return rest;
}

function DocRow({
  item,
  available,
  busy,
  onDownload,
}: {
  item: DocItem;
  available: boolean;
  busy: boolean;
  onDownload: () => void;
}) {
  return (
    <li className="break-inside-avoid rounded border border-slate-200 bg-white p-3 print:rounded-none print:border-x-0 print:border-t-0 print:p-2">
      <div className="flex gap-3">
        <span aria-hidden="true" className="text-xl leading-6">
          ☐
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold">
            {item.title}{' '}
            <span
              className={`ml-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                item.kind === 'template' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {item.kind === 'template' ? 'Biểu mẫu' : 'Giấy tờ cần chuẩn bị'}
            </span>
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-medium">Căn cứ:</span> {item.legalRef}
          </p>
          {item.certifiedBy && (
            <p className="text-sm text-slate-700">
              <span className="font-medium">Nơi xác nhận:</span> {item.certifiedBy}
            </p>
          )}
          {item.note && <p className="text-sm text-slate-600 italic">{item.note}</p>}
          {item.kind === 'template' && (
            <div className="pt-1 print:hidden">
              {available ? (
                <button
                  type="button"
                  onClick={onDownload}
                  disabled={busy}
                  aria-label={`Tải .docx: ${docFileName(item)}`}
                  className={`${btn} bg-red-800 text-white hover:bg-red-900 disabled:opacity-60`}
                >
                  {busy ? 'Đang tạo…' : 'Tải .docx'}
                </button>
              ) : (
                <button type="button" disabled className={`${btn} cursor-not-allowed bg-slate-200 text-slate-600`}>
                  Mẫu đang được cập nhật
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function ResultBody({ draft }: { draft: Draft & Pick<Application, 'doiTuong' | 'dieuKienNhaO'> }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const docs = resolveDocuments(draft);
  const application = toApplication(draft);
  const downloadable = docs.flatMap((item) => {
    const manifest = item.kind === 'template' ? findManifest(MANIFESTS, item.id) : undefined;
    return manifest ? [{ item, manifest }] : [];
  });

  const run = async (key: string, task: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(`Không tạo được file: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const downloadOne = (item: DocItem) => {
    const found = downloadable.find((x) => x.item.key === item.key);
    if (!found) return;
    void run(item.key, async () => {
      const { downloadItem } = await import('./template-download');
      await downloadItem(item, found.manifest, application);
    });
  };

  const downloadAll = () =>
    void run('zip', async () => {
      const { downloadAllZip } = await import('./template-download');
      await downloadAllZip(downloadable, application);
    });

  const people: Person[] = ['applicant', 'spouse'];

  return (
    <>
      <section aria-label="Tóm tắt lựa chọn" className="rounded border border-slate-200 bg-white p-4 text-sm">
        <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[max-content_1fr]">
          <dt className="font-medium">Nhóm đối tượng:</dt>
          <dd>{DOI_TUONG_LABEL[draft.doiTuong]}</dd>
          <dt className="font-medium">Điều kiện nhà ở:</dt>
          <dd>{NHA_O_LABEL[draft.dieuKienNhaO]}</dd>
          <dt className="font-medium">Hình thức:</dt>
          <dd>{draft.hinhThuc ? HINH_THUC_LABEL[draft.hinhThuc] : '(chưa chọn)'}</dd>
          {draft.duAn?.ten && (
            <>
              <dt className="font-medium">Dự án:</dt>
              <dd>{draft.duAn.ten}</dd>
            </>
          )}
        </dl>
      </section>

      <div role="note" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
        Phần <strong>chữ ký</strong>, <strong>xác nhận của cơ quan/UBND</strong>, <strong>ngày tháng ký</strong> và{' '}
        <strong>đóng dấu</strong> được cố ý để trống. Trường nào bạn chưa nhập vẫn giữ dòng chấm để điền tay sau khi in.
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className={`${btn} border border-slate-300 bg-white hover:bg-slate-100`}
        >
          In danh sách giấy tờ
        </button>
        <button
          type="button"
          onClick={downloadAll}
          disabled={downloadable.length === 0 || busy !== null}
          className={`${btn} bg-red-800 text-white hover:bg-red-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600`}
        >
          {busy === 'zip' ? 'Đang tạo…' : 'Tải tất cả (.zip)'}
        </button>
        {downloadable.length === 0 && (
          <p className="w-full text-sm text-slate-600">
            Các biểu mẫu đang được cập nhật theo văn bản gốc. Bạn vẫn có thể in danh sách giấy tờ cần chuẩn bị.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}

      {people.map((p) => {
        const items = docs.filter((d) => d.person === p);
        if (items.length === 0) return null;
        return (
          <section key={p} aria-labelledby={`nhom-${p}`} className="space-y-2">
            <h2 id={`nhom-${p}`} className="text-lg font-semibold">
              {PERSON_TITLE[p]}
            </h2>
            <ol className="space-y-2">
              {items.map((item) => (
                <DocRow
                  key={item.key}
                  item={item}
                  available={downloadable.some((x) => x.item.key === item.key)}
                  busy={busy === item.key}
                  onDownload={() => downloadOne(item)}
                />
              ))}
            </ol>
          </section>
        );
      })}

      <section aria-labelledby="luu-y-chung" className="break-inside-avoid space-y-1 text-sm">
        <h2 id="luu-y-chung" className="font-semibold">
          Lưu ý chung
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          {GENERAL_NOTES.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-slate-600">
        Chủ đầu tư hoặc địa phương có thể yêu cầu thêm giấy tờ. Hãy kiểm tra lại trước khi nộp. Ứng dụng không thay thế
        tư vấn pháp lý.
      </p>
    </>
  );
}

export function ResultPage() {
  const { draft } = useDraft();
  const missing = firstIncompleteBefore(draft, 3);
  return (
    <div className="space-y-5">
      <Stepper index={3} />
      <h1 className="text-xl font-semibold sm:text-2xl">
        <span className="print:hidden">{STEPS[3].title}</span>
        <span className="hidden print:inline">Danh sách giấy tờ hồ sơ đăng ký mua, thuê mua nhà ở xã hội</span>
      </h1>
      {missing !== null || !draft.doiTuong || !draft.dieuKienNhaO ? (
        <StepGuard missing={missing ?? 0} />
      ) : (
        <ResultBody draft={{ ...draft, doiTuong: draft.doiTuong, dieuKienNhaO: draft.dieuKienNhaO }} />
      )}
      <div className="print:hidden">
        <Link to="/buoc-3" className="text-blue-700 underline">
          Quay lại Bước 3
        </Link>
      </div>
    </div>
  );
}
