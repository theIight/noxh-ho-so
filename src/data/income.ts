/**
 * Ngưỡng thu nhập (Điều 30 NĐ 100/2024/NĐ-CP, sửa bởi NĐ 136/2026/NĐ-CP), docs/PLAN.md §5.
 * Chỉ dùng để CẢNH BÁO MỀM trên giao diện, không bao giờ chặn người dùng.
 */
import type { Applicant } from '../domain/types';

export const INCOME_REF = 'Điều 30 Nghị định 100/2024/NĐ-CP (sửa bởi Nghị định 136/2026/NĐ-CP)';

export const NGUONG_THU_NHAP = {
  docThan: 25_000_000,
  docThanNuoiCon: 35_000_000,
  voChong: 50_000_000,
} as const;

export interface IncomeWarning {
  /** Thu nhập đem so (đồng/tháng). */
  thuNhap: number;
  nguong: number;
  truongHop: 'doc_than' | 'doc_than_nuoi_con' | 'vo_chong';
  message: string;
}

const fmt = (n: number) => `${new Intl.NumberFormat('vi-VN').format(n / 1_000_000)} triệu đồng`;

/** Trả về cảnh báo nếu thu nhập đã nhập vượt ngưỡng; null nếu không vượt hoặc chưa nhập. */
export function checkIncome(
  a: Pick<Applicant, 'thuNhapBinhQuanThang' | 'tinhTrangHonNhan' | 'nuoiConDuoiTuoiThanhNien'> & {
    voChong?: { thuNhap?: number };
  },
): IncomeWarning | null {
  const own = a.thuNhapBinhQuanThang;
  if (a.tinhTrangHonNhan === 'da_ket_hon') {
    const spouse = a.voChong?.thuNhap;
    if (own === undefined && spouse === undefined) return null;
    const total = (own ?? 0) + (spouse ?? 0);
    const nguong = NGUONG_THU_NHAP.voChong;
    if (total <= nguong) return null;
    return {
      thuNhap: total,
      nguong,
      truongHop: 'vo_chong',
      message: `Tổng thu nhập của hai vợ chồng (${fmt(total)}/tháng) vượt ngưỡng ${fmt(nguong)}/tháng.`,
    };
  }
  if (own === undefined) return null;
  const nuoiCon = a.nuoiConDuoiTuoiThanhNien === true;
  const nguong = nuoiCon ? NGUONG_THU_NHAP.docThanNuoiCon : NGUONG_THU_NHAP.docThan;
  if (own <= nguong) return null;
  return {
    thuNhap: own,
    nguong,
    truongHop: nuoiCon ? 'doc_than_nuoi_con' : 'doc_than',
    message: `Thu nhập bình quân tháng (${fmt(own)}) vượt ngưỡng ${fmt(nguong)}/tháng${
      nuoiCon ? ' của người độc thân nuôi con dưới tuổi thành niên' : ' của người độc thân'
    }.`,
  };
}

/** Chuyển chuỗi người dùng gõ ("12.000.000", "12000000") thành số; rỗng/sai → undefined. */
export function parseMoney(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v !== 'string' || v.trim() === '') return undefined;
  const n = Number(v.replace(/[.,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
