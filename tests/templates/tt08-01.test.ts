import { describe, expect, it } from 'vitest';
import { listTemplateTags, verifyTemplate } from '../../src/lib/verify-template';
import { tt08_01 } from '../../src/templates/manifest/tt08-01';
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

const template = readTemplate(tt08_01.file);
const allKeys = [...tt08_01.fields.map((f) => f.key), ...tt08_01.checkboxes.map((c) => c.key)].sort();

const SIGNATURE_AND_CERT = [
  '........., ngày ....... tháng ...... năm .......',
  'Người kê khai',
  '(Ký và ghi rõ họ tên)',
  'Xác nhận của cơ quan, đơn vị, doanh nghiệp',
  'Ông/Bà……………là đối tượng …………....',
  '(Ký tên, đóng dấu)',
];

describe('tt08-01 template', () => {
  it('khổ A4, lề văn bản hành chính, Times New Roman', () => {
    expect(pageAndFontInfo(template)).toEqual({ a4: true, margins: true, arial: false });
  });

  it('một section A4, không ngắt trang cứng; run của tag không nghiêng/tô sáng/tô nền', () => {
    expect(sectionAndBreaks(template)).toEqual({ sectPr: 1, pageBreaks: 0, pageBreakBefore: 0 });
    expect(tagsWithStrayFormatting(template)).toEqual([]);
  });

  it('tag trong .docx khớp manifest', () => {
    expect(listTemplateTags(template)).toEqual(allKeys);
    const r = verifyTemplate(template, tt08_01);
    expect(r.errors).toEqual([]);
  });

  it('render rỗng = mẫu trắng chính thức (08-bxd-kem.pdf), kể cả chú thích', () => {
    const rendered = emptyRenderText(template, tt08_01);
    const diff = wordDiff(officialText('tt08-01'), rendered);
    console.log(`[tt08-01] diff với văn bản chính thức: ${diff.size} từ`, diff.hunks);
    expect(diff.hunks).toEqual([]);
    for (const f of tt08_01.fields) expect(rendered).toContain(f.placeholder);
  });

  it('điền đủ dữ liệu: giá trị vào đúng chỗ, phần ký/xác nhận giữ nguyên', () => {
    const app = sampleApplication({ doiTuong: 'k10', kinhGui: { 'tt08-01': 'Ủy ban nhân dân phường Ô Chợ Dừa' } } as never);
    const text = renderText(template, tt08_01, applicantData(app));
    const lines = text.split('\n');
    expect(lines).toContain('1. Kính gửi: Ủy ban nhân dân phường Ô Chợ Dừa');
    expect(lines).toContain('2. Họ và tên: Nguyễn Thị Ánh Tuyết');
    expect(lines).toContain('3. Căn cước công dân số: 001190004567 cấp ngày 10/04/2021 tại Cục Cảnh sát QLHC về TTXH');
    expect(lines).toContain('4. Nơi ở hiện tại: Phòng 1203 toà CT2, phường Hoàng Mai, thành phố Hà Nội');
    expect(lines).toContain(
      '5. Đăng ký thường trú (đăng ký tạm trú) tại: Số 12 ngõ 34 phố Đông Các, phường Ô Chợ Dừa, thành phố Hà Nội',
    );
    expect(lines).toContain('6. Nghề nghiệp Kế toán Tên cơ quan (đơn vị) Công ty TNHH Minh Long');
    expect(text).toContain('7. Là đối tượng Hộ gia đình, cá nhân thuộc trường hợp bị thu hồi đất');
    expect(text).not.toMatch(/\{\{|\}\}/);
    const flat = normalizeWs(text);
    for (const s of SIGNATURE_AND_CERT) expect(flat).toContain(normalizeWs(s));
  });

  it('HSSV: Kính gửi mặc định là trường (cơ quan/đơn vị)', () => {
    const app = sampleApplication({ doiTuong: 'k11' });
    app.applicant!.coQuanCongTac = 'Trường Đại học Xây dựng Hà Nội';
    const text = renderText(template, tt08_01, applicantData(app));
    expect(text).toContain('1. Kính gửi: Trường Đại học Xây dựng Hà Nội');
    expect(text).toContain('7. Là đối tượng Học sinh, sinh viên đại học');
  });

  it('bản vợ/chồng: không tự ghi đối tượng', () => {
    const text = renderText(template, tt08_01, spouseData(sampleApplication({ doiTuong: 'k9' })));
    expect(text).toContain('2. Họ và tên: Trần Văn Bình');
    expect(text).toContain(`7. Là đối tượng ${tt08_01.fields.find((f) => f.key === 'doi_tuong_text')!.placeholder}`);
  });
});
