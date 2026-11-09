/**
 * Sinh public/templates/nd136-01.docx: Mẫu số 01 Phụ lục NĐ 136/2026/NĐ-CP
 * (Đơn đăng ký mua, thuê mua, thuê nhà ở xã hội).
 *
 *   npx tsx scripts/templates/nd136-01.ts
 *
 * Nguồn: lời văn theo bản ký số templates-src/nd136-2026/136-ndcp.signed.pdf (trang 4–6, bản scan),
 * dãy chấm theo VBHN 24/VBHN-BXD (bản text). Xem docs/forms/nd136-mau-01.md, docs/legal-sources.md §4 mục 5–6.
 * Tag `{{key}}` khớp src/templates/manifest/nd136-01.ts. Không gắn tag ngày ký và chữ ký.
 */
import { CM, b, choice, column, fn, i, motto, note, p, t, tag, writeDocx, type Footnotes } from './gen-common.ts';

const IND = { firstLine: CM };
const body = (segs: Parameters<typeof p>[0]) => p(segs, IND);
/** Câu kết thúc chung của 8.2 (giữ nguyên "sỹ quan"/"sĩ quan" như bản gốc). */
const DAI_TA = '(gồm lương cơ bản và phụ cấp theo quy định, bao gồm cả phụ cấp khu vực tại các địa bàn vùng sâu, vùng xa, biên giới, hải đảo có điều kiện khó khăn)';

