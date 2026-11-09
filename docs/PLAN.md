# NOXH Hồ Sơ: SPA tạo bộ hồ sơ đăng ký mua nhà ở xã hội

> Plan lập ngày **09/11/2026**.

## 0. Nguồn tham khảo và mốc cập nhật

**Nguồn chính:** [Mẫu hồ sơ mua nhà ở xã hội 2026 (cập nhật tháng 10/2026)](https://thuvienphapluat.vn/phap-luat-doanh-nghiep/bai-viet/mau-ho-so-mua-nha-o-xa-hoi-2026-cap-nhat-thang-10-2026-19136.html) trên thuvienphapluat.vn. Tác giả: Chuyên viên pháp lý Kiều Diễm. **Đăng/cập nhật lúc 14:45 ngày 14/10/2026.** Đọc bằng Playwright ngày 09/11/2026.

→ `src/data/meta.ts`: `LEGAL_UPDATED_AT = '2026-10-14'`, `SOURCE_URL = <link trên>`.

**Căn cứ pháp lý mà bài viết dẫn:**
- Luật Nhà ở 2023: Điều 76 (đối tượng), được bổ sung bởi điểm a khoản 3 Điều 29 **Luật Dân số 2025**. Điều 78 quy định điều kiện.
- NĐ 100/2024/NĐ-CP: điểm c khoản 1 Điều 38 (hồ sơ), Điều 29, 30 (điều kiện). Các điều này **được sửa bởi NĐ 136/2026/NĐ-CP, áp dụng từ 07/04/2026**. Mẫu đơn mới là **Mẫu 01 Phụ lục NĐ 136/2026**.
- TT 05/2024/TT-BXD: Điều 6, 7, 8, được sửa bởi TT 32/2025/TT-BXD và **TT 08/2026/TT-BXD (áp dụng từ 15/02/2026)**.
- NQ 201/2025/QH15 cùng Quyết định của từng tỉnh: trường hợp đã có nhà nhưng ở xa nơi làm việc.

**Link tải mẫu trong bài là nút JavaScript**, không có URL file trực tiếp. Vì vậy file gốc sẽ lấy từ phụ lục văn bản trên vbpl.vn hoặc datafiles.chinhphu.vn (task P0-2).

## 1. Mục tiêu

- Người dùng chọn **nhóm đối tượng** (Điều 76 Luật Nhà ở 2023) và **điều kiện nhà ở**. Hệ thống trả về **danh sách giấy tờ cần chuẩn bị**: biểu mẫu thì cho tải, giấy tờ khác thì đưa vào checklist (bản sao CCCD, giấy đăng ký kết hôn...).
- Người dùng nhập thông tin cơ bản **một lần**. Thông tin được điền vào mọi biểu mẫu liên quan.
- **Quy tắc điền:**
  - Trường người dùng **để trống** thì **giữ nguyên dãy chấm `......` gốc** của mẫu (đúng độ dài) để in ra điền tay.
  - **Không bao giờ** điền phần **chữ ký**, **xác nhận của cơ quan/UBND xã**, **ngày tháng ký**, **đóng dấu**.
- Xuất **.docx** (giữ nguyên định dạng mẫu nhà nước). Có thể xuất thêm **PDF** để in ngay.
- **Không có backend.** Dữ liệu cá nhân (CCCD, thu nhập) chỉ nằm trong trình duyệt.

## 2. Tech stack

| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Framework | Vite + React + TypeScript | SPA tĩnh, build nhanh |
| UI | Tailwind + shadcn/ui | Form nhiều bước, nhẹ |
| Form | react-hook-form + zod | Validate CCCD 12 số, ngày tháng... |
| Fill DOCX | **docxtemplater + pizzip** | Điền placeholder `{ho_ten}` vào .docx gốc, giữ format |
| Xuất PDF (phase 2) | docx-preview, render HTML rồi `window.print()` | Tránh phải convert server-side |
| Gom file | jszip + file-saver | Tải nguyên bộ dạng .zip |
| Lưu nháp | localStorage (tuỳ chọn, mặc định tắt) + nút "Xoá dữ liệu" | Quyền riêng tư |
| Test | Vitest + Playwright | Kiểm tra unit cho rules, e2e cho việc sinh file |
| Deploy | Cloudflare Pages / GitHub Pages | Hosting tĩnh |

## 3. Cơ chế "để trống thì giữ dấu chấm" (lõi kỹ thuật)

1. Chuyển mẫu gốc `.doc` sang `.docx` (LibreOffice: `soffice --headless --convert-to docx`).
2. Sửa tay từng template: thay **từng dãy chấm cần điền** bằng tag `{field_key}`. Dãy chấm gốc **lưu lại trong manifest**:
   ```ts
   // src/templates/manifest/don-dang-ky.ts
   { key: 'ho_ten', placeholder: '.......................................' }
   ```
3. Dùng `nullGetter` của docxtemplater: khi giá trị rỗng hoặc undefined thì trả về đúng chuỗi `placeholder` gốc. Như vậy file sinh ra **giống hệt mẫu trắng** ở những chỗ chưa nhập.
4. Phần ký tên, xác nhận và ngày ký **không gắn tag**, nên mẫu giữ nguyên.
5. Ô checkbox (☐ "Mua / Thuê mua", "Đã kết hôn / Độc thân"...): dùng tag điều kiện `{#is_mua}☒{/is_mua}{^is_mua}☐{/is_mua}`. Nếu chưa chọn thì giữ ☐.
6. Script `scripts/verify-templates.ts` kiểm tra:
   - Render mỗi template với data rỗng, rồi so text với mẫu gốc. Kết quả phải **giống 100%**.
   - Mọi tag trong .docx đều có trong manifest, và ngược lại.

## 4. Mô hình dữ liệu

```ts
// Hồ sơ người dùng (nhập 1 lần, dùng cho mọi mẫu)
Applicant {
  hoTen, ngaySinh, gioiTinh,
  soDinhDanh /*CCCD*/, ngayCap, noiCap,
  noiThuongTru, noiTamTru, diaChiLienHe, soDienThoai,
  ngheNghiep, coQuanCongTac, diaChiCoQuan,
  thuNhapBinhQuanThang,
  tinhTrangHonNhan: 'doc_than' | 'da_ket_hon' | ...
  voChong?: { hoTen, ngaySinh, soDinhDanh, ngayCap, noiCap, ngheNghiep, coQuanCongTac, thuNhap }
  thanhVienHo?: { hoTen, quanHe, soDinhDanh }[]
}
Application {
  doiTuong: 'k1' | ... | 'k11' | 'k13', // Điều 76 (bỏ k12 = doanh nghiệp)
  coHopDongLaoDong?: boolean,       // tách nhánh khoản 5
  dieuKienNhaO: 'chua_co_nha' | 'duoi_15m2' | 'xa_noi_lam_viec',
  hinhThuc: 'mua' | 'thue_mua',
  duAn?: { ten, chuDauTu, diaChi }
}
```

## 5. Rules engine: nhóm đối tượng → giấy tờ (theo bài ngày 14/10/2026)

Đặt trong `src/data/rules.ts` dạng data thuần (không hard-code trong UI). Mỗi rule có `legalRef` để hiện trích dẫn.

**Mọi nhóm đều cần:** Đơn đăng ký theo **Mẫu 01 PL NĐ 136/2026** · giấy tờ nhà ở (bảng thứ hai) · bản sao CCCD và giấy tờ hôn nhân (đưa vào checklist).

| Nhóm (Đ.76 LNO 2023) | Chứng minh đối tượng | Chứng minh thu nhập | Ai xác nhận |
|---|---|---|---|
| K1 người có công, thân nhân liệt sĩ | Bản sao chứng thực giấy tờ người có công / GCN thân nhân liệt sĩ (checklist) | Không | |
| K2, K3, K4 hộ nghèo/cận nghèo | Bản sao chứng thực GCN hộ nghèo/cận nghèo (checklist) | Như cột trước (cùng giấy) | |
| K5 có HĐLĐ hoặc lương hưu, K6, K8 | **Mẫu 01a PL I TT 32/2025** | **Mẫu 01a PL TT 32/2025** (cùng một mẫu) | Cơ quan/DN nơi làm việc. Người đã nghỉ hưu thì cơ quan BHXH chi trả lương hưu hoặc UBND xã nơi thường trú/tạm trú/nơi ở |
| K5 không có HĐLĐ, không có lương hưu | **Mẫu 05 PL TT 08/2026** | **Mẫu 05 PL TT 08/2026** (cùng một mẫu) | (Theo nội dung mẫu, thường là UBND xã. Cần kiểm tra trong file gốc) |
| K7 lực lượng vũ trang, cơ yếu | Cơ quan/đơn vị xác nhận. *Bài không nêu mẫu đối tượng riêng, cần kiểm tra trong Mẫu 04* | **Mẫu 04 PL TT 32/2025** | Cơ quan/đơn vị công tác |
| K9 đã trả lại nhà công vụ, K10 bị thu hồi đất, K11 HSSV | **Mẫu 01 PL TT 08/2026** | Không | K9: cơ quan quản lý nhà công vụ. K11: trường đang học. K10: *chưa nêu, kiểm tra trong mẫu* |
| K12 doanh nghiệp/HTX trong KCN | **Loại khỏi app** (pháp nhân, không phải cá nhân đăng ký mua) | | |
| K13 người có từ 02 con đẻ trở lên (**từ 01/07/2026**, theo Luật Dân số 2025) | **Bài chưa nêu mẫu.** Cần tra NĐ 136/2026 / TT 08/2026. Trước mắt hiện "chưa có hướng dẫn mẫu" | ? | ? |

| Điều kiện nhà ở | Mẫu |
|---|---|
| Chưa có nhà ở | **Mẫu 02 PL TT 08/2026** |
| Có nhà ở nhưng diện tích bình quân dưới 15 m² sàn/người | **Mẫu 03 PL I TT 05/2024** |
| Có nhà ở nhưng ở xa nơi làm việc (NQ 201/2025/QH15) | Theo Quyết định của từng tỉnh, làm sau MVP |
| **Đã kết hôn** | Vợ/chồng **cũng phải khai Mẫu 02** (nhà ở) và mẫu thu nhập (01a / 04 / 05) |

**Ngưỡng thu nhập** (Đ.30 NĐ 100/2024, sửa bởi NĐ 136/2026), dùng để cảnh báo mềm trên UI, không chặn người dùng:
- Độc thân: không quá 25 triệu/tháng.
- Độc thân nuôi con dưới tuổi thành niên: không quá 35 triệu/tháng.
- Vợ chồng: tổng không quá 50 triệu/tháng.

Diện tích bình quân tính theo người đứng đơn, vợ/chồng, cha mẹ và con có thường trú tại căn nhà đó.

Rule được viết dạng hàm `resolveDocuments(application) => DocItem[]`. Mỗi `DocItem` có `{ id, title, legalRef, kind: 'template' | 'checklist', perPerson: 'applicant' | 'spouse' | 'both', certifiedBy }`.

## 6. Luồng UI

1. **Trang chủ**: giới thiệu, banner *"Căn cứ pháp lý cập nhật đến: dd/mm/yyyy"* và link nguồn, disclaimer "không thay thế tư vấn pháp lý".
2. **Bước 1, Bạn thuộc nhóm nào?**: wizard có câu hỏi gợi ý (có HĐLĐ không? đang ở lực lượng vũ trang? đã kết hôn?...) để chọn khoản 1–11 hoặc 13.
3. **Bước 2, Điều kiện nhà ở và hình thức** (mua / thuê mua, dự án).
4. **Bước 3, Thông tin cá nhân**: chỉ hiện các trường mà bộ mẫu đã chọn cần dùng. Mọi trường đều **optional**, kèm ghi chú "để trống để tự điền tay".
5. **Bước 4, Kết quả**:
   - Checklist giấy tờ (in được).
   - Danh sách biểu mẫu, mỗi mẫu có nút **Xem trước** (docx-preview) và **Tải .docx**.
   - Nút **Tải tất cả (.zip)**.
   - Ghi chú ai ký và ai xác nhận từng mẫu (VD "UBND cấp xã nơi thường trú xác nhận").
6. **Xoá dữ liệu** luôn hiện ở header.

## 7. Cấu trúc thư mục

```
noxh-ho-so/
├─ docs/PLAN.md, docs/legal-sources.md   # ghi nguồn, ngày cập nhật, link văn bản gốc
├─ templates-src/                         # file .doc/.docx gốc tải về (không sửa)
├─ public/templates/*.docx                # template đã gắn tag
├─ src/
│  ├─ data/meta.ts        # LEGAL_UPDATED_AT, SOURCE_URL
│  ├─ data/rules.ts       # nhóm đối tượng -> giấy tờ
│  ├─ templates/manifest/ # mapping field -> placeholder gốc cho từng mẫu
│  ├─ lib/fill-docx.ts    # docxtemplater + nullGetter
│  ├─ lib/zip.ts
│  ├─ features/wizard/…   # các bước
│  └─ features/result/…
├─ scripts/verify-templates.ts
└─ tests/
```

## 8. Lộ trình

| Phase | Việc | Đầu ra |
|---|---|---|
| **P0, Pháp lý (quan trọng nhất)** | ✅ Đã có ngày cập nhật (14/10/2026) và bảng rules · tải phụ lục gốc: Mẫu 01 NĐ 136/2026, Mẫu 01/02/05 TT 08/2026, Mẫu 01a/04 TT 32/2025, Mẫu 03 TT 05/2024 · làm rõ mẫu cho K7, K10, K13 · viết `docs/legal-sources.md` | Bảng rules đã xác minh và bộ file gốc |
| **P1, Scaffold** | Vite + React + TS + Tailwind, routing, layout, meta banner | App chạy được |
| **P2, Template pipeline** | Convert .doc sang .docx, gắn tag, viết manifest, `fill-docx.ts` với nullGetter, script verify (render rỗng phải trùng mẫu gốc) | Đơn đăng ký Mẫu 01 fill đúng |
| **P3, Rules + Wizard** | `rules.ts`, unit test mọi nhánh khoản 1–11 và 13, wizard 4 bước, form zod | Chọn nhóm ra đúng danh sách |
| **P4, Các mẫu còn lại** | Gắn tag cho 01a, 01, 02, 03, 04, 05 · nhân bản mẫu thu nhập cho vợ/chồng | Bộ hồ sơ đầy đủ |
| **P5, Output** | Preview, tải từng file, zip, checklist in được, tuỳ chọn PDF | Hoàn thiện MVP |
| **P6, QA và Deploy** | Playwright e2e, in thử trên giấy A4 (font Times New Roman 13–14), deploy static, analytics không thu PII | Public |
| **Sau MVP** | Bộ chọn tỉnh/thành có mẫu đặc thù (VD Hà Nội dùng giấy xác nhận khoảng cách) · cảnh báo khi luật thay đổi · tra cứu điều kiện thu nhập theo NĐ 136/2026 | |

## 9. Rủi ro và lưu ý

- **Pháp lý thay đổi nhanh** (3 lần sửa mẫu trong 12 tháng). Mọi mẫu phải có `legalRef` và `effectiveFrom`. Banner ngày cập nhật lấy từ `meta.ts`. Thêm checklist định kỳ để soát văn bản mới.
- **Bản quyền nguồn:** biểu mẫu là phụ lục văn bản QPPL nên dùng được. Nên tải từ **văn bản gốc** (chinhphu.vn / vbpl.vn) thay vì file của trang thứ ba.
- **Định dạng .doc cũ** có thể vỡ khi convert. Cần soát lại bằng mắt, và chạy script verify so text.
- **Quyền riêng tư:** không gửi dữ liệu đi đâu, không lưu mặc định. Ghi rõ điều này trên UI.
- Một số địa phương hoặc chủ đầu tư yêu cầu thêm giấy tờ, nên có disclaimer và mục "giấy tờ khác theo yêu cầu chủ đầu tư".

## 10. Trạng thái (09/11/2026)

| Phase | Trạng thái |
|---|---|
| P0 Pháp lý | ✅ `docs/legal-sources.md` (soát xét 09/11/2026, nguồn bài 14/10/2026), `docs/forms/*.md`, PDF gốc trong `templates-src/` |
| P1 Scaffold | ✅ Vite 8 + React 19 + TS 6 + Tailwind 4, hash router |
| P2 Template pipeline | ✅ `fill-docx.ts` (để trống → dãy chấm gốc), `verify-templates` 7/7 |
| P3 Rules + Wizard | ✅ `rules.ts` đã đối chiếu văn bản gốc; Điều 77 (K11 chỉ thuê, K2/K3 phụ thuộc UBND tỉnh); wizard 4 bước |
| P4 Các mẫu | ✅ nd136-01, tt08-01, tt08-02, tt08-05, tt32-01a, tt32-04, tt05-03, đều A4, khớp 100% chữ với văn bản chính thức (`tests/fixtures/official/`) |
| P5 Output | ✅ Tải từng .docx, tải .zip, in checklist |
| P6 QA và Deploy | ⏳ Đã chạy e2e bằng trình duyệt headless và render qua docx-preview. **Còn lại:** mở thử bằng Word/LibreOffice thật, deploy |

**Còn mở:**
- K13: chưa có mẫu.
- K7 thuộc CAND: TT 89/2026/TT-BCA chưa xác minh từ nguồn chính thức.
- K10: cơ quan xác nhận mâu thuẫn giữa nghị định và chú thích mẫu.
- Mẫu "ở xa nơi làm việc" theo từng tỉnh (sau MVP).
- Dự thảo sửa Luật Nhà ở đang trình Quốc hội.
