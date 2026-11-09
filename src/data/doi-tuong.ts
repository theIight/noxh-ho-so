/**
 * Nội dung hiển thị cho Bước 1: giải thích ngắn từng khoản Điều 76 Luật Nhà ở 2023
 * và các câu hỏi gợi ý nhóm. Chỉ là dữ liệu hiển thị; quy tắc giấy tờ nằm ở rules.ts.
 */
import type { DoiTuong, TinhTrangHonNhan } from '../domain/types';

export const HON_NHAN_LABEL: Record<TinhTrangHonNhan, string> = {
  doc_than: 'Độc thân (chưa kết hôn)',
  da_ket_hon: 'Đã kết hôn',
  ly_hon: 'Đã ly hôn',
  goa: 'Vợ/chồng đã mất',
};

export const DOI_TUONG_GIAI_THICH: Record<DoiTuong, string> = {
  k1: 'Người có công với cách mạng, thân nhân liệt sĩ thuộc trường hợp được hỗ trợ cải thiện nhà ở theo pháp luật về ưu đãi người có công.',
  k2: 'Hộ gia đình nghèo, cận nghèo đang sinh sống tại khu vực nông thôn.',
  k3: 'Hộ gia đình nghèo, cận nghèo tại khu vực nông thôn thuộc vùng thường xuyên bị ảnh hưởng bởi thiên tai, biến đổi khí hậu.',
  k4: 'Hộ gia đình nghèo, cận nghèo tại khu vực đô thị.',
  k5: 'Người thu nhập thấp tại khu vực đô thị, kể cả người làm tự do không có hợp đồng lao động hoặc người đang hưởng lương hưu.',
  k6: 'Công nhân, người lao động đang làm việc tại doanh nghiệp, hợp tác xã, liên hiệp hợp tác xã trong và ngoài khu công nghiệp.',
  k7: 'Sĩ quan, quân nhân chuyên nghiệp, hạ sĩ quan, công nhân công an, công chức, công nhân và viên chức quốc phòng đang phục vụ; người làm công tác cơ yếu, công tác khác trong tổ chức cơ yếu hưởng lương từ ngân sách.',
  k8: 'Cán bộ, công chức, viên chức theo quy định của pháp luật về cán bộ, công chức, viên chức.',
  k9: 'Người đã trả lại nhà ở công vụ (trừ trường hợp bị thu hồi nhà ở công vụ do vi phạm).',
  k10: 'Hộ gia đình, cá nhân bị thu hồi đất và phải giải toả, phá dỡ nhà ở mà chưa được Nhà nước bồi thường bằng nhà ở, đất ở.',
  k11: 'Học sinh, sinh viên, học viên các trường đại học, cao đẳng, giáo dục nghề nghiệp, trường chuyên biệt; học sinh trường dân tộc nội trú công lập. Lưu ý: nhóm này thường chỉ được thuê nhà ở trong thời gian học tập, hãy hỏi lại chủ đầu tư.',
  k13: 'Người có từ 02 con đẻ trở lên (bổ sung bởi Luật Dân số 2025, áp dụng từ 01/07/2026). Hiện chưa có hướng dẫn mẫu giấy tờ chứng minh.',
};

export interface CauHoiGoiY {
  id: string;
  label: string;
  /** Nhóm được gợi ý khi câu trả lời là "có". */
  goiY: DoiTuong[];
  /** Với khoản 5: giá trị điền sẵn cho câu hỏi nhánh. */
  k5?: { coHopDongLaoDong: boolean; coLuongHuu?: boolean };
}

export const CAU_HOI_GOI_Y: CauHoiGoiY[] = [
  { id: 'nguoi_co_cong', label: 'Bạn là người có công với cách mạng hoặc thân nhân liệt sĩ?', goiY: ['k1'] },
  { id: 'ho_ngheo', label: 'Hộ gia đình bạn là hộ nghèo hoặc hộ cận nghèo?', goiY: ['k2', 'k3', 'k4'] },
  { id: 'luc_luong_vu_trang', label: 'Bạn đang phục vụ trong lực lượng vũ trang (quân đội, công an) hoặc làm công tác cơ yếu?', goiY: ['k7'] },
  { id: 'can_bo', label: 'Bạn là cán bộ, công chức, viên chức?', goiY: ['k8'] },
  { id: 'cong_nhan', label: 'Bạn là công nhân, người lao động tại doanh nghiệp, hợp tác xã (trong hoặc ngoài khu công nghiệp)?', goiY: ['k6'] },
  {
    id: 'co_hdld',
    label: 'Bạn đang làm việc có hợp đồng lao động (không thuộc các nhóm trên) và sống ở đô thị?',
    goiY: ['k5'],
    k5: { coHopDongLaoDong: true },
  },
  {
    id: 'luong_huu',
    label: 'Bạn đang hưởng lương hưu và sống ở đô thị?',
    goiY: ['k5'],
    k5: { coHopDongLaoDong: false, coLuongHuu: true },
  },
  {
    id: 'tu_do',
    label: 'Bạn làm việc tự do, không có hợp đồng lao động, thu nhập thấp và sống ở đô thị?',
    goiY: ['k5'],
    k5: { coHopDongLaoDong: false, coLuongHuu: false },
  },
  { id: 'tra_nha_cong_vu', label: 'Bạn đã trả lại nhà ở công vụ?', goiY: ['k9'] },
  { id: 'thu_hoi_dat', label: 'Bạn bị thu hồi đất, phải phá dỡ nhà ở mà chưa được bồi thường bằng nhà ở, đất ở?', goiY: ['k10'] },
  { id: 'hssv', label: 'Bạn là học sinh, sinh viên, học viên?', goiY: ['k11'] },
  { id: 'hai_con', label: 'Bạn có từ 02 con đẻ trở lên?', goiY: ['k13'] },
];

/** Danh sách nhóm gợi ý (không trùng, theo thứ tự câu hỏi) từ các câu đã đánh dấu "có". */
export function goiYNhom(daChon: readonly string[]): { doiTuong: DoiTuong; tu: CauHoiGoiY }[] {
  const out: { doiTuong: DoiTuong; tu: CauHoiGoiY }[] = [];
  const seen = new Set<DoiTuong>();
  for (const q of CAU_HOI_GOI_Y) {
    if (!daChon.includes(q.id)) continue;
    for (const k of q.goiY) {
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ doiTuong: k, tu: q });
    }
  }
  return out;
}
