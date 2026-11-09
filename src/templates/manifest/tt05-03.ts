/**
 * Mẫu số 03 Phụ lục I TT 05/2024/TT-BXD: Giấy xác nhận về điều kiện nhà ở
 * (có nhà ở nhưng diện tích bình quân đầu người thấp hơn 15 m² sàn/người). Chưa bị thay thế (VBHN 17/VBHN-BXD).
 * Template: public/templates/tt05-03.docx, sinh bởi scripts/templates/tt05-03.ts. Đặc tả: docs/forms/tt05-mau-03.md.
 *
 * Không gắn tag: ngày ký, chữ ký người kê khai, toàn khối "Xác nhận của Ủy ban nhân dân xã/phường…… về:".
 *
 * Trường chưa có trong mô hình dữ liệu (đọc theo đường dẫn đề xuất, chưa có thì giữ dãy chấm):
 * `application.kinhGui['tt05-03']`, `applicant.soDangKyKetHon`, `thanhVienHo[].ngayCap|noiCap`,
 * `application.nhaO.soGiayChungNhan`, `application.nhaO.dienTichSan`, `application.duAn.tinh`.
 */
import type { DoiTuong, ThanhVienHo } from '../../domain/types';
import type { TemplateData } from '../data';
import type { TemplateManifest } from '../types';
import {
  DOI_TUONG_TEXT_D76,
  isSpouseCopy,
  kinhGui,
  noiOHienTai,
  NOI_O_HIEN_TAI_PATHS,
  pad,
  personField,
  viDate,
} from './_tt-common';

const PH = {
  kinh_gui_xa: '………………………………………',
  ho_ten: '………………………..……………………………………………...',
  so_dinh_danh: '…………………..',
  ngay_cap: '…/ …/ …',
  noi_cap: '………………',
  noi_o_hien_tai: '…………………………………………………………………',
  // File nguồn dùng tab dẫn chấm + dãy "…"; template thay bằng đúng dãy chấm in trong VBHN 17.
  noi_thuong_tru: '................................... ………………………………..',
  vo_chong_ho_ten: '………………………………………………….',
  vo_chong_so_dinh_danh: '…………….',
  vo_chong_ngay_cap: '…/ …/ …',
  vo_chong_noi_cap: '……………………….',
  so_dang_ky_ket_hon: '……………………………………………………',
  thanh_vien_ho_ten: '…………………………',
  thanh_vien_so_dinh_danh: '…………..……..',
  thanh_vien_ngay_cap: '…/ …/ …',
  thanh_vien_noi_cap: '…………………',
  doi_tuong_text: '………………………………………………………….……....',
  so_gcn: '…………..…',
  dien_tich_san: '……….',
  tinh_du_an: '……………..…',
} as const;

type Loose = Record<string, unknown>;

/** Mục 8 chỉ có một dòng: nhiều thành viên thì nối bằng "; " theo cùng thứ tự ở mọi cột. */
function thanhVien(d: TemplateData, pick: (t: ThanhVienHo & Loose) => unknown): string | undefined {
  const list = (d.applicant?.thanhVienHo ?? []) as (ThanhVienHo & Loose)[];
  const vals = list.map((t) => pick(t)).map((v) => (typeof v === 'string' ? v.trim() : ''));
  return vals.some((v) => v !== '') ? vals.map((v) => v || '…').join('; ') : undefined;
}

const nhaO = (d: TemplateData, key: string): unknown => ((d.application as Loose).nhaO as Loose | undefined)?.[key];

