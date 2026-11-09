import { describe, expect, it } from 'vitest';
import { resolveDocuments } from '../src/data/rules';
import type { TemplateManifest } from '../src/templates/types';
import { buildTemplateData, docFileName, isFieldUsed, toApplicantPath, usedApplicantPaths } from '../src/templates/data';
import { goiYNhom } from '../src/data/doi-tuong';
import { MANIFESTS } from '../src/templates/manifest';
import { cleanApplicant, kinhGuiForms, toFormValues } from '../src/features/wizard/applicant-fields';
import { applicantSchema } from '../src/domain/schemas';
import type { Applicant } from '../src/domain/types';

const manifest = (id: string, sources: string[], paths: string[] = []): TemplateManifest =>
  ({
    id,
    title: id,
    legalRef: '',
    effectiveFrom: null,
    file: `${id}.docx`,
    fields: [
      ...sources.map((s, i) => ({ key: `f${i}`, label: s, placeholder: '...', source: s })),
      { key: 'fn', label: 'fn', placeholder: '...', source: () => 'x', paths },
    ],
    checkboxes: [],
  }) as TemplateManifest;

describe('buildTemplateData', () => {
  it('person là người đứng đơn hoặc vợ/chồng tuỳ bản khai', () => {
    const app = { hinhThuc: 'mua' as const, applicant: { hoTen: 'A', voChong: { hoTen: 'B' } } };
    expect(buildTemplateData(app, { person: 'applicant' }).person).toEqual({ hoTen: 'A', voChong: { hoTen: 'B' } });
    const s = buildTemplateData(app, { person: 'spouse' });
    expect(s.person).toEqual({ hoTen: 'B' });
    expect(s.applicant.hoTen).toBe('A');
    expect(s.application.hinhThuc).toBe('mua');
  });
});

describe('lọc trường Bước 3 theo manifest', () => {
  it('toApplicantPath', () => {
    expect(toApplicantPath('person.hoTen', 'applicant')).toBe('hoTen');
    expect(toApplicantPath('person.thuNhap', 'spouse')).toBe('voChong.thuNhap');
    expect(toApplicantPath('applicant.voChong.hoTen', 'applicant')).toBe('voChong.hoTen');
    expect(toApplicantPath('spouse.hoTen', 'applicant')).toBe('voChong.hoTen');
    expect(toApplicantPath('application.applicant.soDienThoai', 'applicant')).toBe('soDienThoai');
    expect(toApplicantPath('application.duAn.ten', 'applicant')).toBeNull();
    expect(toApplicantPath('khac.x', 'applicant')).toBeNull();
  });

  it('không có manifest cho mẫu đã chọn → null (hiện tất cả)', () => {
    const docs = resolveDocuments({ doiTuong: 'k8', dieuKienNhaO: 'chua_co_nha' });
    expect(usedApplicantPaths(docs, [])).toBeNull();
    expect(usedApplicantPaths(docs, [manifest('tt05-03', ['person.hoTen'])])).toBeNull();
    expect(isFieldUsed('ngheNghiep', null)).toBe(true);
  });

  it('gom đường dẫn từ source chuỗi và `paths`, bản vợ/chồng map sang voChong.*', () => {
    const docs = resolveDocuments({
      doiTuong: 'k8',
      dieuKienNhaO: 'chua_co_nha',
      applicant: { tinhTrangHonNhan: 'da_ket_hon' },
    });
    const used = usedApplicantPaths(docs, [
      manifest('nd136-01', ['person.hoTen', 'application.duAn.ten'], ['person.ngaySinh']),
      manifest('tt08-02', ['person.soDinhDanh']),
    ]);
    expect(used).toEqual(new Set(['hoTen', 'ngaySinh', 'soDinhDanh', 'voChong.soDinhDanh']));
    expect(isFieldUsed('hoTen', used)).toBe(true);
    expect(isFieldUsed('ngheNghiep', used)).toBe(false);
    expect(isFieldUsed('voChong.soDinhDanh', used)).toBe(true);
    expect(isFieldUsed('voChong.hoTen', used)).toBe(false);
    expect(isFieldUsed('voChong.hoTen', new Set(['voChong']))).toBe(true);
    expect(isFieldUsed('thanhVienHo', new Set(['thanhVienHo.0.hoTen']))).toBe(true);
  });

  it('manifest thật: trường mới được dùng; person.x hiện cả x của người đứng đơn và voChong.x', () => {
    const docs = resolveDocuments({
      doiTuong: 'k5',
      coHopDongLaoDong: false,
      coLuongHuu: false,
      dieuKienNhaO: 'duoi_15m2',
      applicant: { tinhTrangHonNhan: 'da_ket_hon' },
    });
    const used = usedApplicantPaths(docs, MANIFESTS);
    for (const f of [
      'noiOHienTai',
      'voChong.noiOHienTai',
      'noiThuongTru',
      'voChong.noiThuongTru',
      'voChong.noiTamTru',
      'gioiTinh',
      'voChong.gioiTinh',
      'soDangKyKetHon',
      'thanhVienHo',
    ]) {
      expect(isFieldUsed(f, used), f).toBe(true);
    }
    expect(isFieldUsed('soDienThoai', used)).toBe(false);
    // application.* (dự án, nhà ở, nơi gửi) không thuộc form Bước 3.
    expect(toApplicantPath('application.kinhGui', 'applicant')).toBeNull();
    expect(toApplicantPath('application.nhaO.dienTichSan', 'applicant')).toBeNull();
  });

  it('kinhGuiForms: một ô cho mỗi mẫu đọc application.kinhGui, kèm gợi ý nơi xác nhận', () => {
    const docs = resolveDocuments({
      doiTuong: 'k5',
      coHopDongLaoDong: false,
      coLuongHuu: false,
      dieuKienNhaO: 'duoi_15m2',
      applicant: { tinhTrangHonNhan: 'da_ket_hon' },
    });
    const forms = kinhGuiForms(docs, MANIFESTS);
    expect(forms.map((f) => f.id)).toEqual(['tt08-05', 'tt05-03']);
    expect(forms[0]).toMatchObject({ spouseToo: true, certifiedBy: expect.stringContaining('Công an cấp xã') });
    expect(forms[1]).toMatchObject({ spouseToo: false, certifiedBy: 'UBND cấp xã nơi đăng ký thường trú' });
    expect(kinhGuiForms(docs, [])).toEqual([]);
  });

  it('docFileName', () => {
    expect(docFileName({ id: 'x', title: 'Mẫu A', person: 'spouse' }, 2)).toBe('03 - Mẫu A (vợ hoặc chồng).docx');
  });
});

