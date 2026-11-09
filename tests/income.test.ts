import { describe, expect, it } from 'vitest';
import { checkIncome, parseMoney } from '../src/data/income';

describe('checkIncome (cảnh báo mềm)', () => {
  it('độc thân: ngưỡng 25 triệu, bằng ngưỡng thì không cảnh báo', () => {
    expect(checkIncome({ thuNhapBinhQuanThang: 25_000_000 })).toBeNull();
    expect(checkIncome({ thuNhapBinhQuanThang: 25_000_001 })?.nguong).toBe(25_000_000);
    expect(checkIncome({ tinhTrangHonNhan: 'ly_hon', thuNhapBinhQuanThang: 26_000_000 })?.truongHop).toBe('doc_than');
  });

  it('độc thân nuôi con dưới tuổi thành niên: ngưỡng 35 triệu', () => {
    expect(checkIncome({ thuNhapBinhQuanThang: 30_000_000, nuoiConDuoiTuoiThanhNien: true })).toBeNull();
    expect(checkIncome({ thuNhapBinhQuanThang: 36_000_000, nuoiConDuoiTuoiThanhNien: true })?.truongHop).toBe(
      'doc_than_nuoi_con',
    );
  });

  it('vợ chồng: tổng không quá 50 triệu (bỏ qua cờ nuôi con)', () => {
    const base = { tinhTrangHonNhan: 'da_ket_hon' as const, nuoiConDuoiTuoiThanhNien: true };
    expect(checkIncome({ ...base, thuNhapBinhQuanThang: 30_000_000, voChong: { thuNhap: 20_000_000 } })).toBeNull();
    const w = checkIncome({ ...base, thuNhapBinhQuanThang: 30_000_000, voChong: { thuNhap: 20_000_001 } });
    expect(w?.truongHop).toBe('vo_chong');
    expect(w?.thuNhap).toBe(50_000_001);
    expect(checkIncome({ ...base, voChong: { thuNhap: 51_000_000 } })?.nguong).toBe(50_000_000);
  });

  it('chưa nhập thu nhập thì không cảnh báo', () => {
    expect(checkIncome({})).toBeNull();
    expect(checkIncome({ tinhTrangHonNhan: 'da_ket_hon' })).toBeNull();
  });
});

describe('parseMoney', () => {
  it.each([
    ['12.000.000', 12_000_000],
    ['12,000,000', 12_000_000],
    [' 5000 ', 5000],
    ['', undefined],
    ['abc', undefined],
    ['-5', undefined],
    [7, 7],
  ])('%j → %j', (input, out) => expect(parseMoney(input)).toBe(out));
});
