/**
 * NousCharts Lab — app.js v2
 * Dark mode, tabs, auto-seed, export/import, toasts, custom confirm,
 * margin badges, adaptive chart colors, locale formatting.
 */

const charts = window.NousCharts;

const DB_NAME = 'nouscharts_db';
const DB_VERSION = 1;
const STORE = 'records';
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/* ───── DOM refs ───── */
const el = {
  darkModeBtn:      document.getElementById('darkModeBtn'),
  addRowBtn:        document.getElementById('addRowBtn'),
  seedBtn:          document.getElementById('seedBtn'),
  resetBtn:         document.getElementById('resetBtn'),
  exportBtn:        document.getElementById('exportBtn'),
  importBtn:        document.getElementById('importBtn'),
  importFile:       document.getElementById('importFile'),
  yearFilter:       document.getElementById('yearFilter'),
  regionFilter:     document.getElementById('regionFilter'),
  metricSelect:     document.getElementById('metricSelect'),
  searchInput:      document.getElementById('searchInput'),
  statsBox:         document.getElementById('statsBox'),
  tableBody:        document.getElementById('tableBody'),
  rowDialog:        document.getElementById('rowDialog'),
  rowForm:          document.getElementById('rowForm'),
  cancelDialogBtn:  document.getElementById('cancelDialogBtn'),
  closeDialogBtn:   document.getElementById('closeDialogBtn'),
  formMonth:        document.getElementById('formMonth'),
  formYear:         document.getElementById('formYear'),
  formRegion:       document.getElementById('formRegion'),
  formVentas:       document.getElementById('formVentas'),
  formCostes:       document.getElementById('formCostes'),
  formTickets:      document.getElementById('formTickets'),
  formSatisfaccion: document.getElementById('formSatisfaccion'),
  barChart:         document.getElementById('barChart'),
  lineChart:        document.getElementById('lineChart'),
  areaChart:        document.getElementById('areaChart'),
  donutChart:       document.getElementById('donutChart'),
  radarChart:       document.getElementById('radarChart'),
  heatmapChart:     document.getElementById('heatmapChart'),
  toastContainer:   document.getElementById('toastContainer'),
  confirmDialog:    document.getElementById('confirmDialog'),
  confirmTitle:     document.getElementById('confirmTitle'),
  confirmMsg:       document.getElementById('confirmMsg'),
  confirmOk:        document.getElementById('confirmOk'),
  confirmCancel:    document.getElementById('confirmCancel'),
};

const state = {
  rows: [],
  filtered: [],
  year: 'all',
  region: 'all',
  metric: 'ventas',
  search: '',
};

/* ───── Dark mode ───── */
function applyDark(dark) {
  document.body.classList.toggle('dark', dark);
  localStorage.setItem('nouscharts-dark', dark ? '1' : '0');
  renderCharts();
}
(function initDark() {
  const stored = localStorage.getItem('nouscharts-dark');
  const prefer = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = stored !== null ? stored === '1' : prefer;
  document.body.classList.toggle('dark', isDark);
})();
el.darkModeBtn?.addEventListener('click', () => {
  applyDark(!document.body.classList.contains('dark'));
});

/* ───── Tabs ───── */
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
  });
});

/* ───── Toast ───── */
function toast(msg, tone = 'info') {
  const div = document.createElement('div');
  div.className = `toast toast-${tone}`;
  const icons = { success: '\u2713', error: '\u2717', info: '\u2139', warning: '\u26A0' };
  div.textContent = `${icons[tone] || ''} ${msg}`;
  el.toastContainer.appendChild(div);
  setTimeout(() => div.remove(), 3500);
}

/* ───── Custom confirm ───── */
function nousConfirm(title, msg) {
  return new Promise(resolve => {
    el.confirmTitle.textContent = title;
    el.confirmMsg.textContent = msg;
    el.confirmDialog.showModal();
    const cleanup = (val) => { el.confirmDialog.close(); resolve(val); };
    el.confirmOk.onclick = () => cleanup(true);
    el.confirmCancel.onclick = () => cleanup(false);
  });
}

