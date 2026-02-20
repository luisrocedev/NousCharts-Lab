<div align="center">

# NousCharts Lab

**Librería ligera de visualización con Canvas API · 6 tipos de gráfica · Zero dependencies**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=fff)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=fff)
![JavaScript](https://img.shields.io/badge/ES6+-F7DF1E?logo=javascript&logoColor=000)
![Canvas](https://img.shields.io/badge/Canvas_API-292929?logo=html5&logoColor=fff)
![IndexedDB](https://img.shields.io/badge/IndexedDB-4285F4?logo=googlechrome&logoColor=fff)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## Resumen

**NousCharts Lab** es una librería de gráficas construida 100 % con Canvas API —sin Chart.js, D3 ni librerías externas— acompañada de un dashboard interactivo para la gestión de datos empresariales. Persistencia con IndexedDB, dark mode adaptativo y un sistema completo de filtros en tiempo real.

---

## Características principales

| Característica            | Detalle                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| **6 tipos de gráfica**    | Barras · Línea · Área · Donut · Radar · Heatmap                                             |
| **Dark mode**             | Toggle manual + auto-detección de preferencia del sistema · Colores adaptativos en gráficas |
| **Tabs**                  | Dashboard (KPIs + gráficas) · Dataset (tabla CRUD)                                          |
| **IndexedDB**             | Persistencia offline · Auto-seed de 48 registros en primera ejecución                       |
| **Filtros en vivo**       | Año · Región · Métrica · Búsqueda por texto                                                 |
| **KPIs semánticos**       | 4 tarjetas con bordes de color y formato numérico `es-ES`                                   |
| **Exportar / Importar**   | JSON con nombre fechado · Validación de estructura al importar                              |
| **Toasts**                | Notificaciones contextuales: success, error, info, warning                                  |
| **Confirm personalizado** | Diálogo `<dialog>` con Promise en lugar de `confirm()` nativo                               |
| **Badges**                | Margen calculado con indicador positivo / negativo en cada fila                             |
| **Responsive**            | Breakpoints adaptados a escritorio, tablet y móvil                                          |

---

## Tipos de gráfica

| Gráfica     | Canvas API                             | Uso en el dashboard               |
| ----------- | -------------------------------------- | --------------------------------- |
| **Barras**  | `fillRect`, `linearGradient`           | Ventas/costes/tickets mensuales   |
| **Línea**   | `moveTo`, `lineTo`, `arc`              | Evolución temporal por métrica    |
| **Área**    | `lineTo` + `createLinearGradient` fill | Ventas mensuales con área rellena |
| **Donut**   | `arc` con ángulos proporcionales       | Distribución por región           |
| **Radar**   | Polígono sobre ejes radiales           | Media de indicadores cruzados     |
| **Heatmap** | `fillRect` + `rgba` intensidad         | Ventas por región × mes           |

---

## Inicio rápido

```bash
git clone https://github.com/luisrocedev/NousCharts-Lab.git
cd NousCharts-Lab
# Abrir index.html en un navegador moderno — sin backend necesario
open index.html
```

Al abrir por primera vez, el dashboard carga **48 registros de ejemplo** automáticamente con datos aleatorios de ventas, costes, tickets y satisfacción para las 4 regiones.

---

## Estructura del proyecto

```
NousCharts-Lab/
├── index.html              → SPA: dashboard + dataset + diálogos
├── assets/
│   ├── app.js              → Lógica: IndexedDB, filtros, dark mode, toasts
│   └── styles.css          → CSS vars, dark mode, tabs, responsive
├── lib/
│   └── nouscharts.js       → Librería de 6 gráficas (Canvas API puro)
└── README.md
```

| Archivo             | Líneas | Responsabilidad                                                    |
| ------------------- | ------ | ------------------------------------------------------------------ |
| `lib/nouscharts.js` | ~310   | Renderizado de gráficas sobre `<canvas>` con colores configurables |
| `assets/app.js`     | ~310   | IndexedDB CRUD, eventos, filtros, dark mode, toasts, confirm       |
| `assets/styles.css` | ~220   | Variables CSS, dark mode, tabs, toasts, badges, responsive         |
| `index.html`        | ~175   | Estructura SPA: header, tabs, 6 canvas, tabla, diálogos, footer    |

---

## Flujo de datos

```
Usuario → Filtros (Año / Región / Métrica / Búsqueda)
               │
               ▼
         IndexedDB (records)
               │
               ▼
     Agregaciones (groupByMonth, groupByRegion, radarData, heatmapData)
               │
               ▼
  NousCharts.draw*() → Canvas 2D → 6 gráficas renderizadas
```

---

## Dark mode

El sistema detecta `prefers-color-scheme: dark` al cargar y persiste la elección en `localStorage`. Al activar/desactivar, las gráficas se re-renderizan con una paleta adaptada (fondos oscuros, colores de grid/ejes/texto ajustados).

---

## Tecnologías

- **HTML5** — Canvas API, `<dialog>`, `<nav>`, estructura semántica
- **CSS3** — Custom properties, `color-mix()`, `backdrop-filter`, `@media prefers-color-scheme`
- **JavaScript ES6** — `async/await`, `Promise`, `Map`, `Set`, desestructuración, módulos implícitos
- **IndexedDB** — Base de datos transaccional del navegador para persistencia offline
- **Google Fonts** — Inter (300, 400, 600)

---

## Autor

**Luis Rodriguez Cedeño** · DAM2 — Desarrollo de Interfaces

---

## Licencia

MIT
