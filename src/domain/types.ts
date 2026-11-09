/**
 * Mô hình dữ liệu theo docs/PLAN.md §4.
 * Mọi trường của người khai (Applicant, VoChong, ThanhVienHo) đều optional:
 * trường để trống sẽ được giữ nguyên dãy chấm gốc trong biểu mẫu để điền tay.
 */

/**
 * Nhóm đối tượng theo các khoản của Điều 76 Luật Nhà ở 2023
 * (khoản 13 bổ sung bởi điểm a khoản 3 Điều 29 Luật Dân số 2025, từ 01/07/2026).
 * Khoản 12 (doanh nghiệp, HTX trong KCN) bị loại vì là pháp nhân, không phải cá nhân đăng ký mua.
 */
export const DOI_TUONG = [
  'k1',
  'k2',
  'k3',
  'k4',
  'k5',
  'k6',
  'k7',
  'k8',
  'k9',
  'k10',
  'k11',
  'k13',
] as const;
export type DoiTuong = (typeof DOI_TUONG)[number];

export const DIEU_KIEN_NHA_O = ['chua_co_nha', 'duoi_15m2', 'xa_noi_lam_viec'] as const;
export type DieuKienNhaO = (typeof DIEU_KIEN_NHA_O)[number];

export const HINH_THUC = ['mua', 'thue_mua', 'thue'] as const;
export type HinhThuc = (typeof HINH_THUC)[number];

export const HINH_THUC_LABEL: Record<HinhThuc, string> = { mua: 'Mua', thue_mua: 'Thuê mua', thue: 'Thuê' };

export const TINH_TRANG_HON_NHAN = ['doc_than', 'da_ket_hon', 'ly_hon', 'goa'] as const;
export type TinhTrangHonNhan = (typeof TINH_TRANG_HON_NHAN)[number];

export const GIOI_TINH = ['nam', 'nu'] as const;
export type GioiTinh = (typeof GIOI_TINH)[number];

/** Ngày dạng ISO `yyyy-mm-dd` (từ `<input type="date">`). Định dạng dd/mm/yyyy khi điền mẫu. */
export type IsoDate = string;

export interface VoChong {
  hoTen?: string;
  ngaySinh?: IsoDate;
  gioiTinh?: GioiTinh;
  soDinhDanh?: string;
  ngayCap?: IsoDate;
  noiCap?: string;
  noiThuongTru?: string;
  noiTamTru?: string;
  /** Nơi ở hiện tại nếu khác nơi thường trú/tạm trú (Mẫu 02 TT 08/2026, bản của vợ/chồng). */
  noiOHienTai?: string;
  ngheNghiep?: string;
  coQuanCongTac?: string;
  /** Thu nhập bình quân tháng (đồng). */
  thuNhap?: number;
  /** Vợ/chồng cũng thuộc khoản 7 Điều 76 (chỉ dùng khi người đứng đơn thuộc khoản 7: mục 8.2 Mẫu 01 NĐ 136). */
  thuocKhoan7?: boolean;
}

export interface ThanhVienHo {
  hoTen?: string;
  quanHe?: string;
  soDinhDanh?: string;
  ngayCap?: IsoDate;
  noiCap?: string;
}

export interface Applicant {
  hoTen?: string;
  ngaySinh?: IsoDate;
  gioiTinh?: GioiTinh;
  /** Số định danh cá nhân (CCCD), 12 chữ số. */
  soDinhDanh?: string;
  ngayCap?: IsoDate;
  noiCap?: string;
  noiThuongTru?: string;
  noiTamTru?: string;
  /** Nơi ở hiện tại nếu khác nơi thường trú/tạm trú (không có thì mẫu dùng tạm trú, rồi thường trú). */
  noiOHienTai?: string;
  diaChiLienHe?: string;
  soDienThoai?: string;
  ngheNghiep?: string;
  coQuanCongTac?: string;
  diaChiCoQuan?: string;
  /** Thu nhập bình quân tháng (đồng). */
  thuNhapBinhQuanThang?: number;
  tinhTrangHonNhan?: TinhTrangHonNhan;
  /** Số Giấy chứng nhận đăng ký kết hôn (Mẫu 02 TT 08/2026, Mẫu 03 TT 05/2024). */
  soDangKyKetHon?: string;
  /** Khoản 7: cách ghi đối tượng cụ thể (cấp bậc, chức vụ...) ở mục 6 Mẫu 04 TT 32/2025. */
  loaiDoiTuongK7?: string;
  /** Độc thân đang nuôi con dưới tuổi thành niên (ngưỡng thu nhập 35 triệu thay vì 25 triệu). Chỉ dùng cho cảnh báo mềm. */
  nuoiConDuoiTuoiThanhNien?: boolean;
  voChong?: VoChong;
  thanhVienHo?: ThanhVienHo[];
}

