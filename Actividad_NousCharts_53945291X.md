# Actividad: Librería de Visualización con Canvas API — NousCharts Lab

**Nombre y Apellidos:** Luis Adolfo Roces Dapena  
**DNI:** 53945291X  
**Asignatura:** Desarrollo de Interfaces  
**Fecha de Entrega:** 15 / 06 / 2025  
**Lección:** `dam2526/Segundo/Desarrollo de interfaces/301-Actividades final de unidad - Segundo trimestre/003-Libreria de visualizacion personalizada`

---

## Índice

1. [Introducción y Objetivos del Proyecto](#1-introducción-y-objetivos-del-proyecto)
2. [Tecnologías Empleadas](#2-tecnologías-empleadas)
3. [Arquitectura del Proyecto](#3-arquitectura-del-proyecto)
4. [Desarrollo de la Librería NousCharts](#4-desarrollo-de-la-librería-nouscharts)
5. [Sistema de Persistencia — IndexedDB](#5-sistema-de-persistencia--indexeddb)
6. [Dashboard — Filtros, Agregaciones y KPIs](#6-dashboard--filtros-agregaciones-y-kpis)
7. [Interfaz de Usuario — Panel de Control](#7-interfaz-de-usuario--panel-de-control)
8. [Mejoras v2 Implementadas](#8-mejoras-v2-implementadas)
9. [Patrones de Error y Soluciones](#9-patrones-de-error-y-soluciones)
10. [Conclusiones y Aprendizajes](#10-conclusiones-y-aprendizajes)

---

## 1. Introducción y Objetivos del Proyecto

### 1.1 Contexto

NousCharts Lab es una librería de visualización de datos construida enteramente sobre la **Canvas API** del navegador, acompañada de un dashboard empresarial interactivo que demuestra sus capacidades. El proyecto se ejecuta como una SPA (Single-Page Application) sin dependencias externas de JavaScript: toda la lógica de renderizado, persistencia y UI está implementada con vanilla JS.

La librería expone **6 tipos de gráficas** (barras, línea, área, donut, radar y heatmap) a través de un objeto global `window.NousCharts`, y el dashboard consume esa API para presentar datos comerciales ficticios (ventas, costes, tickets y satisfacción) agrupados por mes y región.

### 1.2 Objetivos

1. Diseñar e implementar una librería de gráficas reutilizable (`lib/nouscharts.js`) que dibuje sobre `<canvas>` sin frameworks ni librerías externas.
2. Soportar **6 tipos de visualización**: barras, línea, área, donut, radar y heatmap, cada uno con opciones de personalización de color para integrar dark mode.
3. Persistir el dataset en **IndexedDB** con operaciones CRUD asíncronas y generación automática de datos semilla (*auto-seed*).
4. Construir un dashboard con filtros dinámicos (año, región, métrica, búsqueda), 4 KPIs en tiempo real y una tabla de datos editable.
5. Incorporar mejoras de UX: navegación por pestañas, dark mode con `localStorage`, notificaciones toast, diálogos de confirmación personalizados, exportación/importación JSON y formato numérico localizado (`es-ES`).

### 1.3 Arquitectura general

```
NousCharts-Lab/
├── index.html          ← Punto de entrada, estructura HTML completa
├── assets/
│   ├── app.js          ← Lógica del dashboard (DB, filtros, eventos, render)
│   └── styles.css      ← Estilos v2 (dark mode, tabs, toasts, responsive)
└── lib/
    └── nouscharts.js   ← Librería de gráficas sobre Canvas API (6 tipos)
```

La separación en dos scripts permite que `nouscharts.js` sea **portable**: cualquier proyecto puede incluirlo y llamar a `NousCharts.drawBarChart(canvas, labels, values, options)` sin depender del dashboard.

---

## 2. Tecnologías Empleadas

| Tecnología         | Uso en el proyecto                                              |
| ------------------ | --------------------------------------------------------------- |
| **HTML5**          | Estructura semántica, elementos `<canvas>`, `<dialog>`, `<nav>` |
| **CSS3**           | Custom properties, `color-mix()`, `backdrop-filter`, Grid, animaciones |
| **JavaScript ES6** | Async/await, destructuring, template literals, arrow functions  |
| **Canvas API**     | Renderizado de las 6 gráficas (paths, arcs, gradientes, texto) |
| **IndexedDB**      | Persistencia local del dataset con object stores e índices      |
| **Google Fonts**   | Tipografía Inter para una UI moderna y legible                  |

No se emplean librerías de terceros ni procesos de compilación. El proyecto funciona directamente sobre cualquier servidor estático.

---

## 3. Arquitectura del Proyecto

### 3.1 Rol de cada fichero

| Fichero              | Responsabilidad                                                             |
| -------------------- | --------------------------------------------------------------------------- |
| `index.html`         | Estructura HTML: header, tabs, 6 canvas, tabla, diálogos, toast container  |
| `lib/nouscharts.js`  | Funciones puras de dibujo sobre Canvas; expone API vía `window.NousCharts` |
| `assets/app.js`      | IndexedDB, estado, filtros, agregaciones, KPIs, eventos de UI, boot        |
| `assets/styles.css`  | Diseño visual: custom properties, dark mode, grid responsive, animaciones  |

### 3.2 Flujo de datos

```
IndexedDB  ─── getAllRows() ──▸  state.rows
                                    │
                              applyFilters()
                                    │
                              state.filtered
                                    │
                    ┌───────────────┼────────────────┐
                    ▼               ▼                ▼
              renderStats()   renderTable()    renderCharts()
              (4 KPIs)        (tabla HTML)     (6 canvas vía NousCharts)
```

---

## 4. Desarrollo de la Librería NousCharts

### 4.1 Fundamentos de Canvas API

Cada función de la librería recibe un elemento `<canvas>` y opera sobre su contexto 2D (`canvas.getContext('2d')`). Canvas API proporciona primitivas de bajo nivel: `fillRect`, `strokeRect`, `arc`, `lineTo`, `fillText`, gradientes lineales, etc. A diferencia de gráficas SVG, el dibujado es *inmediato*: cada frame se repinta completo.

### 4.2 Funciones auxiliares (Helpers)

#### 4.2.1 `clear` — Limpieza del canvas

Rellena el canvas completo con un color de fondo antes de dibujar:

```javascript
function clear(ctx, canvas, bg = '#ffffff') {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}
```

El uso de `ctx.save()` / `ctx.restore()` es un patrón fundamental para preservar el estado del contexto gráfico y evitar efectos colaterales entre funciones.

#### 4.2.2 `getRange` — Rango de valores

```javascript
function getRange(values) {
  return { min: Math.min(...values, 0), max: Math.max(...values, 1) };
}
```

Incluye `0` en el mínimo y `1` en el máximo para evitar divisiones por cero o rangos vacíos.

#### 4.2.3 `drawAxes` — Ejes X e Y

```javascript
function drawAxes(ctx, x, y, w, h, color = '#d9dde2') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
  ctx.restore();
}
```

Dibuja un eje en forma de L con un path de dos segmentos.

#### 4.2.4 `drawGrid` — Rejilla horizontal

```javascript
function drawGrid(ctx, x, y, w, h, steps = 5, color = '#eef0f3') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let i = 1; i <= steps; i++) {
    const yy = y + (h / steps) * i;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();
  }
  ctx.restore();
}
```

Genera líneas horizontales equidistantes para dar referencia visual a las magnitudes.

#### 4.2.5 `text` — Texto parametrizable

```javascript
function text(ctx, str, x, y, color = '#374151', align = 'left', size = 11, weight = '400') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = `${weight} ${size}px Inter, sans-serif`;
  ctx.fillText(String(str), x, y);
  ctx.restore();
}
```

Centraliza toda la escritura de texto con parámetros de color, alineación, tamaño y peso.

### 4.3 Tipos de gráfica

Todas las funciones de gráfica siguen la misma firma:

```
drawXxx(canvas, labels, values, options = {})
```

El objeto `options` permite personalizar **todos** los colores, lo que facilita la integración con dark mode desde la aplicación consumidora.

#### A. `drawBarChart` — Gráfica de barras

Dibuja barras verticales proporcionales al valor máximo, con etiquetas en el eje X y valores sobre cada barra:

```javascript
function drawBarChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext('2d');
  const bg = options.bg || '#ffffff';
  const gridColor = options.gridColor || '#eef0f3';
  const axisColor = options.axisColor || '#d9dde2';
  const labelColor = options.labelColor || '#6b7280';
  const textColor = options.textColor || '#374151';
  const barColor = options.color || '#4b5563';

  clear(ctx, canvas, bg);
  const pad = 38, x = pad, y = 18;
  const w = canvas.width - pad * 2, h = canvas.height - 52;

  drawGrid(ctx, x, y, w, h, 5, gridColor);
  drawAxes(ctx, x, y, w, h, axisColor);

  const { max } = getRange(values);
  const gap = w / Math.max(values.length, 1);
  const barW = gap * 0.58;

  values.forEach((v, i) => {
    const barH = (v / max) * (h - 8);
    const bx = x + i * gap + (gap - barW) / 2;
    const by = y + h - barH;
    ctx.fillStyle = barColor;
    ctx.fillRect(bx, by, barW, barH);
    text(ctx, labels[i], bx + barW / 2, y + h + 16, labelColor, 'center', 10);
    text(ctx, v, bx + barW / 2, by - 6, textColor, 'center', 10, '600');
  });
}
```

**Aspectos clave:**

- El ancho de barra (`barW`) es el 58 % del espacio disponible por columna (`gap * 0.58`), dejando separación visual entre barras.
- La altura de cada barra se calcula proporcionalmente: `(v / max) * (h - 8)`.
- Se muestra el valor numérico encima de la barra con `text()` en peso `600`.

#### B. `drawLineChart` — Gráfica de línea

Conecta los puntos con un trazo continuo y dibuja círculos en cada dato:

```javascript
function drawLineChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext('2d');
  // ...opciones de color...
  clear(ctx, canvas, bg);
  const pad = 38, x = pad, y = 18;
  const w = canvas.width - pad * 2, h = canvas.height - 52;

  drawGrid(ctx, x, y, w, h, 5, gridColor);
  drawAxes(ctx, x, y, w, h, axisColor);

  const { max } = getRange(values);
  const step = w / Math.max(values.length - 1, 1);

  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((v, i) => {
    const px = x + i * step, py = y + h - (v / max) * (h - 8);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.restore();

  values.forEach((v, i) => {
    const px = x + i * step, py = y + h - (v / max) * (h - 8);
    ctx.fillStyle = ptColor;
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, labels[i], px, y + h + 16, labelColor, 'center', 10);
  });
}
```

Se utiliza un único `beginPath()` con `moveTo` / `lineTo` para el trazo de línea, y luego un bucle independiente para los puntos (`arc` con radio 3.5px).

#### C. `drawAreaChart` — Gráfica de área

Combina la técnica de la línea con un relleno gradiente vertical:

```javascript
function drawAreaChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext('2d');
  // ...opciones de color...
  clear(ctx, canvas, bg);

  const { max } = getRange(values);
  const step = w / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => ({
    x: x + i * step,
    y: y + h - (v / max) * (h - 8)
  }));

  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, options.fillTop || 'rgba(55,65,81,0.35)');
  grad.addColorStop(1, options.fillBottom || 'rgba(55,65,81,0.04)');

  ctx.save();
  ctx.beginPath();
  points.forEach((p, i) => {
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  });
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
  // ...trazo de línea encima del relleno...
}
```

El gradiente (`createLinearGradient`) va de una opacidad visible (0.35) en la parte superior a casi transparente (0.04) en la base, generando un efecto de profundidad elegante. El área se cierra conectando el último punto con las esquinas inferiores del gráfico.

#### D. `drawDonutChart` — Gráfica de donut

Utiliza arcos sucesivos para los segmentos y un círculo interior para el efecto "dona":

```javascript
function drawDonutChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext('2d');
  // ...opciones...
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r = Math.min(canvas.width, canvas.height) * 0.33;
  const inner = r * 0.56;
  const sum = values.reduce((a, b) => a + b, 0) || 1;

  const colors = options.colors || ['#374151','#6b7280','#9ca3af','#d1d5db','#4b5563'];

  let start = -Math.PI / 2;
  values.forEach((v, i) => {
    const arc = (v / sum) * Math.PI * 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + arc);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.restore();
    start += arc;
  });

  // Recorte interior → efecto donut
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.restore();

  text(ctx, options.centerText || 'Total', cx, cy - 4, mutedColor, 'center', 11, '600');
  text(ctx, sum, cx, cy + 14, totalColor, 'center', 15, '700');
}
```

**Técnicas empleadas:**

- El ángulo inicial es `-Math.PI / 2` (las 12 en punto) para que la primera "porción" comience arriba.
- El radio interior (`r * 0.56`) crea el hueco; se rellena con el color de fondo para simular el agujero.
- En el centro se muestra el texto de la métrica y la suma total.
- La leyenda se dibuja con pequeños rectángulos de color alineados a la izquierda.

#### E. `drawRadarChart` — Gráfica de radar

Dibuja una malla poligonal con N ejes y superpone el polígono de datos:

```javascript
function drawRadarChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext('2d');
  // ...opciones...
  const cx = canvas.width / 2, cy = canvas.height / 2 + 6;
  const radius = Math.min(canvas.width, canvas.height) * 0.34;
  const levels = 5;
  const max = Math.max(...values, 1);

  // Rejilla poligonal (5 niveles)
  ctx.save();
  ctx.strokeStyle = gridColor;
  for (let l = 1; l <= levels; l++) {
    const rr = (radius / levels) * l;
    ctx.beginPath();
    labels.forEach((_, i) => {
      const ang = (-Math.PI / 2) + (Math.PI * 2 * i / labels.length);
      const px = cx + Math.cos(ang) * rr;
      const py = cy + Math.sin(ang) * rr;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();
  }

  // Ejes radiales + etiquetas
  labels.forEach((label, i) => {
    const ang = (-Math.PI / 2) + (Math.PI * 2 * i / labels.length);
    const px = cx + Math.cos(ang) * radius;
    const py = cy + Math.sin(ang) * radius;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.strokeStyle = axisColor;
    ctx.stroke();
    text(ctx, label, cx + Math.cos(ang) * (radius + 16),
         cy + Math.sin(ang) * (radius + 16), labelColor, 'center', 10);
  });

  // Polígono de datos
  ctx.beginPath();
  values.forEach((v, i) => {
    const ang = (-Math.PI / 2) + (Math.PI * 2 * i / labels.length);
    const rr = (v / max) * radius;
    const px = cx + Math.cos(ang) * rr;
    const py = cy + Math.sin(ang) * rr;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
```

El cálculo trigonométrico `cos(ang) * rr` / `sin(ang) * rr` posiciona cada vértice sobre la circunferencia a la distancia proporcional al dato.

#### F. `drawHeatmap` — Mapa de calor

Representa una matriz bidimensional (regiones × meses) con celdas coloreadas por intensidad:

```javascript
function drawHeatmap(canvas, rows, cols, matrix, options = {}) {
  const ctx = canvas.getContext('2d');
  const bg = options.bg || '#ffffff';
  const labelColor = options.labelColor || '#6b7280';
  const heatBase = options.heatColor || '55,65,81';

  clear(ctx, canvas, bg);
  const padLeft = 70, padTop = 24;
  const gridW = canvas.width - padLeft - 18;
  const gridH = canvas.height - padTop - 38;
  const cw = gridW / Math.max(cols.length, 1);
  const ch = gridH / Math.max(rows.length, 1);
  const max = Math.max(...matrix.flat(), 1);

  matrix.forEach((line, r) => {
    line.forEach((value, c) => {
      const t = value / max;
      const alpha = 0.08 + t * 0.82;
      ctx.fillStyle = `rgba(${heatBase},${alpha})`;
      ctx.fillRect(padLeft + c * cw, padTop + r * ch, cw - 2, ch - 2);
      const tc = t > 0.55 ? '#f9fafb' : (options.textColor || '#1f2937');
      text(ctx, value, padLeft + c * cw + cw / 2,
           padTop + r * ch + ch / 2 + 4, tc, 'center', 10, '600');
    });
  });

  rows.forEach((row, i) => text(ctx, row, padLeft - 8,
    padTop + i * ch + ch / 2 + 3, labelColor, 'right', 10));
  cols.forEach((col, i) => text(ctx, col, padLeft + i * cw + cw / 2,
    padTop + gridH + 16, labelColor, 'center', 10));
}
```

**Detalle del color:** en lugar de una paleta discreta, se usa un único color base en formato RGB (`'55,65,81'`) y se modula su canal alfa entre 0.08 (frío) y 0.90 (caliente). Esto genera un degradado continuo. Cuando la intensidad supera 0.55, el texto se muestra en blanco para mantener el contraste.

### 4.4 API pública

La librería expone un objeto global limpio:

```javascript
window.NousCharts = {
  drawBarChart,
  drawLineChart,
  drawAreaChart,
  drawDonutChart,
  drawRadarChart,
  drawHeatmap,
};
```

Esto permite que `app.js` (u otras aplicaciones) acceda a todas las funciones con `NousCharts.drawBarChart(...)`.

---

## 5. Sistema de Persistencia — IndexedDB

### 5.1 Apertura de la base de datos

```javascript
const DB_NAME = 'nouscharts_db';
const DB_VERSION = 1;
const STORE = 'records';

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
```

- El `onupgradeneeded` solo se ejecuta cuando la versión sube o la BD no existe.
- Se crean dos índices (`year` y `region`) para consultas eficientes futuras.
- `autoIncrement: true` genera IDs secuenciales automáticos.

### 5.2 Acción genérica sobre el store

```javascript
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
```

Este patrón reduce la repetición: cada operación CRUD se expresa como una función de una línea:

```javascript
const getAllRows = () => dbAction('readonly',  s => s.getAll());
const addRow    = (row) => dbAction('readwrite', s => s.add(row));
const deleteRow = (id) => dbAction('readwrite', s => s.delete(id));
const clearRows = () => dbAction('readwrite', s => s.clear());
```

### 5.3 Generación de datos semilla

```javascript
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
```

Se generan **48 registros** (12 meses × 4 regiones) con datos aleatorios pero realistas: los costes son entre el 45 %–70 % de las ventas, los tickets se calculan proporcionalmente y la satisfacción oscila entre 65 y 99.

---

## 6. Dashboard — Filtros, Agregaciones y KPIs

### 6.1 Sistema de filtros

El estado de los filtros se almacena en el objeto `state`:

```javascript
const state = {
  rows: [],
  filtered: [],
  year: 'all',
  region: 'all',
  metric: 'ventas',
  search: '',
};
```

La función `applyFilters` reduce el dataset según los cuatro criterios activos:

```javascript
function applyFilters() {
  const q = state.search.toLowerCase();
  state.filtered = state.rows.filter(r => {
    return (state.year === 'all' || String(r.year) === String(state.year))
      && (state.region === 'all' || r.region === state.region)
      && (q === '' || `${r.month} ${r.region}`.toLowerCase().includes(q));
  });
}
```

Los selectores de año y región se reconstruyen dinámicamente a partir de los datos disponibles:

```javascript
function rebuildFilters() {
  const years = [...new Set(state.rows.map(r => r.year))].sort((a, b) => b - a);
  const regions = [...new Set(state.rows.map(r => r.region))].sort();
  el.yearFilter.innerHTML = `<option value="all">Todos</option>${years.map(y =>
    `<option value="${y}">${y}</option>`).join('')}`;
  el.regionFilter.innerHTML = `<option value="all">Todas</option>${regions.map(r =>
    `<option value="${r}">${r}</option>`).join('')}`;
}
```

### 6.2 Funciones de agregación

#### `groupByMonth` — Agrupación mensual

```javascript
function groupByMonth(metric) {
  const map = new Map(MONTHS.map(m => [m, 0]));
  state.filtered.forEach(r =>
    map.set(r.month, (map.get(r.month) || 0) + Number(r[metric] || 0))
  );
  return {
    labels: MONTHS,
    values: MONTHS.map(m => Math.round(map.get(m) || 0))
  };
}
```

Utiliza un `Map` preinicializado con los 12 meses para asegurar que todos aparezcan aunque no haya datos.

#### `groupByRegion` — Agrupación por región

```javascript
function groupByRegion(metric) {
  const regions = ['Norte', 'Sur', 'Este', 'Oeste'];
  const map = new Map(regions.map(r => [r, 0]));
  state.filtered.forEach(r =>
    map.set(r.region, (map.get(r.region) || 0) + Number(r[metric] || 0))
  );
  return {
    labels: regions,
    values: regions.map(r => Math.round(map.get(r) || 0))
  };
}
```

#### `radarData` — Promedio de las cuatro métricas

```javascript
function radarData() {
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  return {
    labels: ['Ventas', 'Costes', 'Tickets', 'Satisfaccion'],
    values: ['ventas', 'costes', 'tickets', 'satisfaccion']
      .map(m => Math.round(avg(groupByMonth(m).values))),
  };
}
```

#### `heatmapData` — Matriz región × mes

```javascript
function heatmapData() {
  const rows = ['Norte', 'Sur', 'Este', 'Oeste'];
  const matrix = rows.map(region =>
    MONTHS.map(month =>
      state.filtered
        .filter(r => r.region === region && r.month === month)
        .reduce((a, r) => a + Number(r.ventas || 0), 0)
    )
  );
  return { rows, cols: MONTHS, matrix };
}
```

### 6.3 Renderizado de KPIs

```javascript
const fmt = v => Number(v).toLocaleString('es-ES');

function renderStats() {
  const n = state.filtered.length;
  const v = state.filtered.reduce((a, r) => a + r.ventas, 0);
  const c = state.filtered.reduce((a, r) => a + r.costes, 0);
  const m = v - c;
  const margenClass = m >= 0 ? 'kpi-positive' : 'kpi-negative';
  el.statsBox.innerHTML = `
    <article class="kpi kpi-blue">
      <strong>${fmt(n)}</strong><span>Registros activos</span>
    </article>
    <article class="kpi kpi-green">
      <strong>${fmt(Math.round(v))}</strong><span>Ventas acumuladas</span>
    </article>
    <article class="kpi kpi-amber">
      <strong>${fmt(Math.round(c))}</strong><span>Costes acumulados</span>
    </article>
    <article class="kpi ${margenClass}">
      <strong>${fmt(Math.round(m))}</strong><span>Margen estimado</span>
    </article>
  `;
}
```

Cada KPI tiene un **borde lateral coloreado** (azul, verde, ámbar, positivo/negativo) que se activa mediante clases CSS semánticas.

---

## 7. Interfaz de Usuario — Panel de Control

### 7.1 Estructura HTML con pestañas

El HTML emplea el elemento nativo `<nav>` para las pestañas y `<dialog>` para los modales:

```html
<!-- Tabs -->
<nav class="tabs">
  <button class="tab active" data-tab="dashboard">Dashboard</button>
  <button class="tab" data-tab="dataset">Dataset</button>
</nav>

<!-- TAB: Dashboard -->
<div id="tab-dashboard" class="tab-content active">
  <!-- Controles, KPIs, 6 gráficas en grid de 2 columnas -->
</div>

<!-- TAB: Dataset -->
<div id="tab-dataset" class="tab-content">
  <!-- Tabla, botones de acción, import/export -->
</div>
```

La lógica de cambio de pestaña es sencilla y eficiente:

```javascript
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
  });
});
```

### 7.2 Sistema de diálogos

Se utilizan dos `<dialog>` nativos: uno para añadir registros y otro para confirmaciones:

```html
<!-- Dialog nuevo registro -->
<dialog id="rowDialog" class="dialog">
  <form id="rowForm" method="dialog">
    <div class="dialog-header">
      <h3>Nuevo registro</h3>
      <button type="button" id="closeDialogBtn" class="icon-btn close-btn">&times;</button>
    </div>
    <div class="dialog-body">
      <!-- Campos: mes, año, región, ventas, costes, tickets, satisfacción -->
    </div>
    <div class="dialog-footer">
      <button type="submit">Guardar</button>
      <button type="button" id="cancelDialogBtn" class="secondary">Cancelar</button>
    </div>
  </form>
</dialog>
```

El diálogo de confirmación personalizado devuelve una **Promise** para un flujo `async/await` limpio:

```javascript
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
```

Uso:

```javascript
el.resetBtn.addEventListener('click', async () => {
  const ok = await nousConfirm('Reset base de datos',
    'Se eliminaran todos los registros. Esta accion no se puede deshacer.');
  if (!ok) return;
  await clearRows();
  toast('Base de datos vaciada', 'success');
  await refresh();
});
```

### 7.3 Dark mode

El dark mode se implementa con clases CSS y `localStorage`:

```javascript
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
```

En CSS, las custom properties se redefinen bajo `body.dark`:

```css
:root {
  --bg: #f7f7f5;
  --panel: #ffffff;
  --text: #1e1e1e;
  --muted: #6b7280;
  --border: #e4e7eb;
  /* ... */
}

body.dark {
  --bg:#1a1a1a; --panel:#242424; --text:#e4e4e4; --muted:#9ca3af;
  --border:#333; --border-strong:#444; --chart-bg:#26262b;
}
```

Además, las gráficas reciben colores adaptativos mediante `getChartColors()`:

```javascript
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
    // ...más colores...
  };
}
```

### 7.4 Diseño responsivo

El CSS utiliza CSS Grid con breakpoints para adaptarse a pantallas pequeñas:

```css
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 1050px) {
  .grid-2 { grid-template-columns: 1fr; }
  .row-4  { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 700px) {
  .row-4, .row-3 { grid-template-columns: 1fr; }
  .stats { grid-template-columns: 1fr 1fr; }
  .header { flex-direction: column; align-items: flex-start; }
}
```

---

## 8. Mejoras v2 Implementadas

### A. Navegación por pestañas

Se divide la interfaz en dos pestañas (*Dashboard* y *Dataset*) para separar la visualización de datos de la gestión del dataset. Se usa `display: contents` para no romper el grid padre:

```css
.tab-content { display: none; }
.tab-content.active { display: contents; }
```

### B. Modo oscuro con CSS Custom Properties + localStorage

El modo oscuro se persiste entre sesiones con `localStorage`. Si no existe preferencia guardada, se respeta `prefers-color-scheme`. Los canvas se redibujan al cambiar de tema, recibiendo colores adaptativos desde un mapeo centralizado (`getChartColors`).

### C. Colores KPI semánticos

Cada KPI tiene un borde izquierdo de 3px coloreado para transmitir significado visual inmediato:

```css
.kpi.kpi-blue     { border-left-color: var(--blue); }
.kpi.kpi-green    { border-left-color: var(--green); }
.kpi.kpi-amber    { border-left-color: var(--amber); }
.kpi.kpi-positive { border-left-color: var(--green); }
.kpi.kpi-negative { border-left-color: var(--red); }
```

### D. Badges de margen en la tabla

Cada fila de la tabla muestra el margen (ventas – costes) con un badge coloreado:

```javascript
const m = r.ventas - r.costes;
const cls = m >= 0 ? 'badge-positive' : 'badge-negative';
return `<span class="badge ${cls}">${fmt(m)}</span>`;
```

```css
.badge-positive {
  background: color-mix(in srgb, var(--green) 12%, transparent);
  color: var(--green);
}
.badge-negative {
  background: color-mix(in srgb, var(--red) 12%, transparent);
  color: var(--red);
}
```

Se emplea `color-mix()` de CSS para generar fondos semitransparentes sin valores rgba fijos.

### E. Sistema de notificaciones toast

Notificaciones temporales (3.5 s) con 4 tonos (success, error, info, warning):

```javascript
function toast(msg, tone = 'info') {
  const div = document.createElement('div');
  div.className = `toast toast-${tone}`;
  const icons = { success: '\u2713', error: '\u2717', info: '\u2139', warning: '\u26A0' };
  div.textContent = `${icons[tone] || ''} ${msg}`;
  el.toastContainer.appendChild(div);
  setTimeout(() => div.remove(), 3500);
}
```

Los toasts aparecen con animación `slideUp` y se apilan en la esquina inferior derecha:

```css
.toast-container {
  position: fixed; bottom: 20px; right: 20px;
  display: flex; flex-direction: column-reverse; gap: 8px; z-index: 9999;
}
.toast {
  padding: 10px 16px; border-radius: 10px; font-size: .88rem;
  color: #fff; animation: slideUp .25s ease; min-width: 240px;
  box-shadow: 0 4px 12px rgba(0,0,0,.15);
}
```

### F. Diálogos de confirmación personalizados (Promise)

Se sustituye el `window.confirm()` nativo por un diálogo modal personalizado que devuelve una `Promise<boolean>`, integrándose con `async/await` de forma natural. El diálogo utiliza `<dialog>.showModal()` con backdrop blur:

```css
.dialog::backdrop {
  background: rgba(15,23,42,.35);
  backdrop-filter: blur(4px);
}
```

### G. Exportación e importación JSON

- **Exportar:** serializa el dataset completo como JSON y lo descarga con `Blob` + `URL.createObjectURL()`.
- **Importar:** lee un fichero `.json` con `file.text()`, valida la estructura y añade cada registro válido a IndexedDB.

```javascript
el.exportBtn.addEventListener('click', async () => {
  const data = await getAllRows();
  if (!data.length) { toast('Sin datos para exportar', 'warning'); return; }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `nouscharts_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Datos exportados como JSON', 'success');
});
```

### H. Auto-seed en primera ejecución

Al arrancar la aplicación, si IndexedDB está vacío se cargan automáticamente 48 registros de ejemplo:

```javascript
(async function boot() {
  state.rows = await getAllRows();
  if (!state.rows.length) {
    for (const row of seedData()) await addRow(row);
    state.rows = await getAllRows();
    toast('Datos de ejemplo cargados automaticamente', 'info');
  }
  state.rows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  rebuildFilters();
  renderAll();
})();
```

### I. Rediseño del diálogo con header / body / footer

Los diálogos siguen una estructura clara de tres secciones para mantener consistencia visual:

```css
.dialog-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid var(--border);
}
.dialog-body { padding: 16px; }
.dialog-footer {
  padding: 12px 16px; border-top: 1px solid var(--border);
  display: flex; gap: 8px;
}
```

### J. Formato numérico con locale `es-ES`

Todos los valores numéricos se formatean con `toLocaleString('es-ES')`, usando el punto como separador de miles:

```javascript
const fmt = v => Number(v).toLocaleString('es-ES');
// 1234 → "1.234"
```

### K. Mejoras CSS: focus rings, hover, animaciones, backdrop-filter

- **Focus visible:** anillo azul con `box-shadow` en inputs y selects, mejorando la navegabilidad por teclado.
- **Hover en filas:** sutil cambio de fondo con `color-mix()` del color de acento.
- **Animaciones:** `fadeIn` para la shell principal; `slideUp` para los toasts.
- **Backdrop filter:** `blur(4px)` en el overlay de los diálogos.

```css
input:focus, select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
}

tr:hover td {
  background: color-mix(in srgb, var(--accent) 4%, var(--panel));
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 9. Patrones de Error y Soluciones

### 9.1 Canvas se ve borroso o pixelado

**Problema:** al escalar el canvas con CSS (`width: 100%`) sin fijar sus atributos `width`/`height`, el contenido se interpola y aparece borroso.

**Solución:** definir los atributos `width` y `height` directamente en el elemento `<canvas>` para que coincidan con la resolución de dibujo. El CSS solo controla el tamaño de presentación:

```html
<canvas id="barChart" width="560" height="280"></canvas>
```

### 9.2 IndexedDB no crea los índices

**Problema:** al modificar los índices del object store sin incrementar la versión de la BD, el evento `onupgradeneeded` no se ejecuta.

**Solución:** incrementar `DB_VERSION` cada vez que se modifica el esquema. En nuestro caso se usa la versión 1 con la protección `if (!db.objectStoreNames.contains(STORE))` para seguridad.

### 9.3 Los gráficos no reflejan el dark mode al cargar

**Problema:** el dark mode se aplica con `classList.toggle` en la IIFE `initDark()`, pero las gráficas se dibujan después en `boot()` y el estado oscuro ya está reflejado en el DOM. Sin embargo, si `renderCharts()` se llamara antes de que el body reciba la clase `dark`, los colores serían incorrectos.

**Solución:** asegurar que `initDark()` se ejecute síncronamente (IIFE al inicio del script) **antes** de la función `boot()` que renderiza las gráficas.

### 9.4 Importación de JSON con IDs duplicados

**Problema:** al importar un fichero exportado, los registros traen el campo `id` de la BD original. Si se insertan directamente, el `autoIncrement` de IndexedDB entra en conflicto.

**Solución:** se elimina el `id` antes de insertar con destructuring:

```javascript
const { id, ...clean } = row;
await addRow(clean);
```

---

## 10. Conclusiones y Aprendizajes

### 10.1 Logros técnicos

- Se ha construido una **librería de visualización completa** con 6 tipos de gráficas, sin dependencias externas, demostrando el poder de Canvas API para renderizado 2D.
- La librería es **reutilizable y desacoplada**: cualquier aplicación que incluya `nouscharts.js` obtiene acceso a las funciones de dibujo a través de `window.NousCharts`.
- El sistema de **opciones de color** permite adaptar las gráficas a cualquier tema visual, no solo light/dark.

### 10.2 Aprendizajes sobre Canvas API

- El dominio de `save()` / `restore()` del contexto es esencial para evitar fugas de estado entre funciones.
- Los gradientes (`createLinearGradient`) permiten crear efectos visuales sofisticados con pocas líneas.
- El cálculo trigonométrico (seno/coseno) es fundamental para gráficas polares (radar, donut).
- La modulación de canal alfa sobre un color base RGB es una técnica eficiente para heatmaps continuos.

### 10.3 Aprendizajes sobre persistencia

- IndexedDB ofrece un sistema de almacenamiento potente pero con una API basada en eventos que requiere ser envuelta en Promises para un uso ergonómico con `async/await`.
- El patrón de acción genérica (`dbAction`) elimina la duplicación de código de transacciones.
- La generación de datos semilla (*auto-seed*) mejora radicalmente la experiencia de primer uso.

### 10.4 Aprendizajes sobre diseño de interfaces

- Las **CSS Custom Properties** son la clave para implementar temas visuales de forma mantenible: un solo cambio de clase (`body.dark`) repinta toda la interfaz.
- `color-mix()` es una función CSS moderna muy útil para generar variantes de color sin duplicar valores.
- El elemento `<dialog>` nativo simplifica enormemente la creación de modales accesibles, con soporte de `::backdrop` y `showModal()`.
- Las **notificaciones toast** y los **diálogos de confirmación personalizados** mejoran la experiencia de usuario respecto a los `alert()` / `confirm()` nativos del navegador.

### 10.5 Valoración global

NousCharts Lab demuestra que es posible construir herramientas de visualización de datos completas y profesionales con tecnologías nativas del navegador (Canvas API, IndexedDB, CSS Custom Properties, `<dialog>`), sin necesidad de frameworks pesados. El proyecto ha sido una oportunidad excelente para profundizar en el rendering 2D imperativo, la persistencia client-side y el diseño de interfaces modernas con vanilla JavaScript.

---

_Documento generado para la actividad de Desarrollo de Interfaces — DAM2 2025/26._