/* ───── IndexedDB ───── */
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        s.createIndex('year', 'year', { unique: false });
        s.createIndex('region', 'region', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbAction(mode, cb) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const r = cb(store);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    tx.oncomplete = () => db.close();
  });
}

const getAllRows = () => dbAction('readonly', s => s.getAll());
const addRow = (row) => dbAction('readwrite', s => s.add(row));
const deleteRow = (id) => dbAction('readwrite', s => s.delete(id));
const clearRows = () => dbAction('readwrite', s => s.clear());

/* ───── Seed data ───── */
function seedData() {
  const regions = ['Norte', 'Sur', 'Este', 'Oeste'];
  const out = [];
  for (const month of MONTHS) {
    for (const region of regions) {
      const base = 80 + Math.floor(Math.random() * 140);
      out.push({
        month, year: 2026, region,
        ventas: base,
        costes: Math.round(base * (0.45 + Math.random() * 0.25)),
        tickets: Math.round(base * (0.25 + Math.random() * 0.45)),
        satisfaccion: 65 + Math.floor(Math.random() * 34),
        createdAt: new Date().toISOString(),
      });
    }
  }
  return out;
}

/* ───── Filters & aggregation ───── */
function rebuildFilters() {
  const years = [...new Set(state.rows.map(r => r.year))].sort((a, b) => b - a);
  const regions = [...new Set(state.rows.map(r => r.region))].sort();
  el.yearFilter.innerHTML = `<option value="all">Todos</option>${years.map(y => `<option value="${y}">${y}</option>`).join('')}`;
  el.regionFilter.innerHTML = `<option value="all">Todas</option>${regions.map(r => `<option value="${r}">${r}</option>`).join('')}`;
  el.yearFilter.value = state.year;
  el.regionFilter.value = state.region;
}

function applyFilters() {
  const q = state.search.toLowerCase();
  state.filtered = state.rows.filter(r => {
    return (state.year === 'all' || String(r.year) === String(state.year))
      && (state.region === 'all' || r.region === state.region)
      && (q === '' || `${r.month} ${r.region}`.toLowerCase().includes(q));
  });
}

function groupByMonth(metric) {
  const map = new Map(MONTHS.map(m => [m, 0]));
  state.filtered.forEach(r => map.set(r.month, (map.get(r.month) || 0) + Number(r[metric] || 0)));
  return { labels: MONTHS, values: MONTHS.map(m => Math.round(map.get(m) || 0)) };
}

function groupByRegion(metric) {
  const regions = ['Norte', 'Sur', 'Este', 'Oeste'];
  const map = new Map(regions.map(r => [r, 0]));
  state.filtered.forEach(r => map.set(r.region, (map.get(r.region) || 0) + Number(r[metric] || 0)));
  return { labels: regions, values: regions.map(r => Math.round(map.get(r) || 0)) };
}

function radarData() {
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  return {
    labels: ['Ventas', 'Costes', 'Tickets', 'Satisfaccion'],
    values: ['ventas', 'costes', 'tickets', 'satisfaccion'].map(m => Math.round(avg(groupByMonth(m).values))),
  };
}

function heatmapData() {
  const rows = ['Norte', 'Sur', 'Este', 'Oeste'];
  const matrix = rows.map(region => MONTHS.map(month =>
    state.filtered.filter(r => r.region === region && r.month === month)
      .reduce((a, r) => a + Number(r.ventas || 0), 0)
  ));
  return { rows, cols: MONTHS, matrix };
}

