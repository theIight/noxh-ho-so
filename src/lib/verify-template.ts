/**
 * Kiểm tra một template đã gắn tag so với manifest (docs/PLAN.md §3.6):
 *  (a) mọi tag trong .docx đều có trong manifest và ngược lại;
 *  (b) render với dữ liệu rỗng cho ra văn bản giống hệt template khi thay tag bằng placeholder
 *      (tức mẫu trắng gốc), và nếu có file gốc chưa gắn tag thì giống hệt văn bản file gốc.
 */
import { extractDocxText } from './docx-text';
import { renderDocx } from './fill-docx';
import { TAG_IN_TEXT_REGEX } from './docx-common';
import { TAG_KEY_REGEX, type TemplateManifest } from '../templates/types';

export interface VerifyResult {
  id: string;
  ok: boolean;
  errors: string[];
  tagsInDocx: string[];
  missingInManifest: string[];
  missingInDocx: string[];
}

/** Tag (duy nhất, đã sắp xếp) xuất hiện trong văn bản .docx. */
export function listTemplateTags(docx: ArrayBuffer | Uint8Array): string[] {
  const text = extractDocxText(docx);
  return [...new Set([...text.matchAll(TAG_IN_TEXT_REGEX)].map((m) => (m[1] ?? '').trim()))].sort();
}

/** Mô tả vị trí khác nhau đầu tiên giữa hai chuỗi (dòng, cột, đoạn trích). */
export function describeFirstDiff(expected: string, actual: string): string | null {
  if (expected === actual) return null;
  let i = 0;
  while (i < expected.length && i < actual.length && expected[i] === actual[i]) i++;
  const line = expected.slice(0, i).split('\n').length;
  const ctx = (s: string) => JSON.stringify(s.slice(Math.max(0, i - 30), i + 30));
  return `khác nhau tại dòng ${line}, ký tự ${i}: mong đợi ${ctx(expected)} nhưng nhận ${ctx(actual)}`;
}

function emptyManifest<T>(m: TemplateManifest<T>): TemplateManifest<Record<string, never>> {
  return {
    ...m,
    fields: m.fields.map((f) => ({ ...f, source: () => undefined })),
    checkboxes: m.checkboxes.map((c) => ({ ...c, source: () => undefined })),
  };
}

export function verifyTemplate<T>(
  template: ArrayBuffer | Uint8Array,
  manifest: TemplateManifest<T>,
  original?: ArrayBuffer | Uint8Array,
): VerifyResult {
  const errors: string[] = [];
  const id = String(manifest.id);

  // Manifest tự nhất quán.
  const keys = [...manifest.fields.map((f) => f.key), ...manifest.checkboxes.map((c) => c.key)];
  const seen = new Set<string>();
  for (const k of keys) {
    if (seen.has(k)) errors.push(`Manifest trùng key "${k}"`);
    seen.add(k);
    if (!TAG_KEY_REGEX.test(k)) errors.push(`Key "${k}" không hợp lệ (chỉ a-z, 0-9, _)`);
  }
  for (const f of manifest.fields) {
    if (f.placeholder.length === 0) errors.push(`Trường "${f.key}" có placeholder rỗng`);
  }

  // (a) Tag ↔ manifest.
  const tagsInDocx = listTemplateTags(template);
  const missingInManifest = tagsInDocx.filter((t) => !seen.has(t));
  const tagSet = new Set(tagsInDocx);
  const missingInDocx = [...seen].filter((k) => !tagSet.has(k)).sort();
  if (missingInManifest.length) errors.push(`Tag có trong .docx nhưng thiếu trong manifest: ${missingInManifest.join(', ')}`);
  if (missingInDocx.length) errors.push(`Key có trong manifest nhưng không có tag trong .docx: ${missingInDocx.join(', ')}`);

  // (b) Render rỗng = mẫu trắng.
  if (missingInManifest.length === 0) {
    const replacement = new Map<string, string>([
      ...manifest.fields.map((f) => [f.key, f.placeholder] as const),
      ...manifest.checkboxes.map((c) => [c.key, c.unchecked] as const),
    ]);
    try {
      const rendered = extractDocxText(renderDocx(template, emptyManifest(manifest), {}));
      const expected = extractDocxText(template).replace(
        TAG_IN_TEXT_REGEX,
        (whole, key: string) => replacement.get(key.trim()) ?? whole,
      );
      const d1 = describeFirstDiff(expected, rendered);
      if (d1) errors.push(`Render rỗng khác template (tag → placeholder): ${d1}`);
      if (original) {
        const d2 = describeFirstDiff(extractDocxText(original), rendered);
        if (d2) errors.push(`Render rỗng khác file gốc chưa gắn tag: ${d2}`);
      }
    } catch (e) {
      // docxtemplater gom lỗi cú pháp tag vào properties.errors[].properties.explanation.
      const sub = (e as { properties?: { errors?: { properties?: { explanation?: string } }[] } })?.properties?.errors;
      const detail = sub?.map((x) => x.properties?.explanation).filter(Boolean).join('; ');
      errors.push(`Lỗi khi render: ${e instanceof Error ? e.message : String(e)}${detail ? ` (${detail})` : ''}`);
    }
  }

  return { id, ok: errors.length === 0, errors, tagsInDocx, missingInManifest, missingInDocx };
}
