import { describe, expect, it } from 'vitest';
import { verifyTemplate, listTemplateTags, describeFirstDiff } from '../src/lib/verify-template';
import { makeDocx } from './helpers/make-docx';
import { PH, makeSyntheticOriginal, makeSyntheticTemplate, syntheticManifest } from './fixtures/synthetic-form';

const template = makeSyntheticTemplate();
const original = makeSyntheticOriginal();

describe('verifyTemplate', () => {
  it('liệt kê tag kể cả tag bị tách run', () => {
    expect(listTemplateTags(template)).toEqual(
      ['cb_mua', 'cb_thue_mua', 'ghi_chu', 'ho_ten', 'ngay_sinh', 'noi_thuong_tru', 'so_dinh_danh', 'thu_nhap'].sort(),
    );
  });

  it('đạt với template + manifest + file gốc khớp nhau', () => {
    const r = verifyTemplate(template, syntheticManifest, original);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('báo tag thiếu trong manifest', () => {
    const m = { ...syntheticManifest, fields: syntheticManifest.fields.filter((f) => f.key !== 'ho_ten') };
    const r = verifyTemplate(template, m);
    expect(r.ok).toBe(false);
    expect(r.missingInManifest).toEqual(['ho_ten']);
  });

  it('báo key manifest không có trong .docx', () => {
    const m = {
      ...syntheticManifest,
      fields: [...syntheticManifest.fields, { key: 'thua', label: 'Thừa', placeholder: '....', source: 'x' }],
    };
    const r = verifyTemplate(template, m);
    expect(r.ok).toBe(false);
    expect(r.missingInDocx).toEqual(['thua']);
  });

  it('báo placeholder sai độ dài so với file gốc', () => {
    const m = {
      ...syntheticManifest,
      fields: syntheticManifest.fields.map((f) => (f.key === 'ho_ten' ? { ...f, placeholder: PH.ho_ten.slice(1) } : f)),
    };
    const r = verifyTemplate(template, m, original);
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toMatch(/khác file gốc/);
  });

  it('báo khi template lệch văn bản gốc ngoài các tag', () => {
    const orig = makeDocx(['Họ tên: ' + PH.ho_ten]);
    const tpl = makeDocx(['Họ và tên: {{ho_ten}}']);
    const m = { ...syntheticManifest, fields: syntheticManifest.fields.slice(0, 1), checkboxes: [] };
    const r = verifyTemplate(tpl, m, orig);
    expect(r.ok).toBe(false);
  });

  it('báo key trùng và key không hợp lệ', () => {
    const f0 = syntheticManifest.fields[0]!;
    const m = { ...syntheticManifest, fields: [...syntheticManifest.fields, f0, { ...f0, key: 'Ho-Ten' }] };
    const r = verifyTemplate(template, m);
    expect(r.errors.some((e) => e.includes('trùng'))).toBe(true);
    expect(r.errors.some((e) => e.includes('không hợp lệ'))).toBe(true);
  });

  it('describeFirstDiff', () => {
    expect(describeFirstDiff('abc', 'abc')).toBeNull();
    expect(describeFirstDiff('a\nbc', 'a\nbd')).toMatch(/dòng 2/);
  });
});

describe('verifyTemplate: tag hỏng', () => {
  it('báo lỗi render khi tag không đóng', () => {
    const tpl = makeDocx(['Họ tên: {{ho_ten']);
    const m = { ...syntheticManifest, fields: [], checkboxes: [] };
    const r = verifyTemplate(tpl, m);
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toMatch(/Lỗi khi render/);
  });
});
