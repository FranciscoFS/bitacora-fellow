/* Frequency of principal procedures. Local dates and real store data only. */
window.BF = window.BF || {};
(function () {
  const { $, esc, todayISO } = BF.util;
  const S = BF.store;

  function dateRange(period, today = todayISO()) {
    if (period === 'all') return { desde: '', hasta: '' };
    const date = new Date(today + 'T12:00:00');
    date.setDate(date.getDate() - (period === '84' ? 83 : 27));
    const desde = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    return { desde, hasta: today };
  }

  function matches(c, scope) {
    if (scope.desde && (!c.fecha || c.fecha < scope.desde)) return false;
    if (scope.hasta && (!c.fecha || c.fecha > scope.hasta)) return false;
    if (scope.role === 'surgeon' ? !S.isSurgeon(c) : scope.role && c.rol !== scope.role) return false;
    return !scope.procedures || scope.procedures.includes(c.procedimientoPrincipal || 'Sin procedimiento');
  }

  function summarize(cases, scope) {
    const selected = cases.filter(c => matches(c, scope));
    const counts = new Map();
    selected.forEach(c => { const name = c.procedimientoPrincipal || 'Sin procedimiento'; counts.set(name, (counts.get(name) || 0)+1); });
    const procedures = [...counts].map(([name,value]) => ({ name,value })).sort((a,b) => b.value-a.value || a.name.localeCompare(b.name,'es'));
    const tiles = procedures.map(p => ({ ...p, procedures: [p.name] }));
    return { total:selected.length, procedures, tiles };
  }

  let currentScope, currentSummary, expanded = false;
  const visibleLimit = 6;
  function renderCards() {
    const { total, tiles } = currentSummary;
    const visible = expanded ? tiles : tiles.slice(0, visibleLimit);
    const host = $('#practiceTiles');
    host.classList.remove('practice-small');
    host.dataset.odd = String(visible.length > 1 && visible.length % 2 === 1);
    host.innerHTML = visible.map((p,i) => `<button class="practice-tile" type="button" data-practice-index="${i}" aria-label="${esc(p.name)}: ${p.value} ${p.value === 1 ? 'caso' : 'casos'}, ${Math.round(p.value / total * 100)}% del período. Ver casos"><span class="practice-card-top" aria-hidden="true"><span class="practice-card-rank">${String(i + 1).padStart(2, '0')}</span><span class="practice-card-arrow">↗</span></span><strong>${esc(p.name)}</strong><span class="practice-card-bottom" aria-hidden="true"><span class="practice-card-count"><b>${p.value}</b><small>${p.value === 1 ? 'caso' : 'casos'}</small></span><span class="practice-card-share">${Math.round(p.value / total * 100)}%</span></span></button>`).join('') || '<p class="empty">No hay casos en este período. Prueba Historial o registra un caso.</p>';
    const toggle = $('#practiceMore');
    toggle.hidden = tiles.length <= visibleLimit;
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.textContent = expanded ? 'Mostrar menos' : `Ver ${tiles.length - visibleLimit} procedimientos más`;
    if (BF.home) BF.home.animateTiles(host);
  }
  function render() {
    currentScope = { ...dateRange($('#practicePeriod').value), role: '' };
    currentSummary = summarize(S.all(), currentScope);
    const { total } = currentSummary;
    $('#practiceContext').textContent = `${total} ${total === 1 ? 'caso' : 'casos'}`;
    $('#practiceContext').title = $('#practicePeriod').selectedOptions[0].textContent;
    $('#practiceAll').disabled = !total;
    renderCards();
    if (BF.home) BF.home.syncPeriods();
  }
  function openScope(procedures, name) {
    const label = `${name} · ${$('#practicePeriod').selectedOptions[0].textContent}`;
    BF.bitacora.setScope({ ...currentScope, procedures }, label);
    BF.app.show('bitacora');
    $('#view-bitacora h2').tabIndex=-1;$('#view-bitacora h2').focus({preventScroll:true});
  }
  function init() {
    $('#practicePeriod').addEventListener('change', () => { expanded = false; render(); });
    $('#practiceTiles').addEventListener('click', e => {
      const button = e.target.closest('[data-practice-index]'); if (!button) return;
      const tile = currentSummary.tiles[Number(button.dataset.practiceIndex)];
      if (tile) openScope(tile.procedures, tile.name);
    });
    $('#practiceMore').addEventListener('click', () => { expanded = !expanded; renderCards(); });
    $('#practiceAll').addEventListener('click', () => openScope(undefined,'Todos los procedimientos'));
    S.on('change', render);
    render();
  }
  BF.practice = { init, render, dateRange, matches, summarize };
})();
