# Librería de Visualización de Datos - NousCharts Lab

**DNI:** 53945291X  
**Curso:** DAM2 — Desarrollo de interfaces  
**Actividad:** 004-Actividad de gráficas  
**Tecnologías:** Canvas API · JavaScript ES6 · IndexedDB · Visualización de datos  
**Fecha:** 17 de febrero de 2026

---

## 1. Introducción breve y contextualización (25%)

### Concepto general

Una librería de visualización de datos es un conjunto de funciones reutilizables que transforman datos numéricos en representaciones gráficas comprensibles. A diferencia de usar librerías externas como Chart.js o D3.js, este proyecto implementa una librería personalizada desde cero utilizando Canvas API, lo que permite:

- **Control total del renderizado:** Personalización completa de estilos y comportamientos
- **Independencia de dependencias:** Sin necesidad de importar bibliotecas de terceros
- **Aprendizaje profundo:** Comprensión de algoritmos de visualización y geometría
- **Optimización específica:** Rendimiento ajustado a necesidades concretas

### Tipos de gráficas implementadas

La librería **NousCharts** incluye seis tipos de visualizaciones:

1. **Gráfica de barras:** Comparación de valores discretos entre categorías
2. **Gráfica de línea:** Evolución temporal o tendencias continuas
3. **Gráfica de área:** Similar a línea pero con relleno acumulativo
4. **Gráfica donut:** Distribución porcentual de un total entre categorías
5. **Gráfica radar:** Comparación multidimensional de múltiples variables
6. **Mapa de calor (heatmap):** Visualización matricial de intensidades

### Contexto y utilidad

Las visualizaciones de datos son fundamentales porque:

- **Comunicación efectiva:** Transmiten información compleja de forma inmediata
- **Detección de patrones:** Revelan tendencias y anomalías no evidentes en tablas
- **Toma de decisiones:** Facilitan el análisis comparativo y temporal
- **Presentación profesional:** Mejoran reportes y dashboards empresariales

Este proyecto demuestra cómo construir renderizadores personalizados con Canvas API, implementar algoritmos de escalado y posicionamiento, y gestionar datos empresariales con IndexedDB.

### Arquitectura del sistema

El sistema se compone de cuatro capas:

1. **Capa de visualización (`lib/nouscharts.js`):** Funciones puras de renderizado Canvas
2. **Capa de datos (`IndexedDB`):** Persistencia de registros empresariales
3. **Capa de lógica (`assets/app.js`):** Agregaciones, filtros y transformaciones
4. **Capa de presentación (`index.html`):** Dashboard con múltiples gráficas sincronizadas

---

## 2. Desarrollo detallado y preciso (25%)

### Fundamentos de Canvas API

```javascript
// lib/nouscharts.js - Funciones auxiliares base

/**
 * Limpia el canvas con color de fondo
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {HTMLCanvasElement} canvas - Elemento canvas
 * @param {string} bg - Color de fondo (default: blanco)
 */
function clear(ctx, canvas, bg = "#ffffff") {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

/**
 * Calcula rango mínimo y máximo de valores
 * @param {Array<number>} values - Array de valores numéricos
 * @returns {Object} - { min, max }
 */
function getRange(values) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  return { min, max };
}

/**
 * Dibuja ejes cartesianos
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Coordenada X del origen
 * @param {number} y - Coordenada Y del origen
 * @param {number} w - Ancho del área de gráfica
 * @param {number} h - Alto del área de gráfica
 * @param {string} color - Color de los ejes
 */
function drawAxes(ctx, x, y, w, h, color = "#d9dde2") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y); // Eje Y superior
  ctx.lineTo(x, y + h); // Eje Y inferior
  ctx.lineTo(x + w, y + h); // Eje X derecha
  ctx.stroke();
  ctx.restore();
}

/**
 * Dibuja líneas de cuadrícula horizontales
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Coordenada X inicio
 * @param {number} y - Coordenada Y inicio
 * @param {number} w - Ancho
 * @param {number} h - Alto
 * @param {number} steps - Número de divisiones
 * @param {string} color - Color de la cuadrícula
 */
function drawGrid(ctx, x, y, w, h, steps = 5, color = "#eef0f3") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  for (let i = 1; i <= steps; i++) {
    const yPos = y + (h / steps) * i;
    ctx.beginPath();
    ctx.moveTo(x, yPos);
    ctx.lineTo(x + w, yPos);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renderiza texto con estilos configurables
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} str - Texto a renderizar
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {string} color - Color del texto
 * @param {string} align - Alineación (left, center, right)
 * @param {number} size - Tamaño de fuente
 * @param {string} weight - Peso de fuente (400, 600, 700)
 */
function text(
  ctx,
  str,
  x,
  y,
  color = "#374151",
  align = "left",
  size = 11,
  weight = "400",
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = `${weight} ${size}px Inter, sans-serif`;
  ctx.fillText(String(str), x, y);
  ctx.restore();
}
```

### Gráfica de barras