const children = [
  p(b('Mẫu số 01. Đơn đăng ký mua, thuê mua, thuê nhà ở xã hội'), { align: 'center', after: 240 }),
  ...motto({ text: '_______________________________________', size: 18 }),
  p(b('ĐƠN ĐĂNG KÝ MUA, THUÊ MUA, THUÊ NHÀ Ở XÃ HỘI'), { align: 'center', before: 240, after: 360 }),
  p(['Hình thức đăng ký', fn(1), ':   Mua ', tag('cb_mua'), '          Thuê mua ', tag('cb_thue_mua'), '          Thuê ', tag('cb_thue')], {
    align: 'left',
    firstLine: 2 * CM,
  }),
  body(['1. Kính gửi', fn(2), ': ', tag('kinh_gui')]),
  body(['2. Họ và tên người viết đơn:  ', tag('ho_ten')]),
  body(['3. Căn cước công dân số ', tag('so_dinh_danh'), ' cấp ngày ', tag('ngay_cap'), '  tại', tag('noi_cap')]),
  body(['4. Nghề nghiệp', fn(3), tag('nghe_nghiep')]),
  body(['5. Nơi làm việc', fn(4), ': ', tag('noi_lam_viec')]),
  body(['6. Thuộc đối tượng', fn(5), ': ', tag('doi_tuong_text')]),
  body('7. Thực trạng về nhà ở của tôi như sau:'),
  choice([body('7.1. Chưa có nhà ở thuộc sở hữu của mình')], tag('cb_chua_co_nha')),
  choice(
    [body(['7.2. Có nhà ở nhưng diện tích nhà ở bình quân đầu người thấp hơn 15 m', t('2', { sup: true }), ' sàn/người', fn(6)])],
    tag('cb_duoi_15m2'),
  ),
  body('8. Tôi có mức thu nhập hàng tháng là:'),
  body([
    '8.1. Đối với đối tượng quy định tại khoản 5, khoản 6 và khoản 8 Điều 76 của Luật Nhà ở số 27/2023/QH15 ngày 27 tháng 11 năm 2023',
    fn(7),
    ' thì đánh dấu vào một trong hai ô dưới đây:',
  ]),
  choice(
    [
      body([
        '- Trường hợp người đứng đơn là người chưa kết hôn hoặc được xác nhận là độc thân thì có thu nhập bình quân hàng tháng thực nhận không quá 25 triệu đồng tính theo Bảng tiền công, tiền lương do cơ quan, đơn vị, doanh nghiệp nơi đối tượng làm việc xác nhận',
        fn(8),
        '.',
      ]),
    ],
    tag('cb_tn_doc_than'),
  ),
  choice(
    [
      body([
        '- Trường hợp đối tượng là người chưa kết hôn hoặc được xác nhận là độc thân đang nuôi con dưới tuổi thành niên thì thu nhập bình quân hàng tháng thực nhận không quá 35 triệu đồng tính theo Bảng tiền công, tiền lương do cơ quan, đơn vị, doanh nghiệp nơi đối tượng làm việc xác nhận',
        fn(9),
        '.',
      ]),
    ],
    tag('cb_tn_nuoi_con'),
  ),
  choice(
    [
      body([
        '- Trường hợp người đứng đơn đã kết hôn theo quy định của pháp luật thì người đứng đơn và vợ (chồng) của người đó có tổng thu nhập bình quân hàng tháng thực nhận không quá 50 triệu đồng tính theo Bảng tiền công, tiền lương do cơ quan, đơn vị, doanh nghiệp nơi đối tượng làm việc xác nhận',
        fn(10),
        '.',
      ]),
    ],
    tag('cb_tn_ket_hon'),
  ),
  body(['8.2. Đối với đối tượng quy định tại khoản 7 Điều 76 của Luật Nhà ở', fn(11), ' thì đánh dấu vào một trong hai ô dưới đây:']),
  choice(
    [
      body(
        `- Trường hợp là người độc thân thì có thu nhập hàng tháng thực nhận không quá tổng thu nhập của sỹ quan có cấp bậc hàm Đại tá ${DAI_TA} được cơ quan, đơn vị nơi công tác, quản lý xác nhận.`,
      ),
    ],
    tag('cb_llvt_doc_than'),
  ),
  body('- Trường hợp đã kết hôn theo quy định của pháp luật:'),
  choice(
    [
      body(
        `+ Tôi và vợ (chồng) tôi đều thuộc đối tượng quy định tại khoản 7 Điều 76 của Luật Nhà ở thì có tổng thu nhập hàng tháng thực nhận không quá 2,0 lần tổng thu nhập của sĩ quan có cấp bậc hàm Đại tá ${DAI_TA} được cơ quan, đơn vị nơi công tác, quản lý xác nhận.`,
      ),
    ],
    tag('cb_llvt_ca_hai'),
  ),
  choice(
    [
      body(
        `+ Vợ (chồng) tôi không thuộc đối tượng quy định tại khoản 7 Điều 76 của Luật Nhà ở thì có tổng thu nhập hàng tháng thực nhận không quá tổng thu nhập của sỹ quan có cấp bậc hàm Đại tá ${DAI_TA} cộng với mức lương (thu nhập bình quân hàng tháng thực nhận) không quá 25 triệu đồng được cơ quan, đơn vị, doanh nghiệp nơi đối tượng làm việc xác nhận.`,
      ),
    ],
    tag('cb_llvt_vo_chong_khac'),
  ),
  body(
    '9. Tôi chưa được mua hoặc thuê mua nhà ở xã hội, chưa được hưởng chính sách hỗ trợ nhà ở dưới mọi hình thức tại tỉnh, thành phố trực thuộc trung ương nơi có dự án đầu tư xây dựng nhà ở xã hội.',
  ),
  body([
    'Tôi xin cam đoan những lời khai trong đơn là đúng sự thực và hoàn toàn chịu trách nhiệm trước pháp luật về các nội dung đã kê khai. Khi được giải quyết',
    fn(12),
    tag('hinh_thuc_giai_quyet'),
    ' nhà ở xã hội, tôi cam kết chấp hành đầy đủ các quy định của Nhà nước về quản lý, sử dụng nhà ở xã hội.',
  ]),
  // Khối ký: một cột bên phải. Không gắn tag (ngày ký, chữ ký).
  ...column('right', 5200, [
    [i('........., ngày ........ tháng ....... năm .......'), { align: 'center', after: 0, before: 240, keepNext: true }],
    [b('Người viết đơn'), { align: 'center', after: 0, keepNext: true }],
    [i('(Ký và ghi rõ họ tên)'), { align: 'center', after: 0 }],
  ]),
];

const NOTE_LLVT =
  'người làm công tác cơ yếu, người làm công tác khác trong tổ chức cơ yếu hưởng lương từ ngân sách nhà nước đang công tác';
