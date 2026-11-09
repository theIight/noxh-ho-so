import { describe, expect, it } from 'vitest';
import { verifyTemplate, listTemplateTags } from '../../src/lib/verify-template';
import { nd136_01 as m } from '../../src/templates/manifest/nd136-01';
import { buildTemplateData } from '../../src/templates/data';
import type { Application } from '../../src/domain/types';
import { emptyRenderText, loadTemplate, normalize, officialText, renderText, wordDiff } from './generated-form-helpers';

const tpl = loadTemplate(m.file);

const app: Application = {
  doiTuong: 'k8',
  dieuKienNhaO: 'chua_co_nha',
  hinhThuc: 'thue_mua',
  duAn: { ten: 'Dự án NOXH Thử Nghiệm', chuDauTu: 'Công ty CP Đầu tư Thử Nghiệm', diaChi: 'Phường X, Hà Nội' },
  applicant: {
    hoTen: 'Nguyễn Văn An',
    soDinhDanh: '001090000001',
    ngayCap: '2021-03-15',
    noiCap: 'Cục Cảnh sát QLHC về TTXH',
    ngheNghiep: 'Viên chức',
    coQuanCongTac: 'Trường THCS Thử Nghiệm',
    tinhTrangHonNhan: 'da_ket_hon',
    voChong: { hoTen: 'Trần Thị Bình' },
  },
};

const SIGNATURE = ['........., ngày ........ tháng ....... năm .......', 'Người viết đơn', '(Ký và ghi rõ họ tên)'];

describe('nd136-01 template', () => {
  it('tag trong .docx khớp manifest, render rỗng = mẫu trắng', () => {
    const r = verifyTemplate(tpl, m);
    expect(r.errors).toEqual([]);
    expect(listTemplateTags(tpl)).toEqual([...m.fields, ...m.checkboxes].map((f) => f.key).sort());
  });

  it('mọi dãy chấm trong manifest có trong văn bản chính thức (VBHN 24)', () => {
    const off = normalize(officialText('nd136-01'));
    for (const f of m.fields) expect(off, f.key).toContain(f.placeholder);
  });

  it('render rỗng so với văn bản chính thức: chỉ khác ở các chỗ đã biết', () => {
    const d = wordDiff(officialText('nd136-01'), emptyRenderText(tpl, m));
    console.info(`nd136-01: ${d.officialWords} từ; thiếu ${d.removed.length}: ${d.removed.join(' ')}; thừa ${d.added.length}: ${d.added.join(' ')}`);
    // □ (U+25A1) gốc → ☐ (U+2610) theo quy ước manifest; VBHN 24 không trích được 8 ô ở lề phải.
    // Mục 9 và dấu "." cuối 8.2 theo bản ký số NĐ 136 (VBHN 24 ghi khác).
    expect(d.removed.filter((w) => w !== '□')).toEqual('nhận theo quy định của pháp luật về nhà ở'.split(' '));
    expect(d.added.filter((w) => w !== '☐')).toEqual(['nhận.', 'dưới', 'mọi', 'hình', 'thức']);
    expect(d.added.filter((w) => w === '☐')).toHaveLength(11);
  });

  it('điền đủ dữ liệu: có giá trị, ô đánh dấu đúng, khối ký giữ nguyên', () => {
    const text = renderText(tpl, m, buildTemplateData(app, { person: 'applicant' }));
    expect(text).toContain('1. Kính gửi: Công ty CP Đầu tư Thử Nghiệm');
    expect(text).toContain('2. Họ và tên người viết đơn:  Nguyễn Văn An');
    expect(text).toContain('3. Căn cước công dân số 001090000001 cấp ngày 15/03/2021  tại Cục Cảnh sát QLHC về TTXH');
    expect(text).toContain('4. Nghề nghiệp Viên chức');
    expect(text).toContain('5. Nơi làm việc: Trường THCS Thử Nghiệm');
    expect(text).toContain('6. Thuộc đối tượng: Cán bộ, công chức, viên chức');
    expect(text).toContain('Mua ☐          Thuê mua ☒          Thuê ☐');
    expect(text).toContain('Khi được giải quyết thuê mua nhà ở xã hội');
    // 7.1 ☒, 7.2 ☐; 8.1 đã kết hôn ☒; 8.2 ☐.
    const boxes = [...text.matchAll(/[☐☒]/g)].map((x) => x[0]).join('');
    expect(boxes).toBe('☐☒☐' + '☒☐' + '☐☐☒' + '☐☐☐');
    for (const s of SIGNATURE) expect(text).toContain(s);
    expect(text).not.toMatch(/\{\{/);
  });

  it('khoản 7: không ghi nơi làm việc (chú thích 4), đánh dấu mục 8.2', () => {
    const k7: Application = { ...app, doiTuong: 'k7', applicant: { ...app.applicant, tinhTrangHonNhan: 'doc_than', voChong: undefined } };
    const text = renderText(tpl, m, buildTemplateData(k7, { person: 'applicant' }));
    expect(text).toContain('5. Nơi làm việc: …….…………………………………………………......');
    const boxes = [...text.matchAll(/[☐☒]/g)].map((x) => x[0]).join('');
    expect(boxes).toBe('☐☒☐' + '☒☐' + '☐☐☐' + '☒☐☐');
  });
});
