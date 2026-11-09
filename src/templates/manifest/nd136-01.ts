/**
 * Mẫu số 01 Phụ lục NĐ 136/2026/NĐ-CP: Đơn đăng ký mua, thuê mua, thuê nhà ở xã hội.
 * Template sinh bởi scripts/templates/nd136-01.ts (docs/forms/nd136-mau-01.md).
 * Dãy chấm theo VBHN 24/VBHN-BXD (bản text); lời văn theo bản ký số NĐ 136.
 */
import type { TemplateData } from '../data';
import type { TemplateManifest } from '../types';
import { checkbox, derived, doiTuongText, field, get, isMarried } from './generated-common';

const K568 = new Set(['k5', 'k6', 'k8']);
const isK568 = (d: TemplateData) => K568.has(d.application.doiTuong ?? '');
const isK7 = (d: TemplateData) => d.application.doiTuong === 'k7';
/** Vợ/chồng cũng thuộc khoản 7 Điều 76 (chưa có trong mô hình dữ liệu: đề xuất `voChong.thuocKhoan7`). */
const spouseK7 = (d: TemplateData) => get(d, 'spouse.thuocKhoan7');
/** `hinhThuc` hiện chỉ có 'mua' | 'thue_mua'; 'thue' là đề xuất bổ sung. */
const hinhThuc = (d: TemplateData) => get(d, 'application.hinhThuc');

const HINH_THUC_TEXT: Record<string, string> = { mua: 'mua', thue_mua: 'thuê mua', thue: 'thuê' };

export const nd136_01: TemplateManifest<TemplateData> = {
  id: 'nd136-01',
  title: 'Đơn đăng ký mua, thuê mua, thuê nhà ở xã hội',
  legalRef:
    'Mẫu số 01 Phụ lục ban hành kèm theo Nghị định 136/2026/NĐ-CP (thay Mẫu số 01 Phụ lục II Nghị định 100/2024/NĐ-CP)',
  effectiveFrom: '2026-04-07',
  file: 'nd136-01.docx',
  fields: [
    field('kinh_gui', '1. Kính gửi (chủ đầu tư)', '………………………….……………………………………...', 'application.duAn.chuDauTu'),
    field('ho_ten', '2. Họ và tên người viết đơn', '………………………………………………..', 'person.hoTen'),
    field('so_dinh_danh', '3. Căn cước công dân số', '…...............', 'person.soDinhDanh'),
    field('ngay_cap', 'Cấp ngày', '......../........../..........', 'person.ngayCap', { format: 'date' }),
    field('noi_cap', 'Nơi cấp', '….....', 'person.noiCap', { before: true }),
    field('nghe_nghiep', '4. Nghề nghiệp', '…………………………………………………………......', 'person.ngheNghiep', { before: true }),
    // Chú thích 4: lực lượng vũ trang, cơ yếu (khoản 7) không ghi nơi làm việc.
    derived('noi_lam_viec', '5. Nơi làm việc', '…….…………………………………………………......', ['person.coQuanCongTac'], (d) =>
      isK7(d) ? undefined : get(d, 'person.coQuanCongTac'),
    ),
    derived('doi_tuong_text', '6. Thuộc đối tượng', '……………………………………………………….', ['application.doiTuong'], doiTuongText),
    derived(
      'hinh_thuc_giai_quyet',
      'Khi được giải quyết (mua, thuê mua, thuê)',
      // Bản gốc có " ." ngay sau dãy chấm; gộp vào placeholder để khi điền không còn dấu chấm thừa.
      '…….................................. .',
      ['application.hinhThuc'],
      (d) => HINH_THUC_TEXT[String(hinhThuc(d) ?? '')],
      { before: true },
    ),
  ],
  checkboxes: [
    checkbox('cb_mua', 'Hình thức đăng ký: Mua', (d) => hinhThuc(d) === 'mua'),
    checkbox('cb_thue_mua', 'Hình thức đăng ký: Thuê mua', (d) => hinhThuc(d) === 'thue_mua'),
    checkbox('cb_thue', 'Hình thức đăng ký: Thuê', (d) => hinhThuc(d) === 'thue'),
    checkbox('cb_chua_co_nha', '7.1. Chưa có nhà ở thuộc sở hữu của mình', (d) => d.application.dieuKienNhaO === 'chua_co_nha'),
    checkbox('cb_duoi_15m2', '7.2. Diện tích nhà ở bình quân dưới 15 m² sàn/người', (d) => d.application.dieuKienNhaO === 'duoi_15m2'),
    checkbox(
      'cb_tn_doc_than',
      '8.1. Chưa kết hôn/độc thân, thu nhập không quá 25 triệu đồng',
      (d) => isK568(d) && !!d.applicant.tinhTrangHonNhan && !isMarried(d) && !d.applicant.nuoiConDuoiTuoiThanhNien,
    ),
    checkbox(
      'cb_tn_nuoi_con',
      '8.1. Độc thân nuôi con dưới tuổi thành niên, thu nhập không quá 35 triệu đồng',
      (d) => isK568(d) && !!d.applicant.tinhTrangHonNhan && !isMarried(d) && !!d.applicant.nuoiConDuoiTuoiThanhNien,
    ),
    checkbox('cb_tn_ket_hon', '8.1. Đã kết hôn, tổng thu nhập hai vợ chồng không quá 50 triệu đồng', (d) => isK568(d) && isMarried(d)),
    checkbox(
      'cb_llvt_doc_than',
      '8.2. Độc thân, thu nhập không quá tổng thu nhập của sĩ quan cấp bậc hàm Đại tá',
      (d) => isK7(d) && !!d.applicant.tinhTrangHonNhan && !isMarried(d),
    ),
    checkbox(
      'cb_llvt_ca_hai',
      '8.2. Hai vợ chồng đều thuộc khoản 7, không quá 2,0 lần thu nhập Đại tá',
      (d) => isK7(d) && isMarried(d) && spouseK7(d) === true,
    ),
    checkbox(
      'cb_llvt_vo_chong_khac',
      '8.2. Vợ/chồng không thuộc khoản 7, không quá thu nhập Đại tá cộng 25 triệu đồng',
      (d) => isK7(d) && isMarried(d) && spouseK7(d) === false,
    ),
  ],
};
