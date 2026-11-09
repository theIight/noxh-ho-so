/**
 * Giá trị điền không được dính vào chữ bên cạnh (VD "Họ và tên:Nguyễn Văn An", "tạiCục Cảnh sát").
 * Với mọi trường của 7 manifest: cho trường đó một giá trị ("QXQ" hoặc giá trị hợp lệ tương đương),
 * các trường khác để trống, rồi kiểm tra ký tự ngay trước/sau giá trị trong văn bản trích ra là
 * khoảng trắng, đầu/cuối dòng, hoặc một trong ( " , . ; /
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractDocxText } from '../../src/lib/docx-text';
import { formatValue, isBlank, renderDocx, resolveSource } from '../../src/lib/fill-docx';
import type { TemplateData } from '../../src/templates/data';
import type { ManifestField, TemplateManifest } from '../../src/templates/types';
import { nd136_01 } from '../../src/templates/manifest/nd136-01';
import { tt05_03 } from '../../src/templates/manifest/tt05-03';
import { tt08_01 } from '../../src/templates/manifest/tt08-01';
import { tt08_02 } from '../../src/templates/manifest/tt08-02';
import { tt08_05 } from '../../src/templates/manifest/tt08-05';
import { tt32_01a } from '../../src/templates/manifest/tt32-01a';
import { tt32_04 } from '../../src/templates/manifest/tt32-04';

type M = TemplateManifest<TemplateData>;
const MANIFESTS = [nd136_01, tt05_03, tt08_01, tt08_02, tt08_05, tt32_01a, tt32_04] as unknown as M[];

const OPEN = '';
const CLOSE = '';
const OK_NEIGHBOUR = /^(|\s|[(",.;/])$/;

const template = (file: string) =>
  new Uint8Array(readFileSync(resolve(import.meta.dirname, '../../public/templates', file)));

function setPath(root: Record<string, unknown>, path: string, value: unknown): void {
  const segs = path.split('.');
  let cur = root;
  for (const s of segs.slice(0, -1)) {
    if (typeof cur[s] !== 'object' || cur[s] === null) cur[s] = {};
    cur = cur[s] as Record<string, unknown>;
  }
  cur[segs.at(-1)!] = value;
}

/** Giá trị thử cho một đường dẫn ở lần thử `attempt`. */
function valueFor(path: string, attempt: number, formId: string): unknown {
  const last = path.split('.').at(-1)!;
  if (last === 'kinhGui') return { [formId]: 'QXQ' };
  if (last === 'thanhVienHo') return [{ hoTen: 'QXQ', soDinhDanh: 'QXQ', ngayCap: 'QXQ', noiCap: 'QXQ' }];
  if (last === 'hinhThuc') return ['mua', 'thue_mua', 'thue'][attempt % 3];
  if (last === 'gioiTinh') return ['nam', 'nu'][attempt % 2];
  if (last === 'doiTuong') return ['k5', 'k6', 'k8', 'k9', 'k10', 'k11', 'k1', 'k7'][attempt % 8];
  return [('QXQ' as unknown), 777, true][attempt % 3];
}

/** Dữ liệu (bản của người đứng đơn) làm cho trường `f` có giá trị; undefined nếu không tìm được. */
function dataFor(f: ManifestField<TemplateData>, formId: string): TemplateData | undefined {
  const paths = typeof f.source === 'string' ? [f.source] : (f.paths ?? []);
  for (let attempt = 0; attempt < 24; attempt++) {
    const applicant: Record<string, unknown> = {};
    const root: Record<string, unknown> = { person: applicant, applicant, spouse: {}, application: { applicant } };
    for (const p of paths) setPath(root, p, valueFor(p, attempt, formId));
    const d = root as unknown as TemplateData;
    if (!isBlank(resolveSource(f.source, d))) return d;
  }
  return undefined;
}

describe.each(MANIFESTS.map((m) => [m.id, m] as const))('%s: giá trị điền không dính chữ bên cạnh', (_id, m) => {
  const tpl = template(m.file);
  it.each(m.fields.map((f) => [f.key, f] as const))('%s', (_key, f) => {
    const data = dataFor(f, String(m.id));
    expect(data, `không dựng được dữ liệu cho ${f.key}`).toBeDefined();
    const only: M = {
      ...m,
      fields: m.fields.map((x) =>
        x.key === f.key
          ? {
              ...x,
              source: (d: TemplateData) => {
                const v = resolveSource(f.source, d);
                return isBlank(v) ? v : `${OPEN}${formatValue(v)}${CLOSE}`;
              },
            }
          : { ...x, source: () => undefined },
      ),
      checkboxes: m.checkboxes.map((c) => ({ ...c, source: () => false })),
    };
    const text = extractDocxText(renderDocx(tpl, only, data!));
    const at = text.indexOf(OPEN);
    const end = text.indexOf(CLOSE, at);
    expect(at, 'không thấy giá trị trong văn bản').toBeGreaterThanOrEqual(0);
    const inner = text.slice(at + 1, end);
    const before = /^\s/.test(inner) ? ' ' : (text[at - 1] ?? '');
    const after = /\s$/.test(inner) ? ' ' : (text[end + 1] ?? '');
    const ctx = JSON.stringify(text.slice(Math.max(0, at - 25), end + 25));
    expect(OK_NEIGHBOUR.test(before), `dính chữ phía trước: ${ctx}`).toBe(true);
    expect(OK_NEIGHBOUR.test(after), `dính chữ phía sau: ${ctx}`).toBe(true);
  });
});
