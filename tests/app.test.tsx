// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from '../src/App';
import { SOURCE_URL } from '../src/data/meta';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

describe('App shell', () => {
  it('trang chủ có banner ngày cập nhật, link nguồn, disclaimer và nút Xoá dữ liệu', () => {
    render(<App />);
    expect(screen.getByText('Căn cứ pháp lý cập nhật đến 14/10/2026')).toBeTruthy();
    expect(screen.getByRole('link', { name: /thuvienphapluat/ }).getAttribute('href')).toBe(SOURCE_URL);
    expect(screen.getByText(/không thay thế tư vấn pháp lý/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Xoá dữ liệu' })).toBeTruthy();
  });

  it('Xoá dữ liệu xoá khoá noxh: trong localStorage sau khi xác nhận', () => {
    window.localStorage.setItem('noxh:draft', '{}');
    window.localStorage.setItem('other', '1');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Xoá dữ liệu' }));
    expect(window.localStorage.getItem('noxh:draft')).toBeNull();
    expect(window.localStorage.getItem('other')).toBe('1');
  });

  it.each([
    ['#/buoc-1', /Bước 1: Bạn thuộc nhóm đối tượng nào\?/],
    ['#/buoc-2', /Bước 2: Điều kiện nhà ở/],
    ['#/buoc-3', /Bước 3: Thông tin cá nhân/],
    ['#/ket-qua', /Bước 4: Kết quả/],
  ])('route %s', (hash, heading) => {
    window.location.hash = hash;
    render(<App />);
    expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
  });
});
