const charts = window.NousCharts;

const DB_NAME = 'nouscharts_db';
const DB_VERSION = 1;
const STORE = 'records';
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const el = {
  addRowBtn: document.getElementById('addRowBtn'),
  seedBtn: document.getElementById('seedBtn'),
  resetBtn: document.getElementById('resetBtn'),
  yearFilter: document.getElementById('yearFilter'),
  regionFilter: document.getElementById('regionFilter'),
  metricSelect: document.getElementById('metricSelect'),
  searchInput: document.getElementById('searchInput'),
  statsBox: document.getElementById('statsBox'),
  tableBody: document.getElementById('tableBody'),
  rowDialog: document.getElementById('rowDialog'),
  rowForm: document.getElementById('rowForm'),
  cancelDialogBtn: document.getElementById('cancelDialogBtn'),
  formMonth: document.getElementById('formMonth'),
  formYear: document.getElementById('formYear'),
  formRegion: document.getElementById('formRegion'),
  formVentas: document.getElementById('formVentas'),
  formCostes: document.getElementById('formCostes'),
  formTickets: document.getElementById('formTickets'),
  formSatisfaccion: document.getElementById('formSatisfaccion'),
  barChart: document.getElementById('barChart'),
  lineChart: document.getElementById('lineChart'),
  areaChart: document.getElementById('areaChart'),
  donutChart: document.getElementById('donutChart'),
  radarChart: document.getElementById('radarChart'),
  heatmapChart: document.getElementById('heatmapChart'),
};

const state = {
  rows: [],
  filtered: [],
  year: 'all',
  region: 'all',
  metric: 'ventas',
  search: '',
};

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('year', 'year', { unique: false });
        store.createIndex('region', 'region', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbAction(mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = callback(store);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

const getAllRows = () => dbAction('readonly', (store) => store.getAll());
const addRow = (row) => dbAction('readwrite', (store) => store.add(row));
const deleteRow = (id) => dbAction('readwrite', (store) => store.delete(id));
const clearRows = () => dbAction('readwrite', (store) => store.clear());

function seedData() {
  const regions = ['Norte', 'Sur', 'Este', 'Oeste'];
  const out = [];
  for (const month of MONTHS) {
    for (const region of regions) {
      const base = 80 + Math.floor(Math.random() * 140);
      const coste = Math.round(base * (0.45 + Math.random() * 0.25));
      const tickets = Math.round(base * (0.25 + Math.random() * 0.45));
      const sat = 65 + Math.floor(Math.random() * 34);
      out.push({
        month,
        year: 2026,
        region,
        ventas: base,
        costes: coste,
        tickets,
        satisfaccion: sat,
        createdAt: new Date().toISOString(),
      });
    }
  }
  return out;
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map((r) => r[key]))];
}

function rebuildFilters() {
  const years = uniqueValues(state.rows, 'year').sort((a, b) => b - a);
  const regions = uniqueValues(state.rows, 'region').sort();

  const currentYear = state.year;
  const currentRegion = state.region;

  el.yearFilter.innerHTML = `<option value="all">Todos</option>${years.map((y) => `<option value="${y}">${y}</option>`).join('')}`;
  el.regionFilter.innerHTML = `<option value="all">Todas</option>${regions.map((r) => `<option value="${r}">${r}</option>`).join('')}`;

  state.year = years.includes(Number(currentYear)) ? String(currentYear) : 'all';
  state.region = regions.includes(currentRegion) ? currentRegion : 'all';

  el.yearFilter.value = state.year;
  el.regionFilter.value = state.region;
}

function applyFilters() {
  const q = state.search.toLowerCase();
  state.filtered = state.rows.filter((row) => {
    const byYear = state.year === 'all' || String(row.year) === String(state.year);
    const byRegion = state.region === 'all' || row.region === state.region;
    const bySearch = q === '' || `${row.month} ${row.region}`.toLowerCase().includes(q);
    return byYear && byRegion && bySearch;
  });
}

function groupByMonth(metric) {
  const map = new Map(MONTHS.map((m) => [m, 0]));
  state.filtered.forEach((row) => {
    map.set(row.month, (map.get(row.month) || 0) + Number(row[metric] || 0));
  });
  return { labels: MONTHS, values: MONTHS.map((m) => Math.round(map.get(m) || 0)) };
}

function groupByRegion(metric) {
  const regions = ['Norte', 'Sur', 'Este', 'Oeste'];
  const map = new Map(regions.map((r) => [r, 0]));
  state.filtered.forEach((row) => {
    map.set(row.region, (map.get(row.region) || 0) + Number(row[metric] || 0));
  });
  return { labels: regions, values: regions.map((r) => Math.round(map.get(r) || 0)) };
}

