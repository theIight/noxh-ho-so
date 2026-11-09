/**
 * Công cụ dùng chung cho scripts/templates/<form-id>.ts: đọc file .docx bên thứ ba trong
 * templates-src/ (chỉ đọc, coi là dữ liệu không tin cậy), làm sạch, gắn tag `{{key}}`
 * vào dãy chấm và ghi ra public/templates/<form-id>.docx.
 *
 * Mọi thao tác là thay chuỗi có kiểm tra (đúng một lần), để script tái chạy được và
 * báo lỗi ngay khi file nguồn đổi.
 */
import PizZip from 'pizzip';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
/** Ngày cố định cho entry zip + docProps để file sinh ra ổn định giữa các lần chạy. */
export const FIXED_DATE = new Date('2026-11-09T00:00:00Z');

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const REL_FOOTNOTES = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes';
const REL_HYPERLINK = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink';
const CT_FOOTNOTES = 'application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml';

export function loadDocx(relPath: string): PizZip {
  return new PizZip(readFileSync(resolve(ROOT, relPath)));
}

export function getPart(zip: PizZip, name: string): string {
  const f = zip.file(name);
  if (!f) throw new Error(`Thiếu part ${name}`);
  return f.asText();
}

export function setPart(zip: PizZip, name: string, content: string): void {
  zip.file(name, content, { date: FIXED_DATE });
}

export const escXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Thay `find` bằng `replace`, bắt buộc `find` xuất hiện đúng một lần. */
export function replaceOnce(xml: string, find: string, replace: string, label = find): string {
  const first = xml.indexOf(find);
  if (first < 0) throw new Error(`Không tìm thấy: ${label}`);
  if (xml.indexOf(find, first + find.length) >= 0) throw new Error(`Xuất hiện nhiều lần: ${label}`);
  return xml.slice(0, first) + replace + xml.slice(first + find.length);
}

// ---------------------------------------------------------------------------
// Gắn tag vào dãy chấm
// ---------------------------------------------------------------------------

export interface TagSpec {
  key: string;
  /** Dãy chấm gốc, đúng từng ký tự (cũng là `placeholder` trong manifest). */
  placeholder: string;
  /** Chữ đứng ngay trước dãy chấm trong cùng một <w:t> (để định vị duy nhất). */
  before?: string;
  /** Chữ đứng ngay sau dãy chấm trong cùng một <w:t>. */
  after?: string;
  /** Dãy (before+placeholder+after) phải nằm ở đầu / cuối <w:t>. */
  atStart?: boolean;
  atEnd?: boolean;
  /** Khi chuỗi định vị trùng ở nhiều chỗ: chọn chỗ thứ `nth` (0 = đầu tiên theo thứ tự văn bản). */
  nth?: number;
}

const DOT = /[.…]/;
const WT = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;

/** Thay một dãy chấm trong một <w:t> bằng `{{key}}`. Lỗi nếu không định vị được đúng một chỗ. */
export function tagDotRun(xml: string, spec: TagSpec): string {
  const before = spec.before ?? '';
  const after = spec.after ?? '';
  const needle = escXml(before + spec.placeholder + after);
  const hits: { start: number; end: number; text: string; idx: number }[] = [];
  for (const m of xml.matchAll(WT)) {
    const text = m[1] ?? '';
    let idx = text.indexOf(needle);
    while (idx >= 0) {
      const end = idx + needle.length;
      const ok =
        (!spec.atStart || idx === 0) &&
        (!spec.atEnd || end === text.length) &&
        // Không cắt giữa một dãy chấm dài hơn.
        !(DOT.test(needle[0] ?? '') && DOT.test(text[idx - 1] ?? '')) &&
        !(DOT.test(needle.at(-1) ?? '') && DOT.test(text[end] ?? ''));
      if (ok) hits.push({ start: m.index, end: m.index + m[0].length, text, idx });
      idx = text.indexOf(needle, idx + 1);
    }
  }
  const h = spec.nth === undefined ? (hits.length === 1 ? hits[0] : undefined) : hits[spec.nth];
  if (!h) {
    throw new Error(`Tag {{${spec.key}}}: tìm thấy ${hits.length} vị trí cho ${JSON.stringify(before + spec.placeholder + after)}`);
  }
  const newText =
    h.text.slice(0, h.idx) + escXml(before) + `{{${spec.key}}}` + escXml(after) + h.text.slice(h.idx + needle.length);
  return xml.slice(0, h.start) + `<w:t xml:space="preserve">${newText}</w:t>` + xml.slice(h.end);
}

