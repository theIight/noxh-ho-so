/** Gom nhiều file đã điền thành một .zip (toàn bộ trong trình duyệt). */
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface ZipEntry {
  /** Tên file trong zip, VD '01-don-dang-ky.docx'. */
  name: string;
  data: Blob | Uint8Array | ArrayBuffer | string;
}

/** Bỏ ký tự không hợp lệ trong tên file trên Windows/macOS, giữ nguyên dấu tiếng Việt. */
export function sanitizeFileName(name: string): string {
  const cleaned = name
    .normalize('NFC')
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '');
  return cleaned || 'file';
}

/** Đảm bảo tên file không trùng: 'a.docx', 'a (2).docx', ... */
export function uniqueNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((raw) => {
    const n = sanitizeFileName(raw);
    if (!used.has(n.toLowerCase())) {
      used.add(n.toLowerCase());
      return n;
    }
    const dot = n.lastIndexOf('.');
    const [base, ext] = dot > 0 ? [n.slice(0, dot), n.slice(dot)] : [n, ''];
    let i = 2;
    while (used.has(`${base} (${i})${ext}`.toLowerCase())) i++;
    const out = `${base} (${i})${ext}`;
    used.add(out.toLowerCase());
    return out;
  });
}

export async function buildZip(entries: ZipEntry[]): Promise<Blob> {
  const zip = new JSZip();
  const names = uniqueNames(entries.map((e) => e.name));
  entries.forEach((e, i) => zip.file(names[i] as string, e.data));
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/zip' });
}

export async function downloadZip(entries: ZipEntry[], zipName = 'ho-so-nha-o-xa-hoi.zip'): Promise<void> {
  saveAs(await buildZip(entries), sanitizeFileName(zipName));
}

export function downloadBlob(blob: Blob, fileName: string): void {
  saveAs(blob, sanitizeFileName(fileName));
}
