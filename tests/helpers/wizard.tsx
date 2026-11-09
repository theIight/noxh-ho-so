import { fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../../src/App';

export function renderAt(hash: string) {
  window.location.hash = hash;
  return render(<App />);
}

export const radio = (name: RegExp | string) => screen.getByRole('radio', { name });
export const pick = (name: RegExp | string) => fireEvent.click(radio(name));
export const clickNext = () => fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }));
export const heading = (name: RegExp) => screen.findByRole('heading', { level: 1, name });

export function answerYesNo(groupName: RegExp, yes: boolean) {
  const group = screen.getByRole('group', { name: groupName });
  fireEvent.click(within(group).getByRole('radio', { name: yes ? 'Có' : 'Không' }));
}

export interface Scenario {
  group: RegExp;
  k5?: { hdld: boolean; luongHuu?: boolean };
  married?: RegExp;
  housing?: RegExp;
  hinhThuc?: 'Mua' | 'Thuê mua' | 'Thuê';
}

/** Đi từ Bước 1 tới Bước 3 qua giao diện. */
export async function walkToStep3(s: Scenario) {
  renderAt('#/buoc-1');
  await heading(/Bước 1/);
  pick(s.group);
  if (s.k5) {
    answerYesNo(/hợp đồng lao động/, s.k5.hdld);
    if (!s.k5.hdld && s.k5.luongHuu !== undefined) answerYesNo(/lương hưu/, s.k5.luongHuu);
  }
  pick(s.married ?? /^Độc thân/);
  clickNext();
  await heading(/Bước 2/);
  pick(s.housing ?? /^Chưa có nhà ở/);
  // Khoản 11 chỉ có "Thuê" (đã chọn sẵn).
  const hinhThuc = s.hinhThuc ?? 'Mua';
  if (screen.queryByRole('radio', { name: hinhThuc })) pick(hinhThuc);
  clickNext();
  await heading(/Bước 3/);
}

export async function walkToResult(s: Scenario) {
  await walkToStep3(s);
  clickNext();
  await heading(/Bước 4/);
}
