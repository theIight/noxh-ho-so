import { describe, expect, it } from 'vitest';
import { resolveDocuments, hinhThucPolicy, FORMS, type DocItem, type FormId } from '../src/data/rules';
import { DOI_TUONG, DIEU_KIEN_NHA_O, type Application, type DieuKienNhaO, type TinhTrangHonNhan } from '../src/domain/types';

/**
 * Bảng kỳ vọng viết lại độc lập từ docs/PLAN.md §5 (không import GROUP_RULES),
 * để test thực sự kiểm tra rules.ts khớp với plan.
 */
type Variant = { name: string; app: Pick<Application, 'doiTuong' | 'coHopDongLaoDong' | 'coLuongHuu'> };
type GroupExpect = { kind: 'template'; form: FormId; income: boolean; certifiedBy?: RegExp; extra?: string[] } | { kind: 'checklist'; id: string };

const VARIANTS: [Variant, GroupExpect][] = [
  [{ name: 'k1', app: { doiTuong: 'k1' } }, { kind: 'checklist', id: 'cl-k1-nguoi-co-cong' }],
  [{ name: 'k2', app: { doiTuong: 'k2' } }, { kind: 'checklist', id: 'cl-k2-k4-ho-ngheo' }],
  [{ name: 'k3', app: { doiTuong: 'k3' } }, { kind: 'checklist', id: 'cl-k2-k4-ho-ngheo' }],
  [{ name: 'k4', app: { doiTuong: 'k4' } }, { kind: 'checklist', id: 'cl-k2-k4-ho-ngheo' }],
  [
    { name: 'k5 có HĐLĐ', app: { doiTuong: 'k5', coHopDongLaoDong: true } },
    { kind: 'template', form: 'tt32-01a', income: true, certifiedBy: /nơi đang làm việc/ },
  ],
  [
    { name: 'k5 lương hưu', app: { doiTuong: 'k5', coHopDongLaoDong: false, coLuongHuu: true } },
    { kind: 'template', form: 'tt32-01a', income: true, certifiedBy: /bảo hiểm xã hội.*UBND cấp xã/ },
  ],
  [
    { name: 'k5 không HĐLĐ, không lương hưu', app: { doiTuong: 'k5', coHopDongLaoDong: false, coLuongHuu: false } },
    { kind: 'template', form: 'tt08-05', income: true, certifiedBy: /Công an cấp xã/ },
  ],
  [
    { name: 'k5 chưa trả lời', app: { doiTuong: 'k5' } },
    { kind: 'template', form: 'tt08-05', income: true },
  ],
  [{ name: 'k6', app: { doiTuong: 'k6' } }, { kind: 'template', form: 'tt32-01a', income: true, certifiedBy: /nơi đang làm việc/ }],
  [{ name: 'k7', app: { doiTuong: 'k7' } }, { kind: 'template', form: 'tt32-04', income: true, certifiedBy: /đơn vị/, extra: ['cl-k7-doi-tuong'] }],
  [{ name: 'k8', app: { doiTuong: 'k8' } }, { kind: 'template', form: 'tt32-01a', income: true, certifiedBy: /nơi đang làm việc/ }],
  [{ name: 'k9', app: { doiTuong: 'k9' } }, { kind: 'template', form: 'tt08-01', income: false, certifiedBy: /nhà ở công vụ/ }],
  [{ name: 'k10', app: { doiTuong: 'k10' } }, { kind: 'template', form: 'tt08-01', income: false }],
  [{ name: 'k11', app: { doiTuong: 'k11' } }, { kind: 'template', form: 'tt08-01', income: false, certifiedBy: /giáo dục/ }],
  [{ name: 'k13', app: { doiTuong: 'k13' } }, { kind: 'checklist', id: 'k13-chua-co-huong-dan' }],
];

const HOUSING: Record<DieuKienNhaO, { kind: 'template'; form: FormId } | { kind: 'checklist'; id: string }> = {
  chua_co_nha: { kind: 'template', form: 'tt08-02' },
  duoi_15m2: { kind: 'template', form: 'tt05-03' },
  xa_noi_lam_viec: { kind: 'checklist', id: 'cl-nha-o-xa-noi-lam-viec' },
};

const MARITAL: { married: boolean; status: TinhTrangHonNhan | undefined }[] = [
  { married: false, status: 'doc_than' },
  { married: true, status: 'da_ket_hon' },
];

function expectedKeys(group: GroupExpect, housing: DieuKienNhaO, married: boolean): string[] {
  const keys = ['applicant:nd136-01'];
  keys.push(group.kind === 'template' ? `applicant:${group.form}` : `applicant:${group.id}`);
  if (group.kind === 'template') for (const x of group.extra ?? []) keys.push(`applicant:${x}`);
  const h = HOUSING[housing];
  keys.push(h.kind === 'template' ? `applicant:${h.form}` : `applicant:${h.id}`);
  if (married) {
    keys.push('spouse:tt08-02');
    if (group.kind === 'template' && group.income) keys.push(`spouse:${group.form}`);
  }
  keys.push('applicant:cl-cccd');
  if (married) keys.push('spouse:cl-cccd');
  keys.push('applicant:cl-hon-nhan', 'applicant:cl-khac');
  return keys;
}

