/**
 * Sinh .docx tối thiểu bằng cách zip XML WordprocessingML (không cần Word/LibreOffice).
 * Mỗi đoạn là một chuỗi (1 run) hoặc mảng run, để mô phỏng tag bị Word tách qua nhiều run.
 */
import PizZip from 'pizzip';

export type Run = string | { text: string; bold?: boolean };
export type Para = string | Run[];

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function runXml(r: Run): string {
  const { text, bold } = typeof r === 'string' ? { text: r, bold: false } : r;
  const rPr = `<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>${bold ? '<w:b/>' : ''}<w:sz w:val="26"/></w:rPr>`;
  return `<w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

export function documentXml(paras: Para[]): string {
  const body = paras
    .map((p) => `<w:p>${(typeof p === 'string' ? [p] : p).map(runXml).join('')}</w:p>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W_NS}"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>`;
}

export function makeDocx(paras: Para[]): Uint8Array {
  const zip = new PizZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>',
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>',
  );
  zip.file(
    'word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>',
  );
  zip.file('word/document.xml', documentXml(paras));
  return zip.generate({ type: 'uint8array', compression: 'DEFLATE' });
}

export function readDocumentXml(docx: Uint8Array): string {
  return new PizZip(docx).file('word/document.xml')?.asText() ?? '';
}
