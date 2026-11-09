import { describe, expect, it } from 'vitest';
import PizZip from 'pizzip';
import { fillDocx, renderDocx, UnknownTagError, buildRenderData, isBlank } from '../src/lib/fill-docx';
import { extractDocxText } from '../src/lib/docx-text';
import { DOCX_MIME } from '../src/lib/docx-common';
import { makeDocx, readDocumentXml } from './helpers/make-docx';
import {
  PH,
  SIGNATURE_BLOCK,
  emptyData,
  makeSyntheticOriginal,
  makeSyntheticTemplate,
  syntheticManifest,
  type SyntheticData,
} from './fixtures/synthetic-form';

const template = makeSyntheticTemplate();
const textOf = (data: SyntheticData) => extractDocxText(renderDocx(template, syntheticManifest, data));
const lines = (data: SyntheticData) => textOf(data).split('\n');

const full: SyntheticData = {
  person: {
    hoTen: 'Nguyễn Thị Ánh Tuyết',
    soDinhDanh: '001203004567',
    ngaySinh: '1990-07-05',
    noiThuongTru: 'Số 12 ngõ 34 phố Đông Các, phường Ô Chợ Dừa, thành phố Hà Nội',
    thuNhapBinhQuanThang: 12000000,
    diaChiLienHe: 'Phòng 1203, toà nhà Đức Giang',
  },
  application: { hinhThuc: 'mua' },
};

describe('fillDocx: giá trị đã nhập', () => {
  it('điền giá trị vào đúng vị trí', () => {
    const l = lines(full);
    expect(l).toContain('Họ và tên người viết đơn: Nguyễn Thị Ánh Tuyết');
    expect(l).toContain('Ngày sinh: 05/07/1990');
    expect(l).toContain('Nơi thường trú: Số 12 ngõ 34 phố Đông Các, phường Ô Chợ Dừa, thành phố Hà Nội');
    expect(l).toContain('Thu nhập bình quân tháng: 12.000.000 đồng');
  });

  it('xử lý tag bị Word tách qua nhiều run (kể cả run in đậm)', () => {
    expect(lines(full)).toContain('Số định danh cá nhân: 001203004567 cấp ngày ....../....../........');
    expect(textOf(full)).not.toContain('{{');
    expect(textOf(full)).not.toContain('}}');
  });

  it('giữ nguyên dấu tiếng Việt (NFC) và ký tự đặc biệt XML', () => {
    const data: SyntheticData = {
      person: { hoTen: 'Đặng Thị Hương Giang & <Ưng> "Ỷ"', noiThuongTru: 'Xã Ea H’Leo, tỉnh Đắk Lắk' },
      application: {},
    };
    const t = textOf(data);
    expect(t).toContain('Đặng Thị Hương Giang & <Ưng> "Ỷ"');
    expect(t).toContain('Xã Ea H’Leo, tỉnh Đắk Lắk');
    expect(t).toContain('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM');
    // XML hợp lệ: ký tự đặc biệt được escape.
    expect(readDocumentXml(renderDocx(template, syntheticManifest, data))).toContain('&amp; &lt;Ưng&gt;');
  });

  it('xuống dòng trong giá trị thành <w:br/> (linebreaks)', () => {
    const out = renderDocx(template, syntheticManifest, {
      person: { diaChiLienHe: 'Dòng 1\nDòng 2' },
      application: {},
    });
    expect(readDocumentXml(out)).toMatch(/Dòng 1<\/w:t><\/w:r><w:r>(<w:rPr>.*?<\/w:rPr>)?<w:br\/>/);
    expect(extractDocxText(out)).toContain('Địa chỉ liên hệ: Dòng 1\nDòng 2');
  });

  it('trả về Blob .docx mở lại được', async () => {
    const blob = fillDocx(template.buffer as ArrayBuffer, syntheticManifest, full);
    expect(blob.type).toBe(DOCX_MIME);
    const zip = new PizZip(new Uint8Array(await blob.arrayBuffer()));
    expect(zip.file('word/document.xml')?.asText()).toContain('Nguyễn Thị Ánh Tuyết');
  });
});