export function tagDotRuns(xml: string, specs: readonly TagSpec[]): string {
  return specs.reduce(tagDotRun, xml);
}

/** Định dạng lạc không được mang sang giá trị điền: nghiêng, tô sáng, nền, màu, gạch chân. */
const STRAY_RUN_PROPS = /<w:(?:i|iCs|highlight|shd|color|u)\b[^>]*\/>/g;

/**
 * Run chứa tag chỉ giữ định dạng thường của đoạn (phông, cỡ chữ...): bỏ w:i, w:iCs, w:highlight,
 * w:shd, w:color, w:u. Gọi sau khi gắn tag.
 */
export function cleanTagRuns(xml: string): string {
  return xml.replace(/<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*<\/w:r>/g, (run) =>
    run.includes('{{') ? run.replace(/<w:rPr>[\s\S]*?<\/w:rPr>/, (rPr) => rPr.replace(STRAY_RUN_PROPS, '')) : run,
  );
}

/** Bỏ gợi ý ngắt trang do Word lưu lại (<w:lastRenderedPageBreak/>): không phải nội dung, một số trình xem coi là ngắt trang. */
export function removeRenderedPageBreaks(xml: string): string {
  return xml.replace(/<w:lastRenderedPageBreak\/>/g, '');
}

/**
 * Chuẩn hoá chữ trong <w:t>: Unicode NFC (file nguồn có đoạn ở dạng tổ hợp NFD) và
 * dấu cách không ngắt U+00A0 (do dán từ web) → dấu cách thường, như văn bản gốc.
 */
export function normalizeText(xml: string): string {
  return xml.replace(WT, (whole, text: string) => {
    const t = text.normalize('NFC').replace(/\u00a0/g, ' ');
    return t === text ? whole : `<w:t xml:space="preserve">${t}</w:t>`;
  });
}

// ---------------------------------------------------------------------------
// Dọn rác bên thứ ba
// ---------------------------------------------------------------------------

/** Xoá bookmark (start + end) có tên khớp `name`. */
export function removeBookmarks(xml: string, name: RegExp): string {
  const ids = new Set<string>();
  let out = xml.replace(/<w:bookmarkStart\b[^>]*\/>/g, (tag) => {
    const id = /w:id="([^"]*)"/.exec(tag)?.[1];
    const nm = /w:name="([^"]*)"/.exec(tag)?.[1] ?? '';
    if (id !== undefined && name.test(nm)) {
      ids.add(id);
      return '';
    }
    return tag;
  });
  out = out.replace(/<w:bookmarkEnd\b[^>]*\/>/g, (tag) => {
    const id = /w:id="([^"]*)"/.exec(tag)?.[1];
    return id !== undefined && ids.has(id) ? '' : tag;
  });
  return out;
}

function footnoteRefRun(rPr: string | undefined, id: number): string {
  const inner = (rPr ?? '<w:rPr></w:rPr>')
    .replace(/^<w:rPr>/, '')
    .replace(/<\/w:rPr>$/, '')
    .replace(/<w:rStyle\b[^>]*\/>/g, '')
    .replace(/<w:u\b[^>]*\/>/g, '')
    .replace(/<w:vertAlign\b[^>]*\/>/g, '');
  return `<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/>${inner}</w:rPr><w:footnoteReference w:id="${id}"/></w:r>`;
}

const LABEL_RUN = /<w:r\b[^>]*>(<w:rPr>(?:(?!<\/w:rPr>)[\s\S])*<\/w:rPr>)?<w:t(?:\s[^>]*)?>\[(\d+)\]<\/w:t><\/w:r>/;

/**
 * Field HYPERLINK "...thuvienphapluat..." \l "_ftnN" hiển thị "[N]" → tham chiếu chú thích Word thật.
 * `idOf(N)` trả id footnote mới.
 */
