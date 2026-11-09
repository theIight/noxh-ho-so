/**
 * Mẫu thử tổng hợp (KHÔNG phải mẫu nhà nước) để kiểm thử lõi điền .docx
 * trước khi có file gốc trong templates-src/.
 */
import type { Applicant, Application } from '../../src/domain/types';
import type { TemplateManifest } from '../../src/templates/types';
import { formatViDate } from '../../src/data/meta';
import { makeDocx, type Para } from '../helpers/make-docx';

export interface SyntheticData {
  person: Applicant;
  application: Partial<Pick<Application, 'hinhThuc'>>;
}

export const PH = {
  ho_ten: '..........................................................',
  // Dấu "…" (U+2026) như nhiều mẫu gốc dùng.
  so_dinh_danh: '…………………………………………',
  ngay_sinh: '..../..../........',
  noi_thuong_tru: '..................................................................................................',
  thu_nhap: '.................................',
  ghi_chu: '....................................................................',
} as const;

export const SIGNATURE_BLOCK = [
  '........, ngày ...... tháng ...... năm ........',
  'NGƯỜI VIẾT ĐƠN',
  '(Ký và ghi rõ họ tên)',
  'XÁC NHẬN CỦA UBND XÃ/PHƯỜNG ..............................',
  '(Ký tên, đóng dấu)',
];

export const syntheticManifest: TemplateManifest<SyntheticData> = {
  id: 'synthetic-01',
  title: 'Đơn thử nghiệm (tổng hợp)',
  legalRef: 'Không có (mẫu thử)',
  effectiveFrom: null,
  file: 'synthetic-01.docx',
  fields: [
    { key: 'ho_ten', label: 'Họ và tên', placeholder: PH.ho_ten, source: 'person.hoTen' },
    { key: 'so_dinh_danh', label: 'Số định danh cá nhân', placeholder: PH.so_dinh_danh, source: 'person.soDinhDanh' },
    {
      key: 'ngay_sinh',
      label: 'Ngày sinh',
      placeholder: PH.ngay_sinh,
      source: (d) => (d.person.ngaySinh ? formatViDate(d.person.ngaySinh) : undefined),
    },
    { key: 'noi_thuong_tru', label: 'Nơi thường trú', placeholder: PH.noi_thuong_tru, source: 'person.noiThuongTru' },
    { key: 'thu_nhap', label: 'Thu nhập bình quân tháng', placeholder: PH.thu_nhap, source: 'person.thuNhapBinhQuanThang' },
    { key: 'ghi_chu', label: 'Ghi chú', placeholder: PH.ghi_chu, source: 'person.diaChiLienHe' },
  ],
  checkboxes: [
    { key: 'cb_mua', label: 'Mua', checked: '☒', unchecked: '☐', source: (d) => d.application.hinhThuc === 'mua' },
    { key: 'cb_thue_mua', label: 'Thuê mua', checked: '☒', unchecked: '☐', source: (d) => d.application.hinhThuc === 'thue_mua' },
  ],
};

/** `tag(key)`: trả '{{key}}' cho template, hoặc placeholder cho bản gốc chưa gắn tag. */
function paragraphs(tagged: boolean): Para[] {
  const t = (key: keyof typeof PH | 'cb_mua' | 'cb_thue_mua') =>
    tagged ? `{{${key}}}` : key.startsWith('cb_') ? '☐' : PH[key as keyof typeof PH];
  return [
    [{ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true }],
    [{ text: 'Độc lập - Tự do - Hạnh phúc', bold: true }],
    [{ text: 'ĐƠN ĐĂNG KÝ (MẪU THỬ)', bold: true }],
    ['Kính gửi: ', 'Chủ đầu tư dự án ......................................'],
    ['Họ và tên người viết đơn: ', t('ho_ten')],
    // Tag bị tách qua 3 run, có run in đậm ở giữa (giống Word).
    tagged
      ? ['Số định danh cá nhân: ', '{{so_', { text: 'dinh_', bold: true }, 'danh}}', ' cấp ngày ....../....../........']
      : ['Số định danh cá nhân: ', PH.so_dinh_danh, ' cấp ngày ....../....../........'],
    ['Ngày sinh: ', t('ngay_sinh')],
    ['Nơi thường trú: ', t('noi_thuong_tru')],
    ['Thu nhập bình quân tháng: ', t('thu_nhap'), ' đồng'],
    ['Hình thức: ', t('cb_mua'), ' Mua      ', t('cb_thue_mua'), ' Thuê mua'],
    ['Địa chỉ liên hệ: ', t('ghi_chu')],
    'Tôi xin cam đoan những lời khai trong đơn là đúng sự thực.',
    ...SIGNATURE_BLOCK,
  ];
}

export const makeSyntheticTemplate = () => makeDocx(paragraphs(true));
export const makeSyntheticOriginal = () => makeDocx(paragraphs(false));

export const emptyData: SyntheticData = { person: {}, application: {} };
