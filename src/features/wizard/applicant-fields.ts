/**
 * Danh sách trường Bước 3. `name` là đường dẫn trong form (trùng đường dẫn trong Applicant),
 * để lọc theo các `source` trong manifest (xem src/templates/data.ts).
 */
import type { Applicant, GioiTinh, VoChong } from '../../domain/types';
import { FORMS, type DocItem, type FormId } from '../../data/rules';
import { findManifest } from '../../templates/data';

export interface PersonForm {
  hoTen: string;
  ngaySinh: string;
  gioiTinh: '' | GioiTinh;
  soDinhDanh: string;
  ngayCap: string;
  noiCap: string;
  noiThuongTru: string;
  noiTamTru: string;
  noiOHienTai: string;
  ngheNghiep: string;
  coQuanCongTac: string;
}

/** Ô chọn Có/Không/để trống: chuỗi trong form, schema đổi thành boolean | undefined. */
export type YesNo = '' | 'true' | 'false';

export interface MemberForm {
  hoTen: string;
  quanHe: string;
  soDinhDanh: string;
  ngayCap: string;
  noiCap: string;
}

export const EMPTY_MEMBER: MemberForm = { hoTen: '', quanHe: '', soDinhDanh: '', ngayCap: '', noiCap: '' };

export interface FormValues extends PersonForm {
  diaChiLienHe: string;
  soDienThoai: string;
  diaChiCoQuan: string;
  thuNhapBinhQuanThang: string;
  nuoiConDuoiTuoiThanhNien: boolean;
  soDangKyKetHon: string;
  loaiDoiTuongK7: string;
  voChong: PersonForm & { thuNhap: string; thuocKhoan7: YesNo };
  thanhVienHo: MemberForm[];
}

export type FieldKind = 'text' | 'date' | 'tel' | 'cccd' | 'money' | 'gioiTinh' | 'yesNo';

export type ScalarFieldName =
  | Exclude<keyof FormValues, 'voChong' | 'thanhVienHo' | 'nuoiConDuoiTuoiThanhNien'>
  | `voChong.${keyof FormValues['voChong']}`;

export interface FieldDef {
  name: ScalarFieldName;
  label: string;
  kind: FieldKind;
  autoComplete?: string;
  /** Gợi ý thêm dưới ô nhập. */
  help?: string;
}

const NOI_O_HIEN_TAI_HELP = 'Chỉ cần nhập nếu khác nơi thường trú/tạm trú; để trống thì mẫu dùng nơi tạm trú, rồi nơi thường trú.';

export const APPLICANT_FIELDS: FieldDef[] = [
  { name: 'hoTen', label: 'Họ và tên', kind: 'text', autoComplete: 'name' },
  { name: 'ngaySinh', label: 'Ngày sinh', kind: 'date', autoComplete: 'bday' },
  { name: 'gioiTinh', label: 'Giới tính', kind: 'gioiTinh' },
  { name: 'soDinhDanh', label: 'Số định danh cá nhân (CCCD, 12 số)', kind: 'cccd' },
  { name: 'ngayCap', label: 'Ngày cấp CCCD', kind: 'date' },
  { name: 'noiCap', label: 'Nơi cấp CCCD', kind: 'text' },
  { name: 'noiThuongTru', label: 'Nơi thường trú', kind: 'text' },
  { name: 'noiTamTru', label: 'Nơi tạm trú (nếu có)', kind: 'text' },
  { name: 'noiOHienTai', label: 'Nơi ở hiện tại', kind: 'text', help: NOI_O_HIEN_TAI_HELP },
  { name: 'diaChiLienHe', label: 'Địa chỉ liên hệ', kind: 'text', autoComplete: 'street-address' },
  { name: 'soDienThoai', label: 'Số điện thoại', kind: 'tel', autoComplete: 'tel' },
  { name: 'ngheNghiep', label: 'Nghề nghiệp', kind: 'text' },
  { name: 'coQuanCongTac', label: 'Cơ quan, đơn vị công tác', kind: 'text', autoComplete: 'organization' },
  { name: 'diaChiCoQuan', label: 'Địa chỉ cơ quan', kind: 'text' },
  { name: 'thuNhapBinhQuanThang', label: 'Thu nhập bình quân tháng (đồng)', kind: 'money' },
];

/** Chỉ hiện khi người đứng đơn thuộc khoản 7 (mẫu không khai `paths` cho trường này nên không lọc theo manifest). */
export const APPLICANT_K7_FIELDS: FieldDef[] = [
  {
    name: 'loaiDoiTuongK7',
    label: 'Đối tượng cụ thể (cấp bậc, chức vụ...)',
    kind: 'text',
    help: 'Ghi ở mục "Là đối tượng" của Mẫu 04, VD: Sĩ quan quân đội, cấp bậc Thiếu tá. Để trống thì ghi theo lời văn khoản 7 Điều 76.',
  },
];

