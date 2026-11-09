# Nguồn pháp lý và biểu mẫu: NOXH Hồ Sơ

> Soát xét ngày **09/11/2026**. Văn bản mới nhất đã kiểm tra trên moc.gov.vn: TT 82/2026/TT-BXD ngày 07/11/2026 (không liên quan NOXH). Mọi file tải về nằm trong `templates-src/`. Chi tiết từng mẫu xem `docs/forms/*.md`.
>
> Đề xuất `LEGAL_UPDATED_AT`: giữ `2026-10-14` cho bài nguồn. Có thể thêm `LEGAL_REVIEWED_AT = '2026-11-09'` (ngày soát lại văn bản gốc).

## 1. Danh mục văn bản

| Số hiệu | Ngày ban hành | Hiệu lực | Nội dung liên quan | Nguồn chính thức | File đã tải |
|---|---|---|---|---|---|
| Luật Nhà ở 27/2023/QH15 | 27/11/2023 | 01/8/2024 | Đ.76 (đối tượng), Đ.77, Đ.78 (điều kiện) | — (chưa tải) | — |
| Luật Dân số 2025 | 2025 | **01/7/2026** | Điểm a khoản 3 Điều 29: thêm khoản 13 Đ.76 LNO "người có từ 02 con đẻ trở lên", sửa Đ.77–79 | — (chưa tải, chỉ có tin Báo Chính phủ) | — |
| NĐ 100/2024/NĐ-CP | 26/7/2024 | 01/8/2024 | Đ.29, 30 (điều kiện), Đ.38 (hồ sơ), Đ.67 (LLVT), Phụ lục II (Mẫu 01 đơn) | [VBHN 24/VBHN-BXD](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/5/24-vbhn-bxd.pdf) | `vbhn-24-2026/24-vbhn-bxd.pdf` |
| NĐ 261/2025/NĐ-CP | 10/10/2025 | 10/10/2025 | Sửa NĐ 100. Mẫu 01 cũ (đã bị NĐ 136 thay) | — | — |
| NĐ 54/2026/NĐ-CP | 09/02/2026 | 09/02/2026 | Sửa Đ.29.1 (cơ quan cấp GCN xác nhận nhà ở), Đ.30.2 (Công an xã xác nhận thu nhập K5 không HĐLĐ), Đ.38 (K10 do UBND xã nơi thu hồi đất xác nhận; giấy tờ có giá trị 12 tháng) | [moc.gov.vn vID=612](https://moc.gov.vn/pl/pages/ChiTietVanBan.aspx?vID=612&TypeVB=1) | (nội dung đọc qua VBHN 24) |
| **NĐ 136/2026/NĐ-CP** | 07/4/2026 | **07/4/2026** | Sửa Đ.30.1 (ngưỡng 25/35/50 triệu), Đ.67.1-2 (LLVT), **thay Mẫu 01 Phụ lục II** | [vanban.chinhphu.vn docid=217605](https://vanban.chinhphu.vn/?pageid=27160&docid=217605) → [136-ndcp.signed.pdf](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/4/136-ndcp.signed.pdf) | `nd136-2026/136-ndcp.signed.pdf` (scan, ký số VPCP 09/4/2026) |
| VBHN 24/VBHN-BXD | 18/5/2026 | — | Hợp nhất NĐ 100 + 261 + 54 + 136, kèm Phụ lục (Mẫu 01 bản text) | [datafiles](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/5/24-vbhn-bxd.pdf), [moc Phụ lục](https://moc.gov.vn/Images/FileVanBan/BXD_24-VBHN-BXD_18052026_Phuluc.pdf) | `vbhn-24-2026/*.pdf` |
| TT 05/2024/TT-BXD | 31/7/2024 | 01/8/2024 | Đ.6, 7, 8; Phụ lục I (Mẫu 01–07). **Mẫu 03 còn hiệu lực nguyên bản** | [vanban docid=210819](https://chinhphu.vn/?pageid=27160&docid=210819) → [05-bxd.pdf](https://datafiles.chinhphu.vn/cpp/files/vbpq/2024/8/05-bxd.pdf) | `tt05-2024/05-bxd.pdf` (scan 142 tr, 38 MB) |
| TT 09/2025/TT-BXD | 13/6/2025 | 01/7/2025 | Sửa TT 05 theo chính quyền 2 cấp. Không đổi nội dung Mẫu 03 | — | — |
| TT 32/2025/TT-BXD | 10/11/2025 | 10/11/2025 | Thay Mẫu 01, 04, 05; thêm Mẫu 01a | [vanban docid=215947](https://vanban.chinhphu.vn/?pageid=27160&docid=215947) → [32-bxd.pdf](https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/11/32-bxd.pdf) | `tt32-2025/32-bxd.pdf` |
| **TT 08/2026/TT-BXD** | 15/02/2026 | **15/02/2026** | Thay Mẫu 01, 02, 05. Thêm điểm c2 Đ.6. **Bỏ cụm "(photo Bảng tiền công/tiền lương...)" ở Mẫu 01a và 04.** Giấy cũ dùng tiếp 12 tháng | [vanban docid=216996](https://vanban.chinhphu.vn/?pageid=27160&docid=216996) → [08-bxd.pdf](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/02/08-bxd.pdf), [08-bxd-kem.pdf](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/02/08-bxd-kem.pdf); [moc vID=616](https://moc.gov.vn/pl/pages/ChiTietVanBan.aspx?vID=616&TypeVB=1) | `tt08-2026/08-bxd.pdf`, `08-bxd-kem.pdf` |
| VBHN 17/VBHN-BXD | 24/3/2026 | — | Hợp nhất TT 05 + 09/2025 + 32/2025 + 08/2026, kèm Phụ lục (mọi mẫu hiện hành, bản text) | [moc vID=647](https://moc.gov.vn/pl/pages/ChiTietVanBan.aspx?vID=647&TypeVB=1) | `vbhn-17-2026/*.pdf` |
| QĐ 1346/QĐ-BXD | 03/8/2026 | 03/8/2026 | Công bố TTHC sửa đổi: TTHC 1.115150 "bán, cho thuê mua, cho thuê NOXH theo dự án". Thành phần hồ sơ và danh sách mẫu hiện hành | [moc vID=5036](https://moc.gov.vn/vn/Pages/ChiTietVanBan.aspx?vID=5036&TypeVB=1) | `qd1346-2026/BXD_1346-QD-BXD_03082026.pdf` |
| NQ 66.15/2026/NQ-CP | 13/02/2026 | — | Cơ chế xử lý vướng mắc NOXH (căn cứ của TT 08/2026). Chưa đọc chi tiết | [moc vID=623](https://moc.gov.vn/pl/pages/ChiTietVanBan.aspx?vID=623&TypeVB=1) | — |
| NQ 201/2025/QH15 | 29/5/2025 | — | Có nhà nhưng ở xa nơi làm việc (sau MVP) | — | — |
| TT 94/2024/TT-BQP | 11/11/2024 | 26/12/2024 | Mẫu giấy xác nhận đối tượng K7 thuộc BQP | (link vbpl cũ trả về 404) | `k7-bqp-bca/_thirdparty/PL-94.doc` (bên thứ ba) |
| TT 56/2024/TT-BCA | 05/11/2024 | — | Mẫu NOCA (K7 thuộc CAND). **Có thể đã bị TT 89/2026 thay** | — | `k7-bqp-bca/_thirdparty/Mau-NOCA.doc` (bên thứ ba, bản cũ) |
| TT 89/2026/TT-BCA | 10/6/2026 | 26/7/2026 | Thay TT 56/2024 (theo luatvietnam). Mẫu NOCA mới. **Chưa xác minh từ nguồn chính thức** | — | — |

### Văn bản mới sau 14/10/2026 (đến 09/11/2026)
- **Không tìm thấy** nghị định, thông tư mới về mẫu hồ sơ NOXH. Đã kiểm tra: danh mục văn bản moc.gov.vn vID 600–905 (đến TT 82/2026/TT-BXD ngày 07/11/2026), tìm web các nguồn chinhphu.vn, baochinhphu.vn và báo chí.
- Họp báo Chính phủ 04/11/2026 ([Dân trí](https://dantri.com.vn/bat-dong-san/bo-xay-dung-chi-ra-diem-nghen-trong-tiep-can-nha-o-xa-hoi-20261104135056158.htm)): Bộ Xây dựng chủ trì **dự thảo sửa Luật Nhà ở** trình Quốc hội "tại kỳ họp này". Dự thảo làm rõ nhóm đối tượng, điều kiện nhà ở, thu nhập. **Rủi ro: mẫu có thể đổi tiếp trong 2026–2027.**

## 2. File trong `templates-src/` (file làm việc + mức tin cậy)

| Mẫu | File làm việc đề xuất | Nguồn | Phiên bản đã kiểm tra | Vấn đề còn lại |
|---|---|---|---|---|
| Mẫu 01 NĐ 136 (Đơn) | **chưa có .docx** | — | Bản gốc: `nd136-2026/136-ndcp.signed.pdf` (scan). Bản text chính thức: VBHN 24 Phụ lục, QĐ 1346 | Phải dựng .docx từ text. Khung tham khảo: `nd136-2026/_thirdparty/mau-01-nd261-OUTDATED-...docx` (mẫu NĐ 261, đã hết hiệu lực) |
| Mẫu 01 TT 08 | `tt08-2026/mau-01.docx` | thuviennhadat (bộ Long Vân 03/2026) | Nội dung và dãy chấm khớp `08-bxd-kem.pdf` | Thiếu nội dung chú thích |
| Mẫu 02 TT 08 | `tt08-2026/mau-02.docx` | thuviennhadat (02/2026) | Nội dung chữ khớp | Gõ lại: dãy chấm khác bản gốc, kẻ `___` thay `---` |
| Mẫu 05 TT 08 | `tt08-2026/mau-05.docx` | thuviennhadat (Long Vân) | Nội dung và dãy chấm khớp | Thừa chú thích [1]–[9] của mẫu khác, phải xóa |
| Mẫu 01a TT 32 | `tt32-2025/mau-01a.docx` | thuviennhadat (Long Vân) | **Bản hiện hành** (đã bỏ cụm "photo") khớp VBHN 17 | Thiếu nội dung chú thích |
| Mẫu 04 TT 32 | **chưa có .docx sạch**. Gần nhất: `tt32-2025/_thirdparty/mau-04-nmbn-2026-01.doc` | thuviennhadat (01/2026) | Dãy chấm khớp TT 32 | Còn cụm "photo..." đã bị bãi bỏ. Chú thích là HYPERLINK về thuvienphapluat. Cần LibreOffice để chuyển .doc sang .docx |
| Mẫu 03 TT 05 | `tt05-2024/mau-03.docx` | Cắt từ `_thirdparty/pl1-nd05-thuviennhadat.docx` (Phụ lục I TT 05) | Nội dung và dãy chấm khớp VBHN 17 | footnotes.xml còn chú thích thừa (không hiển thị) |

- **Không có bản .doc/.docx chính thức** cho mẫu nào. datafiles.chinhphu.vn, moc.gov.vn và vbpl.vn chỉ có PDF. Mọi file Word đều từ bên thứ ba và được ghi rõ.
- **LibreOffice không có trên máy** (`which soffice` không trả về gì), nên chưa chuyển .doc sang .docx được. `textutil` của macOS làm hỏng field HYPERLINK.
- An toàn: đã kiểm tra mọi .doc/.docx. Không có `vbaProject`, `oleObject`, `activeX`, chuỗi VBA. Chỉ đọc bằng `python3 -I` và `textutil`, script để ngoài thư mục tải về.
- File rác đã xóa: bản trùng phụ lục TT 08 của moc.gov.vn (giống hệt `08-bxd-kem.pdf`), file .doc tự chuyển bị lỗi, một mẫu riêng của dự án Felix Homes.

## 3. Bảng rules đã đối chiếu văn bản gốc

**Mọi nhóm:** Đơn **Mẫu 01 NĐ 136/2026** (không có xác nhận, nộp chủ đầu tư) + giấy tờ nhà ở + giấy tờ đối tượng/thu nhập. Giấy tờ chứng minh có giá trị **12 tháng** kể từ ngày xác nhận (Đ.38 NĐ 100 sửa bởi NĐ 54/2026; Điều 3 TT 08/2026). Giấy xác nhận thu nhập trước 07/4/2026 dùng tiếp 12 tháng kể từ ngày xác nhận (Điều 2 NĐ 136).

| Nhóm (Đ.76 LNO) | Chứng minh đối tượng | Chứng minh thu nhập | Cơ quan xác nhận | Căn cứ |
|---|---|---|---|---|
| K1 người có công, thân nhân liệt sĩ | Bản sao có chứng thực giấy tờ người có công / GCN thân nhân liệt sĩ (checklist) | Không có điều kiện thu nhập (Đ.30 chỉ áp cho K5, 6, 8) | (giấy do cơ quan có thẩm quyền đã cấp) | Đ.6.1.a TT 05 |
| K2, K3, K4 hộ nghèo, cận nghèo | Bản sao có chứng thực GCN hộ nghèo/cận nghèo (checklist) | Cùng giấy này | (đã cấp) | Đ.6.1.b, Đ.8.3 TT 05; Đ.30.3 NĐ 100 |
| K5 có HĐLĐ, K6, K8 | **Mẫu 01a** (một giấy cho cả đối tượng và thu nhập) | **Mẫu 01a** | Cơ quan, đơn vị, DN nơi làm việc | Đ.6.1.c1, Đ.8.1-2 TT 05 sửa đổi |
| K5/K6/K8 đã nghỉ hưu, hưởng lương hưu BHXH | Mẫu 01a (ghi "người thu nhập thấp tại khu vực đô thị (nghỉ hưu)") | Mẫu 01a | **Cơ quan BHXH đang chi trả lương hưu hoặc UBND cấp xã** nơi thường trú/tạm trú/nơi ở hiện tại | Đ.8.2a TT 05 sửa đổi |
| K5 không HĐLĐ, không lương hưu | **Mẫu 05 TT 08/2026** (đồng thời chứng minh đối tượng) | **Mẫu 05** | **Công an cấp xã** nơi thường trú/tạm trú/nơi ở hiện tại (07 ngày; tự kê khai, cam kết) | Đ.6.1.c2 TT 05; Đ.30.2 NĐ 100 (NĐ 54) |
| K7 LLVT, công an, cơ yếu | **Mẫu riêng của BQP (TT 94/2024) hoặc BCA (TT 89/2026, thay TT 56/2024, chưa xác minh)**. Checklist | **Mẫu 04 TT 32/2025** (bản đã bỏ cụm "photo") | Đối tượng: đơn vị cấp Trung đoàn trở lên / Ban Cơ yếu / cấp có thẩm quyền CAND. Thu nhập: cơ quan, đơn vị nơi công tác | Đ.6.1.d, Đ.8.1-2.c TT 05; Đ.67 NĐ 100 (NĐ 136) |
| K9 đã trả lại nhà ở công vụ | **Mẫu 01 TT 08/2026** | Không | Cơ quan quản lý nhà ở công vụ | Đ.6.1.c, Đ.6.3 TT 05; chú thích 1 Mẫu 01 |
| K10 bị thu hồi đất, giải tỏa | **Mẫu 01 TT 08/2026** | Không | **UBND cấp xã.** NĐ 100 Đ.38.1.c (sửa bởi NĐ 54) ghi "nơi bị thu hồi đất". Chú thích của mẫu ghi "nơi thường trú/tạm trú/nơi ở hiện tại" (**mâu thuẫn**, xem §4) | Đ.38 NĐ 100; Mẫu 01 TT 08 |
| K11 HSSV | **Mẫu 01 TT 08/2026** | Không | Trường đang học | Đ.6.4 TT 05 |
| K12 DN, HTX | Loại khỏi app | | | |
| K13 có từ 02 con đẻ trở lên (từ 01/7/2026) | **Chưa có mẫu.** Bộ Xây dựng (trả lời 10–14/10/2026): "chưa có cơ sở" sửa TT 05/2024 để ra mẫu riêng, đang phối hợp Bộ Y tế. Chưa rõ nhóm này có phải đáp ứng điều kiện nhà ở, thu nhập không | ? | ? | [Báo Chính phủ 11/10/2026](https://baochinhphu.vn/dieu-kien-mua-nha-o-xa-hoi-voi-nguoi-co-tu-2-con-tro-len-102261010185841311.htm), [Báo Chính phủ 13/10/2026](https://baochinhphu.vn/co-2-con-de-tro-len-mua-nha-o-xa-hoi-theo-dieu-kien-nao-1022610131035362.htm), [Vietstock 11/10/2026](https://vietstock.vn/2026/10/nguoi-co-2-con-de-mua-nha-xa-hoi-dieu-kien-van-chua-ro-4266-1501211.htm). Đến 09/11/2026 chưa thấy hướng dẫn mới |

| Điều kiện nhà ở | Mẫu | Cơ quan xác nhận | Căn cứ |
|---|---|---|---|
| Chưa có nhà (hoặc không có tên/thông tin nhà ở trong GCN) tại tỉnh có dự án | **Mẫu 02 TT 08/2026** | **Cơ quan có thẩm quyền cấp GCN QSDĐ** tại tỉnh có dự án (VPĐKĐĐ/chi nhánh), 07 ngày | Đ.29.1 NĐ 100 (NĐ 54); chú thích 6 Mẫu 02 |
| Có nhà, < 15 m² sàn/người | **Mẫu 03 TT 05/2024** (bản gốc, chưa bị thay) | **UBND cấp xã nơi thường trú**, 07 ngày | Đ.29.2 NĐ 100; chú thích Mẫu 03 |
| Đã kết hôn | Vợ/chồng **cũng kê khai Mẫu 02** (Đ.7 TT 05) và mẫu thu nhập 01a/04/05 theo đối tượng của vợ/chồng (Đ.8.1 TT 05). Khi vợ/chồng khai 01a thì bỏ trống mục 8 | | |

**Thành phần hồ sơ chính thức** (QĐ 1346/QĐ-BXD, TTHC 1.115150; Đ.38.1.d NĐ 100 sửa đổi): (1) Đơn đăng ký; (2) Giấy tờ chứng minh đối tượng, điều kiện. **Không liệt kê bản sao CCCD hay giấy tờ hôn nhân.** Chú thích 55 của QĐ 1346: thông tin đã có trong CSDL quốc gia về dân cư được thay bằng số định danh cá nhân. → Trên app nên ghi bản sao CCCD, giấy chứng nhận kết hôn, xác nhận tình trạng hôn nhân là **"thường được chủ đầu tư yêu cầu thêm, không bắt buộc theo NĐ 136/QĐ 1346"**, không ghi là bắt buộc. Mẫu 02, 03 đã có mục "Đăng ký kết hôn số"; ngưỡng thu nhập dựa vào tình trạng "chưa kết hôn hoặc được xác nhận là độc thân".

## 4. Còn chưa chắc chắn
1. **K13:** chưa có mẫu, chưa rõ điều kiện. App giữ trạng thái "chưa có hướng dẫn mẫu", kèm link trả lời của Bộ Xây dựng.
2. **K10, cơ quan xác nhận:** NĐ 100 Đ.38 (UBND xã nơi bị thu hồi đất) khác chú thích Mẫu 01 TT 08 (UBND xã nơi thường trú/tạm trú/nơi ở hiện tại). Hiển thị cả hai, ưu tiên nghị định.
3. **K7, CAND:** TT 89/2026/TT-BCA (10/6/2026, hiệu lực 26/7/2026) thay TT 56/2024. Mới thấy ở trang tóm tắt bên thứ ba, chưa có file gốc. TT 94/2024/TT-BQP: chưa thấy văn bản sửa đổi, nhưng chưa xác minh trên CSDL chính thức.
4. **K11 (HSSV), K2/K3, K7 có được *mua* NOXH không:** theo tóm tắt của bên thứ ba, khoản 1 Điều 77 LNO 2023 (mua, thuê mua) chỉ gồm K1, 4, 5, 6, 8, 9, 10; K11 chỉ được **thuê**. Chưa đối chiếu văn bản luật gốc (và Luật Dân số 2025 đã sửa Đ.77). Nên kiểm tra trước khi cho chọn "Mua" với các nhóm này.
5. **Mẫu 01 NĐ 136:** VBHN 24 ghi mục 9 khác bản ký số ("theo quy định của pháp luật về nhà ở" thay "dưới mọi hình thức"). QĐ 1346 thiếu cụm "bao gồm cả phụ cấp khu vực..." ở mục 8.2. Theo bản ký số.
6. Dãy chấm của Mẫu 01 NĐ 136 trích từ VBHN 24 (bản text). Bản ký số là ảnh, không trích được từng ký tự.
7. Dự thảo sửa Luật Nhà ở đang trình Quốc hội (11/2026), nên mẫu có thể thay đổi.
8. Mẫu "có nhà nhưng ở xa nơi làm việc" (NQ 201/2025 + quyết định của tỉnh): chưa nghiên cứu (sau MVP).
