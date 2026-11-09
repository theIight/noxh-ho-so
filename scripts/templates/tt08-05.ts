/**
 * Mẫu số 05 Phụ lục TT 08/2026/TT-BXD (Đơn đề nghị xác nhận điều kiện về thu nhập, K5 không có HĐLĐ).
 *
 *   npx tsx scripts/templates/tt08-05.ts
 *
 * Nguồn: templates-src/tt08-2026/mau-05.docx (bên thứ ba, chỉ đọc). Văn bản chuẩn: 08-bxd-kem.pdf tr. 5.
 * - Xoá phần đuôi thừa: đường kẻ + chú thích [1]–[9] của Mẫu 01, 02 và bản chữ thường của [10]–[13].
 * - Nhãn "[10]".."[13]" → chú thích Word thật (đánh số từ 10 như phụ lục gốc), nội dung theo PDF.
 * - "9. Là đối tượng ¹²: …" đúng vị trí dấu cách như PDF (file nguồn ghi "đối tượng¹² : ").
 * - Gắn tag vào dãy chấm người kê khai điền. Ngày ký, chữ ký, khối xác nhận Công an xã giữ nguyên.
 */
import {
  cleanTagRuns,
  removeRenderedPageBreaks,
  addFootnotes,
  arialToTimes,
  assertClean,
  cleanMetadata,
  fieldLinksToFootnoteRefs,
  getPart,
  loadDocx,
  minimalWebSettings,
  normalizeText,
  removeBookmarks,
  removeHyperlinkRels,
  replaceOnce,
  setFootnoteNumStart,
  setPageA4,
  tightenParagraphSpacing,
  setPart,
  tagDotRuns,
  tagsIn,
  writeDocx,
  type FootnoteSpec,
  type TagSpec,
} from './_docx-tagging.ts';
import { tt08_05 } from '../../src/templates/manifest/tt08-05.ts';

const SRC = 'templates-src/tt08-2026/mau-05.docx';
const OUT = 'public/templates/tt08-05.docx';
const FIRST_NOTE = 10;

const ph = (key: string) => {
  const f = tt08_05.fields.find((x) => x.key === key);
  if (!f) throw new Error(`Manifest thiếu ${key}`);
  return f.placeholder;
};

export const TAGS: TagSpec[] = [
  { key: 'kinh_gui', placeholder: ph('kinh_gui'), before: ' ', atStart: true, atEnd: true },
  { key: 'ho_ten', placeholder: ph('ho_ten'), before: 'Họ, chữ đệm và tên: ', atEnd: true },
  { key: 'ngay_sinh', placeholder: ph('ngay_sinh'), before: 'năm sinh: ', after: ' 4. Giới tính' },
  { key: 'gioi_tinh', placeholder: ph('gioi_tinh'), before: 'Giới tính: ', atEnd: true },
  { key: 'so_dinh_danh_ca_nhan', placeholder: ph('so_dinh_danh_ca_nhan'), before: '(nếu có): ', atEnd: true },
  { key: 'so_the_can_cuoc', placeholder: ph('so_the_can_cuoc'), before: 'căn cước công dân số:', after: ' cấp ngày' },
  { key: 'ngay_cap', placeholder: ph('ngay_cap'), before: 'cấp ngày ', atEnd: true },
  { key: 'noi_o_hien_tai', placeholder: ph('noi_o_hien_tai'), before: ': ', atStart: true, atEnd: true, nth: 0 },
  { key: 'noi_thuong_tru', placeholder: ph('noi_thuong_tru'), before: '(đăng ký tạm trú) tại: ', atEnd: true },
  // Sau khi gắn noi_o_hien_tai, run ": ……" còn lại duy nhất là mục 9.
  { key: 'doi_tuong_text', placeholder: ph('doi_tuong_text'), before: ': ', atStart: true, atEnd: true },
  { key: 'thu_nhap_binh_quan', placeholder: ph('thu_nhap_binh_quan'), after: ' ', atStart: true, atEnd: true },
];

