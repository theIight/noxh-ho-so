/**
 * Mẫu số 05 Phụ lục TT 08/2026/TT-BXD: Đơn đề nghị xác nhận điều kiện về thu nhập
 * (giấy tờ chứng minh đối tượng, thu nhập; khoản 5 Điều 76 không có HĐLĐ, không hưởng lương hưu BHXH).
 * Template: public/templates/tt08-05.docx, sinh bởi scripts/templates/tt08-05.ts. Đặc tả: docs/forms/tt08-mau-05.md.
 *
 * Không gắn tag: ngày ký, chữ ký người kê khai, khối "Xác nhận của Công an cấp xã".
 */
import type { TemplateData } from '../data';
import type { TemplateManifest } from '../types';
import {
  gioiTinhText,
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
  kinh_gui: '............................................................................................',
  ho_ten: '............................................................................................',
  ngay_sinh: '………/……/………..',
  gioi_tinh: '………………..…',
  so_dinh_danh_ca_nhan: '………………………………………………..',
  so_the_can_cuoc: '…………………..',
  ngay_cap: '…./.../..........',
  noi_o_hien_tai: '………………………………………………………………..',
  noi_thuong_tru: '..........................................................',
  doi_tuong_text: '………………………………………………………………..',
  thu_nhap_binh_quan: '……….............',
} as const;

/** Cách ghi "Là đối tượng" theo chú thích 12 của mẫu. */
export const DOI_TUONG_TEXT_TT08_05 =
  'Người thu nhập thấp tại khu vực đô thị không có hợp đồng lao động, không được hưởng lương hưu do cơ quan Bảo hiểm xã hội chi trả';

export const tt08_05: TemplateManifest<TemplateData> = {
  id: 'tt08-05',
  title: 'Đơn đề nghị xác nhận điều kiện về thu nhập (người thu nhập thấp không có hợp đồng lao động)',
  legalRef:
    'Mẫu số 05 Phụ lục ban hành kèm theo Thông tư 08/2026/TT-BXD (thay Mẫu số 05 Phụ lục I Thông tư 05/2024/TT-BXD; điểm c khoản 2 Điều 1)',
  effectiveFrom: '2026-02-15',
  file: 'tt08-05.docx',
  fields: [
    {
      key: 'kinh_gui',
      label: 'Kính gửi: Công an (xã/phường nơi thường trú, tạm trú hoặc nơi ở hiện tại)',
      placeholder: PH.kinh_gui,
      source: (d) => kinhGui(d, 'tt08-05'),
      paths: ['application.kinhGui'],
    },
    { key: 'ho_ten', label: 'Họ, chữ đệm và tên', placeholder: PH.ho_ten, source: 'person.hoTen' },
    {
      key: 'ngay_sinh',
      label: 'Ngày, tháng, năm sinh',
      placeholder: PH.ngay_sinh,
      source: (d) => viDate(personField(d, 'ngaySinh')),
      paths: ['person.ngaySinh'],
    },
    { key: 'gioi_tinh', label: 'Giới tính', placeholder: PH.gioi_tinh, source: gioiTinhText, paths: ['person.gioiTinh'] },
    {
      key: 'so_dinh_danh_ca_nhan',
      label: 'Số định danh cá nhân',
      placeholder: PH.so_dinh_danh_ca_nhan,
      source: 'person.soDinhDanh',
    },
    pad({
      key: 'so_the_can_cuoc',
      label: 'Thẻ căn cước/căn cước công dân số',
      placeholder: PH.so_the_can_cuoc,
      source: 'person.soDinhDanh',
    }, { before: true }),
    {
      key: 'ngay_cap',
      label: 'Ngày cấp',
      placeholder: PH.ngay_cap,
      source: (d) => viDate(personField(d, 'ngayCap')),
      paths: ['person.ngayCap'],
    },
    {
      key: 'noi_o_hien_tai',
      label: 'Nơi ở hiện tại',
      placeholder: PH.noi_o_hien_tai,
      source: noiOHienTai,
      paths: NOI_O_HIEN_TAI_PATHS,
    },
    {
      key: 'noi_thuong_tru',
      label: 'Đăng ký thường trú (đăng ký tạm trú) tại',
      placeholder: PH.noi_thuong_tru,
      source: thuongTruHoacTamTru,
      paths: THUONG_TRU_HOAC_TAM_TRU_PATHS,
    },
    {
      key: 'doi_tuong_text',
      label: 'Là đối tượng',
      placeholder: PH.doi_tuong_text,
      // Mẫu chỉ dành cho một nhóm: người đứng đơn khoản 5, hoặc vợ/chồng không có HĐLĐ.
      source: (d) => (isSpouseCopy(d) || d.application?.doiTuong === 'k5' ? DOI_TUONG_TEXT_TT08_05 : undefined),
      paths: ['application.doiTuong'],
    },
    {
      key: 'thu_nhap_binh_quan',
      label: 'Thu nhập bình quân hàng tháng thực nhận (đồng/tháng)',
      placeholder: PH.thu_nhap_binh_quan,
      source: thuNhapThang,
      paths: THU_NHAP_PATHS,
    },
  ],
  checkboxes: [],
};
