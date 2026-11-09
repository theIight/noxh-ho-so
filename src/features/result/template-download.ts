/**
 * Tải template từ public/templates/, điền dữ liệu và trả Blob .docx (toàn bộ trong trình duyệt).
 * Module này được import động từ trang kết quả để tách docxtemplater/pizzip/jszip khỏi bundle chính.
 */
import { fillDocx } from '../../lib/fill-docx';
import type { DocItem } from '../../data/rules';
import type { Application } from '../../domain/types';
import type { TemplateManifest } from '../../templates/types';
import { buildTemplateData, docFileName } from '../../templates/data';
import { downloadBlob, downloadZip, type ZipEntry } from '../../lib/zip';

/** Đường dẫn tương đối với index.html (vite `base: './'`, hash router nên pathname không đổi). */
export function templateUrl(file: string): string {
  return `templates/${file}`;
}

export async function loadTemplate(file: string): Promise<ArrayBuffer> {
  const res = await fetch(templateUrl(file));
  if (!res.ok) throw new Error(`Không tải được mẫu ${file} (HTTP ${res.status})`);
  return res.arrayBuffer();
}

export async function renderItem(
  item: DocItem,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manifest: TemplateManifest<any>,
  application: Partial<Application>,
): Promise<Blob> {
  const buf = await loadTemplate(manifest.file);
  return fillDocx(buf, manifest, buildTemplateData(application, item));
}

export async function renderAll(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: { item: DocItem; manifest: TemplateManifest<any> }[],
  application: Partial<Application>,
): Promise<ZipEntry[]> {
  return Promise.all(
    items.map(async ({ item, manifest }, i) => ({
      name: docFileName(item, i),
      data: await renderItem(item, manifest, application),
    })),
  );
}

export async function downloadItem(
  item: DocItem,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manifest: TemplateManifest<any>,
  application: Partial<Application>,
): Promise<void> {
  downloadBlob(await renderItem(item, manifest, application), docFileName(item));
}

export async function downloadAllZip(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: { item: DocItem; manifest: TemplateManifest<any> }[],
  application: Partial<Application>,
): Promise<void> {
  await downloadZip(await renderAll(items, application));
}
