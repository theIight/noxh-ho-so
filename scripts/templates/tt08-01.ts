/**
 * Mẫu số 01 Phụ lục TT 08/2026/TT-BXD (Giấy xác nhận về đối tượng, K9/K10/K11).
 *
 *   npx tsx scripts/templates/tt08-01.ts
 *
 * Nguồn: templates-src/tt08-2026/mau-01.docx (bên thứ ba, chỉ đọc). Văn bản chuẩn: 08-bxd-kem.pdf tr. 1–2.
 * - Bỏ field HYPERLINK về trang bên thứ ba, bookmark neo, metadata người soạn.
 * - Nhãn "[1]".."[5]" → chú thích Word thật, nội dung theo 08-bxd-kem.pdf.
 * - Tách câu cam đoan thành đoạn riêng (bản gốc là đoạn riêng, file nguồn dán liền vào mục 7).
 * - Gắn tag vào các dãy chấm người kê khai điền. Ngày ký, chữ ký, khối xác nhận giữ nguyên.
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
  setPageA4,
  tightenParagraphSpacing,
  setPart,
  tagDotRuns,
  tagsIn,
  writeDocx,
  type FootnoteSpec,
  type TagSpec,
} from './_docx-tagging.ts';
import { tt08_01 } from '../../src/templates/manifest/tt08-01.ts';

const SRC = 'templates-src/tt08-2026/mau-01.docx';
const OUT = 'public/templates/tt08-01.docx';

const ph = (key: string) => {
  const f = tt08_01.fields.find((x) => x.key === key);
  if (!f) throw new Error(`Manifest thiếu ${key}`);
  return f.placeholder;
};

export const TAGS: TagSpec[] = [
  { key: 'kinh_gui', placeholder: ph('kinh_gui'), before: ':', atStart: true, atEnd: true },
  { key: 'ho_ten', placeholder: ph('ho_ten'), before: '2. Họ và tên:', atEnd: true },
  { key: 'so_dinh_danh', placeholder: ph('so_dinh_danh'), before: 'Căn cước công dân số: ', after: 'cấp ngày' },
  { key: 'ngay_cap', placeholder: ph('ngay_cap'), before: 'cấp ngày', after: ' tại ' },
  { key: 'noi_cap', placeholder: ph('noi_cap'), before: ' tại ', atEnd: true },
  { key: 'noi_o_hien_tai', placeholder: ph('noi_o_hien_tai'), before: ':', atStart: true, atEnd: true },
  { key: 'noi_thuong_tru', placeholder: ph('noi_thuong_tru'), before: '(đăng ký tạm trú) tại: ', atEnd: true },
  { key: 'nghe_nghiep', placeholder: ph('nghe_nghiep'), before: '6. Nghề nghiệp', after: ' Tên cơ quan' },
  { key: 'co_quan_cong_tac', placeholder: ph('co_quan_cong_tac'), before: 'Tên cơ quan (đơn vị) ', atEnd: true },
  { key: 'doi_tuong_text', placeholder: ph('doi_tuong_text'), before: ' ', atStart: true, atEnd: true },
];

export const FOOTNOTES: FootnoteSpec[] = [
  {
    id: 1,
    paragraphs: [
      '- Ủy ban nhân dân cấp xã nơi đăng ký thường trú hoặc tạm trú hoặc nơi ở hiện tại của người kê khai thực hiện việc xác nhận trong trường hợp: đối tượng quy định tại khoản 10 Điều 76 của Luật Nhà ở.',
      '- Cơ quan quản lý nhà ở công vụ của người kê khai trong trường hợp người kê khai thuộc đối tượng quy định tại khoản 9 Điều 76 của Luật Nhà ở.',
      '- Đại học, học viện, trường đại học, cao đẳng, dạy nghề, trường dân tộc nội trú công lập, trường chuyên biệt theo quy định của pháp luật thực hiện việc xác nhận đối với đối tượng quy định tại khoản 11 Điều 76 của Luật Nhà ở.',
    ],
  },
  {
    id: 2,
    paragraphs: [
      'Là nơi thường trú hoặc nơi tạm trú; trường hợp không có nơi thường trú, nơi tạm trú thì nơi ở hiện tại là nơi người kê khai đang thực tế sinh sống.',
    ],
  },
  {
    id: 3,
    paragraphs: [
      'Ghi rõ người kê khai là đối tượng:',
      '- Đối tượng đã trả lại nhà ở công vụ theo quy định, trừ trường hợp bị thu hồi nhà ở công vụ do vi phạm quy định.',
      '- Hộ gia đình, cá nhân thuộc trường hợp bị thu hồi đất và phải giải tỏa, phá dỡ nhà ở theo quy định của pháp luật mà chưa được Nhà nước bồi thường bằng nhà ở, đất ở.',
      '- Học sinh, sinh viên đại học, học viện, trường đại học, cao đẳng, dạy nghề, học sinh trường dân tộc nội trú công lập, trường chuyên biệt theo quy định của pháp luật.',
    ],
  },
  { id: 4, paragraphs: ['Nơi xác nhận thuộc mục kê khai số 1.'] },
  { id: 5, paragraphs: ['Đối tượng thuộc mục kê khai số 7.'] },
];

function build(): void {
  const zip = loadDocx(SRC);
  let doc = getPart(zip, 'word/document.xml');

  doc = normalizeText(doc);
  doc = removeBookmarks(doc, /^(_ftn|_ftnref|chuong_pl_)/);
  doc = fieldLinksToFootnoteRefs(doc, (n) => n);

  // Câu cam đoan: đoạn riêng (giữ nguyên định dạng đoạn/run của mục 7).
  const CAM_DOAN = 'Tôi xin cam đoan những lời khai trên';
  const pStart = doc.lastIndexOf('<w:p ', doc.indexOf(CAM_DOAN));
  const para = doc.slice(pStart, doc.indexOf('</w:p>', pStart));
  const pPr = /<w:pPr>[\s\S]*?<\/w:pPr>/.exec(para)?.[0] ?? '';
  const runOpen = /<w:r\b[^>]*>(<w:rPr>(?:(?!<\/w:rPr>)[\s\S])*<\/w:rPr>)<w:t(?:\s[^>]*)?>[^<]*Tôi xin cam đoan/.exec(para);
  if (!runOpen) throw new Error('Không thấy run câu cam đoan');
  doc = replaceOnce(
    doc,
    `${ph('doi_tuong_text')} ${CAM_DOAN}`,
    `${ph('doi_tuong_text')}</w:t></w:r></w:p><w:p>${pPr.replace(/<w:spacing [^>]*\/>/, '<w:spacing w:before="120" w:after="120" w:line="234" w:lineRule="atLeast"/>')}<w:r>${runOpen[1]}<w:t>${CAM_DOAN}`,
  );

  // Khối xác nhận: "là đối tượng⁵ …" có dấu cách trước dãy chấm như bản PDF (file nguồn viết liền).
  const certDots = /(<w:footnoteReference w:id="5"\/><\/w:r><w:r\b[^>]*>(?:<w:rPr>(?:(?!<\/w:rPr>)[\s\S])*<\/w:rPr>)?)<w:t>(?=…)/;
  if (!certDots.test(doc)) throw new Error('Không thấy dãy chấm sau chú thích 5');
  doc = doc.replace(certDots, '$1<w:t xml:space="preserve"> ');

  doc = tagDotRuns(doc, TAGS);
  doc = removeRenderedPageBreaks(cleanTagRuns(doc));
  const tags = tagsIn(doc);
  const expected = tt08_01.fields.map((f) => f.key);
  if (tags.join() !== expected.join()) throw new Error(`Tag ${tags.join()} ≠ manifest ${expected.join()}`);

  // Khổ A4, Times New Roman 14 pt, bước dòng như bản PDF chính thức (file nguồn: Letter, Arial 9 pt).
  doc = setPageA4(tightenParagraphSpacing(arialToTimes(doc, 18, 28)));
  setPart(zip, 'word/document.xml', doc);
  removeHyperlinkRels(zip);
  addFootnotes(zip, FOOTNOTES, { font: 'Times New Roman', halfPoints: 20 });
  cleanMetadata(zip, 'Mẫu số 01 - Giấy xác nhận về đối tượng (TT 08/2026/TT-BXD)');
  minimalWebSettings(zip);
  assertClean(zip);
  writeDocx(zip, OUT);
}

build();