function radarData() {
  const m = groupByMonth('ventas').values;
  const c = groupByMonth('costes').values;
  const t = groupByMonth('tickets').values;
  const s = groupByMonth('satisfaccion').values;

  const avg = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0) / arr.length : 0;

  return {
    labels: ['Ventas', 'Costes', 'Tickets', 'Satisfacción'],
    values: [avg(m), avg(c), avg(t), avg(s)].map((x) => Math.round(x)),
  };
}

function heatmapData() {
  const rows = ['Norte', 'Sur', 'Este', 'Oeste'];
  const cols = MONTHS;
  const matrix = rows.map((region) => cols.map((month) => {
    return state.filtered
      .filter((r) => r.region === region && r.month === month)
      .reduce((acc, r) => acc + Number(r.ventas || 0), 0);
  }));
  return { rows, cols, matrix };
}

function renderStats() {
  const totalReg = state.filtered.length;
  const totalVentas = state.filtered.reduce((a, r) => a + r.ventas, 0);
  const totalCostes = state.filtered.reduce((a, r) => a + r.costes, 0);
  const margen = totalVentas - totalCostes;

  el.statsBox.innerHTML = `
    <article class="kpi"><strong>${totalReg}</strong><span>Registros activos</span></article>
    <article class="kpi"><strong>${Math.round(totalVentas)}</strong><span>Ventas acumuladas</span></article>
    <article class="kpi"><strong>${Math.round(totalCostes)}</strong><span>Costes acumulados</span></article>
    <article class="kpi"><strong>${Math.round(margen)}</strong><span>Margen estimado</span></article>
  `;
}

function renderTable() {
  if (!state.filtered.length) {
    el.tableBody.innerHTML = '<tr><td colspan="8">Sin datos para el filtro actual.</td></tr>';
    return;
  }

  el.tableBody.innerHTML = state.filtered.map((r) => `
    <tr data-id="${r.id}">
      <td>${r.month}</td>
      <td>${r.year}</td>
      <td>${r.region}</td>
      <td>${r.ventas}</td>
      <td>${r.costes}</td>
      <td>${r.tickets}</td>
      <td>${r.satisfaccion}</td>
      <td><button class="secondary" data-action="delete">Eliminar</button></td>
    </tr>
  `).join('');
}

function renderCharts() {
  const monthly = groupByMonth(state.metric);
  const monthlyVentas = groupByMonth('ventas');
  const byRegion = groupByRegion(state.metric);
  const radar = radarData();
  const heat = heatmapData();

  charts.drawBarChart(el.barChart, monthly.labels, monthly.values, { color: '#4b5563' });
  charts.drawLineChart(el.lineChart, monthly.labels, monthly.values, { color: '#374151' });
  charts.drawAreaChart(el.areaChart, monthlyVentas.labels, monthlyVentas.values, {});
  charts.drawDonutChart(el.donutChart, byRegion.labels, byRegion.values, { centerText: state.metric });
  charts.drawRadarChart(el.radarChart, radar.labels, radar.values, {});
  charts.drawHeatmap(el.heatmapChart, heat.rows, heat.cols, heat.matrix, {});
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

el.addRowBtn.addEventListener('click', () => el.rowDialog.showModal());
el.cancelDialogBtn.addEventListener('click', () => el.rowDialog.close());

el.rowForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const row = {
    month: el.formMonth.value,
    year: Number(el.formYear.value),
    region: el.formRegion.value,
    ventas: Number(el.formVentas.value),
    costes: Number(el.formCostes.value),
    tickets: Number(el.formTickets.value),
    satisfaccion: Number(el.formSatisfaccion.value),
    createdAt: new Date().toISOString(),
  };

  await addRow(row);
  el.rowForm.reset();
  el.rowDialog.close();
  await refresh();
});

el.seedBtn.addEventListener('click', async () => {
  const rows = seedData();
  for (const row of rows) {
    await addRow(row);
  }
  await refresh();
});

el.resetBtn.addEventListener('click', async () => {
  const ok = confirm('¿Seguro que quieres vaciar la base de datos?');
  if (!ok) return;
  await clearRows();
  await refresh();
});

el.tableBody.addEventListener('click', async (event) => {
  const btn = event.target.closest('button[data-action="delete"]');
  if (!btn) return;
  const tr = event.target.closest('tr[data-id]');
  if (!tr) return;
  await deleteRow(Number(tr.dataset.id));
  await refresh();
});

el.yearFilter.addEventListener('change', () => {
  state.year = el.yearFilter.value;
  renderAll();
});

el.regionFilter.addEventListener('change', () => {
  state.region = el.regionFilter.value;
  renderAll();
});

el.metricSelect.addEventListener('change', () => {
  state.metric = el.metricSelect.value;
  renderCharts();
});

el.searchInput.addEventListener('input', () => {
  state.search = el.searchInput.value.trim();
  renderAll();
});

refresh().catch(console.error);
