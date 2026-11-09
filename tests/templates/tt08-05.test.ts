import { describe, expect, it } from 'vitest';
import { listTemplateTags, verifyTemplate } from '../../src/lib/verify-template';
import { tt08_05 } from '../../src/templates/manifest/tt08-05';
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
  spouseData,
  wordDiff,
} from './_tt-helpers';

const template = readTemplate(tt08_05.file);
const allKeys = [...tt08_05.fields.map((f) => f.key), ...tt08_05.checkboxes.map((c) => c.key)].sort();

const SIGNATURE_AND_CERT = [
  '........., ngày ....... tháng ...... năm ....',
  'Người kê khai',
  '(Ký và ghi rõ họ tên)',
  'Xác nhận của Công an cấp xã',
  '(Ký tên, đóng dấu)',
];

describe('tt08-05 template', () => {
  it('khổ A4, lề văn bản hành chính, Times New Roman', () => {
    expect(pageAndFontInfo(template)).toEqual({ a4: true, margins: true, arial: false });
  });

  it('một section A4, không ngắt trang cứng; run của tag không nghiêng/tô sáng/tô nền', () => {
    expect(sectionAndBreaks(template)).toEqual({ sectPr: 1, pageBreaks: 0, pageBreakBefore: 0 });
    expect(tagsWithStrayFormatting(template)).toEqual([]);
  });

  it('tag trong .docx khớp manifest', () => {
    expect(listTemplateTags(template)).toEqual(allKeys);
    expect(verifyTemplate(template, tt08_05).errors).toEqual([]);
  });

  it('render rỗng = mẫu trắng chính thức (08-bxd-kem.pdf tr. 5), chỉ còn chú thích 10–13', () => {
    const rendered = emptyRenderText(template, tt08_05);
    const diff = wordDiff(officialText('tt08-05'), rendered);
    console.log(`[tt08-05] diff với văn bản chính thức: ${diff.size} từ`, diff.hunks);
    expect(diff.hunks).toEqual([]);
    for (const f of tt08_05.fields) expect(rendered).toContain(f.placeholder);
    // Chú thích của Mẫu 01, 02 (rác trong file nguồn) đã bị xoá.
    expect(rendered).not.toContain('Nơi xác nhận thuộc mục kê khai số 1');
    expect(rendered).not.toContain('Ghi rõ tên tỉnh/thành phố trực thuộc Trung ương');
  });

  it('điền đủ dữ liệu: giá trị vào đúng chỗ, phần ký/xác nhận giữ nguyên', () => {
    const app = sampleApplication({ doiTuong: 'k5', coHopDongLaoDong: false, kinhGui: { 'tt08-05': 'phường Hoàng Mai' } } as never);
    const text = renderText(template, tt08_05, applicantData(app));
    const lines = text.split('\n');
    expect(lines).toContain('1. Kính gửi: Công an phường Hoàng Mai');
    expect(lines).toContain('2. Họ, chữ đệm và tên: Nguyễn Thị Ánh Tuyết');
    expect(lines).toContain('3. Ngày, tháng, năm sinh: 05/07/1990 4. Giới tính: Nữ');
    expect(lines).toContain('5. Số định danh cá nhân (nếu có): 001190004567');
    expect(lines).toContain('6. Thẻ căn cước/căn cước công dân số: 001190004567 cấp ngày 10/04/2021');
    expect(lines).toContain('7. Nơi ở hiện tại: Phòng 1203 toà CT2, phường Hoàng Mai, thành phố Hà Nội');
    expect(lines).toContain(
      // Số chú thích ¹² không có trong văn bản trích nên còn "đối tượng : ".
      '9. Là đối tượng : Người thu nhập thấp tại khu vực đô thị không có hợp đồng lao động, không được hưởng lương hưu do cơ quan Bảo hiểm xã hội chi trả',
    );
    expect(lines).toContain('10. Tôi có thu nhập bình quân hàng tháng thực nhận là 12.500.000 đồng/tháng.');
    expect(text).not.toMatch(/\{\{|\}\}/);
    const flat = normalizeWs(text);
    for (const s of SIGNATURE_AND_CERT) expect(flat).toContain(normalizeWs(s));
  });

  it('bản vợ/chồng: thu nhập lấy từ voChong.thuNhap', () => {
    const text = renderText(template, tt08_05, spouseData(sampleApplication({ doiTuong: 'k8' })));
    expect(text).toContain('2. Họ, chữ đệm và tên: Trần Văn Bình');
    expect(text).toContain('thực nhận là 14.000.000 đồng/tháng.');
    expect(text).toContain('9. Là đối tượng : Người thu nhập thấp tại khu vực đô thị không có hợp đồng lao động');
  });
});
