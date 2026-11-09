/**
 * Rules engine: nhóm đối tượng + điều kiện nhà ở + tình trạng hôn nhân → danh sách giấy tờ.
 * Dữ liệu thuần, theo docs/PLAN.md §5 (bài thuvienphapluat.vn ngày 14/10/2026), đã đối chiếu
 * văn bản gốc trong docs/legal-sources.md §3 (soát xét 09/11/2026).
 * Không hard-code trong UI. Mỗi mục có `legalRef` để hiển thị trích dẫn.
 *
 * Tên mẫu (title) là tên mô tả tạm thời, cần đối chiếu lại với tiêu đề trong file gốc
 * khi có templates-src/ (P0). Mã mẫu (FormId) là ổn định, không đổi.
 */
import type { Application, DoiTuong, TinhTrangHonNhan } from '../domain/types';

export type FormId = 'nd136-01' | 'tt08-01' | 'tt08-02' | 'tt08-05' | 'tt32-01a' | 'tt32-04' | 'tt05-03';
export type Person = 'applicant' | 'spouse';

export interface DocItem {
  /** Mã mẫu (FormId) với kind='template'; mã mục checklist với kind='checklist'. Có thể trùng giữa người đứng đơn và vợ/chồng. */
  id: string;
  /** Khoá duy nhất trong danh sách: `${person}:${id}`. */
  key: string;
  title: string;
  legalRef: string;
  kind: 'template' | 'checklist';
  person: Person;
  certifiedBy?: string;
  note?: string;
}

export interface FormInfo {
  id: FormId;
  title: string;
  legalRef: string;
  /** Ngày văn bản ban hành mẫu có hiệu lực (ISO). null = chưa xác minh (P0, docs/legal-sources.md). */
  effectiveFrom: string | null;
}

export const FORMS: Record<FormId, FormInfo> = {
  'nd136-01': {
    id: 'nd136-01',
    title: 'Đơn đăng ký mua, thuê mua, thuê nhà ở xã hội',
    legalRef:
      'Mẫu số 01 Phụ lục ban hành kèm theo Nghị định 136/2026/NĐ-CP (sửa điểm c khoản 1 Điều 38 Nghị định 100/2024/NĐ-CP)',
    effectiveFrom: '2026-04-07',
  },
  'tt32-01a': {
    id: 'tt32-01a',
    title: 'Giấy xác nhận đối tượng và điều kiện thu nhập',
    legalRef:
      'Mẫu số 01a Phụ lục I Thông tư 05/2024/TT-BXD (bổ sung bởi Thông tư 32/2025/TT-BXD, sửa đổi bởi Thông tư 08/2026/TT-BXD)',
    effectiveFrom: '2025-11-10',
  },
  'tt08-05': {
    id: 'tt08-05',
    title: 'Giấy xác nhận đối tượng và điều kiện thu nhập (người thu nhập thấp không có hợp đồng lao động)',
    legalRef: 'Mẫu số 05 Phụ lục ban hành kèm theo Thông tư 08/2026/TT-BXD',
    effectiveFrom: '2026-02-15',
  },
  'tt32-04': {
    id: 'tt32-04',
    title: 'Giấy xác nhận điều kiện thu nhập (lực lượng vũ trang, cơ yếu)',
    legalRef:
      'Mẫu số 04 Phụ lục I Thông tư 05/2024/TT-BXD (thay bởi Thông tư 32/2025/TT-BXD, sửa đổi bởi Thông tư 08/2026/TT-BXD)',
    effectiveFrom: '2025-11-10',
  },
  'tt08-01': {
    id: 'tt08-01',
    title: 'Giấy xác nhận đối tượng',
    legalRef: 'Mẫu số 01 Phụ lục ban hành kèm theo Thông tư 08/2026/TT-BXD',
    effectiveFrom: '2026-02-15',
  },
  'tt08-02': {
    id: 'tt08-02',
    title: 'Giấy xác nhận điều kiện nhà ở (chưa có nhà ở)',
    legalRef: 'Mẫu số 02 Phụ lục ban hành kèm theo Thông tư 08/2026/TT-BXD',
    effectiveFrom: '2026-02-15',
  },
  'tt05-03': {
    id: 'tt05-03',
    title: 'Giấy xác nhận điều kiện nhà ở (diện tích bình quân dưới 15 m² sàn/người)',
    legalRef: 'Mẫu số 03 Phụ lục I ban hành kèm theo Thông tư 05/2024/TT-BXD',
    effectiveFrom: '2024-08-01',
  },
};

