import { describe, expect, it } from 'vitest';
import { listTemplateTags, verifyTemplate } from '../../src/lib/verify-template';
import { tt32_01a } from '../../src/templates/manifest/tt32-01a';
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

const template = readTemplate(tt32_01a.file);
const allKeys = [...tt32_01a.fields.map((f) => f.key), ...tt32_01a.checkboxes.map((c) => c.key)].sort();
const ph = (key: string) => tt32_01a.fields.find((f) => f.key === key)!.placeholder;

const SIGNATURE_AND_CERT = [
  '........., ngày ....... tháng ...... năm .......',
  'Người kê khai',
  '(Ký và ghi rõ họ tên)',
  'Xác nhận của cơ quan, đơn vị, doanh nghiệp',
  'Ông/Bà………….là đối tượng ……………......……, có tổng thu nhập bình quân hàng tháng thực nhận theo Bảng tiền công/tiền lương là…….…..... đồng/tháng.',
  '(Ký tên, đóng dấu)',
];

describe('tt32-01a template', () => {
  it('khổ A4, lề văn bản hành chính, Times New Roman', () => {
    expect(pageAndFontInfo(template)).toEqual({ a4: true, margins: true, arial: false });
  });

  it('một section A4, không ngắt trang cứng; run của tag không nghiêng/tô sáng/tô nền', () => {
    expect(sectionAndBreaks(template)).toEqual({ sectPr: 1, pageBreaks: 0, pageBreakBefore: 0 });
    expect(tagsWithStrayFormatting(template)).toEqual([]);
  });

  it('tag trong .docx khớp manifest', () => {
    expect(listTemplateTags(template)).toEqual(allKeys);
    expect(verifyTemplate(template, tt32_01a).errors).toEqual([]);
  });

  it('render rỗng = mẫu trắng hiện hành (VBHN 17), không còn cụm "photo"', () => {
    const rendered = emptyRenderText(template, tt32_01a);
    const diff = wordDiff(officialText('tt32-01a'), rendered);
    console.log(`[tt32-01a] diff với văn bản chính thức: ${diff.size} từ`, diff.hunks);
    expect(diff.hunks).toEqual([]);
    expect(rendered).not.toMatch(/photo/i);
    for (const f of tt32_01a.fields) expect(rendered).toContain(f.placeholder);
  });

  it('điền đủ dữ liệu: giá trị vào đúng chỗ, phần ký/xác nhận giữ nguyên', () => {
    const text = renderText(template, tt32_01a, applicantData(sampleApplication({ doiTuong: 'k6' })));
    const lines = text.split('\n');
    expect(lines).toContain('1. Kính gửi: Công ty TNHH Minh Long');
    expect(lines).toContain('2. Họ và tên: Nguyễn Thị Ánh Tuyết');
    expect(lines).toContain('3. Căn cước công dân số: 001190004567 cấp ngày 10/04/2021 tại Cục Cảnh sát QLHC về TTXH');
    expect(lines).toContain('6. Nghề nghiệp: Kế toán');
    expect(lines).toContain('7. Tên cơ quan/đơn vị: Công ty TNHH Minh Long');
    expect(lines).toContain(
      '8. Là đối tượng: Công nhân, người lao động đang làm việc tại doanh nghiệp, hợp tác xã, liên hiệp hợp tác xã trong và ngoài khu công nghiệp',
    );
    expect(text).toContain('tiền công/tiền lương là 12.500.000 đồng/tháng.');
    expect(text).not.toMatch(/\{\{|\}\}/);
    const flat = normalizeWs(text);
    for (const s of SIGNATURE_AND_CERT) expect(flat).toContain(normalizeWs(s));
  });

  it('khoản 5 hưởng lương hưu: ghi "(nghỉ hưu)", Kính gửi để trống (BHXH hoặc UBND xã)', () => {
    const text = renderText(template, tt32_01a, applicantData(sampleApplication({ doiTuong: 'k5', coLuongHuu: true })));
    expect(text).toContain('8. Là đối tượng: Người thu nhập thấp tại khu vực đô thị (nghỉ hưu)');
    expect(text).toContain(`1. Kính gửi:${ph('kinh_gui')}`);
  });

  it('bản vợ/chồng: bỏ trống mục 8 (chú thích), thu nhập lấy từ voChong.thuNhap', () => {
    const text = renderText(template, tt32_01a, spouseData(sampleApplication({ doiTuong: 'k8' })));
    expect(text).toContain('2. Họ và tên: Trần Văn Bình');
    expect(text).toContain('1. Kính gửi: Công ty CP Xây dựng Sông Hồng');
    expect(text).toContain(`8. Là đối tượng: ${ph('doi_tuong_text')}`);
    expect(text).toContain('tiền công/tiền lương là 14.000.000 đồng/tháng.');
  });
});
