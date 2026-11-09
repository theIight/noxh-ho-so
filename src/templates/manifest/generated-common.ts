/**
 * Tiện ích dùng chung cho manifest của các mẫu sinh bằng script (scripts/templates/*.ts):
 * nd136-01, tt32-04, tt08-02.
 */
import { formatViDate } from '../../data/meta';
import type { DoiTuong } from '../../domain/types';
import { isBlank, resolveSource } from '../../lib/fill-docx';
import type { TemplateData } from '../data';
import type { ManifestCheckbox, ManifestField } from '../types';

/** Đọc giá trị theo đường dẫn chấm, kể cả trường chưa có trong kiểu dữ liệu (trả undefined). */
export function get(d: TemplateData, path: string): unknown {
  return resolveSource(path, d);
}

/** Giá trị đầu tiên không rỗng trong các đường dẫn. */
export function firstOf(d: TemplateData, paths: readonly string[]): unknown {
  for (const p of paths) {
    const v = get(d, p);
    if (!isBlank(v)) return v;
  }
  return undefined;
}

const money = new Intl.NumberFormat('vi-VN');

export type Format = 'text' | 'date' | 'money';

function fmt(v: unknown, format: Format): string | undefined {
  if (isBlank(v)) return undefined;
  if (format === 'date') return typeof v === 'string' ? formatViDate(v) : String(v);
  if (format === 'money') return typeof v === 'number' ? money.format(v) : String(v);
  return String(v).trim();
}

export interface GlueOptions {
  /** Thêm dấu cách trước giá trị (dãy chấm gốc dính liền chữ đứng trước, VD "tại…"). */
  before?: boolean;
  /** Thêm dấu cách sau giá trị (dãy chấm gốc dính liền chữ đứng sau, VD "…cấp ngày"). */
  after?: boolean;
  format?: Format;
}

/**
 * Trường lấy từ (các) đường dẫn: giá trị không rỗng đầu tiên, định dạng rồi chèn dấu cách
 * nếu dãy chấm gốc dính liền chữ. Rỗng → undefined → giữ dãy chấm gốc.
 */
export function field(
  key: string,
  label: string,
  placeholder: string,
  paths: string | readonly string[],
  opts: GlueOptions = {},
): ManifestField<TemplateData> {
  const list = typeof paths === 'string' ? [paths] : [...paths];
  return {
    key,
    label,
    placeholder,
    paths: list,
    source: (d) => glue(fmt(firstOf(d, list), opts.format ?? 'text'), opts),
  };
}

/** Trường có nguồn dạng hàm tuỳ ý (kết quả vẫn được chèn dấu cách theo `opts`). */
export function derived(
  key: string,
  label: string,
  placeholder: string,
  paths: readonly string[],
  fn: (d: TemplateData) => unknown,
  opts: GlueOptions = {},
): ManifestField<TemplateData> {
  return { key, label, placeholder, paths: [...paths], source: (d) => glue(fmt(fn(d), opts.format ?? 'text'), opts) };
}

export function glue(v: string | undefined, opts: GlueOptions): string | undefined {
  if (v === undefined || v === '') return undefined;
  return `${opts.before ? ' ' : ''}${v}${opts.after ? ' ' : ''}`;
}

export function checkbox(
  key: string,
  label: string,
  fn: (d: TemplateData) => boolean,
): ManifestCheckbox<TemplateData> {
  return { key, label, checked: '☒', unchecked: '☐', source: fn };
}

/** Vợ/chồng "kia" so với người khai: bản của người đứng đơn → vợ/chồng; bản của vợ/chồng → người đứng đơn. */
export function partnerPath(d: TemplateData): 'applicant' | 'spouse' {
  return d.person === d.spouse ? 'applicant' : 'spouse';
}

export function isMarried(d: TemplateData): boolean {
  return d.applicant.tinhTrangHonNhan === 'da_ket_hon';
}

/**
 * Cách ghi đối tượng theo Điều 76 Luật Nhà ở 2023 (lời văn theo chú thích 8 Mẫu 02 TT 08/2026;
 * K11, K13 theo Luật Nhà ở / Luật Dân số 2025).
 */
export const DOI_TUONG_TEXT: Record<DoiTuong, string> = {
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
  k11: 'Học sinh, sinh viên đại học, học viện, trường đại học, cao đẳng, dạy nghề, trường chuyên biệt theo quy định của pháp luật; học sinh trường dân tộc nội trú công lập',
  k13: 'Người có từ 02 con đẻ trở lên',
};

export function doiTuongText(d: TemplateData): string | undefined {
  const k = d.application.doiTuong;
  return k ? DOI_TUONG_TEXT[k] : undefined;
}
