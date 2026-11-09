/**
 * Sinh public/templates/tt08-02.docx: Mẫu số 02 Phụ lục TT 08/2026/TT-BXD
 * (Giấy xác nhận về điều kiện nhà ở, trường hợp chưa có nhà ở thuộc sở hữu).
 *
 *   npx tsx scripts/templates/tt08-02.ts
 *
 * Nguồn: templates-src/tt08-2026/08-bxd-kem.pdf (trang 3–4, PDF text chính thức), đối chiếu VBHN 17.
 * KHÔNG dùng templates-src/tt08-2026/mau-02.docx (bản gõ lại, dãy chấm sai). Xem docs/forms/tt08-mau-02.md.
 * Tag `{{key}}` khớp src/templates/manifest/tt08-02.ts. Không gắn tag ngày ký, chữ ký, khối xác nhận.
 */
import { b, column, fn, i, motto, noteL, p, tag, writeDocx, type Footnotes } from './gen-common.ts';

/** Bề rộng khối ký (phải) và khối xác nhận (trái), theo vị trí trên PDF gốc. */
const SIGN_W = 4600;
const CERT_W = 5600;

const children = [
  p(
    [
      b(
        'Mẫu số 02. Giấy tờ chứng minh điều kiện về nhà ở để được mua, thuê mua nhà ở xã hội/nhà ở cho lực lượng vũ trang nhân dân ',
      ),
      i(
        '(trường hợp chưa có nhà ở thuộc sở hữu của mình, hoặc không có tên hoặc không có nội dung thông tin về nhà ở trong Giấy chứng nhận quyền sử dụng đất, quyền sở hữu tài sản gắn liền với đất)',
      ),
    ],
    { after: 480 },
  ),
  ...motto({ text: '-----------------', bold: true }),
  p(b('GIẤY XÁC NHẬN VỀ ĐIỀU KIỆN NHÀ Ở'), { align: 'center', after: 480 }),
  p(['1. Kính gửi', fn(1), ': ', tag('kinh_gui')]),
  p(['2. Họ và tên:', tag('ho_ten')]),
  p(['3. Căn cước công dân số:', tag('so_dinh_danh'), ' cấp ngày ', tag('ngay_cap'), ' tại', tag('noi_cap')]),
  p(['4. Nơi ở hiện tại', fn(2), ':', tag('noi_o_hien_tai')]),
  p(['5. Đăng ký thường trú (đăng ký tạm trú) tại: ', tag('noi_thuong_tru')]),
  p(['6. Họ và tên vợ/chồng (nếu có): ', tag('vo_chong_ho_ten')]),
  p([
    'Căn cước công dân số',
    tag('vo_chong_so_dinh_danh'),
    'cấp ngày ',
    tag('vo_chong_ngay_cap'),
    ' tại',
    tag('vo_chong_noi_cap'),
  ]),
  p(['7. Đăng ký kết hôn số (nếu có)', tag('so_dang_ky_ket_hon')], { align: 'left' }),
  p(['8. Là đối tượng', fn(3), ':', tag('doi_tuong_text')]),
  p([
    '9. Tôi và vợ/chồng tôi (nếu có) không có nhà ở thuộc sở hữu của mình, hoặc không có tên hoặc không có nội dung thông tin về nhà ở trong Giấy chứng nhận quyền sử dụng đất, quyền sở hữu tài sản gắn liền với đất (sau đây gọi chung là Giấy chứng nhận) tại tỉnh/Thành phố',
    tag('tinh_du_an'),
    ' (nơi có dự án đầu tư xây dựng nhà ở xã hội/nhà ở cho lực lượng vũ trang nhân dân)',
    fn(4),
    '.',
  ]),
  p(
    'Tôi xin cam đoan những lời khai trên là đúng sự thực và hoàn toàn chịu trách nhiệm trước pháp luật về các nội dung đã kê khai./.',
  ),
  // Khối ký (phải) và khối xác nhận của cơ quan cấp Giấy chứng nhận (trái, bên dưới). Không gắn tag.
  ...column('right', SIGN_W, [
    [i('........., ngày ....... tháng ...... năm ......'), { align: 'center', after: 0, before: 240, keepNext: true }],
    [b('Người kê khai Giấy xác nhận về điều kiện nhà ở'), { align: 'center', after: 0, keepNext: true }],
    [i('(Ký và ghi rõ họ tên)'), { align: 'center', after: 0 }],
  ]),
  ...column('left', CERT_W, [
    [
      b('Xác nhận của cơ quan có thẩm quyền cấp Giấy chứng nhận quyền sử dụng đất, quyền sở hữu tài sản gắn liền với đất ……..……..'),
      { align: 'center', before: 1440, after: 0, keepNext: true },
    ],
    ['………………………………………….…...', { align: 'center', keepNext: true }],
    [
      ' Ông/Bà:  ………………………………………. không có nhà ở thuộc sở hữu của mình, hoặc không có tên hoặc không có nội dung thông tin về nhà ở trong Giấy chứng nhận quyền sử dụng đất, quyền sở hữu tài sản gắn liền với đất tại tỉnh/Thành phố……………………………….. (nơi có dự án đầu tư xây dựng nhà ở xã hội/ nhà ở cho lực lượng vũ trang nhân dân).',
      { after: 360, keepNext: true },
    ],
    ['(Ký tên, đóng dấu)', { align: 'center' }],
  ]),
];