export function fieldLinksToFootnoteRefs(xml: string, idOf: (n: number) => number): string {
  const field =
    /<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*?<w:fldChar w:fldCharType="begin"\/><\/w:r>((?:(?!w:fldCharType="end")[\s\S])*?)<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*?<w:fldChar w:fldCharType="end"\/><\/w:r>/g;
  return xml.replace(field, (whole, body: string) => {
    const anchor = /HYPERLINK[\s\S]*?\\l &quot;_ftn(\d+)&quot;|HYPERLINK[\s\S]*?\\l "_ftn(\d+)"/.exec(body);
    const label = LABEL_RUN.exec(body);
    if (!anchor || !label) throw new Error(`Field không nhận dạng được: ${whole.slice(0, 200)}`);
    const n = Number(anchor[1] ?? anchor[2]);
    if (Number(label[2]) !== n) throw new Error(`Nhãn [${label[2]}] khác anchor _ftn${n}`);
    return footnoteRefRun(label[1], idOf(n));
  });
}

/** <w:hyperlink w:anchor="_ftnN"><w:r>…[N]…</w:r></w:hyperlink> → tham chiếu chú thích Word thật. */
export function hyperlinkElementsToFootnoteRefs(xml: string, idOf: (n: number) => number): string {
  return xml.replace(/<w:hyperlink\b[^>]*w:anchor="_ftn(\d+)"[^>]*>([\s\S]*?)<\/w:hyperlink>/g, (whole, n: string, body: string) => {
    const label = LABEL_RUN.exec(body);
    if (!label || label[2] !== n) throw new Error(`Hyperlink không nhận dạng được: ${whole.slice(0, 200)}`);
    return footnoteRefRun(label[1], idOf(Number(n)));
  });
}

/** Bỏ mọi quan hệ hyperlink ngoài (link về trang bên thứ ba). */
export function removeHyperlinkRels(zip: PizZip): void {
  const name = 'word/_rels/document.xml.rels';
  const rels = getPart(zip, name).replace(new RegExp(`<Relationship\\b[^>]*Type="${REL_HYPERLINK}"[^>]*/>`, 'g'), '');
  setPart(zip, name, rels);
}

/** Thay docProps bằng bản trung tính (bỏ tên người soạn bên thứ ba). */
export function cleanMetadata(zip: PizZip, title: string): void {
  const iso = FIXED_DATE.toISOString().replace(/\.\d{3}Z$/, 'Z');
  setPart(
    zip,
    'docProps/core.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      `<dc:title>${escXml(title)}</dc:title><dc:creator></dc:creator><cp:lastModifiedBy></cp:lastModifiedBy><cp:revision>1</cp:revision>` +
      `<dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified>` +
      '</cp:coreProperties>',
  );
  const app = getPart(zip, 'docProps/app.xml')
    .replace(/<Company>[^<]*<\/Company>/, '<Company></Company>')
    .replace(/<TotalTime>[^<]*<\/TotalTime>/, '<TotalTime>0</TotalTime>');
  setPart(zip, 'docProps/app.xml', app);
}

/** webSettings của bản dán từ web chứa hàng loạt <w:div>; thay bằng bản tối thiểu. */
export function minimalWebSettings(zip: PizZip): void {
  setPart(
    zip,
    'word/webSettings.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:webSettings xmlns:w="${W_NS}"><w:optimizeForBrowser/><w:allowPNG/></w:webSettings>`,
  );
}

// ---------------------------------------------------------------------------
// Chú thích (footnote) Word thật
// ---------------------------------------------------------------------------

export interface FootnoteSpec {
  id: number;
  /** Mỗi phần tử là một đoạn. Đoạn đầu đứng sau số chú thích. */
  paragraphs: string[];
}

export interface FootnoteStyle {
  /** rFonts + sz cho chữ chú thích, VD Arial 8pt. */
  font: string;
  halfPoints: number;
}

