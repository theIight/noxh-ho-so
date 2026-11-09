import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { buildZip, sanitizeFileName, uniqueNames } from '../src/lib/zip';

describe('zip', () => {
  it('sanitizeFileName giữ dấu tiếng Việt, bỏ ký tự cấm', () => {
    expect(sanitizeFileName('Mẫu 01: Đơn đăng ký/thuê mua?.docx')).toBe('Mẫu 01- Đơn đăng ký-thuê mua-.docx');
    expect(sanitizeFileName('   ')).toBe('file');
  });
  it('uniqueNames đánh số file trùng tên', () => {
    expect(uniqueNames(['a.docx', 'A.docx', 'a.docx', 'b'])).toEqual(['a.docx', 'A (2).docx', 'a (3).docx', 'b']);
  });
  it('buildZip gom nhiều file', async () => {
    const blob = await buildZip([
      { name: 'Mẫu 02 - người đứng đơn.docx', data: new Uint8Array([1, 2, 3]) },
      { name: 'Mẫu 02 - người đứng đơn.docx', data: 'x' },
      { name: 'checklist.txt', data: 'Bản sao CCCD' },
    ]);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual(
      ['Mẫu 02 - người đứng đơn (2).docx', 'Mẫu 02 - người đứng đơn.docx', 'checklist.txt'].sort(),
    );
    expect(await zip.file('checklist.txt')?.async('string')).toBe('Bản sao CCCD');
  });
});
