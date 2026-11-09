/**
 * Mẫu số 04 Phụ lục I TT 32/2025/TT-BXD (bản hiện hành, đã bỏ cụm "(photo Bảng tiền công/tiền lương...)"
 * theo khoản 3 Điều 1 TT 08/2026/TT-BXD): Giấy xác nhận điều kiện về thu nhập (khoản 7 Điều 76).
 * Template sinh bởi scripts/templates/tt32-04.ts (docs/forms/tt32-mau-04.md). Văn bản theo VBHN 17/VBHN-BXD.
 */
import type { TemplateData } from '../data';
import type { TemplateManifest } from '../types';
import { derived, doiTuongText, field, firstOf } from './generated-common';

export const tt32_04: TemplateManifest<TemplateData> = {
  id: 'tt32-04',
  title: 'Giấy xác nhận điều kiện về thu nhập (lực lượng vũ trang, cơ yếu)',
  legalRef:
    'Mẫu số 04 Phụ lục I ban hành kèm theo Thông tư 05/2024/TT-BXD, thay bởi Thông tư 32/2025/TT-BXD, sửa đổi bởi khoản 3 Điều 1 Thông tư 08/2026/TT-BXD (từ 15/02/2026)',
  effectiveFrom: '2025-11-10',
  file: 'tt32-04.docx',
  fields: [
    // Chú thích 1: cơ quan, đơn vị, doanh nghiệp nơi người kê khai đang làm việc.
    field('kinh_gui', '1. Kính gửi (cơ quan, đơn vị nơi làm việc)', '……………………………………………………………………...', 'person.coQuanCongTac', { before: true }),
    field('ho_ten', '2. Họ và tên', '…………………………………..…………………………………..', 'person.hoTen', { before: true }),
    field('so_dinh_danh', '3. Căn cước công dân số', '………………', 'person.soDinhDanh', { before: true }),
    field('ngay_cap', 'Cấp ngày', '...../..../......', 'person.ngayCap', { before: true, format: 'date' }),
    field('noi_cap', 'Nơi cấp', '…………………', 'person.noiCap', { before: true }),
    // Chú thích 2: nơi thường trú hoặc tạm trú; nếu không có thì nơi đang thực tế sinh sống.
    field('noi_o_hien_tai', '4. Nơi ở hiện tại', '………………………………………………………………...', ['person.noiOHienTai', 'person.noiTamTru', 'person.noiThuongTru', 'person.diaChiLienHe'], { before: true }),
    field('noi_thuong_tru', '5. Đăng ký thường trú (đăng ký tạm trú) tại', '...... ………………………………..', ['person.noiThuongTru', 'person.noiTamTru']),
    derived('doi_tuong_text', '6. Là đối tượng', '...................................................................................................', ['application.doiTuong'], (d) =>
      firstOf(d, ['person.loaiDoiTuongK7']) ?? doiTuongText(d),
    ),
    field('thu_nhap', '7. Thu nhập bình quân hàng tháng thực nhận (đồng)', '……………', ['person.thuNhapBinhQuanThang', 'person.thuNhap'], { before: true, format: 'money' }),
  ],
  checkboxes: [],
};
