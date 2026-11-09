/**
 * Mẫu số 02 Phụ lục TT 08/2026/TT-BXD: Giấy xác nhận về điều kiện nhà ở (chưa có nhà ở thuộc sở hữu).
 * Template sinh bởi scripts/templates/tt08-02.ts (docs/forms/tt08-mau-02.md). Văn bản và dãy chấm theo
 * templates-src/tt08-2026/08-bxd-kem.pdf (không theo bản gõ lại mau-02.docx).
 *
 * Bản của vợ/chồng (person = spouse): mục 6 ghi người đứng đơn (xem `partnerPath`).
 */
import type { TemplateData } from '../data';
import type { TemplateManifest } from '../types';
import { derived, doiTuongText, field, get, partnerPath } from './generated-common';

const partner = (key: string) => (d: TemplateData) => get(d, `${partnerPath(d)}.${key}`);

export const tt08_02: TemplateManifest<TemplateData> = {
  id: 'tt08-02',
  title: 'Giấy xác nhận về điều kiện nhà ở (chưa có nhà ở)',
  legalRef: 'Mẫu số 02 Phụ lục ban hành kèm theo Thông tư 08/2026/TT-BXD (thay Mẫu số 02 Phụ lục I Thông tư 05/2024/TT-BXD)',
  effectiveFrom: '2026-02-15',
  file: 'tt08-02.docx',
  fields: [
    // Chú thích 6: cơ quan có thẩm quyền cấp Giấy chứng nhận tại tỉnh nơi có dự án (chưa có trong mô hình dữ liệu).
    field('kinh_gui', '1. Kính gửi (cơ quan cấp Giấy chứng nhận nơi có dự án)', '……………………………………………………………………...', 'application.duAn.coQuanXacNhanNhaO'),
    field('ho_ten', '2. Họ và tên', '…………………..…………………………………………………...', 'person.hoTen', { before: true }),
    field('so_dinh_danh', '3. Căn cước công dân số', '………………..', 'person.soDinhDanh', { before: true }),
    field('ngay_cap', 'Cấp ngày', '…/ …/ …', 'person.ngayCap', { format: 'date' }),
    field('noi_cap', 'Nơi cấp', '…………………', 'person.noiCap', { before: true }),
    // Chú thích 7: nơi thường trú hoặc tạm trú đang thường xuyên sinh sống.
    field('noi_o_hien_tai', '4. Nơi ở hiện tại', '…………………………………………………………………', ['person.noiOHienTai', 'person.noiTamTru', 'person.noiThuongTru'], { before: true }),
    field('noi_thuong_tru', '5. Đăng ký thường trú (đăng ký tạm trú) tại', '………………………………….…', ['person.noiThuongTru', 'person.noiTamTru']),
    derived('vo_chong_ho_ten', '6. Họ và tên vợ/chồng', '…………………………………………………..', ['spouse.hoTen', 'applicant.hoTen'], partner('hoTen')),
    derived('vo_chong_so_dinh_danh', 'Căn cước công dân số (vợ/chồng)', '…………….…', ['spouse.soDinhDanh', 'applicant.soDinhDanh'], partner('soDinhDanh'), {
      before: true,
      after: true,
    }),
    derived('vo_chong_ngay_cap', 'Cấp ngày (vợ/chồng)', '…/ …/ …', ['spouse.ngayCap', 'applicant.ngayCap'], partner('ngayCap'), { format: 'date' }),
    derived('vo_chong_noi_cap', 'Nơi cấp (vợ/chồng)', '…………………….', ['spouse.noiCap', 'applicant.noiCap'], partner('noiCap'), { before: true }),
    field('so_dang_ky_ket_hon', '7. Đăng ký kết hôn số', '..……………………………………………………', 'applicant.soDangKyKetHon', { before: true }),
    derived('doi_tuong_text', '8. Là đối tượng', '………………………………………………………………….', ['application.doiTuong'], doiTuongText, { before: true }),
    // Chú thích 9: tỉnh/thành phố nơi có dự án (chưa có trong mô hình dữ liệu).
    field('tinh_du_an', '9. Tỉnh/thành phố nơi có dự án', '…………………', 'application.duAn.tinh', { before: true }),
  ],
  checkboxes: [],
};
