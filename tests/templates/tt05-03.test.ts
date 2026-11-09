import { describe, expect, it } from 'vitest';
import PizZip from 'pizzip';
import { listTemplateTags, verifyTemplate } from '../../src/lib/verify-template';
import { tt05_03 } from '../../src/templates/manifest/tt05-03';
import {
  applicantData,
  emptyRenderText,
  normalizeWs,
  pageAndFontInfo,
  sectionAndBreaks,
  tagsWithStrayFormatting,
  officialText,
  readTemplate,
  renderText,
  sampleApplication,
  wordDiff,
} from './_tt-helpers';

const template = readTemplate(tt05_03.file);
const allKeys = [...tt05_03.fields.map((f) => f.key), ...tt05_03.checkboxes.map((c) => c.key)].sort();

const SIGNATURE_AND_CERT = [
  '........., ngày ....... tháng ...... năm .......',
  'Người kê khai Giấy xác nhận về điều kiện nhà ở',
  '(Ký và ghi rõ họ tên)',
  'Xác nhận của Ủy ban nhân dân xã/phường…… về:',
  'Ông/Bà……………………………..có tên trong Giấy chứng nhận số………., diện tích sàn sử dụng nhà ở….…m2, diện tích nhà ở bình quân đầu người thấp hơn 15m2 sàn/người',
  '(Ký tên, đóng dấu)',
];

describe('tt05-03 template', () => {
  it('khổ A4, lề văn bản hành chính, Times New Roman', () => {
    expect(pageAndFontInfo(template)).toEqual({ a4: true, margins: true, arial: false });
  });

  it('một section A4, không ngắt trang cứng; run của tag không nghiêng/tô sáng/tô nền', () => {
    expect(sectionAndBreaks(template)).toEqual({ sectPr: 1, pageBreaks: 0, pageBreakBefore: 0 });
    expect(tagsWithStrayFormatting(template)).toEqual([]);
  });

  it('tag trong .docx khớp manifest', () => {
    expect(listTemplateTags(template)).toEqual(allKeys);
    expect(verifyTemplate(template, tt05_03).errors).toEqual([]);
  });

  it('footnotes.xml chỉ còn 5 chú thích của Mẫu 03, không còn footer thừa', () => {
    const zip = new PizZip(template);
    const fn = zip.file('word/footnotes.xml')!.asText();
    const ids = [...fn.matchAll(/<w:footnote\b[^>]*w:id="(-?\d+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(['-1', '0', '1', '2', '3', '4', '5']);
    expect(zip.file('word/footer1.xml')).toBeNull();
    expect(zip.file('word/document.xml')!.asText()).toContain('<w:numStart w:val="9"/>');
  });

  it('render rỗng = mẫu trắng chính thức (VBHN 17 tr. 9–10)', () => {
    const rendered = emptyRenderText(template, tt05_03);
    const diff = wordDiff(officialText('tt05-03'), rendered);
    console.log(`[tt05-03] diff với văn bản chính thức: ${diff.size} từ`, diff.hunks);
    expect(diff.hunks).toEqual([]);
    for (const f of tt05_03.fields) expect(rendered).toContain(f.placeholder);
  });

  it('điền đủ dữ liệu: giá trị vào đúng chỗ, phần ký/xác nhận giữ nguyên', () => {
    const app = sampleApplication({
      doiTuong: 'k8',
      dieuKienNhaO: 'duoi_15m2',
      kinhGui: { 'tt05-03': 'Ô Chợ Dừa' },
      nhaO: { soGiayChungNhan: 'CS 123456', dienTichSan: 38.5 },
      duAn: { ten: 'NOXH Hồng Hà Eco', tinh: 'Hà Nội' },
    } as never);
    Object.assign(app.applicant!, { soDangKyKetHon: '45/2015' });
    const text = renderText(template, tt05_03, applicantData(app));
    const lines = text.split('\n');
    expect(lines).toContain('1. Kính gửi: Ủy ban nhân dân xã/phường Ô Chợ Dừa');
    expect(lines).toContain('3. Căn cước công dân số: 001190004567 cấp ngày 10/04/2021 tại Cục Cảnh sát QLHC về TTXH');
    expect(lines).toContain('5. Đăng ký thường trú tại: Số 12 ngõ 34 phố Đông Các, phường Ô Chợ Dừa, thành phố Hà Nội');
    expect(lines).toContain('6. Họ và tên vợ/chồng (nếu có): Trần Văn Bình');
    expect(lines).toContain('Căn cước công dân số 001088001234 cấp ngày 15/01/2022 tại Bộ Công an');
    expect(lines).toContain('7. Đăng ký kết hôn số (nếu có).45/2015');
    expect(lines).toContain('8. Họ và tên các thành viên trong hộ gia đình (nếu có) Trần An Nhiên (con)');
    expect(lines).toContain(`Căn cước công dân số 001220009999  cấp ngày ${tt05_03.fields.find((f) => f.key === 'thanh_vien_ngay_cap')!.placeholder} tại${tt05_03.fields.find((f) => f.key === 'thanh_vien_noi_cap')!.placeholder}`);
    expect(lines).toContain('9. Là đối tượng: Cán bộ, công chức, viên chức theo quy định của pháp luật về cán bộ, công chức, viên chức');
    expect(text).toContain('(sau đây gọi chung là Giấy chứng nhận) số: CS 123456, diện tích sàn sử dụng nhà ở 38,5 m2');
    expect(text).toContain('tại tỉnh/Thành phố Hà Nội (nơi có dự án');
    expect(text).not.toMatch(/\{\{|\}\}/);
    const flat = normalizeWs(text);
    for (const s of SIGNATURE_AND_CERT) expect(flat).toContain(normalizeWs(s));
  });
});
