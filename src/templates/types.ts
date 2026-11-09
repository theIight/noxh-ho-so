import type { FormId } from '../data/rules';

/**
 * Nguồn dữ liệu của một trường: đường dẫn chấm vào object dữ liệu (VD 'person.hoTen',
 * 'application.duAn.ten') hoặc hàm dẫn xuất. Kết quả rỗng/undefined/chỉ có khoảng trắng
 * → giữ nguyên dãy chấm gốc (`placeholder`).
 */
export type FieldSource<T> = string | ((data: T) => unknown);

export interface ManifestField<T = unknown> {
  /** Tên tag trong .docx: `{{key}}`. Chỉ gồm a-z, 0-9, _. */
  key: string;
  label: string;
  /** Dãy chấm gốc của mẫu, giữ đúng từng ký tự (kể cả độ dài). */
  placeholder: string;
  source: FieldSource<T>;
  /**
   * Tuỳ chọn: các đường dẫn dữ liệu mà `source` dạng hàm đọc tới (VD ['person.ngaySinh']),
   * để Bước 3 biết cần hiện trường nào. Không cần khi `source` là chuỗi.
   */
  paths?: string[];
}

export interface ManifestCheckbox<T = unknown> {
  /** Tên tag trong .docx: `{{key}}`, đặt đúng chỗ ký tự ô vuông gốc. */
  key: string;
  label?: string;
  checked: '☒';
  unchecked: '☐';
  /** Giá trị truthy → ☒, còn lại → ☐ (giữ nguyên ô trống gốc). */
  source: FieldSource<T>;
}

export interface TemplateManifest<T = unknown> {
  id: FormId | (string & {});
  title: string;
  legalRef: string;
  /** ISO yyyy-mm-dd. null nếu chưa xác minh. */
  effectiveFrom: string | null;
  /** Đường dẫn dưới public/templates/, VD 'nd136-01.docx'. */
  file: string;
  fields: ManifestField<T>[];
  checkboxes: ManifestCheckbox<T>[];
}

export const TAG_KEY_REGEX = /^[a-z0-9_]+$/;
