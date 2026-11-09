/**
 * Mẫu số 03 Phụ lục I TT 05/2024/TT-BXD (Giấy xác nhận về điều kiện nhà ở, diện tích bình quân < 15 m²/người).
 *
 *   npx tsx scripts/templates/tt05-03.ts
 *
 * Nguồn: templates-src/tt05-2024/mau-03.docx (cắt từ Phụ lục I bên thứ ba, chỉ đọc). Văn bản chuẩn:
 * VBHN 17/VBHN-BXD Phụ lục tr. 9–10.
 * - footnotes.xml: chỉ giữ 5 chú thích được tham chiếu (id 9–13 → 1–5), xoá 25 chú thích thừa của các mẫu khác;
 *   đánh số hiển thị từ 9 như Phụ lục I TT 05/2024.
 * - Xoá footer1.xml không được tham chiếu (số trang "2" còn sót) và metadata người soạn.
 * - Mục 5: tab dẫn chấm + "…" → đúng dãy chấm in trong VBHN để dãy chấm nằm trọn trong placeholder.
 * - Gắn tag vào dãy chấm người kê khai điền. Ngày ký, chữ ký, khối xác nhận UBND xã giữ nguyên.
 */
import {
  cleanTagRuns,
  removeRenderedPageBreaks,
  assertClean,
  cleanMetadata,
  getPart,
  loadDocx,
  normalizeText,
  replaceOnce,
  setFootnoteNumStart,
  setPageA4,
  setPart,
  tagDotRuns,
  tagsIn,
  writeDocx,
  type TagSpec,
} from './_docx-tagging.ts';
import { tt05_03 } from '../../src/templates/manifest/tt05-03.ts';

const SRC = 'templates-src/tt05-2024/mau-03.docx';
const OUT = 'public/templates/tt05-03.docx';
/** Id chú thích được tham chiếu trong thân bài nguồn (số 9–13 của Phụ lục I). */
const KEEP_NOTES = [9, 10, 11, 12, 13];

const ph = (key: string) => {
  const f = tt05_03.fields.find((x) => x.key === key);
  if (!f) throw new Error(`Manifest thiếu ${key}`);
  return f.placeholder;
};

export const TAGS: TagSpec[] = [
  { key: 'kinh_gui_xa', placeholder: ph('kinh_gui_xa'), before: 'Ủy ban nhân dân xã/phường ', atEnd: true },
  { key: 'ho_ten', placeholder: ph('ho_ten'), before: '2. Họ và tên:', atEnd: true },
  { key: 'so_dinh_danh', placeholder: ph('so_dinh_danh'), before: '3. Căn cước công dân số:', after: ' cấp ngày ' },
  { key: 'ngay_cap', placeholder: ph('ngay_cap'), before: ' cấp ngày ', after: ' tại' + ph('noi_cap') },
  { key: 'noi_cap', placeholder: ph('noi_cap'), before: '}} tại', atEnd: true },
  { key: 'noi_o_hien_tai', placeholder: ph('noi_o_hien_tai'), before: ':', atStart: true, atEnd: true },
  { key: 'noi_thuong_tru', placeholder: ph('noi_thuong_tru'), atStart: true, atEnd: true },
  { key: 'vo_chong_ho_ten', placeholder: ph('vo_chong_ho_ten'), before: 'vợ/chồng (nếu có): ', atEnd: true },
  { key: 'vo_chong_so_dinh_danh', placeholder: ph('vo_chong_so_dinh_danh'), before: 'Căn cước công dân số', after: 'cấp ngày ' },
  { key: 'vo_chong_ngay_cap', placeholder: ph('vo_chong_ngay_cap'), before: '}}cấp ngày ', after: ' tại' },
  { key: 'vo_chong_noi_cap', placeholder: ph('vo_chong_noi_cap'), before: '}} tại', atEnd: true },
  { key: 'so_dang_ky_ket_hon', placeholder: ph('so_dang_ky_ket_hon'), before: 'kết hôn số (nếu có).', atEnd: true },
  { key: 'thanh_vien_ho_ten', placeholder: ph('thanh_vien_ho_ten'), before: ' (nếu có) ', atStart: true, atEnd: true },
  { key: 'thanh_vien_so_dinh_danh', placeholder: ph('thanh_vien_so_dinh_danh'), before: 'Căn cước công dân số', after: '  cấp ngày ' },
  { key: 'thanh_vien_ngay_cap', placeholder: ph('thanh_vien_ngay_cap'), before: '}}  cấp ngày ', after: ' tại' },
  { key: 'thanh_vien_noi_cap', placeholder: ph('thanh_vien_noi_cap'), before: '}} tại', atEnd: true },
  { key: 'doi_tuong_text', placeholder: ph('doi_tuong_text'), before: ':', atStart: true, atEnd: true },
  { key: 'so_gcn', placeholder: ph('so_gcn'), before: 'Giấy chứng nhận) số:', after: ', diện tích sàn' },
  { key: 'dien_tich_san', placeholder: ph('dien_tich_san'), before: '}}, diện tích sàn sử dụng nhà ở', after: 'm', atEnd: true },
  { key: 'tinh_du_an', placeholder: ph('tinh_du_an'), before: ' tại tỉnh/Thành phố', after: '(nơi có dự án' },
];

