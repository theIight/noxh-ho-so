/**
 * Mẫu số 01a Phụ lục I TT 05/2024 (bổ sung bởi TT 32/2025, sửa bởi TT 08/2026): Giấy xác nhận về đối tượng, thu nhập.
 *
 *   npx tsx scripts/templates/tt32-01a.ts
 *
 * Nguồn: templates-src/tt32-2025/mau-01a.docx (bên thứ ba, chỉ đọc; đã là bản hiện hành, không còn cụm "photo...").
 * Văn bản chuẩn: VBHN 17/VBHN-BXD Phụ lục tr. 5–6 (bản hợp nhất), chú thích theo 32-bxd.pdf tr. 7–8.
 * - Bỏ <w:hyperlink> về trang bên thứ ba (và quan hệ), bookmark neo, metadata người soạn.
 * - Nhãn "[5]".."[9]" → chú thích Word thật đánh số từ 5 như TT 32 (VBHN đánh 13–18 do hợp nhất cả phụ lục;
 *   chú thích 17 của VBHN chỉ là ghi chú hợp nhất về việc bãi bỏ cụm "photo", không thuộc mẫu nên không đưa vào).
 * - Dòng kẻ dưới quốc hiệu: 17 dấu "-" như văn bản gốc (file nguồn có 15).
 * - Gắn tag vào dãy chấm người kê khai điền. Ngày ký, chữ ký, khối xác nhận giữ nguyên.
 */
