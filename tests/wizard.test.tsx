// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { answerYesNo, clickNext, heading, pick, radio, renderAt, walkToStep3 } from './helpers/wizard';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.location.hash = '';
});

describe('Bước 1: nhóm đối tượng', () => {
  it('liệt kê đủ khoản 1–11 và 13, không có khoản 12', async () => {
    renderAt('#/buoc-1');
    await heading(/Bước 1: Bạn thuộc nhóm đối tượng nào\?/);
    const group = screen.getByRole('group', { name: /Nhóm đối tượng \(Điều 76/ });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(12);
    expect(within(group).queryByRole('radio', { name: /^Khoản 12/ })).toBeNull();
    expect(radio(/^Khoản 13:/)).toBeTruthy();
  });

  it('không cho sang bước 2 khi chưa chọn nhóm và tình trạng hôn nhân', async () => {
    renderAt('#/buoc-1');
    await heading(/Bước 1/);
    clickNext();
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Chọn nhóm đối tượng.');
    expect(alert.textContent).toContain('Chọn tình trạng hôn nhân.');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Bước 1/);
  });

  it('khoản 5 hỏi hợp đồng lao động, rồi lương hưu nếu không có HĐLĐ', async () => {
    renderAt('#/buoc-1');
    await heading(/Bước 1/);
    expect(screen.queryByRole('group', { name: /hợp đồng lao động/ })).toBeNull();
    pick(/^Khoản 5:/);
    pick(/^Độc thân/);
    expect(screen.getByRole('group', { name: /hợp đồng lao động/ })).toBeTruthy();
    expect(screen.queryByRole('group', { name: /lương hưu/ })).toBeNull();

    clickNext();
    expect(screen.getByRole('alert').textContent).toContain('hợp đồng lao động');

    answerYesNo(/hợp đồng lao động/, true);
    expect(screen.queryByRole('group', { name: /lương hưu/ })).toBeNull();
    expect(screen.getByText(/Mẫu số 01a Phụ lục I/)).toBeTruthy();

    answerYesNo(/hợp đồng lao động/, false);
    expect(screen.getByRole('group', { name: /lương hưu/ })).toBeTruthy();
    clickNext();
    expect(screen.getByRole('alert').textContent).toContain('lương hưu');

    answerYesNo(/lương hưu/, false);
    expect(screen.getByText(/Mẫu số 05 Phụ lục/)).toBeTruthy();
    clickNext();
    await heading(/Bước 2/);
  });

  it('đổi sang nhóm khác thì ẩn câu hỏi khoản 5', async () => {
    renderAt('#/buoc-1');
    await heading(/Bước 1/);
    pick(/^Khoản 5:/);
    answerYesNo(/hợp đồng lao động/, true);
    pick(/^Khoản 8:/);
    expect(screen.queryByRole('group', { name: /hợp đồng lao động/ })).toBeNull();
  });

  it('câu hỏi gợi ý đề xuất nhóm và chọn được nhóm từ gợi ý (kèm nhánh khoản 5)', async () => {
    renderAt('#/buoc-1');
    await heading(/Bước 1/);
    fireEvent.click(screen.getByRole('checkbox', { name: /hưởng lương hưu/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /cán bộ, công chức/ }));
    const status = screen.getByRole('status');
    expect(within(status).getByText(/Khoản 5:/)).toBeTruthy();
    expect(within(status).getByText(/Khoản 8:/)).toBeTruthy();
    fireEvent.click(within(status).getByRole('button', { name: 'Chọn khoản 5' }));
    expect((radio(/^Khoản 5:/) as HTMLInputElement).checked).toBe(true);
    const hdld = screen.getByRole('group', { name: /hợp đồng lao động/ });
    expect((within(hdld).getByRole('radio', { name: 'Không' }) as HTMLInputElement).checked).toBe(true);
    const huu = screen.getByRole('group', { name: /lương hưu/ });
    expect((within(huu).getByRole('radio', { name: 'Có' }) as HTMLInputElement).checked).toBe(true);
  });
});

