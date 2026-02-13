# NousCharts Lab

Librería personalizada de gráficas para DAM2 - Desarrollo de interfaces.

## Qué incluye

- Librería propia `lib/nouscharts.js` (sin Chart.js ni librerías externas de gráficas).
- Tipos de gráfica implementados:
  - Barras
  - Línea
  - Área
  - Donut
  - Radar
  - Heatmap
- Dashboard de demostración con múltiples bloques de información.
- Persistencia de datos empresariales en IndexedDB.
- Filtros por año, región, métrica y búsqueda.

## Ejecutar

No necesita backend. Abre `index.html` en navegador moderno.

## Estructura

- `index.html` → dashboard y controles
- `assets/styles.css` → UI estilo Notion
- `assets/app.js` → lógica del dashboard + IndexedDB
- `lib/nouscharts.js` → librería de renderizado de gráficas sobre Canvas