const REF_D76 = 'Điều 76 Luật Nhà ở 2023';
const REF_KHONG_BAT_BUOC = 'Không có trong thành phần hồ sơ tại QĐ 1346/QĐ-BXD và Điều 38 Nghị định 100/2024/NĐ-CP';
const NOTE_KHONG_BAT_BUOC = 'Không bắt buộc theo quy định, nhưng chủ đầu tư thường yêu cầu thêm.';

/** Ghi chú chung hiển thị ở trang kết quả. */
export const GENERAL_NOTES: readonly string[] = [
  'Giấy tờ chứng minh đối tượng, điều kiện có giá trị 12 tháng kể từ ngày được xác nhận (Điều 38 Nghị định 100/2024/NĐ-CP sửa bởi Nghị định 54/2026/NĐ-CP; Điều 3 Thông tư 08/2026/TT-BXD).',
  'Mỗi hộ gia đình, cá nhân chỉ được nộp hồ sơ đăng ký tại một dự án.',
  'Cơ quan xác nhận giải quyết trong 07 ngày kể từ khi nhận đủ giấy tờ (Mẫu 02, 03, 05).',
];

export interface ExtraChecklist {
  id: string;
  title: string;
  legalRef: string;
  note?: string;
}

/** Bảng 1 (§5): nhóm đối tượng → mẫu chứng minh đối tượng/thu nhập. */
type GroupRule =
  | {
      kind: 'checklist';
      id: string;
      title: string;
      legalRef: string;
      incomeForm: false;
      note?: string;
    }
  | {
      kind: 'template';
      form: FormId;
      /** true nếu mẫu này cũng là mẫu chứng minh thu nhập (vợ/chồng phải khai thêm một bản). */
      incomeForm: boolean;
      certifiedBy?: string;
      note?: string;
      /** Giấy tờ bổ sung (checklist) đi kèm mẫu, VD giấy chứng minh đối tượng K7 của BQP/BCA. */
      extraChecklist?: ExtraChecklist[];
    }
  | {
      kind: 'unknown';
      id: string;
      title: string;
      legalRef: string;
      note: string;
      incomeForm: false;
    };

const CERT_NOI_LAM_VIEC = 'Cơ quan, đơn vị, doanh nghiệp nơi đang làm việc';
const CERT_HUU_TRI = 'Cơ quan bảo hiểm xã hội chi trả lương hưu hoặc UBND cấp xã nơi thường trú/tạm trú/nơi ở hiện tại';

const RULE_K1: GroupRule = {
  kind: 'checklist',
  id: 'cl-k1-nguoi-co-cong',
  title: 'Bản sao có chứng thực giấy tờ chứng minh là người có công với cách mạng / Giấy chứng nhận thân nhân liệt sĩ',
  legalRef: `Khoản 1 ${REF_D76}`,
  incomeForm: false,
};
const ruleHoNgheo = (k: 'k2' | 'k3' | 'k4'): GroupRule => ({
  kind: 'checklist',
  id: 'cl-k2-k4-ho-ngheo',
  title: 'Bản sao có chứng thực Giấy chứng nhận hộ nghèo / hộ cận nghèo',
  legalRef: `Khoản ${k.slice(1)} ${REF_D76}`,
  incomeForm: false,
  note: 'Cùng một giấy chứng minh cả đối tượng và điều kiện thu nhập.',
});
const RULE_01A: GroupRule = {
  kind: 'template',
  form: 'tt32-01a',
  incomeForm: true,
  certifiedBy: CERT_NOI_LAM_VIEC,
  note: 'Cùng một mẫu chứng minh cả đối tượng và điều kiện thu nhập.',
};

