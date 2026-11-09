/**
 * Mẫu số 01 Phụ lục TT 08/2026/TT-BXD: Giấy xác nhận về đối tượng (khoản 9, 10, 11 Điều 76 Luật Nhà ở).
 * Template: public/templates/tt08-01.docx, sinh bởi scripts/templates/tt08-01.ts. Đặc tả: docs/forms/tt08-mau-01.md.
 *
 * Không gắn tag: ngày ký, chữ ký người kê khai, toàn khối "Xác nhận của cơ quan, đơn vị, doanh nghiệp"
 * và dòng thứ hai (dãy chấm) của "Tên cơ quan (đơn vị)" (để trống viết tay khi tên dài).
 */
import type { DoiTuong } from '../../domain/types';
import type { TemplateData } from '../data';
import type { TemplateManifest } from '../types';
import {
  isSpouseCopy,
  kinhGui,
  noiOHienTai,
  NOI_O_HIEN_TAI_PATHS,
  personField,
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
  noi_thuong_tru: '.......………………………………..',
  nghe_nghiep: '..............................',
  co_quan_cong_tac: '………………..............',
  doi_tuong_text: '…………………………………………………………………..',
} as const;

/** Cách ghi "Là đối tượng" theo chú thích 3 của mẫu. */
export const DOI_TUONG_TEXT_TT08_01: Partial<Record<DoiTuong, string>> = {
  k9: 'Đối tượng đã trả lại nhà ở công vụ theo quy định',
  k10: 'Hộ gia đình, cá nhân thuộc trường hợp bị thu hồi đất và phải giải tỏa, phá dỡ nhà ở theo quy định của pháp luật mà chưa được Nhà nước bồi thường bằng nhà ở, đất ở',
  k11: 'Học sinh, sinh viên đại học, học viện, trường đại học, cao đẳng, dạy nghề, học sinh trường dân tộc nội trú công lập, trường chuyên biệt theo quy định của pháp luật',
};

export const tt08_01: TemplateManifest<TemplateData> = {
  id: 'tt08-01',
  title: 'Giấy xác nhận về đối tượng (khoản 9, 10, 11 Điều 76 Luật Nhà ở)',
  legalRef:
    'Mẫu số 01 Phụ lục ban hành kèm theo Thông tư 08/2026/TT-BXD (thay Mẫu số 01 Phụ lục I Thông tư 05/2024/TT-BXD; điểm a khoản 2 Điều 1)',
  effectiveFrom: '2026-02-15',
  file: 'tt08-01.docx',
  fields: [
    pad({
      key: 'kinh_gui',
      label: 'Kính gửi (cơ quan xác nhận: UBND cấp xã / cơ quan quản lý nhà ở công vụ / trường)',
      placeholder: PH.kinh_gui,
      // HSSV: trường đang học chính là nơi xác nhận (chú thích 1).
      source: (d) =>
        kinhGui(d, 'tt08-01') ??
        (d.application?.doiTuong === 'k11' && !isSpouseCopy(d) ? personField(d, 'coQuanCongTac') : undefined),
      paths: ['application.kinhGui', 'person.coQuanCongTac', 'application.doiTuong'],
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
    pad({ key: 'nghe_nghiep', label: 'Nghề nghiệp', placeholder: PH.nghe_nghiep, source: 'person.ngheNghiep' }, { before: true }),
    { key: 'co_quan_cong_tac', label: 'Tên cơ quan (đơn vị)', placeholder: PH.co_quan_cong_tac, source: 'person.coQuanCongTac' },
    {
      key: 'doi_tuong_text',
      label: 'Là đối tượng',
      placeholder: PH.doi_tuong_text,
      source: (d) => (isSpouseCopy(d) ? undefined : DOI_TUONG_TEXT_TT08_01[d.application?.doiTuong as DoiTuong]),
      paths: ['application.doiTuong'],
    },
  ],
  checkboxes: [],
};