describe('Bước 2 và chặn bỏ qua bước', () => {
  it('vào thẳng bước 2/3/kết quả khi chưa chọn nhóm thì hiện hướng dẫn quay lại bước 1', async () => {
    for (const hash of ['#/buoc-2', '#/buoc-3', '#/ket-qua']) {
      renderAt(hash);
      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toContain('Bạn chưa hoàn thành Bước 1');
      expect(within(alert).getByRole('link', { name: /Đến Bước 1/ })).toBeTruthy();
      cleanup();
    }
  });

  it('bắt buộc chọn điều kiện nhà ở; "ở xa nơi làm việc" ghi chưa hỗ trợ tạo mẫu; dự án không bắt buộc', async () => {
    renderAt('#/buoc-1');
    await heading(/Bước 1/);
    pick(/^Khoản 8:/);
    pick(/^Đã kết hôn/);
    clickNext();
    await heading(/Bước 2/);
    expect(radio(/ở xa nơi làm việc/).closest('label')?.textContent).toContain('chưa hỗ trợ tạo mẫu');
    expect(screen.getByLabelText('Tên dự án')).toBeTruthy();
    clickNext();
    expect(screen.getByRole('alert').textContent).toContain('Chọn điều kiện nhà ở.');
    pick(/^Chưa có nhà ở/);
    pick('Thuê mua');
    fireEvent.change(screen.getByLabelText('Tên dự án'), { target: { value: 'NOXH Đức Giang' } });
    clickNext();
    await heading(/Bước 3/);
    // Quay lại vẫn giữ lựa chọn.
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
    await heading(/Bước 2/);
    expect((radio('Thuê mua') as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText('Tên dự án') as HTMLInputElement).value).toBe('NOXH Đức Giang');
  });

  it('stepper đánh dấu bước hiện tại', async () => {
    renderAt('#/buoc-1');
    await heading(/Bước 1/);
    const nav = screen.getByRole('navigation', { name: 'Các bước' });
    expect(nav.querySelector('[aria-current="step"]')?.textContent).toContain('Nhóm đối tượng');
  });
});

