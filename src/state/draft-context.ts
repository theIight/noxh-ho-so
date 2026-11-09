import { createContext, useContext } from 'react';
import type { Application } from '../domain/types';

/** Bản nháp hồ sơ: chỉ nằm trong bộ nhớ trình duyệt (không lưu mặc định, không gửi đi đâu). */
export type Draft = Partial<Omit<Application, 'applicant'>> & {
  applicant: NonNullable<Application['applicant']>;
  /** Trạng thái giao diện: id các câu hỏi gợi ý nhóm ở Bước 1 đã đánh dấu "có". */
  goiY?: string[];
};

export const EMPTY_DRAFT: Draft = { applicant: {} };

/** Tiền tố khoá localStorage nếu sau này bật "lưu nháp" (mặc định tắt). */
export const STORAGE_PREFIX = 'noxh:';

export interface DraftContextValue {
  draft: Draft;
  setDraft: (updater: (d: Draft) => Draft) => void;
  clearAll: () => void;
}

export const DraftContext = createContext<DraftContextValue | null>(null);

export function useDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft phải nằm trong <DraftProvider>');
  return ctx;
}

/** Xoá mọi dữ liệu của app trong trình duyệt. */
export function clearBrowserStorage(): void {
  try {
    const ls = window.localStorage;
    for (let i = ls.length - 1; i >= 0; i--) {
      const k = ls.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) ls.removeItem(k);
    }
  } catch {
    /* storage có thể bị chặn */
  }
  try {
    window.sessionStorage.clear();
  } catch {
    /* storage có thể bị chặn */
  }
}