/* ───── Chart colors (dark mode adaptive) ───── */
function getChartColors() {
  const d = document.body.classList.contains('dark');
  return {
    bg:         d ? '#26262b' : '#ffffff',
    color:      d ? '#a1a1aa' : '#4b5563',
    lineColor:  d ? '#71717a' : '#374151',
    gridColor:  d ? '#3a3a3f' : '#eef0f3',
    axisColor:  d ? '#4a4a50' : '#d9dde2',
    labelColor: d ? '#71717a' : '#6b7280',
    textColor:  d ? '#d4d4d8' : '#374151',
    mutedColor: d ? '#71717a' : '#6b7280',
    totalColor: d ? '#e4e4e7' : '#111827',
    fillTop:    d ? 'rgba(161,161,170,0.30)' : 'rgba(55,65,81,0.35)',
    fillBottom: d ? 'rgba(161,161,170,0.04)' : 'rgba(55,65,81,0.04)',
    fillColor:  d ? 'rgba(161,161,170,0.20)' : 'rgba(55,65,81,0.20)',
    heatColor:  d ? '161,161,170' : '55,65,81',
    donutColors: d
      ? ['#71717a','#a1a1aa','#52525b','#d4d4d8','#3f3f46']
      : ['#374151','#6b7280','#9ca3af','#d1d5db','#4b5563'],
  };
}

/* ───── Locale number ───── */
const fmt = v => Number(v).toLocaleString('es-ES');

/* ───── Render ───── */
function renderStats() {
  const n = state.filtered.length;
  const v = state.filtered.reduce((a, r) => a + r.ventas, 0);
  const c = state.filtered.reduce((a, r) => a + r.costes, 0);
  const m = v - c;
  const margenClass = m >= 0 ? 'kpi-positive' : 'kpi-negative';
  el.statsBox.innerHTML = `
    <article class="kpi kpi-blue"><strong>${fmt(n)}</strong><span>Registros activos</span></article>
    <article class="kpi kpi-green"><strong>${fmt(Math.round(v))}</strong><span>Ventas acumuladas</span></article>
    <article class="kpi kpi-amber"><strong>${fmt(Math.round(c))}</strong><span>Costes acumulados</span></article>
    <article class="kpi ${margenClass}"><strong>${fmt(Math.round(m))}</strong><span>Margen estimado</span></article>
  `;
}

function renderTable() {
  if (!state.filtered.length) {
    el.tableBody.innerHTML = '<tr><td colspan="9">Sin datos para el filtro actual.</td></tr>';
    return;
  }
  el.tableBody.innerHTML = state.filtered.map(r => {
    const m = r.ventas - r.costes;
    const cls = m >= 0 ? 'badge-positive' : 'badge-negative';
    return `<tr data-id="${r.id}">
      <td>${r.month}</td><td>${r.year}</td><td>${r.region}</td>
      <td>${fmt(r.ventas)}</td><td>${fmt(r.costes)}</td>
      <td><span class="badge ${cls}">${fmt(m)}</span></td>
      <td>${fmt(r.tickets)}</td><td>${r.satisfaccion}</td>
      <td><button class="secondary" data-action="delete">Eliminar</button></td>
    </tr>`;
  }).join('');
}

function renderCharts() {
  const cc = getChartColors();
  const monthly = groupByMonth(state.metric);
  const monthlyV = groupByMonth('ventas');
  const byRegion = groupByRegion(state.metric);
  const radar = radarData();
  const heat = heatmapData();

  charts.drawBarChart(el.barChart, monthly.labels, monthly.values, {
    bg: cc.bg, color: cc.color, gridColor: cc.gridColor, axisColor: cc.axisColor,
    labelColor: cc.labelColor, textColor: cc.textColor });

  charts.drawLineChart(el.lineChart, monthly.labels, monthly.values, {
    bg: cc.bg, color: cc.lineColor, pointColor: cc.textColor, gridColor: cc.gridColor,
    axisColor: cc.axisColor, labelColor: cc.labelColor, textColor: cc.textColor });

  charts.drawAreaChart(el.areaChart, monthlyV.labels, monthlyV.values, {
    bg: cc.bg, color: cc.lineColor, stroke: cc.lineColor, gridColor: cc.gridColor,
    axisColor: cc.axisColor, labelColor: cc.labelColor,
    fillTop: cc.fillTop, fillBottom: cc.fillBottom });

  charts.drawDonutChart(el.donutChart, byRegion.labels, byRegion.values, {
    bg: cc.bg, centerText: state.metric, colors: cc.donutColors,
    labelColor: cc.textColor, mutedColor: cc.mutedColor, textColor: cc.totalColor });

  charts.drawRadarChart(el.radarChart, radar.labels, radar.values, {
    bg: cc.bg, color: cc.lineColor, gridColor: cc.gridColor, axisColor: cc.gridColor,
    labelColor: cc.labelColor, fillColor: cc.fillColor });

  charts.drawHeatmap(el.heatmapChart, heat.rows, heat.cols, heat.matrix, {
    bg: cc.bg, labelColor: cc.labelColor, textColor: cc.textColor, heatColor: cc.heatColor });
}

