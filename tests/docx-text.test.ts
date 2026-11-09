import { describe, expect, it } from 'vitest';
import PizZip from 'pizzip';
import { extractDocxText, xmlToText } from '../src/lib/docx-text';
import { makeDocx } from './helpers/make-docx';

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const doc = (body: string) => `<w:document ${W}><w:body>${body}</w:body></w:document>`;

describe('xmlToText', () => {
  it('mỗi đoạn một dòng; br/cr thành xuống dòng; giải mã entity', () => {
    const xml = doc(
      '<w:p><w:r><w:t>A &amp; B</w:t><w:br/><w:t>C</w:t></w:r></w:p><w:p><w:r><w:t xml:space="preserve"> D </w:t></w:r></w:p>',
    );
    expect(xmlToText(xml)).toBe('A & B\nC\n D \n');
  });

  it('<w:tab/> trong run là ký tự tab', () => {
    const xml = doc('<w:p><w:r><w:t>5. Đăng ký:</w:t><w:tab/><w:t>……</w:t></w:r></w:p>');
    expect(xmlToText(xml)).toBe('5. Đăng ký:\t……\n');
  });

  it('điểm dừng tab trong <w:pPr><w:tabs> không thành ký tự tab (hồi quy)', () => {
    const xml = doc(
      '<w:p><w:pPr><w:tabs><w:tab w:val="left" w:leader="dot" w:pos="5520"/><w:tab w:val="left" w:leader="dot" w:pos="9120"/></w:tabs>' +
        '<w:spacing w:before="120"/></w:pPr><w:r><w:t xml:space="preserve">5. Đăng ký thường trú tại: </w:t><w:tab/><w:t>……</w:t></w:r></w:p>' +
        '<w:p><w:pPr><w:tabs/></w:pPr><w:r><w:t>Hết</w:t></w:r></w:p>',
    );
    expect(xmlToText(xml)).toBe('5. Đăng ký thường trú tại: \t……\nHết\n');
  });

  it('extractDocxText dùng cùng quy tắc cho cả file .docx', () => {
    const zip = new PizZip(makeDocx(['x']));
    zip.file(
      'word/document.xml',
      doc('<w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="9000"/></w:tabs></w:pPr><w:r><w:t>Một</w:t></w:r></w:p>'),
    );
    expect(extractDocxText(zip.generate({ type: 'uint8array' }))).toBe('Một\n');
  });
});