describe('resolveDocuments: mọi nhánh nhóm × hôn nhân × điều kiện nhà ở', () => {
  for (const [variant, group] of VARIANTS) {
    for (const housing of DIEU_KIEN_NHA_O) {
      for (const { married, status } of MARITAL) {
        it(`${variant.name} | ${housing} | ${married ? 'đã kết hôn' : 'độc thân'}`, () => {
          const docs = resolveDocuments({ ...variant.app, dieuKienNhaO: housing, applicant: { tinhTrangHonNhan: status } });
          expect(docs.map((d) => d.key)).toEqual(expectedKeys(group, housing, married));

          // Khoá duy nhất.
          expect(new Set(docs.map((d) => d.key)).size).toBe(docs.length);
          // Luôn có đơn Mẫu 01 NĐ 136/2026.
          expect(docs[0]).toMatchObject({ id: 'nd136-01', kind: 'template', person: 'applicant' });
          // Mọi mục có title + legalRef.
          for (const d of docs) {
            expect(d.title.length).toBeGreaterThan(0);
            expect(d.legalRef.length).toBeGreaterThan(0);
          }
          // Mục template dùng đúng metadata trong FORMS.
          for (const d of docs.filter((x) => x.kind === 'template')) {
            const f = FORMS[d.id as FormId];
            expect(f).toBeDefined();
            expect(d.legalRef).toBe(f.legalRef);
          }
          // certifiedBy của mẫu đối tượng/thu nhập.
          if (group.kind === 'template' && group.certifiedBy) {
            const g = docs.find((d) => d.key === `applicant:${group.form}`) as DocItem;
            expect(g.certifiedBy).toMatch(group.certifiedBy);
            if (married && group.income) {
              expect((docs.find((d) => d.key === `spouse:${group.form}`) as DocItem).certifiedBy).toBe(g.certifiedBy);
            }
          }
          // Không có mục vợ/chồng khi chưa kết hôn.
          if (!married) expect(docs.every((d) => d.person === 'applicant')).toBe(true);
        });
      }
    }
  }
});

describe('resolveDocuments: chi tiết', () => {
  const base = { dieuKienNhaO: 'chua_co_nha' as const };

  it('có đủ biến thể cho mọi nhóm trong DOI_TUONG (k12 bị loại)', () => {
    const covered = new Set(VARIANTS.map(([v]) => v.app.doiTuong));
    expect([...covered].sort()).toEqual([...DOI_TUONG].sort());
    expect(DOI_TUONG as readonly string[]).not.toContain('k12');
  });

  it('k12 bị từ chối khi truyền vào lúc chạy', () => {
    expect(() => resolveDocuments({ ...base, doiTuong: 'k12' as never })).toThrow(/Khoản 12/);
  });

  it('k13 trả về mục "chưa có hướng dẫn mẫu"', () => {
    const d = resolveDocuments({ ...base, doiTuong: 'k13' }).find((x) => x.id === 'k13-chua-co-huong-dan');
    expect(d).toMatchObject({ kind: 'checklist', person: 'applicant' });
    expect(d?.title).toMatch(/chưa có hướng dẫn mẫu/);
    expect(d?.legalRef).toMatch(/Luật Dân số 2025/);
  });

  it('k1 và k2–k4 là checklist bản sao có chứng thực, không có mẫu thu nhập cho vợ/chồng', () => {
    for (const k of ['k1', 'k2', 'k3', 'k4'] as const) {
      const docs = resolveDocuments({ ...base, doiTuong: k, applicant: { tinhTrangHonNhan: 'da_ket_hon' } });
      const g = docs[1] as DocItem;
      expect(g.kind).toBe('checklist');
      expect(g.title).toMatch(/Bản sao có chứng thực/);
      expect(docs.filter((d) => d.person === 'spouse').map((d) => d.id)).toEqual(['tt08-02', 'cl-cccd']);
    }
  });

  it('k5/k6/k7/k8 đã kết hôn: vợ/chồng khai thêm Mẫu 02 và mẫu thu nhập', () => {
    const spouseIds = (app: Variant['app']) =>
      resolveDocuments({ ...app, ...base, applicant: { tinhTrangHonNhan: 'da_ket_hon' } })
        .filter((d) => d.person === 'spouse' && d.kind === 'template')
        .map((d) => d.id);
    expect(spouseIds({ doiTuong: 'k5', coHopDongLaoDong: true })).toEqual(['tt08-02', 'tt32-01a']);
    expect(spouseIds({ doiTuong: 'k5', coHopDongLaoDong: false })).toEqual(['tt08-02', 'tt08-05']);
    expect(spouseIds({ doiTuong: 'k6' })).toEqual(['tt08-02', 'tt32-01a']);
    expect(spouseIds({ doiTuong: 'k7' })).toEqual(['tt08-02', 'tt32-04']);
    expect(spouseIds({ doiTuong: 'k8' })).toEqual(['tt08-02', 'tt32-01a']);
    expect(spouseIds({ doiTuong: 'k9' })).toEqual(['tt08-02']);
  });

  it('vợ/chồng vẫn khai Mẫu 02 cả khi người đứng đơn thuộc diện dưới 15 m² (đúng như PLAN §5)', () => {
    const docs = resolveDocuments({ doiTuong: 'k6', dieuKienNhaO: 'duoi_15m2', applicant: { tinhTrangHonNhan: 'da_ket_hon' } });
    expect(docs.find((d) => d.person === 'applicant' && d.id === 'tt05-03')).toBeDefined();
    expect(docs.find((d) => d.person === 'spouse' && d.id === 'tt08-02')).toBeDefined();
  });

  it('ở xa nơi làm việc → checklist theo Quyết định của tỉnh, chưa hỗ trợ mẫu', () => {
    const d = resolveDocuments({ doiTuong: 'k8', dieuKienNhaO: 'xa_noi_lam_viec' }).find((x) => x.id === 'cl-nha-o-xa-noi-lam-viec');
    expect(d?.kind).toBe('checklist');
    expect(d?.legalRef).toMatch(/201\/2025\/QH15/);
  });

  it.each<[TinhTrangHonNhan | undefined, RegExp]>([
    ['da_ket_hon', /đăng ký kết hôn/],
    ['doc_than', /tình trạng hôn nhân/],
    ['ly_hon', /ly hôn/],
    ['goa', /chứng tử/],
    [undefined, /tình trạng hôn nhân/],
  ])('giấy tờ hôn nhân theo tình trạng %s', (status, re) => {
    const d = resolveDocuments({ ...base, doiTuong: 'k8', applicant: { tinhTrangHonNhan: status } }).find(
      (x) => x.id === 'cl-hon-nhan',
    );
    expect(d?.title).toMatch(re);
  });

  it('ly hôn / goá / chưa chọn được xử lý như không có vợ/chồng', () => {
    for (const s of ['ly_hon', 'goa', undefined] as const) {
      const docs = resolveDocuments({ ...base, doiTuong: 'k6', applicant: { tinhTrangHonNhan: s } });
      expect(docs.some((d) => d.person === 'spouse')).toBe(false);
    }
  });

  it('mã mẫu ổn định', () => {
    expect(Object.keys(FORMS).sort()).toEqual(
      ['nd136-01', 'tt08-01', 'tt08-02', 'tt08-05', 'tt32-01a', 'tt32-04', 'tt05-03'].sort(),
    );
  });
});

