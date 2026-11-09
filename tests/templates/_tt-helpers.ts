/**
 * Tiện ích chung cho tests/templates/{tt08-01,tt08-05,tt32-01a,tt05-03}.test.ts.
 */
import { readFileSync } from 'node:fs';
import PizZip from 'pizzip';
import { resolve } from 'node:path';
import { extractDocxText } from '../../src/lib/docx-text';
import { renderDocx } from '../../src/lib/fill-docx';
import { buildTemplateData, type TemplateData } from '../../src/templates/data';
import type { TemplateManifest } from '../../src/templates/types';
import type { Application } from '../../src/domain/types';

export function readTemplate(file: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(import.meta.dirname, '../../public/templates', file)));
}

export const normalizeWs = (s: string) => s.replace(/\s+/g, ' ').trim();

export function renderText<T>(template: Uint8Array, manifest: TemplateManifest<T>, data: T): string {
  return extractDocxText(renderDocx(template, manifest, data));
}

/** Văn bản khi render với dữ liệu rỗng (mọi trường → placeholder, checkbox → ☐). */
export function emptyRenderText<T>(template: Uint8Array, manifest: TemplateManifest<T>): string {
  const empty: TemplateManifest<Record<string, never>> = {
    ...manifest,
    fields: manifest.fields.map((f) => ({ ...f, source: () => undefined })),
    checkboxes: manifest.checkboxes.map((c) => ({ ...c, source: () => undefined })),
  };
  return renderText(template, empty, {});
}

export interface WordDiff {
  /** Số từ khác nhau (thêm + bớt) theo LCS trên từ. */
  size: number;
  /** Các đoạn khác nhau: `-` có ở văn bản chuẩn nhưng thiếu trong template, `+` thừa trong template. */
  hunks: string[];
}

/** So sánh theo từ (đã chuẩn hoá khoảng trắng) giữa văn bản chuẩn và văn bản render. */
export function wordDiff(expected: string, actual: string): WordDiff {
  const a = normalizeWs(expected).split(' ');
  const b = normalizeWs(actual).split(' ');
  const n = a.length;
  const m = b.length;
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }
  const hunks: string[] = [];
  let size = 0;
  let i = 0;
  let j = 0;
  let del: string[] = [];
  let add: string[] = [];
  const flush = () => {
    if (del.length) hunks.push(`- ${del.join(' ')}`);
    if (add.length) hunks.push(`+ ${add.join(' ')}`);
    size += del.length + add.length;
    del = [];
    add = [];
  };
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) {
      flush();
      i++;
      j++;
    } else if (j < m && (i === n || dp[i]![j + 1]! >= dp[i + 1]![j]!)) {
      add.push(b[j++]!);
    } else {
      del.push(a[i++]!);
    }
  }
  flush();
  return { size, hunks };
}

/** Dữ liệu mẫu đầy đủ cho người đứng đơn (và vợ/chồng). */
export function sampleApplication(over: Partial<Application> = {}): Partial<Application> {
  return {
    doiTuong: 'k5',
    dieuKienNhaO: 'chua_co_nha',
    hinhThuc: 'mua',
    duAn: { ten: 'Nhà ở xã hội Hồng Hà Eco', chuDauTu: 'Công ty CP Đầu tư Hồng Hà', diaChi: 'xã Thanh Trì, thành phố Hà Nội' },
    applicant: {
      hoTen: 'Nguyễn Thị Ánh Tuyết',
      ngaySinh: '1990-07-05',
      gioiTinh: 'nu',
      soDinhDanh: '001190004567',
      ngayCap: '2021-04-10',
      noiCap: 'Cục Cảnh sát QLHC về TTXH',
      noiThuongTru: 'Số 12 ngõ 34 phố Đông Các, phường Ô Chợ Dừa, thành phố Hà Nội',
      noiTamTru: 'Phòng 1203 toà CT2, phường Hoàng Mai, thành phố Hà Nội',
      ngheNghiep: 'Kế toán',
      coQuanCongTac: 'Công ty TNHH Minh Long',
      thuNhapBinhQuanThang: 12500000,
      tinhTrangHonNhan: 'da_ket_hon',
      voChong: {
        hoTen: 'Trần Văn Bình',
        ngaySinh: '1988-02-01',
        soDinhDanh: '001088001234',
        ngayCap: '2022-01-15',
        noiCap: 'Bộ Công an',
        ngheNghiep: 'Kỹ sư',
        coQuanCongTac: 'Công ty CP Xây dựng Sông Hồng',
        thuNhap: 14000000,
      },
      thanhVienHo: [{ hoTen: 'Trần An Nhiên', quanHe: 'con', soDinhDanh: '001220009999' }],
    },
    ...over,
  };
}

export const applicantData = (app: Partial<Application>): TemplateData => buildTemplateData(app, { person: 'applicant' });
export const spouseData = (app: Partial<Application>): TemplateData => buildTemplateData(app, { person: 'spouse' });

/** Văn bản chính thức tests/fixtures/official/<id>.txt (bỏ dòng bắt đầu bằng #). */
export function officialText(id: string): string {
  return readFileSync(resolve(import.meta.dirname, '../fixtures/official', `${id}.txt`), 'utf8')
    .split('\n')
    .filter((l) => !l.startsWith('#'))
    .join('\n');
}

/** Khổ A4, lề 2/1,5/2/3 cm, không còn Arial (bản PDF chính thức: A4, Times New Roman). */
export function pageAndFontInfo(template: Uint8Array): { a4: boolean; margins: boolean; arial: boolean } {
  const zip = new PizZip(template);
  const doc = zip.file('word/document.xml')!.asText();
  const parts = ['word/document.xml', 'word/footnotes.xml'].map((n) => zip.file(n)?.asText() ?? '').join('');
  return {
    a4: doc.includes('<w:pgSz w:w="11906" w:h="16838"/>'),
    margins: doc.includes('<w:pgMar w:top="1134" w:right="851" w:bottom="1134" w:left="1701"'),
    arial: /"Arial"/.test(parts),
  };
}

/** Tag có run mang định dạng lạc (nghiêng, tô sáng, nền). */
export function tagsWithStrayFormatting(template: Uint8Array): string[] {
  const doc = new PizZip(template).file('word/document.xml')!.asText();
  const bad: string[] = [];
  for (const run of doc.match(/<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*<\/w:r>/g) ?? []) {
    const tag = /\{\{([a-z0-9_]+)\}\}/.exec(run)?.[1];
    if (!tag) continue;
    const rPr = /<w:rPr>[\s\S]*?<\/w:rPr>/.exec(run)?.[0] ?? '';
    if (/<w:(i|iCs|highlight|shd)\b/.test(rPr)) bad.push(tag);
  }
  return bad;
}

/** Số w:sectPr, ngắt trang cứng và pageBreakBefore trong thân văn bản. */
export function sectionAndBreaks(template: Uint8Array): { sectPr: number; pageBreaks: number; pageBreakBefore: number } {
  const doc = new PizZip(template).file('word/document.xml')!.asText();
  return {
    sectPr: (doc.match(/<w:sectPr\b/g) ?? []).length,
    pageBreaks: (doc.match(/<w:br\b[^>]*w:type="page"/g) ?? []).length,
    pageBreakBefore: (doc.match(/<w:pageBreakBefore\b/g) ?? []).length,
  };
}
