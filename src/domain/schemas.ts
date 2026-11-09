import { z } from 'zod';
import {
  DIEU_KIEN_NHA_O,
  DOI_TUONG,
  GIOI_TINH,
  HINH_THUC,
  TINH_TRANG_HON_NHAN,
  type Applicant,
  type Application,
} from './types';

/**
 * Mọi trường người khai đều optional. Chuỗi rỗng ('') từ ô input được coi là "chưa nhập"
 * (mẫu sẽ giữ dãy chấm gốc). Chỉ kiểm tra định dạng khi người dùng đã nhập.
 */
const emptyToUndefined = (v: unknown) =>
  v === null || (typeof v === 'string' && v.trim() === '') || (typeof v === 'number' && Number.isNaN(v))
    ? undefined
    : v;

const optionalText = z.preprocess(emptyToUndefined, z.string().trim().optional());

export const CCCD_REGEX = /^\d{12}$/;
export const cccdSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().regex(CCCD_REGEX, 'Số định danh cá nhân (CCCD) phải gồm đúng 12 chữ số').optional(),
);

const isValidIsoDate = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
};
export const isoDateSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().refine(isValidIsoDate, 'Ngày không hợp lệ (yyyy-mm-dd)').optional(),
);

const optionalMoney = z.preprocess(
  (v) => {
    const e = emptyToUndefined(v);
    return typeof e === 'string' ? Number(e.replace(/[.,\s]/g, '')) : e;
  },
  z.number().finite('Số tiền không hợp lệ').nonnegative('Số tiền không được âm').optional(),
);

/** Ô chọn Có/Không: nhận boolean hoặc chuỗi 'true'/'false' từ <select>; rỗng → undefined. */
const optionalBool = z.preprocess(
  (v) => (v === 'true' ? true : v === 'false' ? false : emptyToUndefined(v)),
  z.boolean().optional(),
);

const optionalGioiTinh = z.preprocess(emptyToUndefined, z.enum(GIOI_TINH).optional());

export const voChongSchema = z.object({
  hoTen: optionalText,
  ngaySinh: isoDateSchema,
  gioiTinh: optionalGioiTinh,
  soDinhDanh: cccdSchema,
  ngayCap: isoDateSchema,
  noiCap: optionalText,
  noiThuongTru: optionalText,
  noiTamTru: optionalText,
  noiOHienTai: optionalText,
  ngheNghiep: optionalText,
  coQuanCongTac: optionalText,
  thuNhap: optionalMoney,
  thuocKhoan7: optionalBool,
});

export const thanhVienHoSchema = z.object({
  hoTen: optionalText,
  quanHe: optionalText,
  soDinhDanh: cccdSchema,
  ngayCap: isoDateSchema,
  noiCap: optionalText,
});

export const applicantSchema = z.object({
  hoTen: optionalText,
  ngaySinh: isoDateSchema,
  gioiTinh: optionalGioiTinh,
  soDinhDanh: cccdSchema,
  ngayCap: isoDateSchema,
  noiCap: optionalText,
  noiThuongTru: optionalText,
  noiTamTru: optionalText,
  noiOHienTai: optionalText,
  diaChiLienHe: optionalText,
  soDienThoai: optionalText,
  ngheNghiep: optionalText,
  coQuanCongTac: optionalText,
  diaChiCoQuan: optionalText,
  thuNhapBinhQuanThang: optionalMoney,
  tinhTrangHonNhan: z.preprocess(emptyToUndefined, z.enum(TINH_TRANG_HON_NHAN).optional()),
  soDangKyKetHon: optionalText,
  loaiDoiTuongK7: optionalText,
  nuoiConDuoiTuoiThanhNien: z.boolean().optional(),
  voChong: voChongSchema.optional(),
  thanhVienHo: z.array(thanhVienHoSchema).optional(),
});

export const duAnSchema = z.object({
  ten: optionalText,
  chuDauTu: optionalText,
  diaChi: optionalText,
  tinh: optionalText,
  coQuanXacNhanNhaO: optionalText,
});

/** Diện tích (m²): chấp nhận dấu phẩy thập phân kiểu Việt Nam ("25,5"). */
export const optionalArea = z.preprocess(
  (v) => {
    const e = emptyToUndefined(v);
    return typeof e === 'string' ? Number(e.trim().replace(/\s/g, '').replace(',', '.')) : e;
  },
  z.number('Diện tích không hợp lệ').finite('Diện tích không hợp lệ').positive('Diện tích phải lớn hơn 0').optional(),
);

export const nhaOSchema = z.object({
  soGiayChungNhan: optionalText,
  dienTichSan: optionalArea,
});

export const kinhGuiSchema = z.record(z.string(), optionalText);

/** Lựa chọn nhóm/điều kiện là bắt buộc (quyết định bộ giấy tờ); thông tin cá nhân thì không. */
export const applicationSchema = z
  .object({
    doiTuong: z.enum(DOI_TUONG, 'Chọn nhóm đối tượng (khoản 12 không áp dụng cho cá nhân)'),
    coHopDongLaoDong: z.boolean().optional(),
    coLuongHuu: z.boolean().optional(),
    dieuKienNhaO: z.enum(DIEU_KIEN_NHA_O, 'Chọn điều kiện nhà ở'),
    hinhThuc: z.enum(HINH_THUC, 'Chọn hình thức mua, thuê mua hoặc thuê'),
    duAn: duAnSchema.optional(),
    nhaO: nhaOSchema.optional(),
    kinhGui: kinhGuiSchema.optional(),
    applicant: applicantSchema,
  })
  .superRefine((a, ctx) => {
    if (a.doiTuong === 'k5' && a.coHopDongLaoDong === undefined && a.coLuongHuu === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['coHopDongLaoDong'],
        message: 'Khoản 5: cho biết có hợp đồng lao động hoặc lương hưu không',
      });
    }
  });

// Compile-time check: output của schema phải gán được cho kiểu domain.
export const _assertApplicant = (x: z.output<typeof applicantSchema>): Applicant => x;
export const _assertApplication = (x: z.output<typeof applicationSchema>): Application => x;