```javascript
/**
 * Dibuja gráfica de barras verticales
 * @param {HTMLCanvasElement} canvas - Canvas donde renderizar
 * @param {Array<string>} labels - Etiquetas del eje X
 * @param {Array<number>} values - Valores numéricos
 * @param {Object} options - Opciones de estilo
 */
function drawBarChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext("2d");
  clear(ctx, canvas, options.bg || "#ffffff");

  // Definir área de gráfica con padding
  const pad = 38;
  const x = pad;
  const y = 18;
  const w = canvas.width - pad * 2;
  const h = canvas.height - 52;

  // Dibujar cuadrícula y ejes
  drawGrid(ctx, x, y, w, h, 5);
  drawAxes(ctx, x, y, w, h);

  // Calcular escala vertical
  const { max } = getRange(values);

  // Calcular dimensiones de barras
  const barWidth = (w / Math.max(values.length, 1)) * 0.58; // 58% del espacio disponible
  const gap = w / Math.max(values.length, 1); // Espacio total por barra

  // Renderizar cada barra
  values.forEach((value, index) => {
    // Altura proporcional al valor
    const barHeight = (value / max) * (h - 8);

    // Posición X centrada en su espacio
    const barX = x + index * gap + (gap - barWidth) / 2;

    // Posición Y desde el eje inferior hacia arriba
    const barY = y + h - barHeight;

    // Dibujar rectángulo de la barra
    ctx.fillStyle = options.color || "#4b5563";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Etiqueta inferior (categoría)
    text(
      ctx,
      labels[index],
      barX + barWidth / 2,
      y + h + 16,
      "#6b7280",
      "center",
      10,
    );

    // Valor superior (número)
    text(
      ctx,
      value,
      barX + barWidth / 2,
      barY - 6,
      "#374151",
      "center",
      10,
      "600",
    );
  });
}
```

### Gráfica de línea

```javascript
/**
 * Dibuja gráfica de línea con puntos marcadores
 * @param {HTMLCanvasElement} canvas
 * @param {Array<string>} labels - Etiquetas del eje X
 * @param {Array<number>} values - Valores numéricos
 * @param {Object} options - { color, pointColor, bg }
 */
function drawLineChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext("2d");
  clear(ctx, canvas, options.bg || "#ffffff");

  const pad = 38;
  const x = pad;
  const y = 18;
  const w = canvas.width - pad * 2;
  const h = canvas.height - 52;

  drawGrid(ctx, x, y, w, h, 5);
  drawAxes(ctx, x, y, w, h);

  const { max } = getRange(values);
  const step = w / Math.max(values.length - 1, 1); // Espacio entre puntos

  // Dibujar línea conectora
  ctx.save();
  ctx.strokeStyle = options.color || "#374151";
  ctx.lineWidth = 2;
  ctx.beginPath();

  values.forEach((value, index) => {
    const px = x + index * step;
    const py = y + h - (value / max) * (h - 8);

    if (index === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  });

  ctx.stroke();
  ctx.restore();

  // Dibujar puntos marcadores
  values.forEach((value, index) => {
    const px = x + index * step;
    const py = y + h - (value / max) * (h - 8);

    // Círculo
    ctx.fillStyle = options.pointColor || "#111827";
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Etiqueta
    text(ctx, labels[index], px, y + h + 16, "#6b7280", "center", 10);
  });
}
```

### Gráfica de área

```javascript
/**
 * Dibuja gráfica de área con gradiente
 * @param {HTMLCanvasElement} canvas
 * @param {Array<string>} labels
 * @param {Array<number>} values
 * @param {Object} options - { fillTop, fillBottom, stroke }
 */
function drawAreaChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext("2d");
  clear(ctx, canvas, options.bg || "#ffffff");

  const pad = 38;
  const x = pad;
  const y = 18;
  const w = canvas.width - pad * 2;
  const h = canvas.height - 52;

  drawGrid(ctx, x, y, w, h, 5);
  drawAxes(ctx, x, y, w, h);

  const { max } = getRange(values);
  const step = w / Math.max(values.length - 1, 1);

  // Calcular puntos de la línea
  const points = values.map((value, index) => ({
    x: x + index * step,
    y: y + h - (value / max) * (h - 8),
  }));

  // Crear gradiente vertical
  const gradient = ctx.createLinearGradient(0, y, 0, y + h);
  gradient.addColorStop(0, options.fillTop || "rgba(55,65,81,0.35)");
  gradient.addColorStop(1, options.fillBottom || "rgba(55,65,81,0.04)");

  // Dibujar área rellena
  ctx.save();
  ctx.beginPath();

  // Seguir puntos de la línea
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });

  // Cerrar path por la base
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();

  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();

  // Dibujar línea del contorno superior
  ctx.save();
  ctx.strokeStyle = options.stroke || "#374151";
  ctx.lineWidth = 2;
  ctx.beginPath();

  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });

  ctx.stroke();
  ctx.restore();

  // Etiquetas
  labels.forEach((label, index) => {
    text(ctx, label, x + index * step, y + h + 16, "#6b7280", "center", 10);
  });
}
```

### Gráfica donut

