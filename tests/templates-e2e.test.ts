/**
 * Điền 7 mẫu thật (public/templates/*.docx) bằng fillDocx với hồ sơ có đủ các trường mới
 * (nơi ở hiện tại, thông tin cư trú của vợ/chồng, nhà ở, tỉnh dự án, nơi gửi...).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fillDocx } from '../src/lib/fill-docx';
import { extractDocxText } from '../src/lib/docx-text';
import { resolveDocuments } from '../src/data/rules';
import { applicationSchema } from '../src/domain/schemas';
import type { Application } from '../src/domain/types';
import { MANIFESTS } from '../src/templates/manifest';
import { buildTemplateData, findManifest, type TemplateData } from '../src/templates/data';
import type { TemplateManifest } from '../src/templates/types';

type M = TemplateManifest<TemplateData>;

const templates = new Map(
  MANIFESTS.map((m) => [m.id, new Uint8Array(readFileSync(resolve(import.meta.dirname, '../public/templates', m.file)))]),
);

async function render(m: M, data: TemplateData): Promise<string> {
  const blob = fillDocx(templates.get(m.id)!, m as TemplateManifest<unknown>, data);
  return extractDocxText(new Uint8Array(await blob.arrayBuffer()));
}

/** Mẫu trắng: mọi nguồn rỗng → dãy chấm gốc, ô ☐. */
function blankManifest(m: M): TemplateManifest<unknown> {
  return {
    ...m,
    fields: m.fields.map((f) => ({ ...f, source: () => undefined })),
    checkboxes: m.checkboxes.map((c) => ({ ...c, source: () => undefined })),
  } as TemplateManifest<unknown>;
}

const ws = (s: string) => s.replace(/\s+/g, ' ');

const full: Application = applicationSchema.parse({
  doiTuong: 'k5',
  coHopDongLaoDong: false,
  coLuongHuu: false,
  dieuKienNhaO: 'duoi_15m2',
  hinhThuc: 'thue',
  duAn: {
    ten: 'NOXH Thử Nghiệm',
    chuDauTu: 'Công ty CP Thử Nghiệm',
    diaChi: 'xã Thanh Trì',
    tinh: 'Thành phố Hà Nội',
    coQuanXacNhanNhaO: 'Văn phòng đăng ký đất đai Hà Nội',
  },
  nhaO: { soGiayChungNhan: 'CS 123456', dienTichSan: '25,5' },
  kinhGui: {
    'tt08-05': 'Công an phường Hoàng Mai',
    'tt05-03': 'UBND phường Ô Chợ Dừa',
    'tt08-01': 'UBND phường Đống Đa',
    'tt32-01a': 'Bảo hiểm xã hội quận Đống Đa',
  },
  applicant: {
    hoTen: 'Nguyễn Thị Ánh',
    ngaySinh: '1990-07-05',
    gioiTinh: 'nu',
    soDinhDanh: '001190004567',
    ngayCap: '2021-04-10',
    noiCap: 'Cục Cảnh sát QLHC về TTXH',
    noiThuongTru: 'Số 12 phố Đông Các, phường Ô Chợ Dừa',
    noiTamTru: 'Phòng 1203 toà CT2, phường Hoàng Mai',
    noiOHienTai: 'Nhà 7 ngõ 9 phố Kim Mã',
    ngheNghiep: 'Bán hàng tự do',
    thuNhapBinhQuanThang: 9000000,
    tinhTrangHonNhan: 'da_ket_hon',
    soDangKyKetHon: '45/2015 quyển 01',
    loaiDoiTuongK7: 'Thiếu tá quân đội',
    voChong: {
      hoTen: 'Trần Văn Bình',
      ngaySinh: '1988-02-01',
      gioiTinh: 'nam',
      soDinhDanh: '001088001234',
      ngayCap: '2022-01-15',
      noiCap: 'Bộ Công an',
      noiThuongTru: 'Thôn Đông, xã Vân Hà, tỉnh Bắc Ninh',
      noiTamTru: 'Số 3 ngõ 5 phố Láng',
      noiOHienTai: 'Số 8 ngõ 2 phố Huế',
      ngheNghiep: 'Thợ điện',
      thuNhap: 8000000,
      thuocKhoan7: false,
    },
    thanhVienHo: [{ hoTen: 'Trần An', quanHe: 'con', soDinhDanh: '001220009999', ngayCap: '2023-03-03', noiCap: 'Bộ Công an' }],
  },
});

