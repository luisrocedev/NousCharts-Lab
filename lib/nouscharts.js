function clear(ctx, canvas, bg = '#ffffff') {
  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function getRange(values) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  return { min, max };
}

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

function text(ctx, str, x, y, color = '#374151', align = 'left', size = 11, weight = '400') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = `${weight} ${size}px Inter, sans-serif`;
  ctx.fillText(String(str), x, y);
  ctx.restore();
}

function drawBarChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext('2d');
  clear(ctx, canvas, options.bg || '#ffffff');

  const pad = 38;
  const x = pad;
  const y = 18;
  const w = canvas.width - pad * 2;
  const h = canvas.height - 52;

  drawGrid(ctx, x, y, w, h, 5);
  drawAxes(ctx, x, y, w, h);

  const { max } = getRange(values);
  const barW = w / Math.max(values.length, 1) * 0.58;
  const gap = w / Math.max(values.length, 1);

  values.forEach((v, i) => {
    const barH = (v / max) * (h - 8);
    const bx = x + i * gap + (gap - barW) / 2;
    const by = y + h - barH;

    ctx.fillStyle = options.color || '#4b5563';
    ctx.fillRect(bx, by, barW, barH);

    text(ctx, labels[i], bx + barW / 2, y + h + 16, '#6b7280', 'center', 10);
    text(ctx, v, bx + barW / 2, by - 6, '#374151', 'center', 10, '600');
  });
}

function drawLineChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext('2d');
  clear(ctx, canvas, options.bg || '#ffffff');

  const pad = 38;
  const x = pad;
  const y = 18;
  const w = canvas.width - pad * 2;
  const h = canvas.height - 52;

  drawGrid(ctx, x, y, w, h, 5);
  drawAxes(ctx, x, y, w, h);

  const { max } = getRange(values);
  const step = w / Math.max(values.length - 1, 1);

  ctx.save();
  ctx.strokeStyle = options.color || '#374151';
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((v, i) => {
    const px = x + i * step;
    const py = y + h - (v / max) * (h - 8);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.restore();

  values.forEach((v, i) => {
    const px = x + i * step;
    const py = y + h - (v / max) * (h - 8);

    ctx.fillStyle = options.pointColor || '#111827';
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();

    text(ctx, labels[i], px, y + h + 16, '#6b7280', 'center', 10);
  });
}

function drawAreaChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext('2d');
  clear(ctx, canvas, options.bg || '#ffffff');

  const pad = 38;
  const x = pad;
  const y = 18;
  const w = canvas.width - pad * 2;
  const h = canvas.height - 52;

  drawGrid(ctx, x, y, w, h, 5);
  drawAxes(ctx, x, y, w, h);

  const { max } = getRange(values);
  const step = w / Math.max(values.length - 1, 1);

  const points = values.map((v, i) => ({
    x: x + i * step,
    y: y + h - (v / max) * (h - 8),
  }));

  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, options.fillTop || 'rgba(55,65,81,0.35)');
  grad.addColorStop(1, options.fillBottom || 'rgba(55,65,81,0.04)');

  ctx.save();
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  });
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = options.stroke || '#374151';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
  ctx.restore();

  labels.forEach((l, i) => text(ctx, l, x + i * step, y + h + 16, '#6b7280', 'center', 10));
}

function drawDonutChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext('2d');
  clear(ctx, canvas, options.bg || '#ffffff');

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = Math.min(canvas.width, canvas.height) * 0.33;
  const inner = r * 0.56;
  const sum = values.reduce((a, b) => a + b, 0) || 1;

  const colors = options.colors || ['#374151', '#6b7280', '#9ca3af', '#d1d5db', '#4b5563'];

  let start = -Math.PI / 2;
  values.forEach((v, i) => {
    const arc = (v / sum) * Math.PI * 2;
    const end = start + arc;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.restore();

    start = end;
  });

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = options.bg || '#ffffff';
  ctx.fill();
  ctx.restore();

  text(ctx, options.centerText || 'Total', cx, cy - 4, '#6b7280', 'center', 11, '600');
  text(ctx, sum, cx, cy + 14, '#111827', 'center', 15, '700');

  labels.forEach((label, i) => {
    const y = 20 + i * 16;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(12, y - 8, 10, 10);
    text(ctx, `${label} (${values[i]})`, 28, y, '#374151', 'left', 10);
  });
}

function drawRadarChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext('2d');
  clear(ctx, canvas, options.bg || '#ffffff');

  const cx = canvas.width / 2;
  const cy = canvas.height / 2 + 6;
  const radius = Math.min(canvas.width, canvas.height) * 0.34;
  const levels = 5;
  const max = Math.max(...values, 1);

  ctx.save();
  ctx.strokeStyle = '#eceff3';
  for (let l = 1; l <= levels; l++) {
    const rr = (radius / levels) * l;
    ctx.beginPath();
    labels.forEach((_, i) => {
      const angle = (-Math.PI / 2) + (Math.PI * 2 * i / labels.length);
      const x = cx + Math.cos(angle) * rr;
      const y = cy + Math.sin(angle) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  labels.forEach((label, i) => {
    const angle = (-Math.PI / 2) + (Math.PI * 2 * i / labels.length);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#eef0f3';
    ctx.stroke();

    text(ctx, label, cx + Math.cos(angle) * (radius + 16), cy + Math.sin(angle) * (radius + 16), '#6b7280', 'center', 10);
  });

  ctx.beginPath();
  values.forEach((v, i) => {
    const angle = (-Math.PI / 2) + (Math.PI * 2 * i / labels.length);
    const rr = (v / max) * radius;
    const x = cx + Math.cos(angle) * rr;
    const y = cy + Math.sin(angle) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(55,65,81,0.20)';
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawHeatmap(canvas, rows, cols, matrix, options = {}) {
  const ctx = canvas.getContext('2d');
  clear(ctx, canvas, options.bg || '#ffffff');

  const padLeft = 70;
  const padTop = 24;
  const gridW = canvas.width - padLeft - 18;
  const gridH = canvas.height - padTop - 38;

  const cw = gridW / Math.max(cols.length, 1);
  const ch = gridH / Math.max(rows.length, 1);

  const flat = matrix.flat();
  const max = Math.max(...flat, 1);

  matrix.forEach((line, r) => {
    line.forEach((value, c) => {
      const t = value / max;
      const alpha = 0.08 + t * 0.82;
      ctx.fillStyle = `rgba(55,65,81,${alpha})`;
      ctx.fillRect(padLeft + c * cw, padTop + r * ch, cw - 2, ch - 2);
      text(ctx, value, padLeft + c * cw + cw / 2, padTop + r * ch + ch / 2 + 4, t > 0.55 ? '#f9fafb' : '#1f2937', 'center', 10, '600');
    });
  });

  rows.forEach((row, i) => text(ctx, row, padLeft - 8, padTop + i * ch + ch / 2 + 3, '#6b7280', 'right', 10));
  cols.forEach((col, i) => text(ctx, col, padLeft + i * cw + cw / 2, padTop + gridH + 16, '#6b7280', 'center', 10));
}

window.NousCharts = {
  drawBarChart,
  drawLineChart,
  drawAreaChart,
  drawDonutChart,
  drawRadarChart,
  drawHeatmap,
};
