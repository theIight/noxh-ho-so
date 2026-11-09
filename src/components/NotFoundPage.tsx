import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Không tìm thấy trang</h1>
      <Link to="/" className="text-blue-700 underline">
        Về trang chủ
      </Link>
    </div>
  );
}