export const GROUP_RULES: Record<Exclude<DoiTuong, 'k5'>, GroupRule> & {
  k5_co_hdld: GroupRule;
  k5_huu_tri: GroupRule;
  k5_khong_hdld: GroupRule;
} = {
  k1: RULE_K1,
  k2: ruleHoNgheo('k2'),
  k3: ruleHoNgheo('k3'),
  k4: ruleHoNgheo('k4'),
  k5_co_hdld: RULE_01A,
  k5_huu_tri: { ...RULE_01A, certifiedBy: CERT_HUU_TRI },
  k5_khong_hdld: {
    kind: 'template',
    form: 'tt08-05',
    incomeForm: true,
    certifiedBy: 'Công an cấp xã nơi thường trú/tạm trú/nơi ở hiện tại',
    note: 'Cùng một mẫu chứng minh cả đối tượng và điều kiện thu nhập.',
  },
  k6: RULE_01A,
  k7: {
    kind: 'template',
    form: 'tt32-04',
    incomeForm: true,
    certifiedBy: 'Cơ quan, đơn vị nơi đang công tác',
    note: 'Mẫu 04 chỉ chứng minh điều kiện thu nhập. Giấy chứng minh đối tượng theo mẫu riêng của Bộ Quốc phòng / Bộ Công an (xem mục bên dưới).',
    extraChecklist: [
      {
        id: 'cl-k7-doi-tuong',
        title: 'Giấy xác nhận đối tượng thuộc lực lượng vũ trang / cơ yếu (mẫu của Bộ Quốc phòng hoặc Bộ Công an)',
        legalRef:
          'Điểm d khoản 1 Điều 6 Thông tư 05/2024/TT-BXD; Thông tư 94/2024/TT-BQP (Quân đội); mẫu NOCA của Bộ Công an (Thông tư 89/2026/TT-BCA thay Thông tư 56/2024/TT-BCA, chưa xác minh từ nguồn chính thức)',
        note: 'Do đơn vị cấp Trung đoàn trở lên / Ban Cơ yếu Chính phủ / cấp có thẩm quyền trong CAND xác nhận. Lấy mẫu tại đơn vị.',
      },
    ],
  },
  k8: RULE_01A,
  k9: {
    kind: 'template',
    form: 'tt08-01',
    incomeForm: false,
    certifiedBy: 'Cơ quan quản lý nhà ở công vụ',
  },
  k10: {
    kind: 'template',
    form: 'tt08-01',
    incomeForm: false,
    certifiedBy: 'UBND cấp xã nơi bị thu hồi đất',
    note: 'Điều 38 Nghị định 100/2024/NĐ-CP (sửa bởi NĐ 54/2026) ghi UBND cấp xã nơi bị thu hồi đất; chú thích của Mẫu 01 ghi UBND cấp xã nơi thường trú/tạm trú/nơi ở hiện tại. Nên hỏi trước UBND xã.',
  },
  k11: {
    kind: 'template',
    form: 'tt08-01',
    incomeForm: false,
    certifiedBy: 'Cơ sở giáo dục nơi đang học',
  },
  k13: {
    kind: 'unknown',
    id: 'k13-chua-co-huong-dan',
    title: 'Giấy tờ chứng minh có từ 02 con đẻ trở lên: chưa có hướng dẫn mẫu',
    legalRef: 'Khoản 13 Điều 76 Luật Nhà ở 2023 (bổ sung bởi điểm a khoản 3 Điều 29 Luật Dân số 2025, từ 01/07/2026)',
    note: 'Đến 09/11/2026 chưa có văn bản hướng dẫn mẫu. Bộ Xây dựng (trả lời trên Báo Chính phủ 11–13/10/2026) cho biết đang phối hợp Bộ Y tế. Hỏi chủ đầu tư / Sở Xây dựng nơi có dự án.',
    incomeForm: false,
  },
};

/** Bảng 2 (§5): điều kiện nhà ở → mẫu. */
export const HOUSING_RULES = {
  chua_co_nha: {
    kind: 'template',
    form: 'tt08-02',
    certifiedBy:
      'Cơ quan có thẩm quyền cấp Giấy chứng nhận quyền sử dụng đất tại tỉnh có dự án (Văn phòng / Chi nhánh Văn phòng đăng ký đất đai)',
  },
  duoi_15m2: {
    kind: 'template',
    form: 'tt05-03',
    certifiedBy: 'UBND cấp xã nơi đăng ký thường trú',
  },
  xa_noi_lam_viec: {
    kind: 'checklist',
    id: 'cl-nha-o-xa-noi-lam-viec',
    title: 'Giấy tờ chứng minh có nhà ở nhưng ở xa nơi làm việc',
    legalRef: 'Nghị quyết 201/2025/QH15 và Quyết định của UBND cấp tỉnh nơi có dự án',
    note: 'Theo mẫu riêng của từng tỉnh/thành. Ứng dụng chưa hỗ trợ mẫu này (làm sau MVP).',
  },
} as const;

/** Vợ/chồng cũng phải khai Mẫu 02 (nhà ở) khi đã kết hôn (§5, dòng "Đã kết hôn"). */
export const SPOUSE_HOUSING_FORM: FormId = 'tt08-02';