export const FOOTNOTES: FootnoteSpec[] = [
  { id: 1, paragraphs: ['Cơ quan Công an cấp xã nơi thường trú hoặc tạm trú hoặc nơi ở hiện tại.'] },
  {
    id: 2,
    paragraphs: [
      'Là nơi thường trú hoặc nơi tạm trú; trường hợp không có nơi thường trú, nơi tạm trú thì nơi ở hiện tại là nơi người kê khai đang thực tế sinh sống.',
    ],
  },
  {
    id: 3,
    paragraphs: [
      'Ghi rõ người kê khai là đối tượng: người thu nhập thấp tại khu vực đô thị không có hợp đồng lao động, không được hưởng lương hưu do cơ quan Bảo hiểm xã hội chi trả.',
    ],
  },
  {
    id: 4,
    paragraphs: [
      'Cơ quan công an cấp xã nơi thường trú hoặc tạm trú hoặc nơi ở hiện tại có trách nhiệm xác nhận theo quy định tại khoản 2 Điều 30 của Nghị định số 100/2024/NĐ-CP đã được sửa đổi, bổ sung tại Nghị định số 261/2025/NĐ-CP và Nghị định số 54/2026/NĐ-CP.',
    ],
  },
];

function build(): void {
  const zip = loadDocx(SRC);
  let doc = getPart(zip, 'word/document.xml');
  doc = normalizeText(doc);

  // Giữ bảng ký/xác nhận; xoá phần đuôi thừa tới <w:sectPr>.
  const tblEnd = doc.indexOf('</w:tbl>');
  if (tblEnd < 0 || doc.indexOf('</w:tbl>', tblEnd + 1) >= 0) throw new Error('Mong đợi đúng một bảng');
  const keepEnd = doc.indexOf('</w:p>', tblEnd) + '</w:p>'.length;
  const sect = doc.lastIndexOf('<w:sectPr');
  const tail = doc.slice(keepEnd, sect); // phần sau đoạn trống ngay dưới bảng
  if (!tail.includes('_ftnref1') || !tail.includes('_ftnref13')) throw new Error('Phần đuôi không như mong đợi');
  // Đoạn bắt buộc sau bảng: thu nhỏ (1 pt) để mẫu nằm gọn một trang như bản PDF.
  const tinyPara =
    '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr></w:pPr></w:p>';
  doc = doc.slice(0, tblEnd + '</w:tbl>'.length) + tinyPara + doc.slice(sect);

  doc = removeBookmarks(doc, /^(_ftn|_ftnref|chuong_pl_)/);
  doc = fieldLinksToFootnoteRefs(doc, (n) => {
    if (n < FIRST_NOTE || n > FIRST_NOTE + FOOTNOTES.length - 1) throw new Error(`Chú thích lạ [${n}]`);
    return n - FIRST_NOTE + 1;
  });
  doc = setFootnoteNumStart(doc, FIRST_NOTE);

  // "9. Là đối tượng ¹²: ……" như PDF.
  doc = replaceOnce(doc, '<w:t>9. Là đối tượng</w:t>', '<w:t xml:space="preserve">9. Là đối tượng </w:t>');
  doc = replaceOnce(doc, `> : ${ph('doi_tuong_text')}</w:t>`, `>: ${ph('doi_tuong_text')}</w:t>`);

  doc = tagDotRuns(doc, TAGS);
  doc = removeRenderedPageBreaks(cleanTagRuns(doc));
  const tags = tagsIn(doc);
  const expected = tt08_05.fields.map((f) => f.key);
  if (tags.join() !== expected.join()) throw new Error(`Tag ${tags.join()} ≠ manifest ${expected.join()}`);

  // Khổ A4, Times New Roman 14 pt, bước dòng như bản PDF chính thức (file nguồn: Letter, Arial 9 pt).
  doc = setPageA4(tightenParagraphSpacing(arialToTimes(doc, 18, 28)));
  setPart(zip, 'word/document.xml', doc);
  removeHyperlinkRels(zip);
  addFootnotes(zip, FOOTNOTES, { font: 'Times New Roman', halfPoints: 20 });
  cleanMetadata(zip, 'Mẫu số 05 - Đơn đề nghị xác nhận điều kiện về thu nhập (TT 08/2026/TT-BXD)');
  minimalWebSettings(zip);
  assertClean(zip);
  writeDocx(zip, OUT);
}

build();
