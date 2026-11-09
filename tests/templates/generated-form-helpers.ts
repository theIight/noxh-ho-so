/**
 * Tiện ích kiểm thử cho các mẫu sinh bằng script (nd136-01, tt32-04, tt08-02).
 * Văn bản chính thức để so sánh nằm ở tests/fixtures/official/<id>.txt (trích từ PDF, xem đầu file).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractDocxText } from '../../src/lib/docx-text';
import { renderDocx } from '../../src/lib/fill-docx';
import type { TemplateManifest } from '../../src/templates/types';

const ROOT = resolve(import.meta.dirname, '../..');

export function loadTemplate(file: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(ROOT, 'public/templates', file)));
}

/** Văn bản chính thức (bỏ dòng chú thích bắt đầu bằng #). */
export function officialText(id: string): string {
  return readFileSync(resolve(ROOT, 'tests/fixtures/official', `${id}.txt`), 'utf8')
    .split('\n')
    .filter((l) => !l.startsWith('#'))
    .join('\n');
}

export const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Render với mọi nguồn rỗng (giống verifyTemplate) và trả văn bản thuần. */
export function emptyRenderText<T>(template: Uint8Array, m: TemplateManifest<T>): string {
  const empty: TemplateManifest<Record<string, never>> = {
    ...m,
    fields: m.fields.map((f) => ({ ...f, source: () => undefined })),
    checkboxes: m.checkboxes.map((c) => ({ ...c, source: () => undefined })),
  };
  return extractDocxText(renderDocx(template, empty, {}));
}

export function renderText<T>(template: Uint8Array, m: TemplateManifest<T>, data: T): string {
  return extractDocxText(renderDocx(template, m, data));
}

export interface WordDiff {
  /** Từ có trong bản chính thức nhưng không có trong render rỗng. */
  removed: string[];
  /** Từ có trong render rỗng nhưng không có trong bản chính thức. */
  added: string[];
  officialWords: number;
}

/** So sánh theo từ (LCS) sau khi chuẩn hoá khoảng trắng. */
export function wordDiff(official: string, rendered: string): WordDiff {
  const a = normalize(official).split(' ');
  const b = normalize(rendered).split(' ');
  const n = a.length;
  const m = b.length;
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    const row = dp[i]!;
    const next = dp[i + 1]!;
    for (let j = m - 1; j >= 0; j--) row[j] = a[i] === b[j] ? next[j + 1]! + 1 : Math.max(next[j]!, row[j + 1]!);
  }
  const removed: string[] = [];
  const added: string[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) removed.push(a[i++]!);
    else added.push(b[j++]!);
  }
  removed.push(...a.slice(i));
  added.push(...b.slice(j));
  return { removed, added, officialWords: n };
}