const HON_NHAN_TITLE: Record<TinhTrangHonNhan | 'chua_chon', string> = {
  da_ket_hon: 'Bản sao Giấy chứng nhận đăng ký kết hôn',
  doc_than: 'Giấy tờ chứng minh tình trạng hôn nhân (Giấy xác nhận tình trạng hôn nhân)',
  ly_hon: 'Bản sao quyết định/bản án ly hôn đã có hiệu lực pháp luật',
  goa: 'Bản sao giấy chứng tử của vợ/chồng',
  chua_chon: 'Giấy tờ chứng minh tình trạng hôn nhân',
};

function templateItem(form: FormId, person: Person, extra: { certifiedBy?: string; note?: string } = {}): DocItem {
  const f = FORMS[form];
  const item: DocItem = {
    id: f.id,
    key: `${person}:${f.id}`,
    title: f.title,
    legalRef: f.legalRef,
    kind: 'template',
    person,
  };
  if (extra.certifiedBy) item.certifiedBy = extra.certifiedBy;
  if (extra.note) item.note = extra.note;
  return item;
}

function checklistItem(id: string, title: string, legalRef: string, person: Person, note?: string): DocItem {
  const item: DocItem = {
    id,
    key: `${person}:${id}`,
    title,
    legalRef,
    kind: 'checklist',
    person,
  };
  if (note) item.note = note;
  return item;
}

export function groupRuleFor(app: Pick<Application, 'doiTuong' | 'coHopDongLaoDong' | 'coLuongHuu'>): GroupRule {
  if (app.doiTuong === 'k5') {
    if (app.coHopDongLaoDong === true) return GROUP_RULES.k5_co_hdld;
    if (app.coLuongHuu === true) return GROUP_RULES.k5_huu_tri;
    return GROUP_RULES.k5_khong_hdld;
  }
  if ((app.doiTuong as string) === 'k12') {
    throw new Error('Khoản 12 (doanh nghiệp, HTX) không áp dụng cho cá nhân đăng ký mua nhà ở xã hội');
  }
  return GROUP_RULES[app.doiTuong];
}

/**
 * Trả về danh sách giấy tờ (biểu mẫu + checklist) theo thứ tự:
 * đơn đăng ký → chứng minh đối tượng/thu nhập → nhà ở → giấy tờ của vợ/chồng → checklist chung.
 */
export function resolveDocuments(
  app: Pick<Application, 'doiTuong' | 'coHopDongLaoDong' | 'coLuongHuu' | 'dieuKienNhaO'> & {
    applicant?: Pick<NonNullable<Application['applicant']>, 'tinhTrangHonNhan'>;
  },
): DocItem[] {
  const items: DocItem[] = [];
  const married = app.applicant?.tinhTrangHonNhan === 'da_ket_hon';

  // 1. Mọi nhóm: Đơn đăng ký Mẫu 01 NĐ 136/2026.
  items.push(templateItem('nd136-01', 'applicant'));

  // 2. Chứng minh đối tượng / thu nhập.
  const group = groupRuleFor(app);
  if (group.kind === 'template') {
    items.push(templateItem(group.form, 'applicant', group));
    for (const x of group.extraChecklist ?? []) {
      items.push(checklistItem(x.id, x.title, x.legalRef, 'applicant', x.note));
    }
  } else {
    items.push(checklistItem(group.id, group.title, group.legalRef, 'applicant', group.note));
  }

  // 3. Điều kiện nhà ở.
  const housing = HOUSING_RULES[app.dieuKienNhaO];
  if (housing.kind === 'template') {
    items.push(
      templateItem(housing.form, 'applicant', {
        certifiedBy: housing.certifiedBy,
      }),
    );
  } else {
    items.push(checklistItem(housing.id, housing.title, housing.legalRef, 'applicant', housing.note));
  }

  // 4. Vợ/chồng: Mẫu 02 (nhà ở) + mẫu thu nhập (01a / 04 / 05) nếu nhóm có chứng minh thu nhập.
  if (married) {
    items.push(
      templateItem(SPOUSE_HOUSING_FORM, 'spouse', {
        certifiedBy: HOUSING_RULES.chua_co_nha.certifiedBy,
        note: 'Vợ/chồng của người đứng đơn khai riêng một bản (Điều 7 Thông tư 05/2024/TT-BXD).',
      }),
    );
    if (group.kind === 'template' && group.incomeForm) {
      items.push(
        templateItem(group.form, 'spouse', {
          certifiedBy: group.certifiedBy,
          note: 'Vợ/chồng của người đứng đơn khai riêng một bản theo đối tượng của chính vợ/chồng (Mẫu 01a, 04 hoặc 05), xác nhận tại nơi vợ/chồng làm việc/cư trú. Khi vợ/chồng khai Mẫu 01a thì bỏ trống mục 8.',
        }),
      );
    }
  }

  // 5. Checklist chung: CCCD, giấy tờ hôn nhân, giấy tờ khác.
  items.push(
    checklistItem(
      'cl-cccd',
      'Bản sao Căn cước / Căn cước công dân của người đứng đơn',
      REF_KHONG_BAT_BUOC,
      'applicant',
      NOTE_KHONG_BAT_BUOC,
    ),
  );
  if (married) {
    items.push(
      checklistItem(
        'cl-cccd',
        'Bản sao Căn cước / Căn cước công dân của vợ/chồng',
        REF_KHONG_BAT_BUOC,
        'spouse',
        NOTE_KHONG_BAT_BUOC,
      ),
    );
  }
  items.push(
    checklistItem(
      'cl-hon-nhan',
      HON_NHAN_TITLE[app.applicant?.tinhTrangHonNhan ?? 'chua_chon'],
      REF_KHONG_BAT_BUOC,
      'applicant',
      NOTE_KHONG_BAT_BUOC,
    ),
  );
  items.push(
    checklistItem(
      'cl-khac',
      'Giấy tờ khác theo yêu cầu của chủ đầu tư dự án (nếu có)',
      'Theo yêu cầu của chủ đầu tư / địa phương',
      'applicant',
      'Một số địa phương hoặc chủ đầu tư yêu cầu thêm giấy tờ.',
    ),
  );

  return items;
}