function renderAll() {
  applyFilters();
  renderStats();
  renderTable();
  renderCharts();
}

async function refresh() {
  state.rows = await getAllRows();
  state.rows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  rebuildFilters();
  renderAll();
}

/* ───── Events ───── */
el.addRowBtn.addEventListener('click', () => el.rowDialog.showModal());
el.cancelDialogBtn.addEventListener('click', () => el.rowDialog.close());
el.closeDialogBtn.addEventListener('click', () => el.rowDialog.close());

el.rowForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await addRow({
    month: el.formMonth.value,
    year: Number(el.formYear.value),
    region: el.formRegion.value,
    ventas: Number(el.formVentas.value),
    costes: Number(el.formCostes.value),
    tickets: Number(el.formTickets.value),
    satisfaccion: Number(el.formSatisfaccion.value),
    createdAt: new Date().toISOString(),
  });
  el.rowForm.reset();
  el.rowDialog.close();
  toast('Registro anadido', 'success');
  await refresh();
});

el.seedBtn.addEventListener('click', async () => {
  for (const row of seedData()) await addRow(row);
  toast('Dataset demo cargado (48 registros)', 'info');
  await refresh();
});

el.resetBtn.addEventListener('click', async () => {
  const ok = await nousConfirm('Reset base de datos', 'Se eliminaran todos los registros. Esta accion no se puede deshacer.');
  if (!ok) return;
  await clearRows();
  toast('Base de datos vaciada', 'success');
  await refresh();
});

el.tableBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action="delete"]');
  if (!btn) return;
  const tr = e.target.closest('tr[data-id]');
  if (!tr) return;
  const ok = await nousConfirm('Eliminar registro', 'Se eliminara este registro de la base de datos.');
  if (!ok) return;
  await deleteRow(Number(tr.dataset.id));
  toast('Registro eliminado', 'success');
  await refresh();
});

/* Export */
el.exportBtn.addEventListener('click', async () => {
  const data = await getAllRows();
  if (!data.length) { toast('Sin datos para exportar', 'warning'); return; }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const d = new Date().toISOString().slice(0, 10);
  a.download = `nouscharts_${d}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Datos exportados como JSON', 'success');
});

/* Import */
el.importBtn.addEventListener('click', () => el.importFile.click());
el.importFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('El archivo debe contener un array JSON');
    let count = 0;
    for (const row of data) {
      if (row.month && row.year && row.region) {
        const { id, ...clean } = row;
        clean.createdAt = clean.createdAt || new Date().toISOString();
        await addRow(clean);
        count++;
      }
    }
    toast(`${count} registros importados`, 'success');
    await refresh();
  } catch (err) {
    toast(`Error al importar: ${err.message}`, 'error');
  }
  el.importFile.value = '';
});

/* Filters */
el.yearFilter.addEventListener('change', () => { state.year = el.yearFilter.value; renderAll(); });
el.regionFilter.addEventListener('change', () => { state.region = el.regionFilter.value; renderAll(); });
el.metricSelect.addEventListener('change', () => { state.metric = el.metricSelect.value; renderCharts(); });
el.searchInput.addEventListener('input', () => { state.search = el.searchInput.value.trim(); renderAll(); });

/* ───── Boot ───── */
(async function boot() {
  try {
    state.rows = await getAllRows();
    /* Auto-seed en primera ejecucion */
    if (!state.rows.length) {
      for (const row of seedData()) await addRow(row);
      state.rows = await getAllRows();
      toast('Datos de ejemplo cargados automaticamente', 'info');
    }
    state.rows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    rebuildFilters();
    renderAll();
  } catch (err) {
    console.error(err);
  }
})();
