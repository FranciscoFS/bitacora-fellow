window.BF = window.BF || {};
(function () {
  const { esc } = BF.util;
  const PALETTE = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)', 'var(--c7)', 'var(--c8)'];
  const color = (i) => PALETTE[i % PALETTE.length];
  const label = (d) => d.label || d.name || d.key;
  function empty(host, message = 'Sin datos para estos filtros') { host.innerHTML = `<p class="empty">${esc(message)}</p>`; }
  function table(data) {
    return `<details class="chart-values"><summary>Ver todos los valores</summary><table class="chart-data"><thead><tr><th scope="col">Categoría</th><th scope="col">Casos</th></tr></thead><tbody>${data.map((d) => `<tr><th scope="row">${esc(label(d))}</th><td>${d.value}</td></tr>`).join('')}</tbody></table></details>`;
  }
  function bars(host, data, opts = {}) {
    if (!data.length) return empty(host);
    const max = Math.max(1, ...data.map((d) => d.value));
    host.innerHTML = `<div class="bars-scroll" tabindex="0" role="group" aria-label="${esc(opts.aria || 'Casos por categoría')}"><div class="html-bars" style="--columns:${data.length}">${data.map((d) => `<div class="bar-column"><div class="bar-track"><div class="bar-fill" style="height:${d.value / max * 100}%;background:${opts.colorFor ? opts.colorFor(d) : 'var(--accent)'}"></div><span class="bar-number">${d.value}</span></div><span class="bar-caption">${esc(label(d))}</span></div>`).join('')}</div></div>${table(data)}`;
  }
  const monthlyPlots = new WeakMap();
  function renderMonthly(state) {
    const { host, data, opts } = state;
    if (!data.length) return empty(host);
    const width = host.clientWidth;
    if (!width) return;
    state.width = width;
    const W = width, H = 224, L = 32, R = 28, T = 24, B = 38;
    const bottom = H - B, plotWidth = W - L - R, plotHeight = bottom - T;
    const max = Math.max(1, ...data.map(d => d.value));
    const roughStep = Math.max(1, max / 4);
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const step = [1, 2, 5, 10].map(n => n * magnitude).find(n => n >= roughStep);
    const ceiling = Math.ceil(max / step) * step;
    const points = data.map((d, i) => [
      data.length === 1 ? L + plotWidth / 2 : L + i / (data.length - 1) * plotWidth,
      bottom - d.value / ceiling * plotHeight
    ]);
    const path = points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
    const area = `${path} L${points.at(-1)[0].toFixed(2)},${bottom} L${points[0][0].toFixed(2)},${bottom} Z`;
    const slots = Math.min(data.length, Math.max(2, Math.floor(plotWidth / 52) + 1));
    const labelled = new Set(Array.from({ length: slots }, (_, i) => Math.round(i * (data.length - 1) / Math.max(1, slots - 1))));
    const ticks = Array.from({ length: Math.round(ceiling / step) + 1 }, (_, i) => i * step);
    host.innerHTML = `<svg class="monthly-plot" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria || 'Casos por mes')}. ${data.length} ${data.length === 1 ? 'mes' : 'meses'}. Valores completos debajo.">${ticks.map(value => {
      const y = bottom - value / ceiling * plotHeight;
      return `<line class="monthly-grid" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text class="monthly-axis" x="${L - 9}" y="${y}" text-anchor="end" dominant-baseline="middle">${value}</text>`;
    }).join('')}<path class="monthly-area" d="${area}"/><path class="monthly-line" d="${path}"/>${points.map((point, i) => `<circle class="monthly-dot" cx="${point[0]}" cy="${point[1]}" r="4"><title>${esc(label(data[i]))}: ${data[i].value} ${data[i].value === 1 ? 'caso' : 'casos'}</title></circle>`).join('')}${points.map((point, i) => labelled.has(i) ? `<text class="monthly-axis monthly-month" x="${point[0]}" y="${H - 10}" text-anchor="middle">${esc(label(data[i]))}</text>` : '').join('')}</svg>${table(data)}`;
  }
  function monthly(host, data, opts = {}) {
    let state = monthlyPlots.get(host);
    if (!state) {
      state = { host, data, opts, width: 0 };
      monthlyPlots.set(host, state);
      if (typeof ResizeObserver !== 'undefined') {
        state.observer = new ResizeObserver(() => {
          if (host.clientWidth && host.clientWidth !== state.width) renderMonthly(state);
        });
        state.observer.observe(host);
      }
    }
    state.data = data; state.opts = opts;
    if (!data.length) { empty(host); return; }
    renderMonthly(state);
  }
  function hbars(host, data, opts = {}) {
    if (!data.length) return empty(host);
    const rows = data.slice(0, opts.limit || 8), max = Math.max(1, ...rows.map((d) => d.value));
    const total = opts.total;
    host.innerHTML = `<div class="rank-list" role="group" aria-label="${esc(opts.aria || 'Procedimientos')}">${rows.map((d) => `<div class="rank-row"><div class="rank-label"><span>${esc(label(d))}</span><b>${d.value}${total ? ` <small>${Math.round(d.value / total * 100)}%</small>` : ''}</b></div><div class="rank-track" aria-hidden="true"><i style="--progress:${d.value / max};background:${opts.colorFor ? opts.colorFor(d) : 'var(--accent)'}"></i></div></div>`).join('')}</div>${data.length > rows.length ? table(data) : ''}`;
  }
  function donut(host, data, opts = {}) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (!total) return empty(host);
    hbars(host, data, { ...opts, limit: data.length, total });
  }
  function line(host, data, opts = {}) {
    if (!data.length) return empty(host);
    const max = Math.max(1, ...data.map((d) => d.value));
    const W = 620, H = 170, L = 16, R = 16, T = 16, B = 12;
    const points = data.map((d, i) => [data.length === 1 ? W / 2 : L + i / (data.length - 1) * (W - L - R), T + (1 - d.value / max) * (H - T - B)]);
    const path = points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
    const area = `${path} L${points[points.length - 1][0]},${H - B} L${points[0][0]},${H - B} Z`;
    const last = data[data.length - 1];
    host.innerHTML = `<div class="line-summary"><b>${last.value}</b><span class="muted small">casos acumulados · ${esc(label(last))}</span></div><svg class="line-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria || 'Evolución acumulada')}. Total final ${last.value}. Valores completos debajo.">${[0, .5, 1].map((v) => `<line x1="${L}" x2="${W - R}" y1="${T + v * (H - T - B)}" y2="${T + v * (H - T - B)}" class="gridline"/>`).join('')}<path d="${area}" fill="var(--accent)" fill-opacity=".1"/><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" vector-effect="non-scaling-stroke"/>${points.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="var(--accent)"><title>${esc(label(data[i]))}: ${data[i].value}</title></circle>`).join('')}</svg><div class="line-axis" aria-hidden="true"><span>${esc(label(data[0]))}</span><span>${esc(label(last))}</span></div>${table(data)}`;
  }
  BF.charts = { bars, monthly, hbars, donut, line, empty, color, PALETTE };
})();