export const tt05_03: TemplateManifest<TemplateData> = {
  id: 'tt05-03',
  title: 'Giấy xác nhận về điều kiện nhà ở (diện tích bình quân dưới 15 m² sàn/người)',
  legalRef: 'Mẫu số 03 Phụ lục I ban hành kèm theo Thông tư 05/2024/TT-BXD (chưa bị thay thế; xem VBHN 17/VBHN-BXD)',
  effectiveFrom: '2024-08-01',
  file: 'tt05-03.docx',
  fields: [
    {
      key: 'kinh_gui_xa',
      label: 'Kính gửi: Ủy ban nhân dân xã/phường (nơi đăng ký thường trú)',
      placeholder: PH.kinh_gui_xa,
      source: (d) => kinhGui(d, 'tt05-03'),
      paths: ['application.kinhGui'],
    },
    pad({ key: 'ho_ten', label: 'Họ và tên', placeholder: PH.ho_ten, source: 'person.hoTen' }, { before: true }),
    pad({ key: 'so_dinh_danh', label: 'Căn cước công dân số', placeholder: PH.so_dinh_danh, source: 'person.soDinhDanh' }, { before: true }),
    {
      key: 'ngay_cap',
      label: 'Ngày cấp',
      placeholder: PH.ngay_cap,
      source: (d) => viDate(personField(d, 'ngayCap')),
      paths: ['person.ngayCap'],
    },
    pad({ key: 'noi_cap', label: 'Nơi cấp', placeholder: PH.noi_cap, source: 'person.noiCap' }, { before: true }),
    pad({
      key: 'noi_o_hien_tai',
      label: 'Nơi ở hiện tại',
      placeholder: PH.noi_o_hien_tai,
      source: noiOHienTai,
      paths: NOI_O_HIEN_TAI_PATHS,
    }, { before: true }),
    { key: 'noi_thuong_tru', label: 'Đăng ký thường trú tại', placeholder: PH.noi_thuong_tru, source: 'person.noiThuongTru' },
    { key: 'vo_chong_ho_ten', label: 'Họ và tên vợ/chồng', placeholder: PH.vo_chong_ho_ten, source: 'spouse.hoTen' },
    pad({
      key: 'vo_chong_so_dinh_danh',
      label: 'Căn cước công dân số (vợ/chồng)',
      placeholder: PH.vo_chong_so_dinh_danh,
      source: 'spouse.soDinhDanh',
    }, { before: true, after: true }),
    {
      key: 'vo_chong_ngay_cap',
      label: 'Ngày cấp (vợ/chồng)',
      placeholder: PH.vo_chong_ngay_cap,
      source: (d) => viDate(d.spouse?.ngayCap),
      paths: ['spouse.ngayCap'],
    },
    pad({ key: 'vo_chong_noi_cap', label: 'Nơi cấp (vợ/chồng)', placeholder: PH.vo_chong_noi_cap, source: 'spouse.noiCap' }, { before: true }),
    {
      key: 'so_dang_ky_ket_hon',
      label: 'Đăng ký kết hôn số',
      placeholder: PH.so_dang_ky_ket_hon,
      source: 'applicant.soDangKyKetHon',
    },
    {
      key: 'thanh_vien_ho_ten',
      label: 'Họ và tên các thành viên trong hộ gia đình',
      placeholder: PH.thanh_vien_ho_ten,
      source: (d) => thanhVien(d, (t) => (t.hoTen && t.quanHe ? `${t.hoTen} (${t.quanHe})` : t.hoTen)),
      paths: ['applicant.thanhVienHo'],
    },
    pad({
      key: 'thanh_vien_so_dinh_danh',
      label: 'Căn cước công dân số (thành viên)',
      placeholder: PH.thanh_vien_so_dinh_danh,
      source: (d) => thanhVien(d, (t) => t.soDinhDanh),
      paths: ['applicant.thanhVienHo'],
    }, { before: true }),
    {
      key: 'thanh_vien_ngay_cap',
      label: 'Ngày cấp (thành viên)',
      placeholder: PH.thanh_vien_ngay_cap,
      source: (d) => thanhVien(d, (t) => viDate(t.ngayCap)),
      paths: ['applicant.thanhVienHo'],
    },
    pad({
      key: 'thanh_vien_noi_cap',
      label: 'Nơi cấp (thành viên)',
      placeholder: PH.thanh_vien_noi_cap,
      source: (d) => thanhVien(d, (t) => t.noiCap),
      paths: ['applicant.thanhVienHo'],
    }, { before: true }),
    pad({
      key: 'doi_tuong_text',
      label: 'Là đối tượng',
      placeholder: PH.doi_tuong_text,
      source: (d) => (isSpouseCopy(d) ? undefined : DOI_TUONG_TEXT_D76[d.application?.doiTuong as DoiTuong]),
      paths: ['application.doiTuong'],
    }, { before: true }),
    pad({
      key: 'so_gcn',
      label: 'Số Giấy chứng nhận',
      placeholder: PH.so_gcn,
      source: (d) => nhaO(d, 'soGiayChungNhan'),
      paths: ['application.nhaO.soGiayChungNhan'],
    }, { before: true }),
    pad({
      key: 'dien_tich_san',
      label: 'Diện tích sàn sử dụng nhà ở (m²)',
      placeholder: PH.dien_tich_san,
      source: (d) => nhaO(d, 'dienTichSan'),
      paths: ['application.nhaO.dienTichSan'],
    }, { before: true, after: true }),
    pad({
      key: 'tinh_du_an',
      label: 'Tỉnh/thành phố nơi có dự án',
      placeholder: PH.tinh_du_an,
      source: 'application.duAn.tinh',
    }, { before: true, after: true }),
  ],
  checkboxes: [],
};
