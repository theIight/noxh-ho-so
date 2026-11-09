import { Link, Outlet, useNavigate } from 'react-router';
import { useDraft } from '../state/draft-context';

export function Layout() {
  const { clearAll } = useDraft();
  const navigate = useNavigate();

  const onClear = () => {
    if (window.confirm('Xoá toàn bộ thông tin đã nhập trên trình duyệt này?')) {
      clearAll();
      void navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 print:bg-white">
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-bold text-red-800">
            NOXH Hồ Sơ
          </Link>
          <button
            type="button"
            onClick={onClear}
            className="rounded border border-red-700 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Xoá dữ liệu
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 print:max-w-none print:p-0">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-4xl px-4 pb-8 text-xs text-slate-500 print:hidden">
        Dữ liệu bạn nhập chỉ nằm trong trình duyệt này, không được gửi đi đâu và không được lưu lại khi đóng trang.
      </footer>
    </div>
  );
}
