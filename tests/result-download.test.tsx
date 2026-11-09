// @vitest-environment jsdom
/**
 * Đường tải .docx với manifest giả (mẫu tổng hợp, không phải mẫu nhà nước).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import PizZip from 'pizzip';
import type { TemplateManifest } from '../src/templates/types';
import { makeSyntheticTemplate, syntheticManifest } from './fixtures/synthetic-form';
import { clickNext, heading, walkToResult, walkToStep3 } from './helpers/wizard';

const mocks = vi.hoisted(() => ({
  downloadBlob: vi.fn(),
  downloadZip: vi.fn(async () => {}),
  fillDocx: vi.fn(),
}));

vi.mock('../src/templates/manifest', () => {
  const nd136: TemplateManifest = {
    ...(syntheticManifest as unknown as TemplateManifest),
    id: 'nd136-01',
    file: 'nd136-01.docx',
    // Nguồn dạng hàm của ngày sinh: khai `paths` để Bước 3 vẫn hiện trường này.
    fields: syntheticManifest.fields.map((f) =>
      f.key === 'ngay_sinh' ? { ...f, paths: ['person.ngaySinh'] } : f,
    ) as TemplateManifest['fields'],
  };
  return { MANIFESTS: [nd136] };
});

vi.mock('../src/lib/zip', async (orig) => ({
  ...(await orig<typeof import('../src/lib/zip')>()),
  downloadBlob: mocks.downloadBlob,
  downloadZip: mocks.downloadZip,
}));

vi.mock('../src/lib/fill-docx', async (orig) => {
  const actual = await orig<typeof import('../src/lib/fill-docx')>();
  mocks.fillDocx.mockImplementation(actual.fillDocx);
  return { ...actual, fillDocx: mocks.fillDocx };
});

const template = makeSyntheticTemplate();
const fetchMock = vi.fn(async (url: string) => {
  if (url !== 'templates/nd136-01.docx') return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
  return { ok: true, status: 200, arrayBuffer: async () => template.slice().buffer };
});

async function blobText(b: Blob): Promise<string> {
  const buf = await new Promise<ArrayBuffer>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error as Error);
    r.readAsArrayBuffer(b);
  });
  return new PizZip(new Uint8Array(buf)).file('word/document.xml')?.asText() ?? '';
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  mocks.downloadBlob.mockClear();
  mocks.downloadZip.mockClear();
  mocks.fillDocx.mockClear();
  fetchMock.mockClear();
  window.location.hash = '';
});

describe('Bước 3 lọc trường theo manifest', () => {
  it('chỉ hiện các trường mẫu đã chọn dùng, có tuỳ chọn hiện tất cả', async () => {
    await walkToStep3({ group: /^Khoản 6:/ });
    for (const l of ['Họ và tên', 'Ngày sinh', 'Số định danh cá nhân (CCCD, 12 số)', 'Nơi thường trú', 'Địa chỉ liên hệ']) {
      expect(screen.getByLabelText(l)).toBeTruthy();
    }
    expect(screen.queryByLabelText('Nghề nghiệp')).toBeNull();
    expect(screen.queryByLabelText('Giới tính')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: /Hiện tất cả các trường/ }));
    expect(screen.getByLabelText('Nghề nghiệp')).toBeTruthy();
  });
});

describe('Tải .docx khi đã có manifest', () => {
  it('tải từng mẫu: fetch template, gọi fillDocx, tạo Blob .docx đã điền', async () => {
    await walkToStep3({ group: /^Khoản 6:/ });
    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Trần Thị Bích' } });
    clickNext();
    await heading(/Bước 4/);

    const me = screen.getByRole('region', { name: /người đứng đơn/ });
    const btn = within(me).getByRole('button', { name: /Tải \.docx/ });
    // Các mẫu chưa có manifest vẫn bị vô hiệu.
    expect(within(me).getAllByRole('button', { name: 'Mẫu đang được cập nhật' })).toHaveLength(2);
    fireEvent.click(btn);

    await waitFor(() => expect(mocks.downloadBlob).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith('templates/nd136-01.docx');
    expect(mocks.fillDocx).toHaveBeenCalledOnce();
    const data = mocks.fillDocx.mock.calls[0]?.[2] as { person: { hoTen?: string }; application: { hinhThuc?: string } };
    expect(data.person.hoTen).toBe('Trần Thị Bích');
    expect(data.application.hinhThuc).toBe('mua');

    const [blob, name] = mocks.downloadBlob.mock.calls[0] as [Blob, string];
    expect(blob).toBeInstanceOf(Blob);
    expect(name).toBe('Đơn đăng ký mua, thuê mua, thuê nhà ở xã hội.docx');
    const xml = await blobText(blob);
    expect(xml).toContain('Trần Thị Bích');
    expect(xml).not.toContain('{{');
  });

  it('Tải tất cả (.zip) gom các mẫu đã có manifest', async () => {
    await walkToResult({ group: /^Khoản 8:/ });
    const zipBtn = screen.getByRole('button', { name: 'Tải tất cả (.zip)' }) as HTMLButtonElement;
    expect(zipBtn.disabled).toBe(false);
    fireEvent.click(zipBtn);
    await waitFor(() => expect(mocks.downloadZip).toHaveBeenCalledOnce());
    const entries = (mocks.downloadZip.mock.calls[0] as unknown as [{ name: string; data: unknown }[]])[0];
    expect(entries.map((e) => e.name)).toEqual(['01 - Đơn đăng ký mua, thuê mua, thuê nhà ở xã hội.docx']);
    expect(entries[0]?.data).toBeInstanceOf(Blob);
  });

  it('báo lỗi nếu không tải được template', async () => {
    fetchMock.mockImplementationOnce(async () => ({ ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) }));
    await walkToResult({ group: /^Khoản 8:/ });
    fireEvent.click(screen.getByRole('button', { name: /Tải \.docx/ }));
    expect((await screen.findByRole('alert')).textContent).toContain('HTTP 404');
    expect(mocks.downloadBlob).not.toHaveBeenCalled();
  });
});
