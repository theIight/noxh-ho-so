import { describe, expect, it } from 'vitest';
import { applicantSchema, applicationSchema, cccdSchema } from '../src/domain/schemas';

describe('applicantSchema', () => {
  it('mọi trường đều optional', () => {
    expect(applicantSchema.safeParse({}).success).toBe(true);
  });
  it('chuỗi rỗng / khoảng trắng coi như chưa nhập', () => {
    const r = applicantSchema.parse({ hoTen: '  ', soDinhDanh: '', ngaySinh: '', thuNhapBinhQuanThang: '' });
    expect(r).toEqual({});
  });
  it('NaN (input number rỗng) coi như chưa nhập', () => {
    expect(applicantSchema.parse({ thuNhapBinhQuanThang: Number.NaN }).thuNhapBinhQuanThang).toBeUndefined();
  });
  it('thu nhập dạng chuỗi có dấu chấm phân cách', () => {
    expect(applicantSchema.parse({ thuNhapBinhQuanThang: '12.500.000' }).thuNhapBinhQuanThang).toBe(12500000);
    expect(applicantSchema.safeParse({ thuNhapBinhQuanThang: -1 }).success).toBe(false);
  });
  it('ngày phải hợp lệ khi có nhập', () => {
    expect(applicantSchema.safeParse({ ngaySinh: '1990-02-28' }).success).toBe(true);
    expect(applicantSchema.safeParse({ ngaySinh: '1990-02-30' }).success).toBe(false);
    expect(applicantSchema.safeParse({ ngaySinh: '28/02/1990' }).success).toBe(false);
  });
  it('vợ/chồng và thành viên hộ: optional, CCCD kiểm tra khi có', () => {
    expect(applicantSchema.safeParse({ voChong: {}, thanhVienHo: [{}] }).success).toBe(true);
    expect(applicantSchema.safeParse({ voChong: { soDinhDanh: '123' } }).success).toBe(false);
    expect(applicantSchema.safeParse({ thanhVienHo: [{ soDinhDanh: '12345678901a' }] }).success).toBe(false);
  });
});

describe('trường bổ sung (nơi ở hiện tại, vợ/chồng, thành viên hộ, khoản 7)', () => {
  it('parse đủ trường mới, chuỗi rỗng coi như chưa nhập', () => {
    const r = applicantSchema.parse({
      noiOHienTai: ' Số 1 phố Huế ',
      soDangKyKetHon: '12/2020',
      loaiDoiTuongK7: '',
      voChong: {
        gioiTinh: 'nam',
        noiThuongTru: 'Xã A',
        noiTamTru: '',
        noiOHienTai: 'Phường B',
        thuocKhoan7: 'true',
      },
      thanhVienHo: [{ hoTen: 'C', ngayCap: '2020-01-02', noiCap: 'Bộ Công an' }],
    });
    expect(r).toEqual({
      noiOHienTai: 'Số 1 phố Huế',
      soDangKyKetHon: '12/2020',
      voChong: { gioiTinh: 'nam', noiThuongTru: 'Xã A', noiOHienTai: 'Phường B', thuocKhoan7: true },
      thanhVienHo: [{ hoTen: 'C', ngayCap: '2020-01-02', noiCap: 'Bộ Công an' }],
    });
  });
  it('voChong.thuocKhoan7: boolean, "false", rỗng', () => {
    expect(applicantSchema.parse({ voChong: { thuocKhoan7: false } }).voChong?.thuocKhoan7).toBe(false);
    expect(applicantSchema.parse({ voChong: { thuocKhoan7: 'false' } }).voChong?.thuocKhoan7).toBe(false);
    expect(applicantSchema.parse({ voChong: { thuocKhoan7: '' } }).voChong?.thuocKhoan7).toBeUndefined();
  });
  it('kiểm tra định dạng ngày cấp thành viên và giới tính vợ/chồng', () => {
    expect(applicantSchema.safeParse({ thanhVienHo: [{ ngayCap: '2020-02-30' }] }).success).toBe(false);
    expect(applicantSchema.safeParse({ voChong: { gioiTinh: 'x' } }).success).toBe(false);
    expect(applicantSchema.parse({ voChong: { gioiTinh: '' } }).voChong?.gioiTinh).toBeUndefined();
  });
});

describe('cccdSchema', () => {
  it.each(['001203004567', ' 001203004567 '])('chấp nhận %j', (v) => {
    expect(cccdSchema.safeParse(v).success).toBe(true);
  });
  it.each(['', undefined])('chấp nhận rỗng %j', (v) => {
    expect(cccdSchema.parse(v)).toBeUndefined();
  });
  it.each(['12345678901', '1234567890123', '00120300456a', '001 203 004 567', '123456789'])('từ chối %j', (v) => {
    const r = cccdSchema.safeParse(v);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/12 chữ số/);
  });
});

describe('applicationSchema', () => {
  const ok = { doiTuong: 'k6', dieuKienNhaO: 'chua_co_nha', hinhThuc: 'mua', applicant: {} };
  it('hợp lệ với thông tin cá nhân rỗng', () => {
    expect(applicationSchema.safeParse(ok).success).toBe(true);
  });
  it('từ chối khoản 12', () => {
    expect(applicationSchema.safeParse({ ...ok, doiTuong: 'k12' }).success).toBe(false);
  });
  it('bắt buộc nhóm, điều kiện nhà ở, hình thức', () => {
    expect(applicationSchema.safeParse({ applicant: {} }).success).toBe(false);
  });
  it('hình thức: mua, thuê mua, thuê', () => {
    for (const h of ['mua', 'thue_mua', 'thue']) expect(applicationSchema.safeParse({ ...ok, hinhThuc: h }).success).toBe(true);
    expect(applicationSchema.safeParse({ ...ok, hinhThuc: 'cho_thue' }).success).toBe(false);
  });
  it('dự án (tỉnh, cơ quan cấp GCN), nhà ở, nơi gửi theo mã mẫu', () => {
    const r = applicationSchema.parse({
      ...ok,
      duAn: { tinh: 'Hà Nội', coQuanXacNhanNhaO: ' VP đăng ký đất đai ' },
      nhaO: { soGiayChungNhan: 'CS 01', dienTichSan: '25,5' },
      kinhGui: { 'tt08-05': 'Công an phường X', 'tt05-03': '' },
    });
    expect(r.duAn).toEqual({ tinh: 'Hà Nội', coQuanXacNhanNhaO: 'VP đăng ký đất đai' });
    expect(r.nhaO).toEqual({ soGiayChungNhan: 'CS 01', dienTichSan: 25.5 });
    expect(r.kinhGui?.['tt08-05']).toBe('Công an phường X');
    expect(r.kinhGui?.['tt05-03']).toBeUndefined();
  });
  it('diện tích sàn: số dương; rỗng coi như chưa nhập', () => {
    expect(applicationSchema.parse({ ...ok, nhaO: { dienTichSan: 40 } }).nhaO?.dienTichSan).toBe(40);
    expect(applicationSchema.parse({ ...ok, nhaO: { dienTichSan: '' } }).nhaO?.dienTichSan).toBeUndefined();
    expect(applicationSchema.safeParse({ ...ok, nhaO: { dienTichSan: 'abc' } }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...ok, nhaO: { dienTichSan: 0 } }).success).toBe(false);
  });
  it('khoản 5 cần trả lời câu hỏi HĐLĐ / lương hưu', () => {
    expect(applicationSchema.safeParse({ ...ok, doiTuong: 'k5' }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...ok, doiTuong: 'k5', coHopDongLaoDong: false }).success).toBe(true);
  });
});