export interface DuAn {
  ten?: string;
  chuDauTu?: string;
  diaChi?: string;
  /** Tỉnh/thành phố nơi có dự án. */
  tinh?: string;
  /** Cơ quan có thẩm quyền cấp Giấy chứng nhận quyền sử dụng đất tại tỉnh có dự án (nơi gửi Mẫu 02 TT 08/2026). */
  coQuanXacNhanNhaO?: string;
}

/** Nhà ở hiện có (chỉ dùng khi dieuKienNhaO = 'duoi_15m2', Mẫu 03 TT 05/2024). */
export interface NhaO {
  soGiayChungNhan?: string;
  /** Diện tích sàn sử dụng (m²). */
  dienTichSan?: number;
}

export interface Application {
  doiTuong: DoiTuong;
  /** Chỉ dùng cho khoản 5: có hợp đồng lao động hay không (tách nhánh Mẫu 01a TT 32/2025 / Mẫu 05 TT 08/2026). */
  coHopDongLaoDong?: boolean;
  /** Khoản 5: đang hưởng lương hưu (đi cùng nhánh "có HĐLĐ hoặc lương hưu"; đổi nơi xác nhận). */
  coLuongHuu?: boolean;
  dieuKienNhaO: DieuKienNhaO;
  hinhThuc: HinhThuc;
  duAn?: DuAn;
  nhaO?: NhaO;
  /** Nơi gửi / cơ quan xác nhận của từng mẫu, theo mã mẫu (FormId), VD { 'tt08-05': 'Công an phường X' }. */
  kinhGui?: Partial<Record<string, string>>;
  /** Thông tin người đứng đơn, nhập một lần, dùng cho mọi mẫu. */
  applicant: Applicant;
}

export const DOI_TUONG_LABEL: Record<DoiTuong, string> = {
  k1: 'Khoản 1: Người có công với cách mạng, thân nhân liệt sĩ',
  k2: 'Khoản 2: Hộ gia đình nghèo, cận nghèo tại khu vực nông thôn',
  k3: 'Khoản 3: Hộ gia đình nghèo, cận nghèo tại khu vực nông thôn thường xuyên bị ảnh hưởng thiên tai, biến đổi khí hậu',
  k4: 'Khoản 4: Hộ gia đình nghèo, cận nghèo tại khu vực đô thị',
  k5: 'Khoản 5: Người thu nhập thấp tại khu vực đô thị',
  k6: 'Khoản 6: Công nhân, người lao động đang làm việc tại doanh nghiệp, HTX trong và ngoài KCN',
  k7: 'Khoản 7: Sĩ quan, quân nhân chuyên nghiệp, công an, công nhân/viên chức quốc phòng, người làm công tác cơ yếu',
  k8: 'Khoản 8: Cán bộ, công chức, viên chức',
  k9: 'Khoản 9: Đối tượng đã trả lại nhà ở công vụ',
  k10: 'Khoản 10: Hộ gia đình, cá nhân thuộc trường hợp bị thu hồi đất mà chưa được bồi thường bằng nhà ở, đất ở',
  k11: 'Khoản 11: Học sinh, sinh viên, học viên',
  k13: 'Khoản 13: Người có từ 02 con đẻ trở lên (Luật Dân số 2025, từ 01/07/2026)',
};