import {
  cleanTagRuns,
  removeRenderedPageBreaks,
  addFootnotes,
  arialToTimes,
  assertClean,
  cleanMetadata,
  getPart,
  hyperlinkElementsToFootnoteRefs,
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
import { tt32_01a } from '../../src/templates/manifest/tt32-01a.ts';

const SRC = 'templates-src/tt32-2025/mau-01a.docx';
const OUT = 'public/templates/tt32-01a.docx';
const FIRST_NOTE = 5;

const ph = (key: string) => {
  const f = tt32_01a.fields.find((x) => x.key === key);
  if (!f) throw new Error(`Manifest thiếu ${key}`);
  return f.placeholder;
};

export const TAGS: TagSpec[] = [
  { key: 'kinh_gui', placeholder: ph('kinh_gui'), before: ':', atStart: true, atEnd: true, nth: 0 },
  { key: 'ho_ten', placeholder: ph('ho_ten'), before: '2. Họ và tên:', atEnd: true },
  { key: 'so_dinh_danh', placeholder: ph('so_dinh_danh'), before: 'Căn cước công dân số: ', after: 'cấp ngày' },
  { key: 'ngay_cap', placeholder: ph('ngay_cap'), before: 'cấp ngày', after: ' tại ' },
  { key: 'noi_cap', placeholder: ph('noi_cap'), before: ' tại ', atEnd: true },
  // Sau khi gắn kinh_gui, run ":……" còn lại duy nhất là mục 4.
  { key: 'noi_o_hien_tai', placeholder: ph('noi_o_hien_tai'), before: ':', atStart: true, atEnd: true },
  { key: 'noi_thuong_tru', placeholder: ph('noi_thuong_tru'), before: '(đăng ký tạm trú) tại: ', atEnd: true },
  { key: 'nghe_nghiep', placeholder: ph('nghe_nghiep'), before: '6. Nghề nghiệp: ', atEnd: true },
  { key: 'co_quan_cong_tac', placeholder: ph('co_quan_cong_tac'), before: '7. Tên cơ quan/đơn vị: ', atEnd: true },
  { key: 'doi_tuong_text', placeholder: ph('doi_tuong_text'), before: ': ', atStart: true, atEnd: true },
  { key: 'thu_nhap_binh_quan', placeholder: ph('thu_nhap_binh_quan'), after: ' ', atStart: true, atEnd: true },
];

export const FOOTNOTES: FootnoteSpec[] = [
  {
    id: 1,
    paragraphs: [
      'Trường hợp các đối tượng này thuê nhà ở xã hội hoặc tự xây dựng hoặc cải tạo, sửa chữa nhà ở thì không phải xác nhận điều kiện về thu nhập tại mục 9 Mẫu này.',
    ],
  },
  {
    id: 2,
    paragraphs: [
      'Cơ quan, đơn vị, doanh nghiệp nơi người kê khai đang làm việc thực hiện việc xác nhận.',
      'Trường hợp người kê khai đang được hưởng lương hưu do cơ quan Bảo hiểm xã hội chi trả theo quy định của pháp luật về bảo hiểm xã hội thì cơ quan Bảo hiểm xã hội đang chi trả lương hưu hoặc Ủy ban nhân dân cấp xã nơi đăng ký thường trú hoặc tạm trú hoặc nơi ở hiện tại thực hiện việc xác nhận.',
    ],
  },
  {
    id: 3,
    paragraphs: [
      'Là nơi thường trú hoặc nơi tạm trú; trường hợp không có nơi thường trú, nơi tạm trú thì nơi ở hiện tại là nơi người kê khai đang thực tế sinh sống.',
    ],
  },
  {
    id: 4,
    paragraphs: [
      'Ghi rõ người kê khai là đối tượng:',
      '- Người thu nhập thấp tại khu vực đô thị (trừ trường hợp người thu nhập thấp tại khu vực đô thị không có hợp đồng lao động, không được hưởng lương hưu do cơ quan Bảo hiểm xã hội chi trả quy định tại khoản 5 Điều 76 của Luật Nhà ở). Trường hợp đối tượng đã nghỉ chế độ (nghỉ hưu) thì ghi rõ: người thu nhập thấp tại khu vực đô thị (nghỉ hưu);',
      '- Công nhân, người lao động đang làm việc tại doanh nghiệp, hợp tác xã, liên hiệp hợp tác xã trong và ngoài khu công nghiệp;',
      '- Cán bộ, công chức, viên chức theo quy định của pháp luật về cán bộ, công chức, viên chức.',
      'Trường hợp vợ hoặc chồng của người kê khai thực hiện kê khai theo Mẫu này thì không phải kê khai đối tượng tại mục 8.',
    ],
  },
  { id: 5, paragraphs: ['Đối tượng thuộc mục kê khai số 8.'] },
];

function build(): void {
  const zip = loadDocx(SRC);
  let doc = getPart(zip, 'word/document.xml');
  doc = normalizeText(doc);
  doc = removeBookmarks(doc, /^(_ftn|_ftnref|chuong_pl_|cumtu_)/);
  doc = hyperlinkElementsToFootnoteRefs(doc, (n) => {
    if (n < FIRST_NOTE || n > FIRST_NOTE + FOOTNOTES.length - 1) throw new Error(`Chú thích lạ [${n}]`);
    return n - FIRST_NOTE + 1;
  });
  doc = setFootnoteNumStart(doc, FIRST_NOTE);
  doc = replaceOnce(doc, '<w:t>---------------</w:t>', '<w:t>-----------------</w:t>');

  doc = tagDotRuns(doc, TAGS);
  doc = removeRenderedPageBreaks(cleanTagRuns(doc));
  // Mục 9: run dấu cách tô nền vàng (vết của cụm "photo..." đã bãi bỏ) và chữ nghiêng lạc → bỏ.
  const yellow = /<w:r\b[^>]*><w:rPr>(?:(?!<\/w:rPr>)[\s\S])*w:fill="FFFF96"(?:(?!<\/w:rPr>)[\s\S])*<\/w:rPr><w:t xml:space="preserve"> <\/w:t><\/w:r>/;
  if (!yellow.test(doc)) throw new Error('Không thấy run tô vàng ở mục 9');
  doc = doc.replace(yellow, '');
  {
    const at = doc.indexOf('{{thu_nhap_binh_quan}}');
    const pS = doc.lastIndexOf('<w:p ', at);
    const pE = doc.indexOf('</w:p>', at);
    doc = doc.slice(0, pS) + doc.slice(pS, pE).replace(/<w:iCs\/>|<w:i\/>/g, '') + doc.slice(pE);
  }
  const tags = tagsIn(doc);
  const expected = tt32_01a.fields.map((f) => f.key);
  if (tags.join() !== expected.join()) throw new Error(`Tag ${tags.join()} ≠ manifest ${expected.join()}`);

  // Khổ A4, Times New Roman 14 pt, bước dòng như bản PDF chính thức (file nguồn: Letter, Arial 9 pt).
  doc = setPageA4(tightenParagraphSpacing(arialToTimes(doc, 18, 28)));
  setPart(zip, 'word/document.xml', doc);
  removeHyperlinkRels(zip);
  addFootnotes(zip, FOOTNOTES, { font: 'Times New Roman', halfPoints: 20 });
  cleanMetadata(zip, 'Mẫu số 01a - Giấy xác nhận về đối tượng, thu nhập (TT 32/2025/TT-BXD, sửa bởi TT 08/2026/TT-BXD)');
  minimalWebSettings(zip);
  assertClean(zip);
  writeDocx(zip, OUT);
}

build();