function footnoteXml(n: FootnoteSpec, st: FootnoteStyle): string {
  const rPr = `<w:rFonts w:ascii="${st.font}" w:hAnsi="${st.font}" w:cs="${st.font}"/><w:sz w:val="${st.halfPoints}"/><w:szCs w:val="${st.halfPoints}"/>`;
  const pPr = '<w:pPr><w:pStyle w:val="FootnoteText"/><w:jc w:val="both"/></w:pPr>';
  const run = (t: string) => `<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escXml(t)}</w:t></w:r>`;
  const paras = n.paragraphs.map((p, i) =>
    i === 0
      ? `<w:p>${pPr}<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/>${rPr}</w:rPr><w:footnoteRef/></w:r>${run(` ${p}`)}</w:p>`
      : `<w:p>${pPr}${run(p)}</w:p>`,
  );
  return `<w:footnote w:id="${n.id}">${paras.join('')}</w:footnote>`;
}

const FOOTNOTE_STYLES =
  '<w:style w:type="paragraph" w:styleId="FootnoteText"><w:name w:val="footnote text"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:style>' +
  '<w:style w:type="character" w:styleId="FootnoteReference"><w:name w:val="footnote reference"/><w:basedOn w:val="DefaultParagraphFont"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:rPr><w:vertAlign w:val="superscript"/></w:rPr></w:style>';

/** Tạo word/footnotes.xml (thêm quan hệ, content type, style, footnotePr trong settings). */
export function addFootnotes(zip: PizZip, notes: readonly FootnoteSpec[], st: FootnoteStyle): void {
  if (zip.file('word/footnotes.xml')) throw new Error('Đã có word/footnotes.xml');
  const sep =
    '<w:footnote w:type="separator" w:id="-1"><w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:separator/></w:r></w:p></w:footnote>' +
    '<w:footnote w:type="continuationSeparator" w:id="0"><w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:continuationSeparator/></w:r></w:p></w:footnote>';
  setPart(
    zip,
    'word/footnotes.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:footnotes xmlns:w="${W_NS}" xmlns:r="${R_NS}">${sep}${notes.map((n) => footnoteXml(n, st)).join('')}</w:footnotes>`,
  );

  const relsName = 'word/_rels/document.xml.rels';
  setPart(
    zip,
    relsName,
    replaceOnce(
      getPart(zip, relsName),
      '</Relationships>',
      `<Relationship Id="rIdFootnotes" Type="${REL_FOOTNOTES}" Target="footnotes.xml"/></Relationships>`,
    ),
  );
  setPart(
    zip,
    '[Content_Types].xml',
    replaceOnce(getPart(zip, '[Content_Types].xml'), '</Types>', `<Override PartName="/word/footnotes.xml" ContentType="${CT_FOOTNOTES}"/></Types>`),
  );

  let styles = getPart(zip, 'word/styles.xml');
  if (/w:styleId="Footnote(Text|Reference)"/.test(styles)) throw new Error('styles.xml đã có style chú thích');
  styles = replaceOnce(styles, '</w:styles>', `${FOOTNOTE_STYLES}</w:styles>`);
  setPart(zip, 'word/styles.xml', styles);

  let settings = getPart(zip, 'word/settings.xml');
  if (!settings.includes('<w:footnotePr>')) {
    settings = replaceOnce(settings, '<w:compat>', '<w:footnotePr><w:footnote w:id="-1"/><w:footnote w:id="0"/></w:footnotePr><w:compat>');
    setPart(zip, 'word/settings.xml', settings);
  }
}

/** Số chú thích bắt đầu từ `n` (giữ đúng số thứ tự như trong phụ lục văn bản gốc). */
export function setFootnoteNumStart(documentXml: string, n: number): string {
  return documentXml.replace(/<w:sectPr\b([^>]*)>/, (m) => `${m}<w:footnotePr><w:numStart w:val="${n}"/></w:footnotePr>`);
}

// ---------------------------------------------------------------------------
// Khổ giấy, phông chữ
// ---------------------------------------------------------------------------

/**
 * Khổ A4 (11906 × 16838 twip), lề kiểu văn bản hành chính (Nghị định 30/2020/NĐ-CP, khớp bản PDF chính thức):
 * trên/dưới 2 cm, trái 3 cm, phải 1,5 cm. Vùng chữ rộng 9354 twip ≈ 467,7 pt: mọi dòng dãy chấm của bản PDF
 * vẫn nằm trên một dòng (với lề phải 2 cm, ước lượng theo độ rộng chữ Times New Roman, vài dòng bị xuống dòng).
 */