/**
 * Hình thức được phép theo Điều 77 Luật Nhà ở 2023 (đối chiếu 09/11/2026):
 * - K1, K4, K5, K6, K8, K9, K10: mua, thuê mua, thuê (khoản 1).
 * - K7: mua, thuê mua, thuê nếu chưa được hưởng chính sách nhà ở cho LLVT (khoản 1, khoản 4).
 * - K2, K3: chỉ khi UBND cấp tỉnh quy định (khoản 1 đoạn 2).
 * - K11: chỉ thuê, trong thời gian học tập (khoản 6).
 * - K13: Luật Dân số 2025 bổ sung, chưa có hướng dẫn.
 */
export type HinhThucValue = 'mua' | 'thue_mua' | 'thue';

export interface HinhThucPolicy {
  allowed: readonly HinhThucValue[];
  /** Cảnh báo mềm hiển thị ở Bước 2 (không chặn). */
  warning?: string;
  legalRef: string;
}

const ALL_HINH_THUC: readonly HinhThucValue[] = ['mua', 'thue_mua', 'thue'];
const REF_D77 = 'Điều 77 Luật Nhà ở 2023';

export function hinhThucPolicy(doiTuong: DoiTuong): HinhThucPolicy {
  switch (doiTuong) {
    case 'k11':
      return {
        allowed: ['thue'],
        warning: 'Học sinh, sinh viên chỉ được thuê nhà ở xã hội trong thời gian học tập, không được mua hoặc thuê mua.',
        legalRef: `Khoản 6 ${REF_D77}`,
      };
    case 'k2':
    case 'k3':
      return {
        allowed: ALL_HINH_THUC,
        warning:
          'Hộ nghèo, cận nghèo tại khu vực nông thôn chỉ được mua, thuê mua, thuê nhà ở xã hội nếu UBND cấp tỉnh nơi có dự án có quy định. Hãy hỏi Sở Xây dựng hoặc chủ đầu tư trước khi nộp.',
        legalRef: `Khoản 1 ${REF_D77}`,
      };
    case 'k7':
      return {
        allowed: ALL_HINH_THUC,
        warning: 'Chỉ áp dụng nếu bạn chưa được hưởng chính sách hỗ trợ về nhà ở cho lực lượng vũ trang nhân dân.',
        legalRef: `Khoản 1, khoản 4 ${REF_D77}`,
      };
    case 'k13':
      return {
        allowed: ALL_HINH_THUC,
        warning: 'Nhóm này mới được bổ sung từ 01/07/2026 và chưa có văn bản hướng dẫn hình thức, điều kiện cụ thể.',
        legalRef: 'Khoản 13 Điều 76 Luật Nhà ở 2023 (Luật Dân số 2025)',
      };
    default:
      return { allowed: ALL_HINH_THUC, legalRef: `Khoản 1 ${REF_D77}` };
  }
}
