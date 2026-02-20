# NousCharts-Lab — Plantilla de Examen

**Alumno:** Luis Rodríguez Cedeño · **DNI:** 53945291X  
**Módulo:** Desarrollo de Interfaces · **Curso:** DAM2 2025/26

---

## 1. Introducción

- **Qué es:** Librería de visualización de datos con Canvas API (6 tipos de gráfica) + demo interactiva con IndexedDB
- **Contexto:** Módulo de Desarrollo de Interfaces — Canvas 2D, gráficos adaptativos, dark mode, datos persistentes
- **Objetivos principales:**
  - Librería `NousCharts` con 6 tipos: Barras, Línea, Área, Donut, Radar, Heatmap
  - Renderizado pure Canvas 2D (sin dependencias externas)
  - Soporte dark mode adaptativo (colores se calculan según tema)
  - Demo con IndexedDB, filtros, KPIs, export/import JSON, auto-seed
- **Tecnologías clave:**
  - JavaScript vanilla, Canvas 2D API, IndexedDB, CSS dark mode
- **Arquitectura:** `lib/nouscharts.js` (6 funciones de dibujo) → `assets/app.js` (demo CRUD + filtros + charts adaptativos) → `index.html` (6 canvas + tabla + formularios) → `assets/styles.css` (Notion-inspired)

---

## 2. Desarrollo de las partes

### 2.1 Gráfico de barras — Canvas API

- Helpers: `clear()` (fondo), `drawGrid()` (rejilla), `drawAxes()` (ejes), `text()` (texto con fuente)
- Cálculo de proporciones: normalización por valor máximo
- Responsive: adapta ancho de barras al número de valores

```javascript
function drawBarChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext("2d");
  clear(ctx, canvas, options.bg || "#ffffff");

  const pad = 38,
    x = pad,
    y = 18;
  const w = canvas.width - pad * 2,
    h = canvas.height - 52;

  drawGrid(ctx, x, y, w, h, 5, options.gridColor);
  drawAxes(ctx, x, y, w, h, options.axisColor);

  const { max } = getRange(values);
  const gap = w / Math.max(values.length, 1);
  const barW = gap * 0.58;

  values.forEach((v, i) => {
    const barH = (v / max) * (h - 8);
    const bx = x + i * gap + (gap - barW) / 2;
    const by = y + h - barH;
    ctx.fillStyle = options.color || "#4b5563";
    ctx.fillRect(bx, by, barW, barH);
    text(
      ctx,
      labels[i],
      bx + barW / 2,
      y + h + 16,
      options.labelColor,
      "center",
      10,
    );
    text(ctx, v, bx + barW / 2, by - 6, options.textColor, "center", 10, "600");
  });
}
```

> **Explicación:** Se calcula el padding para ejes, se dibuja rejilla y ejes. Cada barra se escala proporcionalmente al máximo. Las etiquetas van debajo y los valores encima de cada barra. Todo en Canvas puro, sin SVG ni librerías.

### 2.2 Gráfico de área — Gradiente lineal

- Dibuja la línea + relleno con gradiente vertical (opaco arriba → transparente abajo)
- `createLinearGradient()` para el relleno
- `closePath()` cierra el polígono hasta el eje X

```javascript
function drawAreaChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext("2d");
  // ... setup (clear, grid, axes)
  const points = values.map((v, i) => ({
    x: x + i * step,
    y: y + h - (v / max) * (h - 8),
  }));

  // Relleno con gradiente
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, options.fillTop || "rgba(55,65,81,0.35)");
  grad.addColorStop(1, options.fillBottom || "rgba(55,65,81,0.04)");

  ctx.beginPath();
  points.forEach((p, i) =>
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
  );
  ctx.lineTo(x + w, y + h); // esquina inferior derecha
  ctx.lineTo(x, y + h); // esquina inferior izquierda
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
}
```

> **Explicación:** Se traza la línea de datos, luego se extiende hasta el eje X para formar un polígono cerrado. Se rellena con un gradiente vertical: más opaco arriba (datos altos) y más transparente abajo (eje).

### 2.3 Gráfico Radar — Geometría polar

- Calcula posiciones con `Math.cos/sin` desde el centro
- Dibuja anillos concéntricos (niveles) + ejes radiales
- Área de datos con relleno semitransparente