describe('Bước 3: thông tin cá nhân', () => {
  it('lọc theo manifest: chỉ hiện trường các mẫu dùng; đều không bắt buộc, kèm gợi ý để trống; "Hiện tất cả" hiện đủ', async () => {
    await walkToStep3({ group: /^Khoản 8:/ });
    // Khoản 8, chưa có nhà: Đơn 01, Mẫu 01a, Mẫu 02 không có ngày sinh, giới tính, số điện thoại.
    for (const label of ['Ngày sinh', 'Giới tính', 'Số điện thoại']) expect(screen.queryByLabelText(label)).toBeNull();
    expect(screen.getByText(/Đã ẩn \d+ trường/)).toBeTruthy();
    for (const label of ['Họ và tên', 'Nơi thường trú', 'Nơi ở hiện tại', 'Nghề nghiệp', 'Thu nhập bình quân tháng (đồng)']) {
      const input = screen.getByLabelText(label);
      expect(input.hasAttribute('required')).toBe(false);
      const hintIds = (input.getAttribute('aria-describedby') ?? '').split(' ');
      expect(hintIds.map((id) => document.getElementById(id)?.textContent).join(' ')).toContain(
        'Để trống nếu muốn tự điền tay sau khi in',
      );
    }
    fireEvent.click(screen.getByRole('checkbox', { name: /Hiện tất cả/ }));
    for (const label of ['Ngày sinh', 'Giới tính', 'Số điện thoại']) expect(screen.getByLabelText(label)).toBeTruthy();
  });

  it('chỉ hiện phần vợ/chồng khi đã kết hôn', async () => {
    await walkToStep3({ group: /^Khoản 8:/ });
    expect(screen.queryByRole('group', { name: 'Vợ hoặc chồng' })).toBeNull();
    cleanup();
    await walkToStep3({ group: /^Khoản 8:/, married: /^Đã kết hôn/ });
    expect(screen.getByRole('group', { name: 'Vợ hoặc chồng' })).toBeTruthy();
    expect(screen.getByLabelText('Họ và tên vợ/chồng')).toBeTruthy();
  });

  it('để trống toàn bộ vẫn sang được bước kết quả', async () => {
    await walkToStep3({ group: /^Khoản 6:/ });
    clickNext();
    await heading(/Bước 4/);
  });

  it('CCCD sai định dạng thì báo lỗi và không chuyển bước', async () => {
    await walkToStep3({ group: /^Khoản 6:/ });
    const cccd = screen.getByLabelText('Số định danh cá nhân (CCCD, 12 số)');
    fireEvent.change(cccd, { target: { value: '123' } });
    clickNext();
    expect(await screen.findByText('Số định danh cá nhân (CCCD) phải gồm đúng 12 chữ số')).toBeTruthy();
    expect(cccd.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Bước 3/);
  });

  it('cảnh báo mềm khi độc thân thu nhập vượt 25 triệu; nuôi con thì ngưỡng 35 triệu; không chặn', async () => {
    await walkToStep3({ group: /^Khoản 6:/ });
    const income = screen.getByLabelText('Thu nhập bình quân tháng (đồng)');
    fireEvent.change(income, { target: { value: '20.000.000' } });
    expect(screen.queryByText(/Lưu ý về điều kiện thu nhập/)).toBeNull();
    fireEvent.change(income, { target: { value: '30.000.000' } });
    expect(await screen.findByText(/vượt ngưỡng 25 triệu đồng/)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: /nuôi con dưới tuổi thành niên/ }));
    await vi.waitFor(() => expect(screen.queryByText(/Lưu ý về điều kiện thu nhập/)).toBeNull());
    fireEvent.change(income, { target: { value: '40000000' } });
    expect(await screen.findByText(/vượt ngưỡng 35 triệu đồng/)).toBeTruthy();
    clickNext();
    await heading(/Bước 4/);
  });

  it('vợ chồng: cảnh báo khi tổng thu nhập vượt 50 triệu', async () => {
    await walkToStep3({ group: /^Khoản 8:/, married: /^Đã kết hôn/ });
    const [own, spouse] = screen.getAllByLabelText('Thu nhập bình quân tháng (đồng)');
    fireEvent.change(own as HTMLElement, { target: { value: '30000000' } });
    expect(screen.queryByText(/Lưu ý về điều kiện thu nhập/)).toBeNull();
    fireEvent.change(spouse as HTMLElement, { target: { value: '25000000' } });
    expect(await screen.findByText(/Tổng thu nhập của hai vợ chồng \(55 triệu đồng\/tháng\) vượt ngưỡng 50 triệu/)).toBeTruthy();
  });

  it('thông tin đã nhập được giữ khi quay lại; Xoá dữ liệu đặt lại mọi thứ', async () => {
    await walkToStep3({ group: /^Khoản 6:/ });
    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Nguyễn Văn An' } });
    clickNext();
    await heading(/Bước 4/);
    fireEvent.click(screen.getByRole('link', { name: 'Quay lại Bước 3' }));
    await heading(/Bước 3/);
    expect((screen.getByLabelText('Họ và tên') as HTMLInputElement).value).toBe('Nguyễn Văn An');

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Xoá dữ liệu' }));
    await screen.findByRole('heading', { name: /Tạo bộ hồ sơ/ });
    window.location.hash = '#/buoc-1';
    await heading(/Bước 1/);
    expect((radio(/^Khoản 6:/) as HTMLInputElement).checked).toBe(false);
    expect((radio(/^Độc thân/) as HTMLInputElement).checked).toBe(false);
    window.location.hash = '#/buoc-3';
    expect((await screen.findByRole('alert')).textContent).toContain('Bạn chưa hoàn thành Bước 1');
  });
});

