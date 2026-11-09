/**
 * Mẫu số 01a Phụ lục I TT 05/2024/TT-BXD (bổ sung bởi TT 32/2025/TT-BXD, sửa bởi TT 08/2026/TT-BXD):
 * Giấy xác nhận về đối tượng, thu nhập (khoản 5 có HĐLĐ hoặc lương hưu, khoản 6, khoản 8 Điều 76 Luật Nhà ở).
 * Bản hiện hành: đã bỏ cụm "(photo Bảng tiền công/tiền lương ...)" ở mục 9 (khoản 3 Điều 1 TT 08/2026).
 * Template: public/templates/tt32-01a.docx, sinh bởi scripts/templates/tt32-01a.ts. Đặc tả: docs/forms/tt32-mau-01a.md.
 *
 * Không gắn tag: ngày ký, chữ ký người kê khai, toàn khối "Xác nhận của cơ quan, đơn vị, doanh nghiệp".
 */
import type { TemplateData } from '../data';
import type { TemplateManifest } from '../types';
import {
  DOI_TUONG_TEXT_D76,
  isSpouseCopy,
  kinhGui,
  noiOHienTai,
  NOI_O_HIEN_TAI_PATHS,
  personField,
  thuNhapThang,
  THU_NHAP_PATHS,
  thuongTruHoacTamTru,
  THUONG_TRU_HOAC_TAM_TRU_PATHS,
  viDate,
  pad,
} from './_tt-common';

const PH = {
  kinh_gui: '………………………………………………………………………',
  ho_ten: '………………………………………………………………………',
  so_dinh_danh: '………………….',
  ngay_cap: '...../..../......',
  noi_cap: '……………',
  noi_o_hien_tai: '…………………………………………………………………',
  noi_thuong_tru: '...... ………………………………..',
  nghe_nghiep: '.......................................................................................................',
  co_quan_cong_tac: '............................................................................................',
  doi_tuong_text: '.....................................................................................................',
  thu_nhap_binh_quan: '……………',
} as const;

/** Người đứng đơn khoản 5 đang hưởng lương hưu: nơi xác nhận là BHXH hoặc UBND xã (chú thích 6), không phải nơi làm việc. */
const huongLuongHuu = (d: TemplateData) => !isSpouseCopy(d) && d.application?.doiTuong === 'k5' && d.application?.coLuongHuu === true;

/** Cách ghi "Là đối tượng" theo chú thích 8. Vợ/chồng kê khai mẫu này thì không phải kê khai mục 8. */
export function doiTuongText01a(d: TemplateData): string | undefined {
  if (isSpouseCopy(d)) return undefined;
  switch (d.application?.doiTuong) {
    case 'k5':
      return d.application?.coLuongHuu
        ? 'Người thu nhập thấp tại khu vực đô thị (nghỉ hưu)'
        : DOI_TUONG_TEXT_D76.k5;
    case 'k6':
      return DOI_TUONG_TEXT_D76.k6;
    case 'k8':
      return DOI_TUONG_TEXT_D76.k8;
    default:
      return undefined;
  }
}

export const tt32_01a: TemplateManifest<TemplateData> = {
  id: 'tt32-01a',
  title: 'Giấy xác nhận về đối tượng, thu nhập (khoản 5, 6, 8 Điều 76 Luật Nhà ở)',
  legalRef:
    'Mẫu số 01a Phụ lục I Thông tư 05/2024/TT-BXD, bổ sung bởi Thông tư 32/2025/TT-BXD (điểm b khoản 3 Điều 1); ' +
    'sửa bởi khoản 3 Điều 1 Thông tư 08/2026/TT-BXD (bỏ cụm "photo Bảng tiền công/tiền lương", từ 15/02/2026)',
  effectiveFrom: '2025-11-10',
  file: 'tt32-01a.docx',
  fields: [
    pad({
      key: 'kinh_gui',
      label: 'Kính gửi (cơ quan, đơn vị, doanh nghiệp nơi làm việc; người hưởng lương hưu: BHXH hoặc UBND cấp xã)',
      placeholder: PH.kinh_gui,
      source: (d) => kinhGui(d, 'tt32-01a') ?? (huongLuongHuu(d) ? undefined : personField(d, 'coQuanCongTac')),
      paths: ['application.kinhGui', 'person.coQuanCongTac', 'application.coLuongHuu'],
    }, { before: true }),
    pad({ key: 'ho_ten', label: 'Họ và tên', placeholder: PH.ho_ten, source: 'person.hoTen' }, { before: true }),
    pad({ key: 'so_dinh_danh', label: 'Căn cước công dân số', placeholder: PH.so_dinh_danh, source: 'person.soDinhDanh' }, { after: true }),
    pad({
      key: 'ngay_cap',
      label: 'Ngày cấp',
      placeholder: PH.ngay_cap,
      source: (d) => viDate(personField(d, 'ngayCap')),
      paths: ['person.ngayCap'],
    }, { before: true }),
    { key: 'noi_cap', label: 'Nơi cấp', placeholder: PH.noi_cap, source: 'person.noiCap' },
    pad({
      key: 'noi_o_hien_tai',
      label: 'Nơi ở hiện tại',
      placeholder: PH.noi_o_hien_tai,
      source: noiOHienTai,
      paths: NOI_O_HIEN_TAI_PATHS,
    }, { before: true }),
    {
      key: 'noi_thuong_tru',
      label: 'Đăng ký thường trú (đăng ký tạm trú) tại',
      placeholder: PH.noi_thuong_tru,
      source: thuongTruHoacTamTru,
      paths: THUONG_TRU_HOAC_TAM_TRU_PATHS,
    },
    { key: 'nghe_nghiep', label: 'Nghề nghiệp', placeholder: PH.nghe_nghiep, source: 'person.ngheNghiep' },
    { key: 'co_quan_cong_tac', label: 'Tên cơ quan/đơn vị', placeholder: PH.co_quan_cong_tac, source: 'person.coQuanCongTac' },
    {
      key: 'doi_tuong_text',
      label: 'Là đối tượng',
      placeholder: PH.doi_tuong_text,
      source: doiTuongText01a,
      paths: ['application.doiTuong', 'application.coLuongHuu'],
    },
    pad({
      key: 'thu_nhap_binh_quan',
      label: 'Thu nhập bình quân hàng tháng thực nhận theo Bảng tiền công/tiền lương (đồng/tháng)',
      placeholder: PH.thu_nhap_binh_quan,
      source: thuNhapThang,
      paths: THU_NHAP_PATHS,
    }, { before: true }),
  ],
  checkboxes: [],
};