```javascript
/**
 * Dibuja gráfica de donut con leyenda
 * @param {HTMLCanvasElement} canvas
 * @param {Array<string>} labels - Nombres de categorías
 * @param {Array<number>} values - Valores numéricos
 * @param {Object} options - { colors, centerText, bg }
 */
function drawDonutChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext("2d");
  clear(ctx, canvas, options.bg || "#ffffff");

  // Configuración del donut
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) * 0.33;
  const innerRadius = radius * 0.56; // Radio del agujero interior

  const total = values.reduce((acc, val) => acc + val, 0) || 1;

  const colors = options.colors || [
    "#374151",
    "#6b7280",
    "#9ca3af",
    "#d1d5db",
    "#4b5563",
  ];

  // Dibujar sectores
  let startAngle = -Math.PI / 2; // Comenzar desde arriba (12 en punto)

  values.forEach((value, index) => {
    const arcAngle = (value / total) * Math.PI * 2;
    const endAngle = startAngle + arcAngle;

    // Dibujar sector
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    ctx.restore();

    startAngle = endAngle;
  });

  // Dibujar agujero interior (centro blanco)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = options.bg || "#ffffff";
  ctx.fill();
  ctx.restore();

  // Texto central
  text(
    ctx,
    options.centerText || "Total",
    cx,
    cy - 4,
    "#6b7280",
    "center",
    11,
    "600",
  );
  text(ctx, total, cx, cy + 14, "#111827", "center", 15, "700");

  // Leyenda lateral
  labels.forEach((label, index) => {
    const yPos = 20 + index * 16;

    // Cuadrado de color
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(12, yPos - 8, 10, 10);

    // Texto de leyenda
    text(ctx, `${label} (${values[index]})`, 28, yPos, "#374151", "left", 10);
  });
}
```

### Gráfica radar

```javascript
/**
 * Dibuja gráfica radar (spider/polar)
 * @param {HTMLCanvasElement} canvas
 * @param {Array<string>} labels - Nombres de las dimensiones
 * @param {Array<number>} values - Valores para cada dimensión
 * @param {Object} options - Opciones de estilo
 */
function drawRadarChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext("2d");
  clear(ctx, canvas, options.bg || "#ffffff");

  const cx = canvas.width / 2;
  const cy = canvas.height / 2 + 6;
  const radius = Math.min(canvas.width, canvas.height) * 0.34;
  const levels = 5; // Número de anillos concéntricos
  const max = Math.max(...values, 1);

  // Dibujar anillos de fondo
  ctx.save();
  ctx.strokeStyle = "#eceff3";

  for (let level = 1; level <= levels; level++) {
    const r = (radius / levels) * level;

    ctx.beginPath();
    labels.forEach((_, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / labels.length;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.stroke();
  }

  // Dibujar ejes radiales
  labels.forEach((label, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / labels.length;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    // Línea del eje
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#eef0f3";
    ctx.stroke();

    // Etiqueta
    const labelX = cx + Math.cos(angle) * (radius + 16);
    const labelY = cy + Math.sin(angle) * (radius + 16);
    text(ctx, label, labelX, labelY, "#6b7280", "center", 10);
  });

  ctx.restore();

  // Dibujar polígono de datos
  ctx.save();
  ctx.beginPath();

  values.forEach((value, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / labels.length;
    const r = (value / max) * radius;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.closePath();
  ctx.fillStyle = "rgba(55,65,81,0.20)";
  ctx.fill();

  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}
```

### Mapa de calor (Heatmap)

```javascript
/**
 * Dibuja heatmap (mapa de calor matricial)
 * @param {HTMLCanvasElement} canvas
 * @param {Array<string>} rows - Etiquetas de filas
 * @param {Array<string>} cols - Etiquetas de columnas
 * @param {Array<Array<number>>} matrix - Matriz de valores [filas][columnas]
 * @param {Object} options - Opciones de estilo
 */
function drawHeatmap(canvas, rows, cols, matrix, options = {}) {
  const ctx = canvas.getContext("2d");
  clear(ctx, canvas, options.bg || "#ffffff");

  const padLeft = 70; // Espacio para etiquetas de filas
  const padTop = 24; // Espacio superior
  const gridW = canvas.width - padLeft - 18;
  const gridH = canvas.height - padTop - 38;

  // Tamaño de cada celda
  const cellWidth = gridW / Math.max(cols.length, 1);
  const cellHeight = gridH / Math.max(rows.length, 1);

  // Encontrar valor máximo para escala de color
  const flatValues = matrix.flat();
  const max = Math.max(...flatValues, 1);

  // Renderizar celdas
  matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      // Calcular intensidad (0 a 1)
      const intensity = value / max;

      // Transparencia basada en intensidad (8% a 90%)
      const alpha = 0.08 + intensity * 0.82;

      const cellX = padLeft + colIndex * cellWidth;
      const cellY = padTop + rowIndex * cellHeight;

      // Dibujar celda con color proporcional
      ctx.fillStyle = `rgba(55,65,81,${alpha})`;
      ctx.fillRect(cellX, cellY, cellWidth - 2, cellHeight - 2);

      // Texto del valor (color adaptativo según fondo)
      const textColor = intensity > 0.55 ? "#f9fafb" : "#1f2937";
      text(
        ctx,
        value,
        cellX + cellWidth / 2,
        cellY + cellHeight / 2 + 4,
        textColor,
        "center",
        10,
        "600",
      );
    });
  });

  // Etiquetas de filas (izquierda)
  rows.forEach((label, index) => {
    const yPos = padTop + index * cellHeight + cellHeight / 2 + 3;
    text(ctx, label, padLeft - 8, yPos, "#6b7280", "right", 10);
  });

  // Etiquetas de columnas (abajo)
  cols.forEach((label, index) => {
    const xPos = padLeft + index * cellWidth + cellWidth / 2;
    const yPos = padTop + gridH + 16;
    text(ctx, label, xPos, yPos, "#6b7280", "center", 10);
  });
}
```

