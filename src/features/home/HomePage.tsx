import { Link } from 'react-router';
import { LEGAL_UPDATED_AT, SOURCE_URL, formatViDate } from '../../data/meta';

export function HomePage() {
  return (
    <div className="space-y-6">
      <div role="note" className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
        <p className="font-semibold">Căn cứ pháp lý cập nhật đến {formatViDate(LEGAL_UPDATED_AT)}</p>
        <p>
          Nguồn:{' '}
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
            Mẫu hồ sơ mua nhà ở xã hội 2026 (thuvienphapluat.vn)
          </a>
        </p>
      </div>

      <section className="space-y-3">
        <h1 className="text-2xl font-bold">Tạo bộ hồ sơ đăng ký mua, thuê mua nhà ở xã hội</h1>
        <p>
          Chọn nhóm đối tượng và điều kiện nhà ở, ứng dụng sẽ liệt kê các giấy tờ cần chuẩn bị và điền sẵn thông tin
          của bạn vào các biểu mẫu theo quy định. Trường nào để trống sẽ giữ nguyên dòng chấm để bạn điền tay.
        </p>
        <p>Phần chữ ký, xác nhận của cơ quan/UBND xã và ngày tháng ký luôn được để trống.</p>
        <Link
          to="/buoc-1"
          className="inline-block rounded bg-red-800 px-4 py-2 font-medium text-white hover:bg-red-900"
        >
          Bắt đầu
        </Link>
      </section>

      <section className="rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <h2 className="font-semibold">Lưu ý</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Ứng dụng chỉ hỗ trợ chuẩn bị hồ sơ, không thay thế tư vấn pháp lý.</li>
          <li>Chủ đầu tư hoặc địa phương có thể yêu cầu thêm giấy tờ. Hãy kiểm tra lại trước khi nộp.</li>
          <li>Không có máy chủ: dữ liệu (CCCD, thu nhập...) chỉ xử lý trong trình duyệt của bạn.</li>
        </ul>
      </section>
    </div>
  );
}