export const A4_PAGE = '<w:pgSz w:w="11906" w:h="16838"/>';
export const A4_MARGINS = '<w:pgMar w:top="1134" w:right="851" w:bottom="1134" w:left="1701" w:header="720" w:footer="720" w:gutter="0"/>';

export function setPageA4(documentXml: string): string {
  const sect = /<w:sectPr\b[\s\S]*?<\/w:sectPr>/.exec(documentXml);
  if (!sect || documentXml.indexOf('<w:sectPr', sect.index + 1) >= 0) throw new Error('Mong đợi đúng một <w:sectPr>');
  const fixed = sect[0]
    .replace(/<w:pgSz\b[^>]*\/>/, A4_PAGE)
    .replace(/<w:pgMar\b[^>]*\/>/, A4_MARGINS);
  if (!fixed.includes(A4_PAGE) || !fixed.includes(A4_MARGINS)) throw new Error('sectPr thiếu pgSz/pgMar');
  return documentXml.slice(0, sect.index) + fixed + documentXml.slice(sect.index + sect[0].length);
}

/**
 * Bản dán từ web dùng Arial 9 pt; văn bản gốc dùng Times New Roman 14 pt. Đổi mọi khai báo phông Arial
 * và cỡ `fromHalfPts` (nửa point) sang Times New Roman cỡ `toHalfPts`. Bắt buộc không còn Arial.
 */
export function arialToTimes(xml: string, fromHalfPts: number, toHalfPts: number): string {
  const out = xml
    .replace(/w:(ascii|hAnsi|cs)="Arial"/g, 'w:$1="Times New Roman"')
    .replace(new RegExp(`<w:(sz|szCs) w:val="${fromHalfPts}"/>`, 'g'), `<w:$1 w:val="${toHalfPts}"/>`);
  if (/"Arial"/.test(out)) throw new Error('Còn phông Arial');
  return out;
}

/**
 * Khoảng cách đoạn 6 pt trước + 6 pt sau của bản dán web → 4 pt + 4 pt: bước dòng ≈ 24 pt như bản PDF
 * (Times New Roman 14 pt), để mẫu chiếm số trang như bản gốc.
 */
export function tightenParagraphSpacing(xml: string): string {
  return xml.replace(/<w:spacing w:before="120" w:after="120"/g, '<w:spacing w:before="80" w:after="80"');
}

// ---------------------------------------------------------------------------
// Kiểm tra và ghi file
// ---------------------------------------------------------------------------

const FORBIDDEN = [/thuvienphapluat/i, /thuviennhadat/i, /HYPERLINK/, /<w:hyperlink\b/, /_ftnref/, /w:comment/, /PTSP/, /TVNĐ/];

/** Không còn link/nhãn/branding bên thứ ba trong bất kỳ part nào; không còn nhãn "[n]". */
export function assertClean(zip: PizZip): void {
  for (const name of Object.keys(zip.files)) {
    const f = zip.files[name];
    if (!f || f.dir) continue;
    if (/\.(png|jpe?g|gif|emf|wmf|bin)$/i.test(name)) throw new Error(`Part nhị phân không mong đợi: ${name}`);
    const text = f.asText();
    for (const re of FORBIDDEN) if (re.test(text)) throw new Error(`${name} còn ${re}`);
    if (/vbaProject|oleObject|activeX/i.test(name)) throw new Error(`Part không an toàn: ${name}`);
  }
  const doc = getPart(zip, 'word/document.xml');
  const visible = [...doc.matchAll(WT)].map((m) => m[1]).join('');
  if (/\[\d+\]/.test(visible)) throw new Error('document.xml còn nhãn chú thích dạng [n]');
}

/** Mọi tag trong document.xml (đã gắn), để đối chiếu với danh sách spec. */
export function tagsIn(xml: string): string[] {
  return [...xml.matchAll(/\{\{([a-z0-9_]+)\}\}/g)].map((m) => m[1] ?? '');
}

export function writeDocx(zip: PizZip, relOut: string): void {
  for (const name of Object.keys(zip.files)) {
    const f = zip.files[name];
    if (f) f.date = FIXED_DATE;
  }
  const out = resolve(ROOT, relOut);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));
  console.log(`Đã ghi ${relOut}`);
}