describe('cơ quan xác nhận theo văn bản gốc (legal-sources §3)', () => {
  const certOf = (key: string, app: Parameters<typeof resolveDocuments>[0]) =>
    resolveDocuments(app).find((d) => d.key === key)?.certifiedBy ?? '';
  it('Mẫu 02: cơ quan cấp GCN tại tỉnh có dự án; Mẫu 03: UBND xã nơi thường trú', () => {
    expect(certOf('applicant:tt08-02', { doiTuong: 'k6', dieuKienNhaO: 'chua_co_nha' })).toMatch(/cấp Giấy chứng nhận/);
    expect(certOf('applicant:tt05-03', { doiTuong: 'k6', dieuKienNhaO: 'duoi_15m2' })).toMatch(/UBND cấp xã nơi đăng ký thường trú/);
  });
  it('K10: UBND cấp xã nơi bị thu hồi đất', () => {
    expect(certOf('applicant:tt08-01', { doiTuong: 'k10', dieuKienNhaO: 'chua_co_nha' })).toMatch(/nơi bị thu hồi đất/);
  });
  it('CCCD và giấy tờ hôn nhân được đánh dấu là không bắt buộc', () => {
    const docs = resolveDocuments({ doiTuong: 'k6', dieuKienNhaO: 'chua_co_nha', applicant: { tinhTrangHonNhan: 'da_ket_hon' } });
    for (const k of ['applicant:cl-cccd', 'spouse:cl-cccd', 'applicant:cl-hon-nhan']) {
      expect(docs.find((d) => d.key === k)?.note).toMatch(/Không bắt buộc/);
    }
  });
});

describe('hinhThucPolicy (Điều 77 Luật Nhà ở 2023)', () => {
  it('K11 chỉ được thuê', () => {
    expect(hinhThucPolicy('k11').allowed).toEqual(['thue']);
  });
  it('K2, K3 có cảnh báo phụ thuộc quy định của UBND tỉnh', () => {
    for (const k of ['k2', 'k3'] as const) expect(hinhThucPolicy(k).warning).toMatch(/UBND cấp tỉnh/);
  });
  it('K5, K6, K8 không có cảnh báo, được cả 3 hình thức', () => {
    for (const k of ['k5', 'k6', 'k8'] as const) {
      expect(hinhThucPolicy(k).warning).toBeUndefined();
      expect(hinhThucPolicy(k).allowed).toEqual(['mua', 'thue_mua', 'thue']);
    }
  });
});
