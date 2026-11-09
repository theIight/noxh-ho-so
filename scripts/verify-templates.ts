/**
 * Kiểm tra mọi template đã gắn tag trong public/templates/ so với manifest.
 *
 *   npm run verify-templates
 *   npm run verify-templates -- --only nd136-01
 *   npm run verify-templates -- --original nd136-01=templates-src/nd136-01.docx
 *   npm run verify-templates -- --template path/tagged.docx --manifest nd136-01 [--original path/original.docx]
 *
 * --original <id>=<path>: so thêm văn bản render rỗng với file gốc chưa gắn tag (lặp lại được).
 * Với --template/--manifest, `--original <path>` không cần tiền tố id.
 * Thoát với mã 1 nếu có lỗi.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { MANIFESTS } from '../src/templates/manifest/index.ts';
import { verifyTemplate, type VerifyResult } from '../src/lib/verify-template.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const { values } = parseArgs({
  options: {
    only: { type: 'string', multiple: true },
    original: { type: 'string', multiple: true },
    template: { type: 'string' },
    manifest: { type: 'string' },
  },
});

function read(path: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(process.cwd(), path)));
}

const originals = new Map<string, string>();
let bareOriginal: string | undefined;
for (const o of values.original ?? []) {
  const eq = o.indexOf('=');
  if (eq > 0 && !existsSync(o)) originals.set(o.slice(0, eq), o.slice(eq + 1));
  else bareOriginal = o;
}

const results: VerifyResult[] = [];

if (values.template) {
  const m = MANIFESTS.find((x) => x.id === values.manifest);
  if (!m) {
    console.error(`Không tìm thấy manifest "${values.manifest ?? ''}". Có: ${MANIFESTS.map((x) => x.id).join(', ') || '(trống)'}`);
    process.exit(1);
  }
  const orig = bareOriginal ?? originals.get(String(m.id));
  results.push(verifyTemplate(read(values.template), m, orig ? read(orig) : undefined));
} else {
  const selected = values.only?.length ? MANIFESTS.filter((m) => values.only?.includes(String(m.id))) : MANIFESTS;
  if (selected.length === 0) {
    console.log('Chưa có manifest nào để kiểm tra (src/templates/manifest/index.ts).');
    process.exit(0);
  }
  for (const m of selected) {
    const file = resolve(root, 'public/templates', m.file);
    if (!existsSync(file)) {
      results.push({ id: String(m.id), ok: false, errors: [`Thiếu file template ${file}`], tagsInDocx: [], missingInManifest: [], missingInDocx: [] });
      continue;
    }
    const orig = originals.get(String(m.id));
    results.push(verifyTemplate(new Uint8Array(readFileSync(file)), m, orig ? read(orig) : undefined));
  }
}

let failed = 0;
for (const r of results) {
  if (r.ok) {
    console.log(`OK    ${r.id} (${r.tagsInDocx.length} tag)`);
  } else {
    failed++;
    console.log(`FAIL  ${r.id}`);
    for (const e of r.errors) console.log(`      - ${e}`);
  }
}
console.log(`\n${results.length - failed}/${results.length} template đạt.`);
process.exit(failed ? 1 : 0);
