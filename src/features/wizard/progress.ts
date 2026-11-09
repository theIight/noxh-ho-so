import { hinhThucPolicy } from '../../data/rules';
import type { Draft } from '../../state/draft-context';

export const STEPS = [
  { path: '/buoc-1', short: 'Nhóm đối tượng', title: 'Bước 1: Bạn thuộc nhóm đối tượng nào?' },
  { path: '/buoc-2', short: 'Nhà ở, hình thức', title: 'Bước 2: Điều kiện nhà ở và hình thức' },
  { path: '/buoc-3', short: 'Thông tin cá nhân', title: 'Bước 3: Thông tin cá nhân' },
  { path: '/ket-qua', short: 'Kết quả', title: 'Bước 4: Kết quả' },
] as const;

export type StepIndex = 0 | 1 | 2 | 3;

/** Lỗi còn thiếu ở Bước 1 (rỗng = đã đủ). */
export function step1Errors(d: Draft): string[] {
  const errs: string[] = [];
  if (!d.doiTuong) errs.push('Chọn nhóm đối tượng.');
  if (d.doiTuong === 'k5') {
    if (d.coHopDongLaoDong === undefined) errs.push('Khoản 5: cho biết bạn có hợp đồng lao động không.');
    else if (d.coHopDongLaoDong === false && d.coLuongHuu === undefined)
      errs.push('Khoản 5: cho biết bạn có đang hưởng lương hưu không.');
  }
  if (!d.applicant.tinhTrangHonNhan) errs.push('Chọn tình trạng hôn nhân.');
  return errs;
}

export function step2Errors(d: Draft): string[] {
  const errs: string[] = [];
  if (!d.dieuKienNhaO) errs.push('Chọn điều kiện nhà ở.');
  if (!d.hinhThuc || (d.doiTuong && !hinhThucPolicy(d.doiTuong).allowed.includes(d.hinhThuc)))
    errs.push('Chọn hình thức mua, thuê mua hoặc thuê.');
  return errs;
}

/** Bước đầu tiên chưa hoàn thành mà bước `index` phụ thuộc vào; null nếu đã đủ điều kiện. */
export function firstIncompleteBefore(d: Draft, index: StepIndex): StepIndex | null {
  if (index >= 1 && step1Errors(d).length > 0) return 0;
  if (index >= 2 && step2Errors(d).length > 0) return 1;
  return null;
}