describe('Bước 2: hình thức theo Điều 77 Luật Nhà ở, dự án, nhà ở', () => {
  async function toStep2(group: RegExp, married = /^Độc thân/) {
    renderAt('#/buoc-1');
    await heading(/Bước 1/);
    pick(group);
    pick(married);
    clickNext();
    await heading(/Bước 2/);
  }
  const hinhThucRadios = () =>
    within(screen.getByRole('group', { name: 'Hình thức' }))
      .getAllByRole('radio')
      .map((r) => r.closest('label')?.textContent);

  it('khoản 8: ba lựa chọn Mua, Thuê mua, Thuê; không có cảnh báo; chọn được "Thuê"', async () => {
    await toStep2(/^Khoản 8:/);
    expect(hinhThucRadios()).toEqual(['Mua', 'Thuê mua', 'Thuê']);
    expect(within(screen.getByRole('group', { name: 'Hình thức' })).queryByRole('note')).toBeNull();
    pick(/^Chưa có nhà ở/);
    pick('Thuê');
    expect((radio('Thuê') as HTMLInputElement).checked).toBe(true);
    clickNext();
    await heading(/Bước 3/);
  });

  it('khoản 11: chỉ có "Thuê", đã chọn sẵn, kèm cảnh báo mềm có căn cứ; không chặn', async () => {
    await toStep2(/^Khoản 11:/);
    expect(hinhThucRadios()).toEqual(['Thuê']);
    expect((radio('Thuê') as HTMLInputElement).checked).toBe(true);
    const note = within(screen.getByRole('group', { name: 'Hình thức' })).getByRole('note');
    expect(note.textContent).toContain('chỉ được thuê');
    expect(note.textContent).toContain('Khoản 6 Điều 77 Luật Nhà ở 2023');
    pick(/^Chưa có nhà ở/);
    clickNext();
    await heading(/Bước 3/);
  });

  it.each([
    [/^Khoản 2:/, 'Khoản 1 Điều 77'],
    [/^Khoản 3:/, 'Khoản 1 Điều 77'],
    [/^Khoản 7:/, 'Khoản 1, khoản 4 Điều 77'],
    [/^Khoản 13:/, 'chưa có văn bản hướng dẫn'],
  ])('%s: đủ ba hình thức kèm cảnh báo (%s)', async (group, text) => {
    await toStep2(group);
    expect(hinhThucRadios()).toHaveLength(3);
    expect(within(screen.getByRole('group', { name: 'Hình thức' })).getByRole('note').textContent).toContain(text);
    pick(/^Chưa có nhà ở/);
    pick('Mua');
    clickNext();
    await heading(/Bước 3/);
  });

  it('đổi nhóm sang khoản 11 thì bỏ hình thức "Mua" đã chọn và chọn sẵn "Thuê"; đổi lại thì giữ "Thuê"', async () => {
    await toStep2(/^Khoản 8:/);
    pick('Mua');
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
    await heading(/Bước 1/);
    pick(/^Khoản 11:/);
    clickNext();
    await heading(/Bước 2/);
    expect(screen.queryByRole('radio', { name: 'Mua' })).toBeNull();
    expect((radio('Thuê') as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
    await heading(/Bước 1/);
    pick(/^Khoản 8:/);
    clickNext();
    await heading(/Bước 2/);
    expect((radio('Thuê') as HTMLInputElement).checked).toBe(true);
    expect((radio('Mua') as HTMLInputElement).checked).toBe(false);
  });

  it('dự án có tỉnh và cơ quan cấp GCN; nhà ở hiện có chỉ hiện khi dưới 15 m²; giữ khi quay lại', async () => {
    await toStep2(/^Khoản 8:/);
    expect(screen.queryByLabelText(/Số Giấy chứng nhận/)).toBeNull();
    fireEvent.change(screen.getByLabelText('Tỉnh/thành phố nơi có dự án'), { target: { value: 'Hà Nội' } });
    const coQuan = screen.getByLabelText('Cơ quan cấp Giấy chứng nhận (nơi xác nhận Mẫu 02)') as HTMLInputElement;
    expect(coQuan.placeholder).toContain('Văn phòng đăng ký đất đai');
    fireEvent.change(coQuan, { target: { value: 'VPĐKĐĐ Hà Nội' } });
    pick(/dưới 15 m²/);
    fireEvent.change(screen.getByLabelText(/Số Giấy chứng nhận/), { target: { value: 'CS 01' } });
    const area = screen.getByLabelText('Diện tích sàn sử dụng nhà ở (m²)');
    fireEvent.change(area, { target: { value: 'abc' } });
    expect(screen.getByText('Diện tích không hợp lệ')).toBeTruthy();
    expect(area.getAttribute('aria-invalid')).toBe('true');
    fireEvent.change(area, { target: { value: '25,5' } });
    expect(screen.queryByText('Diện tích không hợp lệ')).toBeNull();
    pick('Mua');
    clickNext();
    await heading(/Bước 3/);
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
    await heading(/Bước 2/);
    expect((screen.getByLabelText('Tỉnh/thành phố nơi có dự án') as HTMLInputElement).value).toBe('Hà Nội');
    expect((screen.getByLabelText(/Số Giấy chứng nhận/) as HTMLInputElement).value).toBe('CS 01');
    expect((screen.getByLabelText('Diện tích sàn sử dụng nhà ở (m²)') as HTMLInputElement).value).toBe('25,5');
  });
});

describe('Bước 3: trường bổ sung', () => {
  it('đã kết hôn: nơi ở hiện tại, thông tin cư trú và giới tính của vợ/chồng, số ĐKKH; thành viên có ngày/nơi cấp', async () => {
    await walkToStep3({ group: /^Khoản 5:/, k5: { hdld: false, luongHuu: false }, married: /^Đã kết hôn/, housing: /dưới 15 m²/ });
    const me = screen.getByRole('group', { name: 'Người đứng đơn' });
    expect(within(me).getByLabelText('Nơi ở hiện tại')).toBeTruthy();
    expect(within(me).queryByLabelText(/Đối tượng cụ thể/)).toBeNull();
    const sp = screen.getByRole('group', { name: 'Vợ hoặc chồng' });
    for (const label of ['Giới tính', 'Nơi thường trú', 'Nơi tạm trú (nếu có)', 'Nơi ở hiện tại', 'Số Giấy chứng nhận đăng ký kết hôn']) {
      expect(within(sp).getByLabelText(label)).toBeTruthy();
    }
    expect(within(sp).queryByLabelText(/khoản 7/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Thêm thành viên' }));
    const members = screen.getByRole('group', { name: /Thành viên hộ gia đình/ });
    expect(within(members).getByLabelText('Ngày cấp CCCD')).toBeTruthy();
    expect(within(members).getByLabelText('Nơi cấp CCCD')).toBeTruthy();
  });

  it('khoản 7: đối tượng cụ thể và câu hỏi vợ/chồng thuộc khoản 7', async () => {
    await walkToStep3({ group: /^Khoản 7:/, married: /^Đã kết hôn/ });
    expect(screen.getByLabelText('Đối tượng cụ thể (cấp bậc, chức vụ...)')).toBeTruthy();
    const q = screen.getByLabelText(/Vợ\/chồng cũng thuộc lực lượng vũ trang/) as HTMLSelectElement;
    expect([...q.options].map((o) => o.textContent)).toEqual(['(Để trống)', 'Có', 'Không']);
  });

  it('mục "Nơi gửi / cơ quan xác nhận": một ô cho mỗi mẫu có dòng Kính gửi, gợi ý theo nơi xác nhận', async () => {
    await walkToStep3({ group: /^Khoản 5:/, k5: { hdld: false, luongHuu: false }, married: /^Đã kết hôn/, housing: /dưới 15 m²/ });
    const g = screen.getByRole('group', { name: /Nơi gửi \/ cơ quan xác nhận/ });
    const inputs = within(g).getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs).toHaveLength(2);
    const tt0805 = within(g).getByLabelText(/người thu nhập thấp không có hợp đồng lao động/) as HTMLInputElement;
    expect(tt0805.placeholder).toContain('Công an cấp xã');
    const tt0503 = within(g).getByLabelText(/dưới 15 m²/) as HTMLInputElement;
    expect(tt0503.placeholder).toContain('UBND cấp xã nơi đăng ký thường trú');
    const hintIds = (tt0805.getAttribute('aria-describedby') ?? '').split(' ');
    expect(hintIds.map((id) => document.getElementById(id)?.textContent).join(' ')).toContain('Để trống nếu muốn tự điền tay');
  });

  it('khoản 7: trường riêng được giữ khi quay lại', async () => {
    await walkToStep3({ group: /^Khoản 7:/, married: /^Đã kết hôn/ });
    fireEvent.change(screen.getByLabelText('Đối tượng cụ thể (cấp bậc, chức vụ...)'), { target: { value: 'Thiếu tá' } });
    fireEvent.change(screen.getByLabelText(/Vợ\/chồng cũng thuộc/), { target: { value: 'false' } });
    clickNext();
    await heading(/Bước 4/);
    fireEvent.click(screen.getByRole('link', { name: 'Quay lại Bước 3' }));
    await heading(/Bước 3/);
    expect((screen.getByLabelText('Đối tượng cụ thể (cấp bậc, chức vụ...)') as HTMLInputElement).value).toBe('Thiếu tá');
    expect((screen.getByLabelText(/Vợ\/chồng cũng thuộc/) as HTMLSelectElement).value).toBe('false');
    expect(screen.queryByRole('group', { name: /Nơi gửi/ })).toBeNull();
  });

  it('trường mới được giữ khi quay lại (draft round-trip); Xoá dữ liệu đặt lại', async () => {
    await walkToStep3({ group: /^Khoản 5:/, k5: { hdld: false, luongHuu: false }, married: /^Đã kết hôn/, housing: /dưới 15 m²/ });
    fireEvent.change(within(screen.getByRole('group', { name: 'Người đứng đơn' })).getByLabelText('Nơi ở hiện tại'), {
      target: { value: 'Ngõ 9 Kim Mã' },
    });
    const sp = screen.getByRole('group', { name: 'Vợ hoặc chồng' });
    fireEvent.change(within(sp).getByLabelText('Nơi thường trú'), { target: { value: 'Xã Vân Hà' } });
    fireEvent.change(within(sp).getByLabelText('Giới tính'), { target: { value: 'nam' } });
    fireEvent.change(within(sp).getByLabelText('Số Giấy chứng nhận đăng ký kết hôn'), { target: { value: '45/2015' } });
    fireEvent.click(screen.getByRole('button', { name: 'Thêm thành viên' }));
    const members = screen.getByRole('group', { name: /Thành viên hộ gia đình/ });
    fireEvent.change(within(members).getByLabelText('Nơi cấp CCCD'), { target: { value: 'Bộ Công an' } });
    fireEvent.change(within(members).getByLabelText('Ngày cấp CCCD'), { target: { value: '2023-03-03' } });
    const g = screen.getByRole('group', { name: /Nơi gửi \/ cơ quan xác nhận/ });
    fireEvent.change(within(g).getAllByRole('textbox')[0] as HTMLInputElement, { target: { value: 'Công an phường X' } });
    clickNext();
    await heading(/Bước 4/);
    fireEvent.click(screen.getByRole('link', { name: 'Quay lại Bước 3' }));
    await heading(/Bước 3/);
    expect((within(screen.getByRole('group', { name: 'Người đứng đơn' })).getByLabelText('Nơi ở hiện tại') as HTMLInputElement).value).toBe(
      'Ngõ 9 Kim Mã',
    );
    const sp2 = screen.getByRole('group', { name: 'Vợ hoặc chồng' });
    expect((within(sp2).getByLabelText('Nơi thường trú') as HTMLInputElement).value).toBe('Xã Vân Hà');
    expect((within(sp2).getByLabelText('Giới tính') as HTMLSelectElement).value).toBe('nam');
    expect((within(sp2).getByLabelText('Số Giấy chứng nhận đăng ký kết hôn') as HTMLInputElement).value).toBe('45/2015');
    const members2 = screen.getByRole('group', { name: /Thành viên hộ gia đình/ });
    expect((within(members2).getByLabelText('Nơi cấp CCCD') as HTMLInputElement).value).toBe('Bộ Công an');
    expect((within(members2).getByLabelText('Ngày cấp CCCD') as HTMLInputElement).value).toBe('2023-03-03');
    const g2 = screen.getByRole('group', { name: /Nơi gửi \/ cơ quan xác nhận/ });
    expect((within(g2).getAllByRole('textbox')[0] as HTMLInputElement).value).toBe('Công an phường X');

    // Xoá dữ liệu trong cùng phiên rồi đi lại các bước: mọi trường trống.
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Xoá dữ liệu' }));
    await screen.findByRole('heading', { name: /Tạo bộ hồ sơ/ });
    window.location.hash = '#/buoc-1';
    await heading(/Bước 1/);
    pick(/^Khoản 5:/);
    answerYesNo(/hợp đồng lao động/, false);
    answerYesNo(/lương hưu/, false);
    pick(/^Đã kết hôn/);
    clickNext();
    await heading(/Bước 2/);
    pick(/dưới 15 m²/);
    expect((screen.getByLabelText(/Số Giấy chứng nhận/) as HTMLInputElement).value).toBe('');
    pick('Mua');
    clickNext();
    await heading(/Bước 3/);
    expect((within(screen.getByRole('group', { name: 'Vợ hoặc chồng' })).getByLabelText('Nơi thường trú') as HTMLInputElement).value).toBe('');
    expect(within(screen.getByRole('group', { name: /Thành viên hộ gia đình/ })).queryAllByRole('listitem')).toHaveLength(0);
    expect((within(screen.getByRole('group', { name: /Nơi gửi/ })).getAllByRole('textbox')[0] as HTMLInputElement).value).toBe('');
  });
});
