/**
 * Dữ liệu truyền vào manifest khi điền một biểu mẫu, và cách suy ra các trường Bước 3 cần hiện.
 *
 * Đường dẫn `source` trong manifest được tra trên object `TemplateData`:
 * - `person.*`      : người khai của bản này (người đứng đơn, hoặc vợ/chồng với bản khai riêng).
 * - `applicant.*`   : luôn là người đứng đơn (Applicant).
 * - `spouse.*`      : luôn là vợ/chồng (VoChong).
 * - `application.*` : lựa chọn hồ sơ (doiTuong, hinhThuc, duAn...).
 */
import type { DocItem } from '../data/rules';
import type { Applicant, Application, VoChong } from '../domain/types';
import type { TemplateManifest } from './types';

export interface TemplateData {
  person: Applicant | VoChong;
  applicant: Applicant;
  spouse: VoChong;
  application: Partial<Application>;
}

export function buildTemplateData(application: Partial<Application>, item: Pick<DocItem, 'person'>): TemplateData {
  const applicant = application.applicant ?? {};
  const spouse = applicant.voChong ?? {};
  return { person: item.person === 'spouse' ? spouse : applicant, applicant, spouse, application };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyManifest = TemplateManifest<any>;

export function findManifest(manifests: readonly AnyManifest[], formId: string): AnyManifest | undefined {
  return manifests.find((m) => m.id === formId);
}

/** Đổi đường dẫn trong manifest thành đường dẫn trong form Applicant (VD 'voChong.hoTen'); null nếu không thuộc Bước 3. */
export function toApplicantPath(path: string, person: DocItem['person']): string | null {
  const [head, ...rest] = path.split('.');
  const tail = rest.join('.');
  switch (head) {
    case 'person':
      if (!tail) return person === 'spouse' ? 'voChong' : '';
      return person === 'spouse' ? `voChong.${tail}` : tail;
    case 'applicant':
      return tail;
    case 'spouse':
      return tail ? `voChong.${tail}` : 'voChong';
    case 'application':
      return tail.startsWith('applicant.') ? tail.slice('applicant.'.length) : tail === 'applicant' ? '' : null;
    default:
      return null;
  }
}

/**
 * Tập đường dẫn trường Applicant mà các mẫu đã chọn sẽ điền.
 * Trả `null` khi chưa có manifest nào cho các mẫu đã chọn → giao diện hiện toàn bộ trường.
 * Chuỗi rỗng '' trong tập nghĩa là mẫu dùng cả object người khai → hiện mọi trường.
 */
export function usedApplicantPaths(docs: readonly DocItem[], manifests: readonly AnyManifest[]): Set<string> | null {
  const out = new Set<string>();
  let found = false;
  for (const d of docs) {
    if (d.kind !== 'template') continue;
    const m = findManifest(manifests, d.id);
    if (!m) continue;
    found = true;
    const sources: string[] = [];
    for (const f of [...m.fields, ...m.checkboxes]) {
      if (typeof f.source === 'string') sources.push(f.source);
      if ('paths' in f && f.paths) sources.push(...f.paths);
    }
    for (const s of sources) {
      const p = toApplicantPath(s, d.person);
      if (p !== null) out.add(p);
    }
  }
  return found ? out : null;
}

/** Trường `field` (VD 'voChong.hoTen') có cần hiện không. */
export function isFieldUsed(field: string, used: Set<string> | null): boolean {
  if (used === null) return true;
  for (const p of used) {
    if (p === '' || p === field || field.startsWith(`${p}.`) || p.startsWith(`${field}.`)) return true;
  }
  return false;
}

/** Tên file tải về cho một mục. */
export function docFileName(item: Pick<DocItem, 'id' | 'title' | 'person'>, index?: number): string {
  const prefix = index === undefined ? '' : `${String(index + 1).padStart(2, '0')} - `;
  const who = item.person === 'spouse' ? ' (vợ hoặc chồng)' : '';
  return `${prefix}${item.title}${who}.docx`;
}