describe('fillDocx: để trống thì giữ dãy chấm gốc', () => {
  it('dữ liệu rỗng → văn bản giống hệt bản gốc chưa gắn tag', () => {
    expect(textOf(emptyData)).toBe(extractDocxText(makeSyntheticOriginal()));
  });

  it('mỗi trường rỗng trả lại đúng chuỗi placeholder (cả độ dài, cả ký tự …)', () => {
    const l = lines(emptyData);
    expect(l).toContain(`Họ và tên người viết đơn: ${PH.ho_ten}`);
    expect(l).toContain(`Số định danh cá nhân: ${PH.so_dinh_danh} cấp ngày ....../....../........`);
    expect(l).toContain(`Ngày sinh: ${PH.ngay_sinh}`);
    expect(l).toContain(`Thu nhập bình quân tháng: ${PH.thu_nhap} đồng`);
  });

  it.each([
    ['undefined', undefined],
    ['chuỗi rỗng', ''],
    ['chỉ khoảng trắng', '   \t '],
    ['null', null],
  ])('giá trị %s → placeholder', (_label, v) => {
    const data = { person: { hoTen: v as string | undefined }, application: {} };
    expect(lines(data)).toContain(`Họ và tên người viết đơn: ${PH.ho_ten}`);
  });

  it('số NaN → placeholder, số 0 vẫn được điền', () => {
    expect(lines({ person: { thuNhapBinhQuanThang: Number.NaN }, application: {} })).toContain(
      `Thu nhập bình quân tháng: ${PH.thu_nhap} đồng`,
    );
    expect(lines({ person: { thuNhapBinhQuanThang: 0 }, application: {} })).toContain('Thu nhập bình quân tháng: 0 đồng');
  });

  it('điền một phần: trường khác vẫn giữ dãy chấm', () => {
    const l = lines({ person: { hoTen: 'Lê Văn Bình' }, application: {} });
    expect(l).toContain('Họ và tên người viết đơn: Lê Văn Bình');
    expect(l).toContain(`Nơi thường trú: ${PH.noi_thuong_tru}`);
  });

  it('isBlank', () => {
    expect([undefined, null, '', '  ', Number.NaN, []].every(isBlank)).toBe(true);
    expect([0, 'a', false, ['x']].some(isBlank)).toBe(false);
  });
});

describe('fillDocx: checkbox', () => {
  it('chưa chọn → giữ ☐ ở cả hai ô', () => {
    expect(lines(emptyData)).toContain('Hình thức: ☐ Mua      ☐ Thuê mua');
  });
  it('chọn "mua" → ☒ Mua, ☐ Thuê mua', () => {
    expect(lines({ person: {}, application: { hinhThuc: 'mua' } })).toContain('Hình thức: ☒ Mua      ☐ Thuê mua');
  });
  it('chọn "thue_mua" → ☐ Mua, ☒ Thuê mua', () => {
    expect(lines({ person: {}, application: { hinhThuc: 'thue_mua' } })).toContain('Hình thức: ☐ Mua      ☒ Thuê mua');
  });
  it('buildRenderData trả đúng ký tự', () => {
    const d = buildRenderData(syntheticManifest, { person: {}, application: { hinhThuc: 'thue_mua' } });
    expect(d.cb_mua).toBe('☐');
    expect(d.cb_thue_mua).toBe('☒');
  });
});

describe('fillDocx: phần ký tên / xác nhận không bị đụng tới', () => {
  it('khối chữ ký, ngày ký, xác nhận UBND giữ nguyên khi đã điền đầy đủ', () => {
    const l = lines(full);
    const start = l.indexOf(SIGNATURE_BLOCK[0] as string);
    expect(start).toBeGreaterThan(0);
    expect(l.slice(start, start + SIGNATURE_BLOCK.length)).toEqual(SIGNATURE_BLOCK);
  });
  it('các dãy chấm không gắn tag (Kính gửi, cấp ngày) giữ nguyên', () => {
    const l = lines(full);
    expect(l).toContain('Kính gửi: Chủ đầu tư dự án ......................................');
  });
  it('XML phần chữ ký giống hệt template (không chỉ text)', () => {
    const tail = (xml: string) => xml.slice(xml.indexOf('Tôi xin cam đoan'));
    expect(tail(readDocumentXml(renderDocx(template, syntheticManifest, full)))).toBe(tail(readDocumentXml(template)));
  });
});

describe('fillDocx: lỗi', () => {
  it('tag không có trong manifest → UnknownTagError', () => {
    const t = makeDocx(['Họ tên: {{ho_ten}}', 'Lạ: {{khong_co}}']);
    expect(() => renderDocx(t, syntheticManifest, full)).toThrow(UnknownTagError);
    try {
      renderDocx(t, syntheticManifest, full);
    } catch (e) {
      expect((e as UnknownTagError).tags).toEqual(['khong_co']);
    }
  });
  it('dấu ngoặc nhọn đơn trong văn bản không bị hiểu nhầm là tag', () => {
    const t = makeDocx(['Ghi chú {a} và {b}: {{ho_ten}}']);
    const m = { ...syntheticManifest, fields: syntheticManifest.fields.slice(0, 1), checkboxes: [] };
    expect(extractDocxText(renderDocx(t, m, full))).toBe('Ghi chú {a} và {b}: Nguyễn Thị Ánh Tuyết\n');
  });
});

describe('resolveSource: hàm dẫn xuất lỗi', () => {
  it('trả về undefined (giữ dãy chấm) thay vì ném lỗi', async () => {
    const { resolveSource } = await import('../src/lib/fill-docx');
    const src = (d: { spouse?: { ngayCap?: string } }) => (d.spouse as { ngayCap: string }).ngayCap.slice(0, 4);
    expect(resolveSource(src, {})).toBeUndefined();
  });
});
