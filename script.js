let selectedTableId = null;
let currentMenuFilter = 'all';
let currentFilter = 'all';

const params = new URLSearchParams(window.location.search);
const paramTableId = parseInt(params.get('tableId'));
if (!isNaN(paramTableId)) {
  selectedTableId = paramTableId;
}

const statusCycle = ['empty', 'reserved', 'occupied'];

let tables = JSON.parse(localStorage.getItem('tables')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || {};
let menu = JSON.parse(localStorage.getItem('menu')) || [];

function saveTables() { localStorage.setItem('tables', JSON.stringify(tables)); }
function saveOrders() { localStorage.setItem('orders', JSON.stringify(orders)); }
function saveMenu()   { localStorage.setItem('menu', JSON.stringify(menu)); }

function renderTables() {
  const tableList = document.getElementById('tableList');
  tableList.innerHTML = '';
  tables.forEach(table => {
    const hasOrder = orders[table.id] && orders[table.id].length > 0;
    table.status = hasOrder ? 'occupied' : (table.status === 'occupied' ? 'empty' : table.status);
    const div = document.createElement('div');
    div.className = `table-item ${table.status}`;
    div.innerHTML = `Bàn ${table.id}<br>
      <span>${hasOrder ? 'Đang sử dụng' : (table.status === 'reserved' ? 'Đã đặt trước' : 'Trống')}</span><br>
      <button onclick="selectTable(${table.id})">Đặt món</button>
      <button onclick="showDetail(${table.id})">Chi tiết</button>
      <button onclick="deleteTable(${table.id})">Xoá</button>`;
    tableList.appendChild(div);
  });
  saveTables();
}

function selectTable(id) {
  window.location.href = `dat_mon.html?tableId=${id}`;
}

function addTable() {
  const maxId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) : 0;
  const newId = maxId + 1;
  tables.push({ id: newId, status: 'empty' });
  saveTables();
  renderTables();
}

function deleteTable(id) {
  if (!confirm(`Bạn có chắc muốn xoá bàn ${id} không?`)) return;
  tables = tables.filter(t => t.id !== id);
  delete orders[id];
  saveTables();
  saveOrders();
  renderTables();
}

function setCurrentMenuFilter(type) {
  currentMenuFilter = type;
  document.querySelectorAll('#menuTabs button').forEach(btn => btn.classList.remove('active'));
  const selectedBtn = Array.from(document.querySelectorAll('#menuTabs button')).find(b => b.textContent.trim().toLowerCase() === type.toLowerCase());
  if (selectedBtn) selectedBtn.classList.add('active');
  renderMenuForOrdering();
}

function renderMenuForOrdering() {
  const container = document.getElementById('menuForOrdering');
  if (!container) return;
  container.innerHTML = '';

  const filteredMenu = currentMenuFilter === 'all'
    ? menu
    : menu.filter(item => item.type.toLowerCase() === currentMenuFilter.toLowerCase());

  filteredMenu.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'menu-item order';
    div.innerHTML = `
      <div>
        <strong>${item.name}</strong><br>
        ${
          item.manualPrice
            ? `Giá: <input type="number" id="price_${index}" min="0" style="width:80px">đ<br>`
            : `Giá: ${item.price.toLocaleString()}đ<br>`
        }
        <label>Số lượng: <input type="number" min="1" value="1" id="qty_${index}" style="width:60px"></label><br>
        <input type="text" id="note_${index}" placeholder="Ghi chú" style="width:100%"><br>
        <button onclick="addOrderFromFilteredIndex(${index})">Chọn</button>
      </div>`;
    container.appendChild(div);
  });

  const preview = document.createElement('div');
  preview.id = 'orderPreview';
  container.appendChild(preview);
  renderOrderPreview();
}

