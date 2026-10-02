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
  BF.charts = { bars, hbars, donut, line, empty, color, PALETTE };
})();
