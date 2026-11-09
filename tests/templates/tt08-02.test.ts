import { describe, expect, it } from 'vitest';
import { verifyTemplate, listTemplateTags } from '../../src/lib/verify-template';
import { tt08_02 as m } from '../../src/templates/manifest/tt08-02';
import { buildTemplateData } from '../../src/templates/data';
import type { Application } from '../../src/domain/types';
import { emptyRenderText, loadTemplate, normalize, officialText, renderText, wordDiff } from './generated-form-helpers';

const tpl = loadTemplate(m.file);

const app: Application = {
  doiTuong: 'k6',
  dieuKienNhaO: 'chua_co_nha',
  hinhThuc: 'mua',
  duAn: { ten: 'Dự án NOXH Thử Nghiệm', chuDauTu: 'Công ty Thử Nghiệm' },
  applicant: {
    hoTen: 'Hoàng Văn Em',
    soDinhDanh: '036095000004',
    ngayCap: '2021-07-01',
    noiCap: 'Cục Cảnh sát QLHC về TTXH',
    noiThuongTru: 'Xã A, tỉnh Nam Định',
    noiTamTru: 'Phường B, Bắc Ninh',
    tinhTrangHonNhan: 'da_ket_hon',
    voChong: { hoTen: 'Vũ Thị Gấm', soDinhDanh: '036196000005', ngayCap: '2022-02-02', noiCap: 'Bộ Công an' },
  },
};

const FIXED = [
  '........., ngày ....... tháng ...... năm ......',
  'Người kê khai Giấy xác nhận về điều kiện nhà ở',
  '(Ký và ghi rõ họ tên)',
  'Xác nhận của cơ quan có thẩm quyền cấp Giấy chứng nhận quyền sử dụng đất, quyền sở hữu tài sản gắn liền với đất ……..……..',
  '………………………………………….…...',
  ' Ông/Bà:  ………………………………………. không có nhà ở',
  'tại tỉnh/Thành phố……………………………….. (nơi có dự án',
  '(Ký tên, đóng dấu)',
];

describe('tt08-02 template', () => {
  it('tag trong .docx khớp manifest, render rỗng = mẫu trắng', () => {
    const r = verifyTemplate(tpl, m);
    expect(r.errors).toEqual([]);
    expect(listTemplateTags(tpl)).toEqual(m.fields.map((f) => f.key).sort());
  });

  it('mọi dãy chấm trong manifest có trong văn bản chính thức (08-bxd-kem.pdf)', () => {
    const off = normalize(officialText('tt08-02'));
    for (const f of m.fields) expect(off, f.key).toContain(f.placeholder);
  });

  it('render rỗng giống văn bản chính thức', () => {
    const d = wordDiff(officialText('tt08-02'), emptyRenderText(tpl, m));
    console.info(`tt08-02: ${d.officialWords} từ; thiếu ${d.removed.length}; thừa ${d.added.length}`);
    expect(d.removed).toEqual([]);
    expect(d.added).toEqual([]);
  });

  it('bản người đứng đơn: mục 6 là vợ/chồng; khối xác nhận giữ nguyên', () => {
    const text = renderText(tpl, m, buildTemplateData(app, { person: 'applicant' }));
    expect(text).toContain('2. Họ và tên: Hoàng Văn Em');
    expect(text).toContain('3. Căn cước công dân số: 036095000004 cấp ngày 01/07/2021 tại Cục Cảnh sát QLHC về TTXH');
    expect(text).toContain('4. Nơi ở hiện tại: Phường B, Bắc Ninh');
    expect(text).toContain('5. Đăng ký thường trú (đăng ký tạm trú) tại: Xã A, tỉnh Nam Định');
    expect(text).toContain('6. Họ và tên vợ/chồng (nếu có): Vũ Thị Gấm');
    expect(text).toContain('Căn cước công dân số 036196000005 cấp ngày 02/02/2022 tại Bộ Công an');
    expect(text).toContain('8. Là đối tượng: Công nhân, người lao động');
    // Chưa có trong mô hình dữ liệu → giữ dãy chấm.
    expect(text).toContain('1. Kính gửi: ……………………………………………………………………...');
    expect(text).toContain('7. Đăng ký kết hôn số (nếu có)..……………………………………………………');
    expect(text).toContain('tại tỉnh/Thành phố………………… (nơi có dự án');
    for (const s of FIXED) expect(text).toContain(s);
    expect(text).not.toMatch(/\{\{/);
  });

  it('bản của vợ/chồng: người kê khai là vợ/chồng, mục 6 là người đứng đơn', () => {
    const text = renderText(tpl, m, buildTemplateData(app, { person: 'spouse' }));
    expect(text).toContain('2. Họ và tên: Vũ Thị Gấm');
    expect(text).toContain('6. Họ và tên vợ/chồng (nếu có): Hoàng Văn Em');
    expect(text).toContain('Căn cước công dân số 036095000004 cấp ngày 01/07/2021 tại Cục Cảnh sát QLHC về TTXH');
    for (const s of FIXED) expect(text).toContain(s);
  });

  it('người độc thân: mục 6 giữ dãy chấm', () => {
    const single: Application = { ...app, applicant: { ...app.applicant, tinhTrangHonNhan: 'doc_than', voChong: undefined } };
    const text = renderText(tpl, m, buildTemplateData(single, { person: 'applicant' }));
    expect(text).toContain('6. Họ và tên vợ/chồng (nếu có): …………………………………………………..');
    expect(text).toContain('Căn cước công dân số…………….…cấp ngày …/ …/ … tại…………………….');
  });
});