// ✅ Di chuyển ra ngoài (toàn cục)
function addOrderFromFilteredIndex(index) {
  const filteredMenu = currentMenuFilter === 'all'
    ? menu
    : menu.filter(item => item.type.toLowerCase() === currentMenuFilter.toLowerCase());

  const item = filteredMenu[index];
  if (!item) return;

  const qtyInput = document.getElementById(`qty_${index}`);
  const noteInput = document.getElementById(`note_${index}`);
  const priceInput = document.getElementById(`price_${index}`);

  const qty = parseInt(qtyInput.value);
  const note = noteInput.value || '';
  const price = item.manualPrice ? parseInt(priceInput.value) : item.price;

  if (!qty || qty <= 0 || isNaN(price) || price <= 0) {
    alert("Vui lòng nhập đúng số lượng và giá.");
    return;
  }

  if (item.manualPrice && (!priceInput.value || parseInt(priceInput.value) <= 0)) {
    alert("Vui lòng nhập giá cho món này!");
    return;
  }

  if (!Array.isArray(orders[selectedTableId])) {
    orders[selectedTableId] = [];
  }

  if (!orders[selectedTableId].checkInTime) {
    orders[selectedTableId].checkInTime = new Date().toISOString();
  }

  orders[selectedTableId].push({
    name: item.name,
    qty,
    note,
    price,
    unit: item.unit?.trim() || 'đĩa',
    status: 'Đang chuẩn bị'
  });

  const table = tables.find(t => t.id === selectedTableId);
  if (table) table.status = 'occupied';

  saveOrders();
  saveTables();
  renderOrderList(selectedTableId);
  renderOrderPreview();

  alert(`✔️ Đã thêm ${item.name} (${qty}) vào đơn bàn ${selectedTableId}`);
}



function addOrderFromMenuIndex(index) {
  if (selectedTableId == null) return;
  const item = menu[index];
  const qtyInput = document.getElementById(`qty_${index}`);
  const noteInput = document.getElementById(`note_${index}`);
  const priceInput = document.getElementById(`price_${index}`);

  const qty = parseInt(qtyInput.value);
  const note = noteInput.value || '';
  const price = item.manualPrice ? parseInt(priceInput.value) : item.price;

  if (!qty || qty <= 0 || isNaN(price) || price <= 0) {
    alert("Vui lòng nhập đúng số lượng và giá.");
    return;
  }

  if (item.manualPrice && (!priceInput.value || parseInt(priceInput.value) <= 0)) {
    alert("Vui lòng nhập giá cho món này!");
    return;
  }

  if (!Array.isArray(orders[selectedTableId])) {
    orders[selectedTableId] = [];
  }
  if (!orders[selectedTableId].checkInTime) {
    orders[selectedTableId].checkInTime = new Date().toISOString();
  }


  orders[selectedTableId].push({
    name: item.name,
    qty,
    note,
    price,
    unit: item.unit?.trim() || (menu.find(m => m.name === item.name)?.unit?.trim() || 'đĩa'),
    status: 'Đang chuẩn bị'
  });

  const table = tables.find(t => t.id === selectedTableId);
  if (table) table.status = 'occupied';

  saveOrders();
  saveTables();
  renderOrderList(selectedTableId);
  renderOrderPreview();
  alert(`✔️ Đã thêm ${item.name} (${qty}) vào đơn bàn ${selectedTableId}`);
}