### Exportación de la librería

```javascript
// lib/nouscharts.js - Exponer API global
window.NousCharts = {
  drawBarChart,
  drawLineChart,
  drawAreaChart,
  drawDonutChart,
  drawRadarChart,
  drawHeatmap,
};
```

### Sistema de persistencia con IndexedDB

```javascript
// assets/app.js - Gestión de base de datos
const DB_NAME = "nouscharts_db";
const DB_VERSION = 1;
const STORE = "records";

/**
 * Abre conexión a IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, {
          keyPath: "id",
          autoIncrement: true,
        });

        // Índices para consultas eficientes
        store.createIndex("year", "year", { unique: false });
        store.createIndex("region", "region", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Ejecuta acción sobre el object store
 * @param {string} mode - 'readonly' o 'readwrite'
 * @param {Function} callback - Función que recibe el store
 */
async function dbAction(mode, callback) {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

// Operaciones CRUD
const getAllRows = () => dbAction("readonly", (store) => store.getAll());
const addRow = (row) => dbAction("readwrite", (store) => store.add(row));
const deleteRow = (id) => dbAction("readwrite", (store) => store.delete(id));
const clearRows = () => dbAction("readwrite", (store) => store.clear());
```

### Agregación y transformación de datos

```javascript
const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

/**
 * Agrupa datos por mes y suma métrica especificada
 * @param {string} metric - 'ventas', 'costes', 'tickets', 'satisfaccion'
 * @returns {Object} - { labels, values }
 */
function groupByMonth(metric) {
  // Inicializar mapa con todos los meses en 0
  const aggregation = new Map(MONTHS.map((m) => [m, 0]));

  // Sumar valores de registros filtrados
  state.filtered.forEach((record) => {
    const currentValue = aggregation.get(record.month) || 0;
    const recordValue = Number(record[metric] || 0);
    aggregation.set(record.month, currentValue + recordValue);
  });

  // Convertir a arrays para gráficas
  return {
    labels: MONTHS,
    values: MONTHS.map((month) => Math.round(aggregation.get(month) || 0)),
  };
}

/**
 * Agrupa datos por región
 * @param {string} metric
 * @returns {Object} - { labels, values }
 */
function groupByRegion(metric) {
  const regions = ["Norte", "Sur", "Este", "Oeste"];
  const aggregation = new Map(regions.map((r) => [r, 0]));

  state.filtered.forEach((record) => {
    const current = aggregation.get(record.region) || 0;
    aggregation.set(record.region, current + Number(record[metric] || 0));
  });

  return {
    labels: regions,
    values: regions.map((r) => Math.round(aggregation.get(r) || 0)),
  };
}

/**
 * Genera datos para gráfica radar (promedios de métricas)
 * @returns {Object} - { labels, values }
 */
function radarData() {
  const metrics = ["ventas", "costes", "tickets", "satisfaccion"];

  const averages = metrics.map((metric) => {
    const monthlyTotals = groupByMonth(metric).values;
    const sum = monthlyTotals.reduce((acc, val) => acc + val, 0);
    const avg = monthlyTotals.length > 0 ? sum / monthlyTotals.length : 0;
    return Math.round(avg);
  });

  return {
    labels: ["Ventas", "Costes", "Tickets", "Satisfacción"],
    values: averages,
  };
}

/**
 * Genera matriz para heatmap (ventas por región y mes)
 * @returns {Object} - { rows, cols, matrix }
 */
function heatmapData() {
  const rows = ["Norte", "Sur", "Este", "Oeste"];
  const cols = MONTHS;

  const matrix = rows.map((region) => {
    return cols.map((month) => {
      // Sumar ventas de registros que coincidan región y mes
      return state.filtered
        .filter((r) => r.region === region && r.month === month)
        .reduce((acc, r) => acc + Number(r.ventas || 0), 0);
    });
  });

  return { rows, cols, matrix };
}
```

---

## 3. Aplicación práctica (25%)

### Dashboard completo integrado

