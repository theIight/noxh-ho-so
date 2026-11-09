/** Mốc cập nhật căn cứ pháp lý (ngày đăng/cập nhật bài nguồn: 14:45 ngày 14/10/2026). */
export const LEGAL_UPDATED_AT = '2026-10-14';

/** Bài nguồn chính trên thuvienphapluat.vn (xem docs/PLAN.md §0). */
export const SOURCE_URL =
  'https://thuvienphapluat.vn/phap-luat-doanh-nghiep/bai-viet/mau-ho-so-mua-nha-o-xa-hoi-2026-cap-nhat-thang-10-2026-19136.html';

/** ISO yyyy-mm-dd → dd/mm/yyyy. Trả nguyên chuỗi nếu không đúng định dạng ISO. */
export function formatViDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}