function printInvoice(tableId, total) {
  const tableOrders = orders[tableId];
  if (!Array.isArray(tableOrders)) {
    alert("Đơn đặt món không hợp lệ.");
    return;
  }

  // 👉 Giờ vào / ra
  if (!orders[tableId].checkInTime) {
    orders[tableId].checkInTime = new Date().toISOString();
  }
  if (!orders[tableId].checkOutTime) {
    orders[tableId].checkOutTime = new Date().toISOString(); // lưu lại giờ ra lần đầu
  }

  const now = new Date();
  const checkInTime = new Date(orders[tableId].checkInTime);
  const checkOutTime = new Date(orders[tableId].checkOutTime);
  const timeIn = checkInTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const timeOut = checkOutTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = checkOutTime.toLocaleDateString('vi-VN');

  // Mã hóa đơn
  if (!orders[tableId].invoiceId) {
    orders[tableId].invoiceId = String(Date.now()).slice(-6);
  }
  const invoiceId = orders[tableId].invoiceId;

  // Nội dung hóa đơn
  let content = `
    <div style="font-family: monospace; padding: 10px; width: 300px; border: 1px solid #000;">
      <center>
        <h3 style="margin: 5px 0;">HÂN HÂN QUÁN</h3>
        <div>CS2</div>
        <div>ĐC:  Ô 51, đường DA7, tổ 9, KDC Việt Sing, kp Hoà Lân2, Phường Thuận Giao, tp Thuận An, TP HCM</div>
        <div>ĐT: 0377.1760.33</div>
        <hr>
        <h3 style="margin: 5px 0;">HÓA ĐƠN BÁN HÀNG</h3>
        <div>BÀN ${tableId.toString().padStart(2, '0')}</div>
      </center>
      <div style="margin-top: 10px;">Ngày: ${dateStr} &nbsp;&nbsp;&nbsp; Số: ${invoiceId}</div>
      <div>Thu ngân: Lý Du &nbsp; In lúc: ${timeOut}</div>
      <div>Giờ vào: ${timeIn} &nbsp;&nbsp;&nbsp; Giờ ra: ${timeOut}</div>
      <hr>
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;" border="1" cellspacing="0" cellpadding="5">
        <thead style="background-color: #eee;">
          <tr>
            <th style="text-align:left;">Món</th>
            <th style="text-align:center;">SL</th>
            <th style="text-align:center;">ĐVT</th>
            <th style="text-align:right;">Đơn giá</th>
            <th style="text-align:right;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
  `;

  const enrichedOrders = tableOrders.filter(item => item.name).map(item => {
    const price = item.price || 0;
    const unit = item.unit?.trim() || 'đĩa';
    const itemTotal = price * item.qty;
    content += `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center;">${item.qty}</td>
        <td style="text-align:center;">${unit}</td>
        <td style="text-align:right;">${price.toLocaleString()}</td>
        <td style="text-align:right;">${itemTotal.toLocaleString()}</td>
      </tr>
    `;
    return { name: item.name, qty: item.qty, price, unit };
  });

  content += `
        </tbody>
      </table>
      <hr>
      <div style="text-align:right; font-size:16px; margin-top:10px;"><strong>Tổng cộng: ${total.toLocaleString()}đ</strong></div>
      <hr>
      <center><p>Cảm ơn Quý khách. Hẹn gặp lại!</p></center>
    </div>
  `;

  // ✅ Ghi trạng thái đơn & lưu vào lịch sử
  tableOrders.forEach(item => {
    item.status = 'Đã in hóa đơn';
    if (!item.unit || !item.unit.trim()) {
      const menuItem = menu.find(m => m.name === item.name);
      item.unit = menuItem?.unit?.trim() || 'đĩa';
    }
  });

  orders[tableId].invoiceSaved = true;
  saveOrders();

  let history = JSON.parse(localStorage.getItem('invoiceHistory') || '[]');
  history.push({
    invoiceId,
    tableId,
    time: orders[tableId].checkOutTime,
    orders: enrichedOrders,
    total
  });
  localStorage.setItem('invoiceHistory', JSON.stringify(history));

  // 🖨 In hóa đơn
  const newWin = window.open('', '', 'width=400,height=600');
  newWin.document.write(content);
  newWin.document.close();
  newWin.print();
}