function cleanFootnotes(footnotesXml: string): string {
  const notes = [...footnotesXml.matchAll(/<w:footnote\b([^>]*)>[\s\S]*?<\/w:footnote>/g)];
  const head = footnotesXml.slice(0, notes[0]?.index ?? 0);
  const tail = footnotesXml.slice((notes.at(-1)?.index ?? 0) + (notes.at(-1)?.[0].length ?? 0));
  const kept: string[] = [];
  let dropped = 0;
  for (const m of notes) {
    const attrs = m[1] ?? '';
    const id = Number(/w:id="(-?\d+)"/.exec(attrs)?.[1]);
    if (/w:type="(separator|continuationSeparator)"/.test(attrs)) kept.push(m[0]);
    else if (KEEP_NOTES.includes(id)) {
      kept.push(m[0].replace(`<w:footnote w:id="${id}">`, `<w:footnote w:id="${KEEP_NOTES.indexOf(id) + 1}">`));
    } else dropped++;
  }
  if (kept.length !== KEEP_NOTES.length + 2) throw new Error(`Giữ ${kept.length} chú thích, mong đợi ${KEEP_NOTES.length + 2}`);
  console.log(`footnotes.xml: giữ ${KEEP_NOTES.length}, xoá ${dropped} chú thích thừa`);
  return head + kept.join('') + tail;
}

function build(): void {
  const zip = loadDocx(SRC);
  let doc = normalizeText(getPart(zip, 'word/document.xml'));

  // Chú thích: chỉ đúng 9–13 được tham chiếu, theo thứ tự.
  const refs = [...doc.matchAll(/<w:footnoteReference w:id="(\d+)"\/>/g)].map((m) => Number(m[1]));
  if (refs.join() !== KEEP_NOTES.join()) throw new Error(`Tham chiếu chú thích ${refs.join()}`);
  for (const [i, id] of KEEP_NOTES.entries()) {
    doc = replaceOnce(doc, `<w:footnoteReference w:id="${id}"/>`, `<w:footnoteReference w:id="${i + 1}"/>`);
  }
  doc = setFootnoteNumStart(doc, KEEP_NOTES[0]!);
  setPart(zip, 'word/footnotes.xml', cleanFootnotes(getPart(zip, 'word/footnotes.xml')));

  // Footer không được sectPr tham chiếu → bỏ.
  if (/<w:footerReference\b/.test(doc)) throw new Error('Không mong đợi footerReference');
  zip.remove('word/footer1.xml');
  const relsName = 'word/_rels/document.xml.rels';
  const rels = getPart(zip, relsName).replace(/<Relationship\b[^>]*Target="footer1\.xml"[^>]*\/>/, '');
  if (rels.includes('footer1.xml')) throw new Error('Còn quan hệ footer1.xml');
  setPart(zip, relsName, rels);
  setPart(
    zip,
    '[Content_Types].xml',
    replaceOnce(
      getPart(zip, '[Content_Types].xml'),
      '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>',
      '',
    ),
  );

  // Mục 5: tab dẫn chấm → dãy chấm thật (như VBHN).
  const dots = ph('noi_thuong_tru');
  const ellipsis = dots.slice(dots.indexOf(' ') + 1);
  doc = replaceOnce(doc, `<w:tab/><w:t>${ellipsis}</w:t>`, `<w:t xml:space="preserve">${dots}</w:t>`);
  // Điểm dừng tab dẫn chấm của đoạn này không còn dùng.
  doc = replaceOnce(
    doc,
    '<w:tabs><w:tab w:val="left" w:leader="dot" w:pos="5520"/><w:tab w:val="left" w:leader="dot" w:pos="9120"/></w:tabs>',
    '',
  );

  doc = tagDotRuns(doc, TAGS);
  doc = removeRenderedPageBreaks(cleanTagRuns(doc));
  // Ngắt trang thừa ở cuối (còn lại sau khi cắt từ Phụ lục I) → trang trắng cuối. Bỏ cả đoạn chứa nó.
  {
    const br = doc.indexOf('<w:br w:type="page"/>');
    if (br < 0 || doc.indexOf('<w:br w:type="page"/>', br + 1) >= 0) throw new Error('Mong đợi đúng một ngắt trang');
    const pS = Math.max(doc.lastIndexOf('<w:p>', br), doc.lastIndexOf('<w:p ', br));
    const pE = doc.indexOf('</w:p>', br) + '</w:p>'.length;
    const para = doc.slice(pS, pE);
    if (/<w:t\b/.test(para) || pS < doc.lastIndexOf('</w:p>', br)) throw new Error('Đoạn ngắt trang có nội dung');
    doc = doc.slice(0, pS) + doc.slice(pE);
  }
  const tags = tagsIn(doc);
  const expected = tt05_03.fields.map((f) => f.key);
  if (tags.join() !== expected.join()) throw new Error(`Tag ${tags.join()} ≠ manifest ${expected.join()}`);

  doc = setPageA4(doc); // file nguồn: Letter
  setPart(zip, 'word/document.xml', doc);
  cleanMetadata(zip, 'Mẫu số 03 - Giấy xác nhận về điều kiện nhà ở (TT 05/2024/TT-BXD)');
  assertClean(zip);
  writeDocx(zip, OUT);
}

build();
