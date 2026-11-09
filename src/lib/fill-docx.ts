/**
 * Lõi điền biểu mẫu .docx (docs/PLAN.md §3).
 *
 * Quy tắc:
 * - Trường có giá trị → điền giá trị.
 * - Trường rỗng / undefined / chỉ khoảng trắng → trả lại ĐÚNG dãy chấm gốc (`placeholder`) của mẫu.
 * - Checkbox chưa chọn → giữ ô ☐ gốc; đã chọn → ☒.
 * - Chữ ký, xác nhận cơ quan/UBND, ngày tháng ký, đóng dấu: không bao giờ gắn tag nên giữ nguyên.
 *
 * Chạy hoàn toàn trong trình duyệt (hoặc Node khi test/verify). Không gửi dữ liệu đi đâu.
 */
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { DELIMITERS, DOCX_MIME } from './docx-common';
import type { FieldSource, TemplateManifest } from '../templates/types';

/** Lấy giá trị theo đường dẫn chấm ('a.b.c') hoặc gọi hàm dẫn xuất. */
export function resolveSource<T>(source: FieldSource<T>, data: T): unknown {
  if (typeof source === 'function') {
    // Hàm dẫn xuất lỗi (dữ liệu thiếu nhánh) → coi như chưa nhập, giữ dãy chấm gốc.
    try {
      return source(data);
    } catch {
      return undefined;
    }
  }
  let cur: unknown = data;
  for (const seg of source.split('.')) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

export function isBlank(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'number') return !Number.isFinite(v);
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

const numberFormat = new Intl.NumberFormat('vi-VN');

/** Chuyển giá trị (đã chắc chắn không rỗng) thành chuỗi để điền. */
export function formatValue(v: unknown): string {
  if (typeof v === 'number') return numberFormat.format(v);
  if (v instanceof Date) {
    const dd = String(v.getDate()).padStart(2, '0');
    const mm = String(v.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${v.getFullYear()}`;
  }
  if (typeof v === 'boolean') return v ? 'Có' : 'Không';
  if (Array.isArray(v)) return v.map(formatValue).join(', ');
  return String(v);
}

/** Map tag → chuỗi sẽ điền (giá trị, hoặc placeholder gốc khi rỗng). */
export function buildRenderData<T>(manifest: TemplateManifest<T>, data: T): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of manifest.fields) {
    const v = resolveSource(f.source, data);
    out[f.key] = isBlank(v) ? f.placeholder : formatValue(v);
  }
  for (const c of manifest.checkboxes) {
    out[c.key] = resolveSource(c.source, data) ? c.checked : c.unchecked;
  }
  return out;
}

export class UnknownTagError extends Error {
  readonly tags: string[];
  constructor(manifestId: string, tags: string[]) {
    super(`Template "${manifestId}" có tag không khai báo trong manifest: ${tags.join(', ')}`);
    this.name = 'UnknownTagError';
    this.tags = tags;
  }
}

function toUint8(buf: ArrayBuffer | Uint8Array): Uint8Array {
  return buf instanceof Uint8Array ? buf : new Uint8Array(buf);
}

/** Điền template, trả về bytes .docx (dùng được cả trong Node). */
export function renderDocx<T>(
  template: ArrayBuffer | Uint8Array,
  manifest: TemplateManifest<T>,
  data: T,
): Uint8Array {
  const values = buildRenderData(manifest, data);
  const placeholders = new Map<string, string>([
    ...manifest.fields.map((f) => [f.key, f.placeholder] as const),
    ...manifest.checkboxes.map((c) => [c.key, c.unchecked] as const),
  ]);
  const unknown = new Set<string>();

  const zip = new PizZip(toUint8(template));
  const doc = new Docxtemplater(zip, {
    delimiters: { ...DELIMITERS },
    paragraphLoop: true,
    linebreaks: true,
    // Tag thuần: chỉ tra khoá (đã trim), không biểu thức.
    parser: (tag: string) => {
      const key = tag.trim();
      return { get: (scope: unknown) => (key === '.' ? scope : (scope as Record<string, unknown>)?.[key]) };
    },
    nullGetter: (part) => {
      if (part.module) return '';
      const key = String(part.value).trim();
      const ph = placeholders.get(key);
      if (ph !== undefined) return ph; // phòng hờ: rỗng → dãy chấm gốc
      unknown.add(key);
      return `${DELIMITERS.start}${key}${DELIMITERS.end}`;
    },
  });
  doc.render(values);
  if (unknown.size > 0) throw new UnknownTagError(String(manifest.id), [...unknown].sort());

  return doc.getZip().generate({ type: 'uint8array', compression: 'DEFLATE', mimeType: DOCX_MIME });
}

/** Điền template và trả về Blob .docx để tải/xem trước trong trình duyệt. */
export function fillDocx<T>(template: ArrayBuffer | Uint8Array, manifest: TemplateManifest<T>, data: T): Blob {
  const bytes = renderDocx(template, manifest, data);
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: DOCX_MIME });
}