const NOTE_KHONG_HDLD = 'Trường hợp đối tượng là người thu nhập thấp khu vực đô thị không có hợp đồng lao động, nếu ';

const footnotes: Footnotes = {
  1: [note('Đánh dấu vào ô mà người viết đơn có nhu cầu đăng ký.')],
  2: [note('Ghi tên chủ đầu tư xây dựng nhà ở xã hội.')],
  3: [note('Nếu đang làm việc tại cơ quan, tổ chức thì ghi rõ nghề nghiệp, nếu là lao động tự do thì ghi là lao động tự do, nếu đã nghỉ hưu thì ghi đã nghỉ hưu...')],
  4: [
    note(
      `Nếu đang làm việc thì mới ghi vào mục này, trừ đối tượng là sĩ quan, quân nhân chuyên nghiệp, hạ sĩ quan thuộc lực lượng vũ trang nhân dân, công nhân công an, công chức, công nhân và viên chức quốc phòng đang phục vụ tại ngũ; ${NOTE_LLVT}.`,
    ),
  ],
  5: [note('Ghi rõ người có đơn thuộc đối tượng theo quy định được hỗ trợ nhà ở xã hội.')],
  6: [
    note('Đối với trường hợp độc thân: diện tích nhà ở bình quân đầu người đối với người đó.'),
    note(
      'Đối với trường hợp hộ gia đình: diện tích nhà ở bình quân đầu người đối với người đề nghị xác nhận, vợ/chồng người đề nghị xác nhận (nếu có), cha, mẹ của người đề nghị xác nhận bao gồm cả cha, mẹ vợ/chồng của người đó (nếu có) và các con của người đề nghị xác nhận (nếu có).',
    ),
  ],
  7: [
    note(
      'Người thu nhập thấp tại khu vực đô thị (khoản 5 Điều 76); công nhân, người lao động đang làm việc tại doanh nghiệp, hợp tác xã, liên hiệp hợp tác xã trong và ngoài khu công nghiệp (khoản 6 Điều 76); cán bộ, công chức, viên chức theo quy định của pháp luật về cán bộ, công chức, viên chức (khoản 8 Điều 76).',
    ),
  ],
  8: [
    note(
      `${NOTE_KHONG_HDLD}là người chưa kết hôn hoặc được xác nhận là độc thân thì có thu nhập bình quân hàng tháng thực nhận không quá 25 triệu đồng. Cơ quan Công an cấp xã nơi thường trú/tạm trú hoặc nơi ở tại thời điểm đối tượng đề nghị xác nhận xác nhận điều kiện về thu nhập.`,
    ),
  ],
  9: [
    note(
      `${NOTE_KHONG_HDLD}là người chưa kết hôn hoặc được xác nhận là độc thân đang nuôi con dưới tuổi thành niên thì thu nhập bình quân hàng tháng thực nhận không quá 35 triệu đồng. Cơ quan Công an cấp xã nơi thường trú/tạm trú hoặc nơi ở tại thời điểm đối tượng đề nghị xác nhận xác nhận điều kiện về thu nhập.`,
    ),
  ],
  10: [
    note(
      `${NOTE_KHONG_HDLD}đã kết hôn theo quy định của pháp luật thì tổng thu nhập bình quân hàng tháng thực nhận không quá 50 triệu đồng. Công an cấp xã nơi thường trú/tạm trú hoặc nơi ở tại thời điểm đối tượng đề nghị xác nhận xác nhận điều kiện về thu nhập.`,
    ),
  ],
  11: [
    note(
      `Sỹ quan, quân nhân chuyên nghiệp, hạ sỹ quan thuộc lực lượng vũ trang nhân dân, công nhân công an, công chức, công nhân và viên chức quốc phòng đang phục vụ tại ngũ; ${NOTE_LLVT} (khoản 7 Điều 76).`,
    ),
  ],
  12: [note('Ghi rõ hình thức được giải quyết chính sách hỗ trợ về nhà ở xã hội (mua, thuê mua, thuê).')],
};

const out = await writeDocx('nd136-01', 'Mẫu số 01. Đơn đăng ký mua, thuê mua, thuê nhà ở xã hội', children, footnotes);
console.log(`Đã ghi ${out}`);
