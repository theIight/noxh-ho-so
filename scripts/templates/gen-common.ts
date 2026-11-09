/**
 * Khung dựng .docx cho các mẫu không có bản Word chính thức (nd136-01, tt32-04, tt08-02),
 * dùng thư viện `docx`. Bố cục theo bản PDF chính thức: A4, lề trên/dưới/phải 2 cm, lề trái 3 cm,
 * Times New Roman 14pt, chú thích là footnote thật của Word.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType,
  Document,
  FootnoteReferenceRun,
  Packer,
  Paragraph,
  Table,
  TableBorders,
  TableCell,
  TableLayoutType,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlignTable,
  WidthType,
  type ParagraphChild,
} from 'docx';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const CM = 567; // twips / cm
export const PAGE = { width: 11906, height: 16838, top: 2 * CM, bottom: 2 * CM, left: 3 * CM, right: 2 * CM };
/** Chiều rộng vùng chữ (twips). */
export const TEXT_WIDTH = PAGE.width - PAGE.left - PAGE.right;
export const FONT = 'Times New Roman';
export const BODY_SIZE = 28; // nửa point → 14pt
export const NOTE_SIZE = 20; // 10pt

export interface RunOpts {
  b?: boolean;
  i?: boolean;
  sup?: boolean;
  size?: number;
}

export type Seg = string | TextRun | FootnoteReferenceRun;

/** Đoạn chữ thường / đậm / nghiêng. */
export const t = (text: string, o: RunOpts = {}) =>
  new TextRun({ text, bold: o.b, italics: o.i, superScript: o.sup, size: o.size });
export const b = (text: string, o: RunOpts = {}) => t(text, { ...o, b: true });
export const i = (text: string, o: RunOpts = {}) => t(text, { ...o, i: true });
/** Tag docxtemplater `{{key}}`, luôn nằm trọn trong một run. */
export const tag = (key: string) => new TextRun({ text: `{{${key}}}` });
/** Dấu chú thích (footnote reference). */
export const fn = (id: number) => new FootnoteReferenceRun(id);
/** Ký tự tab. */
export const tab = () => new TextRun({ children: ['\t'] });

export interface ParaOpts {
  align?: 'left' | 'center' | 'right' | 'justify';
  /** Thụt dòng đầu (twips). */
  firstLine?: number;
  /** Khoảng cách sau đoạn (twips). */
  after?: number;
  before?: number;
  tabs?: number[];
  keepNext?: boolean;
  /** Thụt lề trái / phải cả đoạn (twips), dùng cho khối ký và khối xác nhận. */
  left?: number;
  right?: number;
}

const ALIGN = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
} as const;

export function p(segs: Seg | Seg[], o: ParaOpts = {}): Paragraph {
  const children: ParagraphChild[] = (Array.isArray(segs) ? segs : [segs]).map((s) =>
    typeof s === 'string' ? t(s) : s,
  );
  return new Paragraph({
    children,
    alignment: ALIGN[o.align ?? 'justify'],
    indent:
      o.firstLine || o.left || o.right ? { firstLine: o.firstLine, left: o.left, right: o.right } : undefined,
    spacing: { before: o.before ?? 0, after: o.after ?? 120, line: 264 },
    tabStops: o.tabs?.map((position) => ({ type: TabStopType.LEFT, position })),
    keepNext: o.keepNext,
  });
}

/** Quốc hiệu, tiêu ngữ và đường kẻ (giữ đúng chuỗi kẻ của bản gốc). */
export function motto(rule: { text: string; size?: number; bold?: boolean }): Paragraph[] {
  return [
    p(b('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'), { align: 'center', after: 0 }),
    p(b('Độc lập - Tự do - Hạnh phúc'), { align: 'center', after: 0 }),
    p(t(rule.text, { b: rule.bold, size: rule.size }), { align: 'center', after: 240 }),
  ];
}

/** Đoạn chú thích (10pt, thụt dòng đầu 1 cm như bản gốc). */
export function note(segs: Seg | Seg[], o: ParaOpts = {}): Paragraph {
  const children = (Array.isArray(segs) ? segs : [segs]).map((s) => (typeof s === 'string' ? t(s, { size: NOTE_SIZE }) : s));
  return p(children, { firstLine: CM, after: 0, ...o });
}

/** Footnote: mảng đoạn, đoạn đầu được Word tự thêm số chú thích. */
export type Footnotes = Record<number, Paragraph[]>;

const noBorders = TableBorders.NONE;

function cell(children: Paragraph[], width: number, valign: 'top' | 'bottom' = 'top'): TableCell {
  return new TableCell({
    children: children.length ? children : [new Paragraph({})],
    width: { size: width, type: WidthType.DXA },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    verticalAlign: valign === 'bottom' ? VerticalAlignTable.BOTTOM : VerticalAlignTable.TOP,
  });
}

/**
 * Khối chữ (khối ký bên phải, khối xác nhận bên trái) bằng thụt lề đoạn thay cho bảng,
 * để mọi trình xem đặt đúng vị trí. `side: 'right'` → khối rộng `width` sát lề phải.
 */
export function column(side: 'left' | 'right', width: number, paras: [Seg | Seg[], ParaOpts?][]): Paragraph[] {
  const pad = TEXT_WIDTH - width;
  return paras.map(([segs, o = {}]) => p(segs, side === 'right' ? { ...o, left: pad } : { ...o, right: pad }));
}

/**
 * Lựa chọn có ô đánh dấu ở lề phải (như bản ký số NĐ 136): cột chữ rộng bằng vùng chữ,
 * cột ô vuông nằm trong lề phải, căn đáy theo dòng cuối của lựa chọn.
 */
export function choice(text: Paragraph[], box: Seg, boxWidth = 500): Table {
  return new Table({
    rows: [
      new TableRow({
        children: [
          cell(text, TEXT_WIDTH),
          cell([p(box, { align: 'center' })], boxWidth, 'bottom'),
        ],
      }),
    ],
    columnWidths: [TEXT_WIDTH, boxWidth],
    width: { size: TEXT_WIDTH + boxWidth, type: WidthType.DXA },
    borders: noBorders,
    layout: TableLayoutType.FIXED,
  });
}

export async function writeDocx(
  id: string,
  title: string,
  children: (Paragraph | Table)[],
  footnotes: Footnotes,
): Promise<string> {
  const doc = new Document({
    creator: 'noxh-ho-so',
    title,
    styles: {
      default: {
        document: { run: { font: FONT, size: BODY_SIZE }, paragraph: { spacing: { after: 0 } } },
        footnoteText: { run: { font: FONT, size: NOTE_SIZE } },
      },
    },
    footnotes: Object.fromEntries(Object.entries(footnotes).map(([k, v]) => [k, { children: v }])),
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE.width, height: PAGE.height },
            margin: { top: PAGE.top, bottom: PAGE.bottom, left: PAGE.left, right: PAGE.right },
          },
        },
        children,
      },
    ],
  });
  const out = resolve(ROOT, 'public/templates', `${id}.docx`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, await Packer.toBuffer(doc));
  return out;
}

export { CM };

/** Đoạn chú thích không thụt dòng (kiểu chú thích của các Thông tư BXD). */
export const noteL = (segs: Seg | Seg[], o: ParaOpts = {}) => note(segs, { ...o, firstLine: 0 });
