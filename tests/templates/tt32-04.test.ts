import { describe, expect, it } from 'vitest';
import { verifyTemplate, listTemplateTags } from '../../src/lib/verify-template';
import { tt32_04 as m } from '../../src/templates/manifest/tt32-04';
import { buildTemplateData } from '../../src/templates/data';
import type { Application } from '../../src/domain/types';
import { emptyRenderText, loadTemplate, normalize, officialText, renderText, wordDiff } from './generated-form-helpers';

const tpl = loadTemplate(m.file);

const app: Application = {
  doiTuong: 'k7',
  dieuKienNhaO: 'chua_co_nha',
  hinhThuc: 'mua',
  applicant: {
    hoTen: 'Lê Văn Cường',
    soDinhDanh: '001088000002',
    ngayCap: '2022-01-05',
    noiCap: 'Bộ Công an',
    noiThuongTru: 'Số 1 phố A, phường B, Hà Nội',
    noiTamTru: 'Số 2 phố C, phường D, Hà Nội',
    coQuanCongTac: 'Sư đoàn 000',
    thuNhapBinhQuanThang: 18500000,
    tinhTrangHonNhan: 'da_ket_hon',
    voChong: { hoTen: 'Phạm Thị Dung', soDinhDanh: '001190000003', coQuanCongTac: 'Bệnh viện Quân y 000', thuNhap: 15000000 },
  },
};

const FIXED = [
  '........., ngày ....... tháng ...... năm ......',
  'Người kê khai',
  '(Ký và ghi rõ họ tên)',
  'Xác nhận của cơ quan, đơn vị, doanh nghiệp',
  'Ông/Bà………………………………………......……,',
  'có tổng thu nhập bình quân hàng tháng thực nhận theo Bảng tiền công/tiền lương là…….…....... đồng/tháng.',
  '(Ký tên, đóng dấu)',
];

describe('tt32-04 template', () => {
  it('tag trong .docx khớp manifest, render rỗng = mẫu trắng', () => {
    const r = verifyTemplate(tpl, m);
    expect(r.errors).toEqual([]);
    expect(listTemplateTags(tpl)).toEqual(m.fields.map((f) => f.key).sort());
  });

  it('mọi dãy chấm trong manifest có trong văn bản chính thức (VBHN 17)', () => {
    const off = normalize(officialText('tt32-04'));
    for (const f of m.fields) expect(off, f.key).toContain(f.placeholder);
  });

  it('render rỗng giống văn bản chính thức hiện hành (không còn cụm "photo")', () => {
    const empty = emptyRenderText(tpl, m);
    const d = wordDiff(officialText('tt32-04'), empty);
    console.info(`tt32-04: ${d.officialWords} từ; thiếu ${d.removed.length}; thừa ${d.added.length}`);
    expect(d.removed).toEqual([]);
    expect(d.added).toEqual([]);
    expect(empty).not.toContain('photo');
  });

  it('điền đủ dữ liệu (bản người đứng đơn)', () => {
    const text = renderText(tpl, m, buildTemplateData(app, { person: 'applicant' }));
    expect(text).toContain('1. Kính gửi: Sư đoàn 000');
    expect(text).toContain('2. Họ và tên: Lê Văn Cường');
    expect(text).toContain('3. Căn cước công dân số 001088000002 cấp ngày 05/01/2022 tại Bộ Công an');
    expect(text).toContain('4. Nơi ở hiện tại: Số 2 phố C, phường D, Hà Nội');
    expect(text).toContain('5. Đăng ký thường trú (đăng ký tạm trú) tại:  Số 1 phố A, phường B, Hà Nội');
    expect(text).toContain('6. Là đối tượng:  Sĩ quan, quân nhân chuyên nghiệp');
    expect(text).toContain('tiền lương là 18.500.000 đồng/tháng.');
    for (const s of FIXED) expect(text).toContain(s);
    expect(text).not.toMatch(/\{\{/);
  });

  it('bản của vợ/chồng dùng thông tin vợ/chồng, trường thiếu giữ dãy chấm', () => {
    const text = renderText(tpl, m, buildTemplateData(app, { person: 'spouse' }));
    expect(text).toContain('2. Họ và tên: Phạm Thị Dung');
    expect(text).toContain('1. Kính gửi: Bệnh viện Quân y 000');
    expect(text).toContain('tiền lương là 15.000.000 đồng/tháng.');
    expect(text).toContain('cấp ngày...../..../...... tại…………………');
    expect(text).toContain('4. Nơi ở hiện tại:………………………………………………………………...');
    for (const s of FIXED) expect(text).toContain(s);
  });
});