```javascript
// assets/app.js - Aplicación principal
const charts = window.NousCharts;

const state = {
  rows: [], // Todos los registros
  filtered: [], // Registros filtrados
  year: "all", // Filtro de año
  region: "all", // Filtro de región
  metric: "ventas", // Métrica activa
  search: "", // Búsqueda textual
};

/**
 * Referencias a elementos DOM
 */
const el = {
  addRowBtn: document.getElementById("addRowBtn"),
  seedBtn: document.getElementById("seedBtn"),
  resetBtn: document.getElementById("resetBtn"),
  yearFilter: document.getElementById("yearFilter"),
  regionFilter: document.getElementById("regionFilter"),
  metricSelect: document.getElementById("metricSelect"),
  searchInput: document.getElementById("searchInput"),
  statsBox: document.getElementById("statsBox"),
  tableBody: document.getElementById("tableBody"),
  rowDialog: document.getElementById("rowDialog"),
  rowForm: document.getElementById("rowForm"),
  barChart: document.getElementById("barChart"),
  lineChart: document.getElementById("lineChart"),
  areaChart: document.getElementById("areaChart"),
  donutChart: document.getElementById("donutChart"),
  radarChart: document.getElementById("radarChart"),
  heatmapChart: document.getElementById("heatmapChart"),
};

/**
 * Aplica filtros activos sobre datos
 */
function applyFilters() {
  const query = state.search.toLowerCase();

  state.filtered = state.rows.filter((record) => {
    // Filtro de año
    const matchesYear =
      state.year === "all" || String(record.year) === String(state.year);

    // Filtro de región
    const matchesRegion =
      state.region === "all" || record.region === state.region;

    // Filtro de búsqueda textual
    const searchText = `${record.month} ${record.region}`.toLowerCase();
    const matchesSearch = query === "" || searchText.includes(query);

    return matchesYear && matchesRegion && matchesSearch;
  });
}

/**
 * Renderiza estadísticas KPI
 */
function renderStats() {
  const totalRecords = state.filtered.length;
  const totalVentas = state.filtered.reduce((acc, r) => acc + r.ventas, 0);
  const totalCostes = state.filtered.reduce((acc, r) => acc + r.costes, 0);
  const margen = totalVentas - totalCostes;

  el.statsBox.innerHTML = `
        <article class="kpi">
            <strong>${totalRecords}</strong>
            <span>Registros activos</span>
        </article>
        <article class="kpi">
            <strong>${Math.round(totalVentas)}</strong>
            <span>Ventas acumuladas</span>
        </article>
        <article class="kpi">
            <strong>${Math.round(totalCostes)}</strong>
            <span>Costes acumulados</span>
        </article>
        <article class="kpi">
            <strong>${Math.round(margen)}</strong>
            <span>Margen estimado</span>
        </article>
    `;
}

/**
 * Renderiza tabla de datos
 */
function renderTable() {
  if (!state.filtered.length) {
    el.tableBody.innerHTML = `
            <tr><td colspan="8">Sin datos para el filtro actual.</td></tr>
        `;
    return;
  }

  el.tableBody.innerHTML = state.filtered
    .map(
      (record) => `
        <tr data-id="${record.id}">
            <td>${record.month}</td>
            <td>${record.year}</td>
            <td>${record.region}</td>
            <td>${record.ventas}</td>
            <td>${record.costes}</td>
            <td>${record.tickets}</td>
            <td>${record.satisfaccion}</td>
            <td>
                <button class="secondary" data-action="delete">Eliminar</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

/**
 * Renderiza todas las gráficas
 */
function renderCharts() {
  // Datos agregados
  const monthlyMetric = groupByMonth(state.metric);
  const monthlyVentas = groupByMonth("ventas");
  const byRegion = groupByRegion(state.metric);
  const radar = radarData();
  const heat = heatmapData();

  // Renderizar cada gráfica
  charts.drawBarChart(el.barChart, monthlyMetric.labels, monthlyMetric.values, {
    color: "#4b5563",
  });

  charts.drawLineChart(
    el.lineChart,
    monthlyMetric.labels,
    monthlyMetric.values,
    { color: "#374151" },
  );

  charts.drawAreaChart(
    el.areaChart,
    monthlyVentas.labels,
    monthlyVentas.values,
    {},
  );

  charts.drawDonutChart(el.donutChart, byRegion.labels, byRegion.values, {
    centerText: state.metric,
  });

  charts.drawRadarChart(el.radarChart, radar.labels, radar.values, {});

  charts.drawHeatmap(el.heatmapChart, heat.rows, heat.cols, heat.matrix, {});
}

/**
 * Renderiza todo el dashboard
 */
function renderAll() {
  applyFilters();
  renderStats();
  renderTable();
  renderCharts();
}

/**
 * Recarga datos desde IndexedDB
 */
async function refresh() {
  state.rows = await getAllRows();
  state.rows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  rebuildFilters();
  renderAll();
}

/**
 * Reconstruye opciones de filtros dinámicamente
 */
function rebuildFilters() {
  const years = [...new Set(state.rows.map((r) => r.year))].sort(
    (a, b) => b - a,
  );
  const regions = [...new Set(state.rows.map((r) => r.region))].sort();

  el.yearFilter.innerHTML = `
        <option value="all">Todos</option>
        ${years.map((y) => `<option value="${y}">${y}</option>`).join("")}
    `;

  el.regionFilter.innerHTML = `
        <option value="all">Todas</option>
        ${regions.map((r) => `<option value="${r}">${r}</option>`).join("")}
    `;

  el.yearFilter.value = state.year;
  el.regionFilter.value = state.region;
}
```

### Gestión de eventos

```javascript
/**
 * Abrir modal para añadir registro
 */
el.addRowBtn.addEventListener("click", () => {
  el.rowDialog.showModal();
});

/**
 * Cancelar formulario
 */
el.cancelDialogBtn.addEventListener("click", () => {
  el.rowDialog.close();
});

/**
 * Enviar formulario de nuevo registro
 */