const footnotes: Footnotes = {
  1: [
    noteL(
      'Cơ quan có thẩm quyền cấp Giấy chứng nhận quyền sử dụng đất, quyền sở hữu tài sản gắn liền với đất theo quy định của pháp luật về đất đai tại tỉnh, thành phố trực thuộc trung ương nơi có dự án nhà ở xã hội/nhà ở cho lực lượng vũ trang nhân dân xác nhận.',
    ),
  ],
  2: [noteL('Là nơi thường trú hoặc nơi tạm trú của người kê khai đang thường xuyên sinh sống.')],
  3: [
    noteL('Ghi rõ người kê khai là đối tượng:'),
    ...[
      'Người có công với cách mạng, thân nhân liệt sĩ thuộc trường hợp được hỗ trợ cải thiện nhà ở theo quy định của Pháp lệnh Ưu đãi người có công với cách mạng;',
      'Hộ gia đình nghèo, cận nghèo tại khu vực nông thôn;',
      'Hộ gia đình nghèo, cận nghèo tại khu vực nông thôn thuộc vùng thường xuyên bị ảnh hưởng bởi thiên tai, biến đổi khí hậu;',
      'Hộ gia đình nghèo, cận nghèo tại khu vực đô thị;',
      'Người thu nhập thấp tại khu vực đô thị;',
      'Công nhân, người lao động đang làm việc tại doanh nghiệp, hợp tác xã, liên hiệp hợp tác xã trong và ngoài khu công nghiệp;',
      'Sĩ quan, quân nhân chuyên nghiệp, hạ sĩ quan thuộc lực lượng vũ trang nhân dân, công nhân công an, công chức, công nhân và viên chức quốc phòng đang phục vụ tại ngũ; người làm công tác cơ yếu, người làm công tác khác trong tổ chức cơ yếu hưởng lương từ ngân sách nhà nước đang công tác;',
      'Cán bộ, công chức, viên chức theo quy định của pháp luật về cán bộ, công chức, viên chức;',
      'Đối tượng đã trả lại nhà ở công vụ theo quy định tại khoản 4 Điều 125 của Luật Nhà ở, trừ trường hợp bị thu hồi nhà ở công vụ do vi phạm quy định của Luật Nhà ở;',
      'Hộ gia đình, cá nhân thuộc trường hợp bị thu hồi đất và phải giải tỏa, phá dỡ nhà ở theo quy định của pháp luật mà chưa được Nhà nước bồi thường bằng nhà ở, đất ở;',
    ].map((s) => noteL(`- ${s}`)),
  ],
  4: [
    noteL(
      'Ghi rõ tên tỉnh/thành phố trực thuộc Trung ương nơi có dự án đầu tư xây dựng nhà ở xã hội/nhà ở cho lực lượng vũ trang nhân dân.',
    ),
  ],
};

const out = await writeDocx('tt08-02', 'Mẫu số 02. Giấy xác nhận về điều kiện nhà ở', children, footnotes);
console.log(`Đã ghi ${out}`);