describe('goiYNhom', () => {
  it('gợi ý theo thứ tự câu hỏi, không trùng', () => {
    expect(goiYNhom(['hssv', 'co_hdld', 'luong_huu']).map((g) => g.doiTuong)).toEqual(['k5', 'k11']);
    expect(goiYNhom(['ho_ngheo']).map((g) => g.doiTuong)).toEqual(['k2', 'k3', 'k4']);
    expect(goiYNhom([])).toEqual([]);
  });
});

describe('toFormValues / cleanApplicant', () => {
  const a: Applicant = {
    hoTen: 'A',
    noiOHienTai: 'N',
    tinhTrangHonNhan: 'da_ket_hon',
    soDangKyKetHon: '1/2020',
    loaiDoiTuongK7: 'Thiếu tá',
    voChong: {
      hoTen: 'B',
      gioiTinh: 'nam',
      noiThuongTru: 'T',
      noiTamTru: 'TT',
      noiOHienTai: 'O',
      thuocKhoan7: false,
    },
    thanhVienHo: [{ hoTen: 'C', ngayCap: '2020-01-02', noiCap: 'BCA' }],
  };

  it('round-trip qua form giữ nguyên mọi trường mới', () => {
    const v = toFormValues(a);
    expect(v.voChong.thuocKhoan7).toBe('false');
    expect(v.thanhVienHo[0]).toEqual({ hoTen: 'C', quanHe: '', soDinhDanh: '', ngayCap: '2020-01-02', noiCap: 'BCA' });
    expect(cleanApplicant(applicantSchema.parse(v), 'da_ket_hon')).toEqual(a);
  });

  it('không kết hôn: bỏ vợ/chồng và số đăng ký kết hôn', () => {
    const r = cleanApplicant(applicantSchema.parse(toFormValues(a)), 'doc_than');
    expect(r.voChong).toBeUndefined();
    expect(r.soDangKyKetHon).toBeUndefined();
    expect(r.noiOHienTai).toBe('N');
  });

  it('form rỗng → Applicant rỗng', () => {
    expect(cleanApplicant(applicantSchema.parse(toFormValues({})), undefined)).toEqual({});
  });
});