el.rowForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const record = {
    month: el.formMonth.value,
    year: Number(el.formYear.value),
    region: el.formRegion.value,
    ventas: Number(el.formVentas.value),
    costes: Number(el.formCostes.value),
    tickets: Number(el.formTickets.value),
    satisfaccion: Number(el.formSatisfaccion.value),
    createdAt: new Date().toISOString(),
  };

  await addRow(record);
  el.rowForm.reset();
  el.rowDialog.close();
  await refresh();
});

/**
 * Cargar dataset de demostración
 */
el.seedBtn.addEventListener("click", async () => {
  const demoData = seedData();

  for (const record of demoData) {
    await addRow(record);
  }

  await refresh();
});

/**
 * Generador de datos demo
 */
function seedData() {
  const regions = ["Norte", "Sur", "Este", "Oeste"];
  const records = [];

  for (const month of MONTHS) {
    for (const region of regions) {
      const base = 80 + Math.floor(Math.random() * 140);
      const coste = Math.round(base * (0.45 + Math.random() * 0.25));
      const tickets = Math.round(base * (0.25 + Math.random() * 0.45));
      const satisfaccion = 65 + Math.floor(Math.random() * 34);

      records.push({
        month,
        year: 2026,
        region,
        ventas: base,
        costes: coste,
        tickets,
        satisfaccion,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return records;
}

/**
 * Reset completo de base de datos
 */
el.resetBtn.addEventListener("click", async () => {
  if (!confirm("¿Seguro que quieres vaciar la base de datos?")) {
    return;
  }

  await clearRows();
  await refresh();
});

/**
 * Eliminar registro individual
 */
el.tableBody.addEventListener("click", async (event) => {
  const deleteBtn = event.target.closest('button[data-action="delete"]');
  if (!deleteBtn) return;

  const row = event.target.closest("tr[data-id]");
  if (!row) return;

  await deleteRow(Number(row.dataset.id));
  await refresh();
});

/**
 * Filtros reactivos
 */
el.yearFilter.addEventListener("change", () => {
  state.year = el.yearFilter.value;
  renderAll();
});

el.regionFilter.addEventListener("change", () => {
  state.region = el.regionFilter.value;
  renderAll();
});

el.metricSelect.addEventListener("change", () => {
  state.metric = el.metricSelect.value;
  renderCharts(); // Solo re-renderizar gráficas
});

el.searchInput.addEventListener("input", () => {
  state.search = el.searchInput.value.trim();
  renderAll();
});

// Inicializar aplicación
refresh().catch(console.error);
```

### Estructura HTML del dashboard

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NousCharts Lab · Librería de gráficas</title>
    <link rel="stylesheet" href="assets/styles.css" />
  </head>
  <body>
    <main class="shell">
      <!-- Header -->
      <section class="panel header">
        <div>
          <h1>NousCharts Lab</h1>
          <p>
            Librería personalizada de gráficas para paneles empresariales con
            datos persistidos en IndexedDB.
          </p>
        </div>
        <div class="actions">
          <button id="addRowBtn">+ Añadir registro</button>
          <button id="seedBtn" class="secondary">Cargar dataset demo</button>
          <button id="resetBtn" class="secondary">Reset BD</button>
        </div>
      </section>

      <!-- Controles -->
      <section class="panel">
        <div class="row row-4">
          <label
            >Año
            <select id="yearFilter"></select>
          </label>
          <label
            >Región
            <select id="regionFilter"></select>
          </label>
          <label
            >Métrica principal
            <select id="metricSelect">
              <option value="ventas">Ventas</option>
              <option value="costes">Costes</option>
              <option value="tickets">Tickets</option>
              <option value="satisfaccion">Satisfacción</option>
            </select>
          </label>
          <label
            >Búsqueda rápida
            <input id="searchInput" placeholder="Mes o región..." />
          </label>
        </div>
        <div class="stats" id="statsBox"></div>
      </section>

      <!-- Grid de gráficas -->
      <section class="grid-2">
        <article class="panel chart-card">
          <h2>Barras comparativas</h2>
          <canvas id="barChart" width="560" height="280"></canvas>
        </article>

        <article class="panel chart-card">
          <h2>Línea de evolución</h2>
          <canvas id="lineChart" width="560" height="280"></canvas>
        </article>

        <article class="panel chart-card">
          <h2>Área acumulada</h2>
          <canvas id="areaChart" width="560" height="280"></canvas>
        </article>

        <article class="panel chart-card">
          <h2>Donut por regiones</h2>
          <canvas id="donutChart" width="560" height="280"></canvas>
        </article>

        <article class="panel chart-card">
          <h2>Radar KPI mensual</h2>
          <canvas id="radarChart" width="560" height="280"></canvas>
        </article>

        <article class="panel chart-card">
          <h2>Heatmap ventas (mes x región)</h2>
          <canvas id="heatmapChart" width="560" height="280"></canvas>
        </article>
      </section>

      <!-- Tabla de datos -->
      <section class="panel">
        <h2>Dataset (persistencia IndexedDB)</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Año</th>
                <th>Región</th>
                <th>Ventas</th>
                <th>Costes</th>
                <th>Tickets</th>
                <th>Satisfacción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tableBody"></tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- Scripts -->
    <script src="lib/nouscharts.js"></script>
    <script src="assets/app.js"></script>
  </body>
</html>
```

### Errores comunes y soluciones

**Error 1:** No escalar valores correctamente.

```javascript
// Incorrecto
const barHeight = value;

// Correcto
const { max } = getRange(values);
const barHeight = (value / max) * availableHeight;
```

**Error 2:** No cerrar paths en Canvas.

```javascript
// Incorrecto
ctx.beginPath();
ctx.arc(x, y, r, 0, Math.PI * 2);
ctx.fill();

// Correcto
ctx.beginPath();
ctx.arc(x, y, r, 0, Math.PI * 2);
ctx.closePath(); // Cerrar antes de fill
ctx.fill();
```

**Error 3:** No usar save/restore con estilos.

```javascript
// Incorrecto
ctx.fillStyle = "#ff0000";
ctx.fillRect(0, 0, 100, 100);
// El fillStyle persiste para operaciones posteriores

// Correcto
ctx.save();
ctx.fillStyle = "#ff0000";
ctx.fillRect(0, 0, 100, 100);
ctx.restore(); // Restaurar estado anterior
```

---

## 4. Conclusión breve (25%)

### Resumen de puntos clave

Este proyecto de librería de visualización de datos demuestra:

1. **Canvas API avanzado:** Renderizado de primitivas geométricas, textos, gradientes y transformaciones
2. **Algoritmos de visualización:** Escalado proporcional, layouts circulares, distribución angular
3. **Arquitectura modular:** Separación entre capa de renderizado, lógica de negocio y persistencia
4. **Agregación de datos:** Transformaciones map/reduce para agrupar y sumarizar información
5. **Dashboard reactivo:** Sincronización automática entre filtros, gráficas y tabla de datos
6. **Persistencia empresarial:** IndexedDB con índices para consultas eficientes

### Enlace con contenidos de la unidad

Este proyecto integra conceptos del módulo:

- **Canvas API (Unidad 3):** Renderizado 2D con paths, fills, strokes y transformaciones
- **Visualización de datos (Unidad 5):** Implementación de múltiples tipos de gráficas
- **IndexedDB (Unidad 4):** Persistencia estructurada con object stores e índices
- **Eventos y DOM (Unidad 1):** Gestión de formularios, filtros y acciones de usuario
- **Arquitectura de software:** Separación de responsabilidades en capas independientes

### Comparación con librerías comerciales

| Característica       | NousCharts (personalizada)        | Chart.js            | D3.js      |
| -------------------- | --------------------------------- | ------------------- | ---------- |
| Tamaño               | ~310 líneas (~8 KB)               | ~200 KB minificado  | ~500 KB    |
| Dependencias         | Ninguna                           | Ninguna             | Ninguna    |
| Curva de aprendizaje | Alta (implementar todo)           | Baja                | Muy alta   |
| Personalización      | Total                             | Limitada a opciones | Total      |
| Rendimiento          | Optimizado para casos específicos | Bueno               | Variable   |
| Tipos de gráficas    | 6 básicas                         | 8+ con plugins      | Ilimitadas |

**Ventajas de implementación propia:**

- Comprensión profunda de algoritmos de visualización
- Control total sobre renderizado y estilos
- Sin overhead de funcionalidades no utilizadas
- Aprendizaje de geometría y matemáticas aplicadas

**Cuándo usar librerías externas:**

- Proyectos con plazos ajustados
- Necesidad de tipos de gráficas complejas (sankey, treemap, chord)
- Interactividad avanzada (zoom, pan, tooltips dinámicos)
- Actualizaciones animadas en tiempo real

### Aplicaciones en el mundo real

La visualización de datos es crítica en:

- **Business Intelligence:** Dashboards ejecutivos con KPIs y métricas
- **Análisis financiero:** Gráficas de evolución bursátil y rentabilidad
- **Ciencia de datos:** Exploración visual de datasets para ML
- **IoT y telemetría:** Monitorización en tiempo real de sensores
- **Salud y bienestar:** Tracking de métricas personales (peso, pasos, calorías)

### Futuras mejoras

Posibles extensiones del proyecto:

- **Interactividad:** Tooltips al hover, zoom, pan, click en elementos
- **Animaciones:** Transiciones suaves entre estados de datos
- **Más tipos de gráficas:** Scatter plot, bubble chart, sankey, treemap
- **Exportación:** Guardar gráficas como PNG/SVG/PDF
- **Responsive:** Adaptación automática a diferentes tamaños de viewport
- **Temas:** Sistema de colores configurable (claro, oscuro, personalizado)
- **Accesibilidad:** Descripciones ARIA, navegación por teclado

---

## Anexo — Mejoras UI/UX aplicadas (v2)

A continuación se documentan las mejoras implementadas sobre la versión original del proyecto, orientadas a mejorar la experiencia de usuario, la legibilidad visual y la funcionalidad de la aplicación.

### A.1 Navegación por pestañas

Se ha reorganizado la interfaz en **2 pestañas** para separar visualización de datos crudos:

| Pestaña       | Contenido                                                |
| ------------- | -------------------------------------------------------- |
| **Dashboard** | Filtros, 6 gráficas y KPIs en tiempo real                |
| **Dataset**   | Tabla completa con CRUD, botones de seed, import y reset |

Esto reduce el scroll en pantalla y ofrece un flujo más profesional tipo BI dashboard.

### A.2 Sistema de KPIs con colores semánticos

Se reemplaza el `statsBox` inline por una **barra de 4 KPIs** con bordes laterales coloreados:

| KPI       | Color    | Descripción                         |
| --------- | -------- | ----------------------------------- |
| Registros | Azul     | Total de registros filtrados        |
| Ventas    | Verde    | Suma de ventas con formato es-ES    |
| Costes    | Ámbar    | Suma de costes con formato es-ES    |
| Margen    | Dinámico | Verde si positivo, rojo si negativo |

El KPI de margen cambia dinámicamente su color según el resultado sea positivo o negativo.

### A.3 Modo oscuro persistente

Se implementa un **toggle de modo oscuro** con persistencia en `localStorage`:

```javascript
document.body.classList.toggle("dark");
localStorage.setItem("nouscharts-dark", isDark ? "1" : "0");
```

Las gráficas se re-renderizan automáticamente con los colores apropiados para el tema activo, pasando `bg`, `color` y `gridColor` adaptados.

### A.4 Colores adaptativos en gráficas

Las 6 gráficas Canvas ahora reciben **colores dinámicos** según el tema:

```javascript
function getChartColors() {
  const isDark = document.body.classList.contains("dark");
  return {
    bg:        isDark ? "#26262b" : "#ffffff",
    color:     isDark ? "#a1a1aa" : "#4b5563",
    lineColor: isDark ? "#71717a" : "#374151",
    ...
  };
}
```

Esto garantiza que todas las gráficas sean legibles tanto en modo claro como oscuro.

### A.5 Badges de margen en tabla

Cada fila de la tabla ahora muestra una **columna de margen** con badge coloreado:

| Margen   | Clase             | Visual                   |
| -------- | ----------------- | ------------------------ |
| Positivo | `.badge-positive` | Fondo verde, texto verde |
| Negativo | `.badge-negative` | Fondo rojo, texto rojo   |

Esto permite identificar de un vistazo qué registros son rentables y cuáles no.

### A.6 Notificaciones toast

Se implementa un **sistema de toasts** con 4 tonos:

| Tono    | Icono | Uso                              |
| ------- | ----- | -------------------------------- |
| success | ✓     | Registro añadido, exportación OK |
| error   | ✗     | Errores de importación           |
| info    | ℹ     | Carga de datos de ejemplo        |
| warning | ⚠     | Sin datos para exportar          |

Las notificaciones se apilan en la esquina inferior derecha y desaparecen tras 3.5 segundos.

### A.7 Diálogos de confirmación personalizados

Se sustituye el `confirm()` nativo por **diálogos overlay estilizados** con Promise:

```javascript
const ok = await nousConfirm(
  "Reset base de datos",
  "¿Vaciar todos los registros?",
);
if (!ok) return;
```

Se aplica tanto al reset de la BD como a la eliminación individual de registros.

### A.8 Confirmación al eliminar registro

En la versión original, eliminar un registro de la tabla **no pedía confirmación**. Ahora se muestra un diálogo personalizado antes de proceder, evitando borrados accidentales.

### A.9 Exportación de datos (JSON)

Nuevo botón **⬇ Exportar** que descarga todos los registros en formato JSON:

```javascript
const blob = new Blob([JSON.stringify(data, null, 2)], {
  type: "application/json",
});
a.download = `nouscharts_${date}.json`;
```

Esto cubre la mejora futura "Exportación" mencionada en la sección 4.

### A.10 Importación de datos (JSON)

Nuevo botón **⬆ Importar** que permite cargar registros desde un archivo JSON externo, con validación de formato y feedback por toast.

### A.11 Seed automático en primera ejecución

En la primera ejecución (IndexedDB vacío), se cargan automáticamente **48 registros** (12 meses × 4 regiones) para que el dashboard muestre datos inmediatamente, sin necesidad de pulsar "Cargar dataset demo".

### A.12 Dialog rediseñado

El formulario de nuevo registro usa `<dialog>` nativo con:

- `::backdrop` con `backdrop-filter: blur(4px)` para foco visual
- Layout estructurado con `dialog-header`, `dialog-body` y `dialog-footer`
- Botón de cierre (✕) en la esquina superior derecha
- Labels en uppercase con tracking para jerarquía visual
- Animación `slideUp` al abrir

### A.13 Formato numérico localizado

Los KPIs de ventas, costes y margen usan `toLocaleString("es-ES")` para mostrar los números con separadores de miles correctos para el locale español.

### A.14 Mejoras CSS generales

- **Variables CSS** ampliadas con colores semánticos (`--blue`, `--green`, `--red`, `--amber`, `--violet`)
- **Animaciones**: `fadeIn`, `slideUp` para feedback visual suave
- **Responsive** con breakpoints a 1050px y 700px
- **Row hover** en tabla con highlight azul sutil
- **Focus states** con ring azul en inputs y selects
- **Sombras y transiciones** en hover para paneles y KPIs
- **Header** rediseñado con iconos de acción agrupados
- **Footer** con información del curso
