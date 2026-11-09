// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { walkToResult } from './helpers/wizard';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.location.hash = '';
});

const section = (name: RegExp) => screen.getByRole('region', { name });
const titles = (el: HTMLElement) =>
  within(el)
    .getAllByRole('listitem')
    .map((li) => li.querySelector('p')?.firstChild?.textContent?.trim());

describe('Kết quả', () => {
  it('khoản 6, độc thân, chưa có nhà: đơn + Mẫu 01a + Mẫu 02 + checklist; không có phần vợ/chồng', async () => {
    await walkToResult({ group: /^Khoản 6:/ });
    const me = section(/người đứng đơn/);
    expect(titles(me)).toEqual([
      'Đơn đăng ký mua, thuê mua, thuê nhà ở xã hội',
      'Giấy xác nhận đối tượng và điều kiện thu nhập',
      'Giấy xác nhận điều kiện nhà ở (chưa có nhà ở)',
      'Bản sao Căn cước / Căn cước công dân của người đứng đơn',
      'Giấy tờ chứng minh tình trạng hôn nhân (Giấy xác nhận tình trạng hôn nhân)',
      'Giấy tờ khác theo yêu cầu của chủ đầu tư dự án (nếu có)',
    ]);
    expect(screen.queryByRole('region', { name: /vợ hoặc chồng/ })).toBeNull();
    expect(within(me).getByText(/Mẫu số 01a Phụ lục I Thông tư 05\/2024\/TT-BXD \(bổ sung bởi Thông tư 32\/2025/)).toBeTruthy();
    expect(within(me).getAllByText('Cơ quan, đơn vị, doanh nghiệp nơi đang làm việc').length).toBeGreaterThan(0);
  });

  it('khoản 5 không HĐLĐ, đã kết hôn, dưới 15 m²: Mẫu 05 + Mẫu 03; vợ/chồng có Mẫu 02, Mẫu 05, CCCD', async () => {
    await walkToResult({
      group: /^Khoản 5:/,
      k5: { hdld: false, luongHuu: false },
      married: /^Đã kết hôn/,
      housing: /dưới 15 m²/,
    });
    const me = section(/người đứng đơn/);
    expect(titles(me)).toContain(
      'Giấy xác nhận đối tượng và điều kiện thu nhập (người thu nhập thấp không có hợp đồng lao động)',
    );
    expect(titles(me)).toContain('Giấy xác nhận điều kiện nhà ở (diện tích bình quân dưới 15 m² sàn/người)');
    expect(titles(me)).toContain('Bản sao Giấy chứng nhận đăng ký kết hôn');
    const spouse = section(/vợ hoặc chồng/);
    expect(titles(spouse)).toEqual([
      'Giấy xác nhận điều kiện nhà ở (chưa có nhà ở)',
      'Giấy xác nhận đối tượng và điều kiện thu nhập (người thu nhập thấp không có hợp đồng lao động)',
      'Bản sao Căn cước / Căn cước công dân của vợ/chồng',
    ]);
  });

  it('khoản 1, ở xa nơi làm việc: chỉ có checklist cho đối tượng và nhà ở', async () => {
    await walkToResult({ group: /^Khoản 1:/, housing: /ở xa nơi làm việc/ });
    const me = section(/người đứng đơn/);
    expect(titles(me)).toContain(
      'Bản sao có chứng thực giấy tờ chứng minh là người có công với cách mạng / Giấy chứng nhận thân nhân liệt sĩ',
    );
    expect(titles(me)).toContain('Giấy tờ chứng minh có nhà ở nhưng ở xa nơi làm việc');
    // Chỉ đơn đăng ký là biểu mẫu.
    expect(within(me).getAllByRole('button', { name: /^Tải \.docx/ })).toHaveLength(1);
  });

  it('đủ manifest cho 7 mẫu: mọi biểu mẫu có nút tải, "Tải tất cả (.zip)" bật; có ghi chú phần ký để trống; in được', async () => {
    await walkToResult({ group: /^Khoản 8:/, married: /^Đã kết hôn/ });
    expect(screen.queryByRole('button', { name: 'Mẫu đang được cập nhật' })).toBeNull();
    expect(screen.getAllByRole('button', { name: /^Tải \.docx/ })).toHaveLength(5); // đơn, 01a, 02 + vợ/chồng: 02, 01a
    expect((screen.getByRole('button', { name: 'Tải tất cả (.zip)' }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByRole('note').textContent).toMatch(/chữ ký.*xác nhận của cơ quan\/UBND.*được cố ý để trống/s);

    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    fireEvent.click(screen.getByRole('button', { name: 'In danh sách giấy tờ' }));
    expect(print).toHaveBeenCalledOnce();
  });

  it('khoản 13: hiện mục "chưa có hướng dẫn mẫu"', async () => {
    await walkToResult({ group: /^Khoản 13:/ });
    expect(screen.getByText(/chưa có hướng dẫn mẫu/)).toBeTruthy();
  });
});