const manifest = (id: string) => findManifest(MANIFESTS, id) as M;
const applicantCopy = (app: Partial<Application>) => buildTemplateData(app, { person: 'applicant' });
const spouseCopy = (app: Partial<Application>) => buildTemplateData(app, { person: 'spouse' });

describe('7 mẫu thật với đủ trường mới', () => {
  it('đăng ký đủ 7 manifest', () => {
    expect(MANIFESTS.map((m) => m.id).sort()).toEqual(
      ['nd136-01', 'tt05-03', 'tt08-01', 'tt08-02', 'tt08-05', 'tt32-01a', 'tt32-04'].sort(),
    );
  });

  it('bộ giấy tờ của hồ sơ mẫu gồm nd136-01, tt08-05, tt05-03 và bản vợ/chồng tt08-02, tt08-05', () => {
    const keys = resolveDocuments(full)
      .filter((d) => d.kind === 'template')
      .map((d) => d.key);
    expect(keys).toEqual(['applicant:nd136-01', 'applicant:tt08-05', 'applicant:tt05-03', 'spouse:tt08-02', 'spouse:tt08-05']);
  });

  it.each(MANIFESTS.map((m) => m.id))('%s: điền được bản người đứng đơn và bản vợ/chồng, khác mẫu trắng', async (id) => {
    const m = manifest(id);
    const blankText = extractDocxText(
      new Uint8Array(await fillDocx(templates.get(id)!, blankManifest(m), {}).arrayBuffer()),
    );
    const a = await render(m, applicantCopy(full));
    expect(a).not.toBe(blankText);
    expect(a).toContain('Nguyễn Thị Ánh');
    const s = await render(m, spouseCopy(full));
    expect(s).toContain('Trần Văn Bình');
  });

  it('tt08-02 bản vợ/chồng: nơi ở, thường trú của vợ/chồng; mục 6 là người đứng đơn; tỉnh dự án; nơi gửi; số ĐKKH', async () => {
    const t = ws(await render(manifest('tt08-02'), spouseCopy(full)));
    expect(t).toContain('Văn phòng đăng ký đất đai Hà Nội');
    expect(t).toContain('2. Họ và tên: Trần Văn Bình');
    expect(t).toContain('4. Nơi ở hiện tại: Số 8 ngõ 2 phố Huế');
    expect(t).toContain('Thôn Đông, xã Vân Hà, tỉnh Bắc Ninh');
    expect(t).not.toContain('Nhà 7 ngõ 9 phố Kim Mã');
    expect(t).toContain('Nguyễn Thị Ánh');
    expect(t).toContain('45/2015 quyển 01');
    expect(t).toContain('Thành phố Hà Nội');
  });

  it('tt08-02 bản vợ/chồng: không có nơi ở hiện tại thì dùng tạm trú của vợ/chồng', async () => {
    const app = structuredClone(full);
    delete app.applicant.voChong!.noiOHienTai;
    const t = ws(await render(manifest('tt08-02'), spouseCopy(app)));
    expect(t).toContain('4. Nơi ở hiện tại: Số 3 ngõ 5 phố Láng');
  });

  it('tt05-03: nhà ở, tỉnh dự án, nơi gửi, ngày/nơi cấp của thành viên hộ, nơi ở hiện tại', async () => {
    const t = ws(await render(manifest('tt05-03'), applicantCopy(full)));
    expect(t).toContain('CS 123456');
    expect(t).toContain('25,5');
    expect(t).toContain('Thành phố Hà Nội');
    expect(t).toContain('UBND phường Ô Chợ Dừa');
    expect(t).toContain('Trần An (con)');
    expect(t).toContain('03/03/2023');
    expect(t).toContain('Nhà 7 ngõ 9 phố Kim Mã');
    expect(t).toContain('45/2015 quyển 01');
  });

  it('tt08-05: nơi gửi theo application.kinhGui; giới tính vợ/chồng ở bản vợ/chồng', async () => {
    const a = ws(await render(manifest('tt08-05'), applicantCopy(full)));
    expect(a).toContain('Công an phường Hoàng Mai');
    expect(a).toContain('Nhà 7 ngõ 9 phố Kim Mã');
    const s = ws(await render(manifest('tt08-05'), spouseCopy(full)));
    expect(s).toContain('Nam');
    expect(s).toContain('Số 8 ngõ 2 phố Huế');
  });

  it('tt08-01, tt32-01a: nơi gửi theo application.kinhGui', async () => {
    expect(await render(manifest('tt08-01'), applicantCopy(full))).toContain('UBND phường Đống Đa');
    expect(await render(manifest('tt32-01a'), applicantCopy(full))).toContain('Bảo hiểm xã hội quận Đống Đa');
  });

  it('nd136-01: hình thức "thuê" đánh dấu ô Thuê, ghi "thuê"', async () => {
    const m = manifest('nd136-01');
    const t = ws(await render(m, applicantCopy(full)));
    const blank = ws(extractDocxText(new Uint8Array(await fillDocx(templates.get(m.id)!, blankManifest(m), {}).arrayBuffer())));
    expect(t).toContain('Hình thức đăng ký: Mua ☐ Thuê mua ☐ Thuê ☒');
    expect(t).toContain('Khi được giải quyết thuê nhà ở xã hội');
    expect(blank).toContain('Hình thức đăng ký: Mua ☐ Thuê mua ☐ Thuê ☐');
  });

  it('nd136-01 và tt32-04 khoản 7: đối tượng cụ thể và mục 8.2 theo voChong.thuocKhoan7', async () => {
    const k7 = (thuocKhoan7: boolean | undefined) => {
      const app = structuredClone(full);
      app.doiTuong = 'k7';
      if (thuocKhoan7 === undefined) delete app.applicant.voChong!.thuocKhoan7;
      else app.applicant.voChong!.thuocKhoan7 = thuocKhoan7;
      return app;
    };
    const m = manifest('nd136-01');
    const data = (v: boolean | undefined) => m.checkboxes.map((c) => [c.key, Boolean((c.source as (d: TemplateData) => unknown)(applicantCopy(k7(v))))]);
    expect(Object.fromEntries(data(true))).toMatchObject({ cb_llvt_ca_hai: true, cb_llvt_vo_chong_khac: false });
    expect(Object.fromEntries(data(false))).toMatchObject({ cb_llvt_ca_hai: false, cb_llvt_vo_chong_khac: true });
    expect(Object.fromEntries(data(undefined))).toMatchObject({ cb_llvt_ca_hai: false, cb_llvt_vo_chong_khac: false });
    expect(await render(manifest('tt32-04'), applicantCopy(k7(true)))).toContain('Thiếu tá quân đội');
  });

  it('hồ sơ rỗng: mọi mẫu (bản người đứng đơn) giống hệt mẫu trắng', async () => {
    for (const app of [{} as Partial<Application>, { applicant: {} } as Partial<Application>]) {
      for (const m of MANIFESTS as M[]) {
        const blank = extractDocxText(new Uint8Array(await fillDocx(templates.get(m.id)!, blankManifest(m), {}).arrayBuffer()));
        expect(await render(m, applicantCopy(app)), m.id).toBe(blank);
      }
    }
  });

  it('hồ sơ rỗng: bản vợ/chồng giống mẫu trắng, trừ dòng "Là đối tượng" cố định của Mẫu 05', async () => {
    for (const m of MANIFESTS as M[]) {
      const blank = extractDocxText(new Uint8Array(await fillDocx(templates.get(m.id)!, blankManifest(m), {}).arrayBuffer()));
      const t = await render(m, spouseCopy({ applicant: {} }));
      if (m.id === 'tt08-05') expect(t).toContain('Người thu nhập thấp tại khu vực đô thị không có hợp đồng lao động');
      else expect(t, m.id).toBe(blank);
    }
  });
});