export const SPOUSE_FIELDS: FieldDef[] = [
  { name: 'voChong.hoTen', label: 'Họ và tên vợ/chồng', kind: 'text' },
  { name: 'voChong.ngaySinh', label: 'Ngày sinh', kind: 'date' },
  { name: 'voChong.gioiTinh', label: 'Giới tính', kind: 'gioiTinh' },
  { name: 'voChong.soDinhDanh', label: 'Số định danh cá nhân (CCCD, 12 số)', kind: 'cccd' },
  { name: 'voChong.ngayCap', label: 'Ngày cấp CCCD', kind: 'date' },
  { name: 'voChong.noiCap', label: 'Nơi cấp CCCD', kind: 'text' },
  { name: 'voChong.noiThuongTru', label: 'Nơi thường trú', kind: 'text' },
  { name: 'voChong.noiTamTru', label: 'Nơi tạm trú (nếu có)', kind: 'text' },
  { name: 'voChong.noiOHienTai', label: 'Nơi ở hiện tại', kind: 'text', help: NOI_O_HIEN_TAI_HELP },
  { name: 'voChong.ngheNghiep', label: 'Nghề nghiệp', kind: 'text' },
  { name: 'voChong.coQuanCongTac', label: 'Cơ quan, đơn vị công tác', kind: 'text' },
  { name: 'voChong.thuNhap', label: 'Thu nhập bình quân tháng (đồng)', kind: 'money' },
  { name: 'soDangKyKetHon', label: 'Số Giấy chứng nhận đăng ký kết hôn', kind: 'text' },
];

/** Chỉ hiện khi người đứng đơn thuộc khoản 7 và đã kết hôn: quyết định ô đánh dấu mục 8.2 Mẫu 01 NĐ 136. */
export const SPOUSE_K7_FIELDS: FieldDef[] = [
  {
    name: 'voChong.thuocKhoan7',
    label: 'Vợ/chồng cũng thuộc lực lượng vũ trang, cơ yếu (khoản 7)?',
    kind: 'yesNo',
    help: 'Dùng để đánh dấu mục 8.2 của Đơn đăng ký.',
  },
];

const s = (v: string | undefined) => v ?? '';
const n = (v: number | undefined) => (v === undefined ? '' : String(v));
const yn = (v: boolean | undefined): YesNo => (v === undefined ? '' : v ? 'true' : 'false');

function personForm(p: Applicant | VoChong): PersonForm {
  return {
    hoTen: s(p.hoTen),
    ngaySinh: s(p.ngaySinh),
    gioiTinh: p.gioiTinh ?? '',
    soDinhDanh: s(p.soDinhDanh),
    ngayCap: s(p.ngayCap),
    noiCap: s(p.noiCap),
    noiThuongTru: s(p.noiThuongTru),
    noiTamTru: s(p.noiTamTru),
    noiOHienTai: s(p.noiOHienTai),
    ngheNghiep: s(p.ngheNghiep),
    coQuanCongTac: s(p.coQuanCongTac),
  };
}

export function toFormValues(a: Applicant): FormValues {
  const v = a.voChong ?? {};
  return {
    ...personForm(a),
    diaChiLienHe: s(a.diaChiLienHe),
    soDienThoai: s(a.soDienThoai),
    diaChiCoQuan: s(a.diaChiCoQuan),
    thuNhapBinhQuanThang: n(a.thuNhapBinhQuanThang),
    nuoiConDuoiTuoiThanhNien: a.nuoiConDuoiTuoiThanhNien ?? false,
    soDangKyKetHon: s(a.soDangKyKetHon),
    loaiDoiTuongK7: s(a.loaiDoiTuongK7),
    voChong: { ...personForm(v), thuNhap: n(v.thuNhap), thuocKhoan7: yn(v.thuocKhoan7) },
    thanhVienHo: (a.thanhVienHo ?? []).map((t) => ({
      hoTen: s(t.hoTen),
      quanHe: s(t.quanHe),
      soDinhDanh: s(t.soDinhDanh),
      ngayCap: s(t.ngayCap),
      noiCap: s(t.noiCap),
    })),
  };
}

const hasValue = (o: object) => Object.values(o).some((x) => x !== undefined);

/** Dọn kết quả đã parse trước khi lưu: bỏ dòng thành viên trống, bỏ thông tin vợ/chồng (và số đăng ký kết hôn) nếu không kết hôn. */
export function cleanApplicant(parsed: Applicant, tinhTrangHonNhan: Applicant['tinhTrangHonNhan']): Applicant {
  const out: Applicant = { ...parsed, tinhTrangHonNhan };
  if (tinhTrangHonNhan !== 'da_ket_hon' || !out.voChong || !hasValue(out.voChong)) delete out.voChong;
  if (tinhTrangHonNhan !== 'da_ket_hon') delete out.soDangKyKetHon;
  if (tinhTrangHonNhan === 'da_ket_hon' || !out.nuoiConDuoiTuoiThanhNien) delete out.nuoiConDuoiTuoiThanhNien;
  const tv = (out.thanhVienHo ?? []).filter(hasValue);
  if (tv.length > 0) out.thanhVienHo = tv;
  else delete out.thanhVienHo;
  for (const k of Object.keys(out) as (keyof Applicant)[]) if (out[k] === undefined) delete out[k];
  return out;
}

/** Các mẫu (trong danh sách của người dùng) có ô "Kính gửi" lấy từ `application.kinhGui[mã mẫu]`. */
export function kinhGuiForms(docs: readonly DocItem[], manifests: Parameters<typeof findManifest>[0]) {
  const out: { id: FormId; title: string; certifiedBy?: string; spouseToo: boolean }[] = [];
  for (const d of docs) {
    if (d.kind !== 'template') continue;
    const existing = out.find((x) => x.id === d.id);
    if (existing) {
      if (d.person === 'spouse') existing.spouseToo = true;
      continue;
    }
    const m = findManifest(manifests, d.id);
    const reads = m?.fields.some((f) => f.paths?.includes('application.kinhGui'));
    if (!reads) continue;
    const id = d.id as FormId;
    out.push({ id, title: FORMS[id]?.title ?? d.title, certifiedBy: d.certifiedBy, spouseToo: d.person === 'spouse' });
  }
  return out;
}
