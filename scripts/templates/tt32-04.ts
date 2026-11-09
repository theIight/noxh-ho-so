/**
 * Sinh public/templates/tt32-04.docx: Mẫu số 04 Phụ lục I TT 32/2025/TT-BXD, bản HIỆN HÀNH
 * (đã bỏ cụm "(photo Bảng tiền công/tiền lương...)" theo khoản 3 Điều 1 TT 08/2026/TT-BXD).
 *
 *   npx tsx scripts/templates/tt32-04.ts
 *
 * Nguồn: VBHN 17/VBHN-BXD (templates-src/vbhn-17-2026/BXD_17-VBHN-BXD_24032026_Phuluc.pdf, trang 11),
 * đối chiếu TT 32/2025 (32-bxd.pdf, trang 9). Xem docs/forms/tt32-mau-04.md.
 * Tag `{{key}}` khớp src/templates/manifest/tt32-04.ts. Không gắn tag ngày ký, chữ ký, khối xác nhận.
 */
import { b, column, fn, i, motto, noteL, p, tag, writeDocx, type Footnotes } from './gen-common.ts';

/** Bề rộng khối ký (phải) và khối xác nhận (trái), theo vị trí trên PDF gốc. */
const SIGN_W = 4600;
const CERT_W = 6400;

const children = [
  p(
    b(
      'Mẫu số 04. Giấy tờ chứng minh điều kiện về thu nhập để được mua, thuê mua nhà ở xã hội (áp dụng cho đối tượng quy định tại khoản 7 Điều 76 của Luật Nhà ở)',
    ),
    { after: 480 },
  ),
  ...motto({ text: '-----------------', bold: true }),
  p(b('GIẤY XÁC NHẬN ĐIỀU KIỆN VỀ THU NHẬP'), { align: 'center', after: 480 }),
  p(['1. Kính gửi', fn(1), ':', tag('kinh_gui')]),
  p(['2. Họ và tên:', tag('ho_ten')]),
  p(['3. Căn cước công dân số', tag('so_dinh_danh'), ' cấp ngày', tag('ngay_cap'), ' tại', tag('noi_cap')]),
  p(['4. Nơi ở hiện tại', fn(2), ':', tag('noi_o_hien_tai')]),
  p(['5. Đăng ký thường trú (đăng ký tạm trú) tại:  ', tag('noi_thuong_tru')]),
  p(['6. Là đối tượng', fn(3), ':  ', tag('doi_tuong_text')]),
  p(['7. Tôi có thu nhập bình quân hàng tháng thực nhận tính theo Bảng tiền công/tiền lương là', tag('thu_nhap'), ' đồng/tháng.']),
  p(
    'Tôi xin cam đoan những lời khai trên là đúng sự thực và hoàn toàn chịu trách nhiệm trước pháp luật về các nội dung đã kê khai./.',
  ),
  // Khối ký (phải) và khối xác nhận của cơ quan, đơn vị (trái, bên dưới). Không gắn tag.
  ...column('right', SIGN_W, [
    [i('........., ngày ....... tháng ...... năm ......'), { align: 'center', after: 0, before: 240, keepNext: true }],
    [b('Người kê khai'), { align: 'center', after: 0, keepNext: true }],
    [i('(Ký và ghi rõ họ tên)'), { align: 'center', after: 0 }],
  ]),
  ...column('left', CERT_W, [
    [b('Xác nhận của cơ quan, đơn vị, doanh nghiệp'), { align: 'center', before: 720, keepNext: true }],
    ['Ông/Bà………………………………………......……,', { align: 'left', keepNext: true }],
    ['có tổng thu nhập bình quân hàng tháng thực nhận theo Bảng tiền công/tiền lương là…….…....... đồng/tháng.', { keepNext: true }],
    [i('(Ký tên, đóng dấu)'), { align: 'center' }],
  ]),
];

const footnotes: Footnotes = {
  1: [noteL('Cơ quan, đơn vị, doanh nghiệp nơi người kê khai đang làm việc.')],
  2: [
    noteL(
      'Là nơi thường trú hoặc nơi tạm trú; trường hợp không có nơi thường trú, nơi tạm trú thì nơi ở hiện tại là nơi người kê khai đang thực tế sinh sống.',
    ),
  ],
  3: [
    noteL(
      'Ghi rõ người kê khai là đối tượng: Sĩ quan, quân nhân chuyên nghiệp, hạ sĩ quan thuộc lực lượng vũ trang nhân dân, công nhân công an, công chức, công nhân và viên chức quốc phòng đang phục vụ tại ngũ; người làm công tác cơ yếu, người làm công tác khác trong tổ chức cơ yếu hưởng lương từ ngân sách nhà nước đang công tác.',
    ),
  ],
};

const out = await writeDocx('tt32-04', 'Mẫu số 04. Giấy xác nhận điều kiện về thu nhập', children, footnotes);
console.log(`Đã ghi ${out}`);