function showDetail(id) {
  const modal = document.getElementById('detailModal');
  const body = document.getElementById('modalContent');
  const tableOrders = orders[id] || [];

  let total = 0;
  const now = new Date();
  const checkInTime = orders[id]?.checkInTime ? new Date(orders[id].checkInTime) : now;
  const timeIn = checkInTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const timeOut = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('vi-VN');
  const invoiceId = orders[id]?.invoiceId || '(Chưa in hóa đơn)';

  let html = `
    <div style="font-family: monospace; padding: 10px; width: 300px;">
      <center>
        <h3 style="margin: 5px 0;">HÂN HÂN QUÁN</h3>
        <div>CS2</div>
        <div>ĐC:  Ô 51, đường DA7, tổ 9, KDC Việt Sing, kp Hoà Lân2, Phường Thuận Giao, tp Thuận An, TP HCM</div>
        <div>ĐT: 0377.176.033</div>
        <hr>
        <h3 style="margin: 5px 0;">HÓA ĐƠN BÁN HÀNG</h3>
        <div>BÀN ${id.toString().padStart(2, '0')}</div>
      </center>
      <div style="margin-top: 10px;">Ngày: ${dateStr} &nbsp;&nbsp;&nbsp; Số: ${invoiceId}</div>
      <div>Thu ngân: Lý Du &nbsp; In lúc: ${timeOut}</div>
      <div>Giờ vào: ${timeIn} &nbsp;&nbsp;&nbsp; Giờ ra: ${timeOut}</div>
      <hr>
      <table style="width: 100%; font-size: 14px;">
        <thead>
          <tr>
            <th style="text-align:left;">Mặt hàng</th>
            <th>SL</th>
            <th>ĐVT</th>
            <th>Giá</th>
            <th>T.tiền</th>
          </tr>
        </thead>
        <tbody>
  `;

  tableOrders.forEach(item => {
    const menuItem = menu.find(m => m.name === item.name);
    const price = item.price ?? (menuItem ? menuItem.price : 0);
    const unit = item.unit || menuItem?.unit || 'đĩa';
    const itemTotal = price * item.qty;
    total += itemTotal;

    html += `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center;">${item.qty}</td>
        <td style="text-align:center;">${unit}</td>
        <td style="text-align:right;">${price.toLocaleString()}</td>
        <td style="text-align:right;">${itemTotal.toLocaleString()}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
      <hr>
      <div style="text-align:right; font-size:16px;"><strong>Tổng cộng: ${total.toLocaleString()}đ</strong></div>
      <hr>
      <center>
        <button onclick="printInvoice(${id}, ${total})">🖨 In hóa đơn</button>
        <button onclick="markTableAsPaid(${id})">💰 Đã thanh toán</button>
      </center>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
  `;

  body.innerHTML = html;
  modal.style.display = 'flex';
}


function closeModal() {
  document.getElementById('detailModal').style.display = 'none';
}

function calcTotal(id) {
  const tableOrders = orders[id] || [];
  let total = 0;
  tableOrders.forEach(item => {
    const menuItem = menu.find(m => m.name === item.name);
    const price = menuItem ? menuItem.price : 0;
    total += price * item.qty;
  });
  return total;
}

if (document.getElementById('tableList')) {
  renderTables();
}

function renderOrderList(tableId) {
  const list = document.getElementById('orderList');
  if (!list) return;
  list.innerHTML = '';

  const tableOrders = orders[tableId] || [];
  tableOrders.forEach((item, index) => {
    if (!item.name) return;
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${item.name}</strong> - SL: ${item.qty} - ${item.note || ''}
      <button onclick="decreaseQty(${index})">-</button>
      <button onclick="increaseQty(${index})">+</button>
      <button onclick="removeItem(${index})">🗑</button>
    `;
    list.appendChild(li);
  });

  if (tableOrders.length > 0) {
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '✅ Xác nhận đặt món';
    confirmBtn.onclick = confirmOrder;
    list.appendChild(confirmBtn);
  }
}

function increaseQty(index) {
  if (!orders[selectedTableId] || !orders[selectedTableId][index]) return;
  orders[selectedTableId][index].qty += 1;
  saveOrders();
  renderOrderList(selectedTableId);
  renderOrderPreview();
}

function decreaseQty(index) {
  if (!orders[selectedTableId] || !orders[selectedTableId][index]) return;
  if (orders[selectedTableId][index].qty > 1) {
    orders[selectedTableId][index].qty -= 1;
  } else {
    orders[selectedTableId].splice(index, 1);
  }
  saveOrders();
  renderOrderList(selectedTableId);
  renderOrderPreview();
}

function removeItem(index) {
  if (!orders[selectedTableId]) return;
  orders[selectedTableId].splice(index, 1);
  saveOrders();
  renderOrderList(selectedTableId);
  renderOrderPreview();
}

function confirmOrder() {
  if (!orders[selectedTableId] || orders[selectedTableId].length === 0) {
    alert("Không có món để xác nhận!");
    return;
  }
  orders[selectedTableId].forEach(item => {
    if (item.status === 'Đang chuẩn bị') {
      item.status = 'Đã xác nhận';
    }
  });
  saveOrders();
  alert("✔️ Đã xác nhận đơn!");

  // 👉 Chuyển về trang bàn ăn
  window.location.href = 'index.html';
}


function renderOrderPreview() {
  const preview = document.getElementById('orderPreview');
  if (!preview || selectedTableId == null) return;

  const tableOrders = orders[selectedTableId] || [];
  let html = '<h4>Đơn tạm:</h4><ul>';
  tableOrders.forEach(item => {
    if (!item.name) return;
    html += `<li>${item.name} - SL: ${item.qty} - ${item.note || ''}</li>`;
  });
  html += '</ul>';
  preview.innerHTML = html;
}

function markTableAsPaid(id) {
  if (!confirm(`Xác nhận bàn ${id} đã thanh toán?`)) return;

  const table = tables.find(t => t.id === id);
  const tableOrders = orders[id];
  if (!tableOrders) return;

  // ✅ Lấy lại số hóa đơn đã in
  const invoiceId = orders[id].invoiceId;
  if (!invoiceId) {
    alert("❗ Hóa đơn chưa được in nên chưa thể thanh toán!");
    return;
  }

  // ✅ Nếu chưa lưu vào doanh thu thì lưu
  if (tableOrders.length > 0 && !tableOrders.invoiceSaved) {
    const enrichedOrders = tableOrders.filter(item => item.name).map(item => ({
      name: item.name,
      qty: item.qty,
      price: item.price,
      unit: item.unit?.trim()
  ? item.unit.trim()
  : (menu.find(m => m.name === item.name)?.unit?.trim() || 'đĩa')

    }));

    let history = JSON.parse(localStorage.getItem('invoiceHistory') || '[]');
    history.push({
      invoiceId,
      tableId: id,
      time: new Date().toISOString(),
      orders: enrichedOrders,
      total: calcTotalFromOrder(tableOrders)
    });
    localStorage.setItem('invoiceHistory', JSON.stringify(history));

    orders[id].invoiceSaved = true; // ✅ đánh dấu đã lưu
  }

  // ✅ Cập nhật trạng thái bàn và xoá đơn
  if (table) {
    table.status = 'empty';
  }

  delete orders[id];
  saveTables();
  saveOrders();

  alert(`✔️ Bàn ${id} đã thanh toán và ghi nhận vào doanh thu.`);
  closeModal();

  if (document.getElementById('tableList')) renderTables();
  if (typeof renderOrderList === 'function') {
    renderOrderList(id);
    renderOrderPreview();
    renderMenuForOrdering();
  }
}

function renderMenu() {
  const menuList = document.getElementById('menuList');
  const search = document.getElementById('searchFood')?.value?.toLowerCase() || '';
  const filtered = currentFilter === 'all'
    ? menu
    : menu.filter(item => item.type.toLowerCase() === currentFilter.toLowerCase());

  const results = filtered.filter(item => item.name.toLowerCase().includes(search));
  menuList.innerHTML = '';

  results.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.innerHTML = `
      <strong>${item.name}</strong> - ${item.price.toLocaleString()}đ - ${item.unit || 'đĩa'}<br>
      <em>${item.type}</em>
      <button onclick="deleteMenuItem(${index})">🗑</button>
    `;
    menuList.appendChild(div);
  });
}

function addMenuItem() {
  const name = document.getElementById('newFoodName').value.trim();
  const price = parseInt(document.getElementById('newFoodPrice').value);
  const type = document.getElementById('newFoodType').value;
  const file = document.getElementById('newFoodFile').files[0];
  const unitRaw = document.getElementById('newFoodUnit').value;
  const unit = unitRaw && unitRaw.trim() ? unitRaw.trim() : 'đĩa';
  const manualPrice = document.getElementById('manualPriceCheckbox').checked;
  if (!name || isNaN(price)) {
    alert("Vui lòng nhập đầy đủ tên và giá món.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const image = e.target.result;
    menu.push({ name, price: manualPrice ? 0 : price, type, image, unit, manualPrice });
    saveMenu();
    renderMenu();
    document.getElementById('newFoodName').value = '';
    document.getElementById('newFoodPrice').value = '';
    document.getElementById('newFoodFile').value = '';
  };

  if (file) {
    reader.readAsDataURL(file);
  } else {
    menu.push({ name, price: manualPrice ? 0 : price, type, image: '', unit, manualPrice });
    saveMenu();
    renderMenu();
    document.getElementById('newFoodName').value = '';
    document.getElementById('newFoodPrice').value = '';
  }
}

function deleteMenuItem(index) {
  if (!confirm("Xóa món này?")) return;
  menu.splice(index, 1);
  saveMenu();
  renderMenu();
}

function filterMenu(type) {
  currentFilter = type;
  renderMenu();
}
function calcTotalFromOrder(orderList) {
  let total = 0;
  orderList.forEach(item => {
    total += item.price * item.qty;
  });
  return total;
}