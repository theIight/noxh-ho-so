/**
 * Hàm dẫn xuất dùng chung cho manifest các mẫu thông tư (tt08-01, tt08-05, tt32-01a, tt05-03).
 *
 * Một số trường đọc theo đường dẫn chưa có trong src/domain (đề xuất bổ sung):
 * - `application.kinhGui[formId]`: nơi gửi/xác nhận của từng mẫu (UBND xã, Công an xã, trường...).
 * - `person.noiOHienTai`, `spouse.noiThuongTru`, `spouse.gioiTinh`...
 * Khi chưa có dữ liệu thì trả undefined → giữ dãy chấm gốc.
 */
import { formatViDate } from '../../data/meta';
import type { DoiTuong } from '../../domain/types';
import { formatValue, isBlank, resolveSource } from '../../lib/fill-docx';
import type { TemplateData } from '../data';
import type { ManifestField } from '../types';

type Loose = Record<string, unknown>;

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() !== '' ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

/** Đọc trường của người khai bản này (Applicant hoặc VoChong) kể cả khi kiểu kia không có trường đó. */
export const personField = (d: TemplateData, key: string): unknown => (d.person as Loose | undefined)?.[key];

/** ISO yyyy-mm-dd → dd/mm/yyyy, undefined nếu trống. */
export const viDate = (v: unknown): string | undefined => {
  const s = str(v);
  return s ? formatViDate(s) : undefined;
};

/** Bản khai của vợ/chồng (person chính là spouse). */
export const isSpouseCopy = (d: TemplateData): boolean => d.person !== undefined && d.person === d.spouse;

/** Nơi gửi của mẫu `formId` (đề xuất `application.kinhGui`). */
export function kinhGui(d: TemplateData, formId: string): string | undefined {
  const map = (d.application as Loose | undefined)?.kinhGui as Loose | undefined;
  return str(map?.[formId]);
}

/**
 * "Nơi ở hiện tại": theo chú thích mẫu là nơi thường trú hoặc tạm trú (không có thì nơi thực tế sinh sống).
 * Ưu tiên `noiOHienTai` (đề xuất), rồi nơi tạm trú, rồi nơi thường trú.
 */
export const noiOHienTai = (d: TemplateData): string | undefined =>
  str(personField(d, 'noiOHienTai')) ?? str(personField(d, 'noiTamTru')) ?? str(personField(d, 'noiThuongTru'));
export const NOI_O_HIEN_TAI_PATHS = ['person.noiOHienTai', 'person.noiTamTru', 'person.noiThuongTru'];

/** "Đăng ký thường trú (đăng ký tạm trú) tại": thường trú, không có thì tạm trú. */
export const thuongTruHoacTamTru = (d: TemplateData): string | undefined =>
  str(personField(d, 'noiThuongTru')) ?? str(personField(d, 'noiTamTru'));
export const THUONG_TRU_HOAC_TAM_TRU_PATHS = ['person.noiThuongTru', 'person.noiTamTru'];

/** Thu nhập bình quân tháng (Applicant.thuNhapBinhQuanThang / VoChong.thuNhap). Số → định dạng vi-VN khi điền. */
export const thuNhapThang = (d: TemplateData): number | undefined =>
  num(personField(d, 'thuNhapBinhQuanThang')) ?? num(personField(d, 'thuNhap'));
export const THU_NHAP_PATHS = ['person.thuNhapBinhQuanThang', 'person.thuNhap'];

export const gioiTinhText = (d: TemplateData): string | undefined => {
  const g = personField(d, 'gioiTinh');
  return g === 'nam' ? 'Nam' : g === 'nu' ? 'Nữ' : undefined;
};

/**
 * Cách ghi "Là đối tượng" theo chú thích của Mẫu 02/03 (liệt kê khoản 1–10 Điều 76 Luật Nhà ở).
 * Khoản 11 (HSSV), 13 không có trong danh sách của Mẫu 02/03.
 */
export const DOI_TUONG_TEXT_D76: Partial<Record<DoiTuong, string>> = {
  k1: 'Người có công với cách mạng, thân nhân liệt sĩ thuộc trường hợp được hỗ trợ cải thiện nhà ở theo quy định của Pháp lệnh Ưu đãi người có công với cách mạng',
  k2: 'Hộ gia đình nghèo, cận nghèo tại khu vực nông thôn',
  k3: 'Hộ gia đình nghèo, cận nghèo tại khu vực nông thôn thuộc vùng thường xuyên bị ảnh hưởng bởi thiên tai, biến đổi khí hậu',
  k4: 'Hộ gia đình nghèo, cận nghèo tại khu vực đô thị',
  k5: 'Người thu nhập thấp tại khu vực đô thị',
  k6: 'Công nhân, người lao động đang làm việc tại doanh nghiệp, hợp tác xã, liên hiệp hợp tác xã trong và ngoài khu công nghiệp',
  k7: 'Sĩ quan, quân nhân chuyên nghiệp, hạ sĩ quan thuộc lực lượng vũ trang nhân dân, công nhân công an, công chức, công nhân và viên chức quốc phòng đang phục vụ tại ngũ; người làm công tác cơ yếu, người làm công tác khác trong tổ chức cơ yếu hưởng lương từ ngân sách nhà nước đang công tác',
  k8: 'Cán bộ, công chức, viên chức theo quy định của pháp luật về cán bộ, công chức, viên chức',
  k9: 'Đối tượng đã trả lại nhà ở công vụ theo quy định tại khoản 4 Điều 125 của Luật Nhà ở',
  k10: 'Hộ gia đình, cá nhân thuộc trường hợp bị thu hồi đất và phải giải tỏa, phá dỡ nhà ở theo quy định của pháp luật mà chưa được Nhà nước bồi thường bằng nhà ở, đất ở',
};

export interface PadOptions {
  /** Dãy chấm gốc dính liền chữ / ":" / số chú thích đứng trước (VD "Họ và tên:…", "tại…"). */
  before?: boolean;
  /** Dãy chấm gốc dính liền chữ đứng sau (VD "…cấp ngày", "…m2"). */
  after?: boolean;
}

/**
 * Giá trị có nội dung thì thêm dấu cách trước/sau để không dính chữ bên cạnh trong mẫu
 * (cùng ý với `glue` của generated-common.ts). Rỗng → undefined → giữ đúng dãy chấm gốc.
 * Giữ `paths` (nguồn dạng chuỗi được chuyển thành `paths`) để Bước 3 vẫn biết trường cần hiện.
 */
export function pad(f: ManifestField<TemplateData>, opts: PadOptions): ManifestField<TemplateData> {
  const src = f.source;
  return {
    ...f,
    paths: f.paths ?? (typeof src === 'string' ? [src] : undefined),
    source: (d) => {
      const v = resolveSource(src, d);
      if (isBlank(v)) return undefined;
      return `${opts.before ? ' ' : ''}${formatValue(v).trim()}${opts.after ? ' ' : ''}`;
    },
  };
}