```javascript
function drawRadarChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2,
    cy = canvas.height / 2 + 6;
  const radius = Math.min(canvas.width, canvas.height) * 0.34;
  const max = Math.max(...values, 1);

  // Anillos concéntricos (niveles)
  for (let l = 1; l <= 5; l++) {
    const rr = (radius / 5) * l;
    ctx.beginPath();
    labels.forEach((_, i) => {
      const ang = -Math.PI / 2 + (Math.PI * 2 * i) / labels.length;
      const px = cx + Math.cos(ang) * rr,
        py = cy + Math.sin(ang) * rr;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();
  }

  // Polígono de datos
  ctx.beginPath();
  values.forEach((v, i) => {
    const ang = -Math.PI / 2 + (Math.PI * 2 * i) / labels.length;
    const rr = (v / max) * radius;
    const px = cx + Math.cos(ang) * rr;
    const py = cy + Math.sin(ang) * rr;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = options.fillColor || "rgba(55,65,81,0.20)";
  ctx.fill();
  ctx.stroke();
}
```

> **Explicación:** Cada eje del radar se calcula con trigonometría (cos/sin). Los anillos son polígonos concéntricos a cada nivel. Los datos se normalizan contra el máximo y se dibujan como un polígono relleno semitransparente.

### 2.4 Heatmap — Matriz de celdas coloreadas

- Filas (regiones) × Columnas (meses) → matriz numérica
- Intensidad alpha proporcional al valor: `rgba(base, 0.08 + t * 0.82)`
- Texto claro si alpha > 0.55, oscuro si no

```javascript
function drawHeatmap(canvas, rows, cols, matrix, options = {}) {
  const ctx = canvas.getContext('2d');
  const max = Math.max(...matrix.flat(), 1);

  matrix.forEach((line, r) => {
    line.forEach((value, c) => {
      const t = value / max;
      const alpha = 0.08 + t * 0.82;
      ctx.fillStyle = `rgba(${options.heatColor || '55,65,81'},${alpha})`;
      ctx.fillRect(padLeft + c * cw, padTop + r * ch, cw - 2, ch - 2);
      // Texto adaptativo: blanco si celda oscura, negro si clara
      const tc = t > 0.55 ? '#f9fafb' : '#1f2937';
      text(ctx, value, /* centro celda */, tc, 'center');
    });
  });
}
```

> **Explicación:** Cada celda se colorea con alpha proporcional a su valor (más valor = más opaco). El color del texto se adapta: blanco sobre celdas oscuras, negro sobre claras, para máxima legibilidad.

### 2.5 Colores adaptativos dark mode

- `getChartColors()` devuelve un objeto con todos los colores según el tema activo
- Detecta `document.body.classList.contains('dark')`
- Los charts se re-renderizan al cambiar de tema

```javascript
function getChartColors() {
  const d = document.body.classList.contains("dark");
  return {
    bg: d ? "#26262b" : "#ffffff",
    color: d ? "#a1a1aa" : "#4b5563",
    gridColor: d ? "#3a3a3f" : "#eef0f3",
    axisColor: d ? "#4a4a50" : "#d9dde2",
    labelColor: d ? "#71717a" : "#6b7280",
    textColor: d ? "#d4d4d8" : "#374151",
    donutColors: d
      ? ["#71717a", "#a1a1aa", "#52525b", "#d4d4d8", "#3f3f46"]
      : ["#374151", "#6b7280", "#9ca3af", "#d1d5db", "#4b5563"],
    heatColor: d ? "161,161,170" : "55,65,81",
  };
}
```

> **Explicación:** Un solo objeto centraliza todos los colores. Dependiendo del dark mode, se devuelven paletas diferentes. Los charts reciben estos colores como `options` y se redibujan al toggle del tema.

---

## 3. Presentación del proyecto

- **Flujo:** Abrir → ver 6 charts → Tab datos: CRUD registros → filtrar año/región → cambiar métrica → export JSON
- **Puntos fuertes:** 6 tipos de gráfica en Canvas puro, dark mode adaptativo, auto-seed de datos demo
- **Demo:** LLive Server → seed automático 48 registros → filtrar por región → ver heatmap → exportar
- **Librería reutilizable:** `NousCharts.*` se expone en `window` para uso externo

---

## 4. Conclusión

- **Competencias:** Canvas 2D API, geometría (polar/cartesiana), gradientes, gestión de color adaptativa
- **Canvas vs SVG:** Canvas es imperativo (dibujas píxel a píxel), ideal para visualización de datos performante
- **Sin dependencias:** Todo pure JavaScript, no usa Chart.js ni D3.js
- **Extensibilidad:** Añadir nuevo tipo de chart = nueva función con misma interfaz (canvas, labels, values, options)
- **Valoración:** Librería de gráficas profesional que demuestra dominio de Canvas 2D y dark mode adaptativo
