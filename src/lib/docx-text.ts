/**
 * Trích văn bản thuần từ .docx (không cần DOMParser, chạy được trong Node và trình duyệt).
 * Dùng để so sánh "render rỗng" với mẫu gốc và tìm tag (kể cả tag bị Word tách qua nhiều run).
 */
import PizZip from 'pizzip';

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function decodeXmlEntities(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, e: string) => {
    if (e.startsWith('#x')) return String.fromCodePoint(parseInt(e.slice(2), 16));
    if (e.startsWith('#')) return String.fromCodePoint(parseInt(e.slice(1), 10));
    return ENTITIES[e] ?? _;
  });
}

/**
 * Văn bản của một part XML WordprocessingML: mỗi đoạn (w:p) một dòng.
 * Chỉ <w:tab/> trong run là ký tự tab; <w:tab> nằm trong <w:tabs> (định nghĩa điểm dừng tab của
 * w:pPr, VD tab dẫn chấm) không phải nội dung nên bị bỏ qua.
 */
export function xmlToText(xml: string): string {
  const token = /<w:t\b[^>]*\/>|<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/>|<w:(?:br|cr)\b[^>]*\/>|<\/w:p>/g;
  const content = xml.replace(/<w:tabs\b[^>]*\/>|<w:tabs\b[^>]*>[\s\S]*?<\/w:tabs>/g, '');
  let out = '';
  for (const m of content.matchAll(token)) {
    const t = m[0];
    if (t === '</w:p>') out += '\n';
    else if (t.startsWith('<w:tab')) out += '\t';
    else if (t.startsWith('<w:br') || t.startsWith('<w:cr')) out += '\n';
    else out += decodeXmlEntities(m[1] ?? '');
  }
  return out;
}

const PART_ORDER = (name: string) =>
  name === 'word/document.xml' ? 1 : name.startsWith('word/header') ? 0 : name.startsWith('word/footer') ? 2 : 3;

/** Các part chứa nội dung hiển thị (thân văn bản, header, footer, chú thích). */
export function contentPartNames(zip: PizZip): string[] {
  return Object.keys(zip.files)
    .filter((n) => /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(n))
    .sort((a, b) => PART_ORDER(a) - PART_ORDER(b) || a.localeCompare(b));
}

export function extractDocxText(docx: ArrayBuffer | Uint8Array): string {
  const zip = new PizZip(docx instanceof Uint8Array ? docx : new Uint8Array(docx));
  return contentPartNames(zip)
    .map((n) => xmlToText(zip.file(n)?.asText() ?? ''))
    .join('');
}
