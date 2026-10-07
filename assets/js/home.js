/* Interactive home frames. Data stays in the store; motion is progressive enhancement. */
window.BF = window.BF || {};
(function () {
  const { $, esc, fmtDate } = BF.util;
  let summaryKey = '', focusKey = '', focusTimer;
  const allowsMotion = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function reveal(nodes, delay = 0) {
    if (!allowsMotion()) return;
    Array.from(nodes).filter((node) => !node.hidden).forEach((node, i) => {
      if (typeof node.animate === 'function') node.animate(
        [{ opacity: .35, transform: 'translateY(16px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 460, delay: delay + i * 55, easing: 'cubic-bezier(.22,.8,.3,1)' }
      );
    });
  }
  function formatNumber(value, decimals) {
    return new Intl.NumberFormat('es-CL', { maximumFractionDigits: decimals }).format(value);
  }
  function animateNumbers() {
    if (!allowsMotion()) return;
    document.querySelectorAll('#personalSummary [data-home-number]').forEach((node) => {
      const target = Number(node.dataset.homeNumber), decimals = Number(node.dataset.decimals);
      const start = performance.now();
      function tick(now) {
        if (!node.isConnected || $('#view-dashboard').hidden || !allowsMotion()) {
          node.textContent = formatNumber(target, decimals); return;
        }
        const progress = Math.min(1, (now - start) / 580);
        node.textContent = formatNumber(target * (1 - Math.pow(1 - progress, 3)), decimals);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
  function renderSummary(cases, metrics) {
    const recent = cases[0];
    const hours = Math.round(metrics.duracionTotal / 6) / 10;
    const key = JSON.stringify([metrics.total, metrics.comoCirujano, hours, recent && [recent.id, recent.codigo, recent.procedimientoPrincipal, recent.fecha]]);
    if (key === summaryKey) return;
    summaryKey = key;
    const stat = (value, label, scope, decimals = 0, primary = false) => `<button type="button" class="home-stat${primary ? ' home-stat-primary' : ''}" data-home-scope="${scope}" aria-label="${esc(label)}: ${formatNumber(value, decimals)}. ${scope === 'hours' ? 'Ver casos por duración' : 'Ver casos'}"><span class="home-stat-label">${esc(label)}</span><b data-home-number="${value}" data-decimals="${decimals}" aria-hidden="true">${formatNumber(value, decimals)}</b><span class="home-stat-link">${scope === 'hours' ? 'Ver tiempos' : 'Ver casos'} <span aria-hidden="true">↗</span></span></button>`;
    $('#personalSummary').innerHTML =
      stat(metrics.total, 'Casos registrados', 'all', 0, true) +
      stat(metrics.comoCirujano, 'Como cirujano', 'surgeon') +
      stat(hours, 'Horas de quirófano', 'hours', 1) +
      (recent ? `<button type="button" class="home-recent" data-home-case="${esc(recent.id)}"><span class="home-stat-label">Último caso</span><strong>${esc(recent.procedimientoPrincipal || 'Caso registrado')}</strong><span class="home-recent-date">${esc(fmtDate(recent.fecha))} · ${esc(recent.codigo)}</span><span class="home-stat-link">Abrir ficha <span aria-hidden="true">↗</span></span></button>` : '');
    if (!$('#view-dashboard').hidden) { reveal($('#personalSummary').children); animateNumbers(); }
  }
  function renderFocus(goals, soloCirujano) {
    const host = $('#homeGoalFocus');
    host.hidden = !goals.length || !BF.store.all().length;
    if (host.hidden) return;
    const completed = goals.filter((goal) => goal.cumplida).length;
    const focus = goals.filter((goal) => !goal.cumplida).sort((a, b) => b.pct - a.pct || a.proc.localeCompare(b.proc, 'es'))[0];
    const key = JSON.stringify([focus, completed, goals.length, soloCirujano]);
    if (key === focusKey) return;
    focusKey = key;
    host.innerHTML = focus
      ? `<button type="button" class="home-focus-button" data-focus-goal="${esc(focus.proc)}"><span class="home-stat-label">Tu meta más avanzada</span><strong>${esc(focus.proc)}</strong><span class="home-focus-progress"><b>${focus.logrado}</b> / ${focus.meta} casos <span aria-hidden="true">↗</span></span><span class="home-focus-note">Faltan ${Math.max(0, focus.meta - focus.logrado)} · ${soloCirujano ? 'Como cirujano' : 'Toda participación'}</span></button>`
      : `<button type="button" class="home-focus-button" data-focus-goal=""><span class="home-stat-label">Metas alcanzadas</span><strong>${completed} de ${goals.length} cumplidas</strong><span class="home-stat-link">Revisar metas <span aria-hidden="true">↗</span></span></button>`;
  }
  function syncPeriods() {
    const value = $('#practicePeriod').value;
    document.querySelectorAll('[data-home-period]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.homePeriod === value)));
  }
  function animateTiles(host) {
    if (!$('#view-dashboard').hidden) reveal(host.querySelectorAll('.practice-tile'));
  }
  function enter() {
    syncPeriods();
    reveal(document.querySelectorAll('#view-dashboard > .view-head, #personalSummary, #gettingStarted:not([hidden]), #daybookOverview > *, #view-dashboard > .advanced-analysis:not([hidden])'));
    animateNumbers();
    animateTiles($('#practiceTiles'));
    if (!allowsMotion()) return;
    document.querySelectorAll('#progressList .goal-bar i').forEach((bar, i) => {
      if (typeof bar.animate === 'function') bar.animate(
        [{ transform: 'scaleX(0)' }, { transform: `scaleX(${bar.style.getPropertyValue('--pct') || 0})` }],
        { duration: 650, delay: 100 + i * 45, easing: 'cubic-bezier(.22,.8,.3,1)' }
      );
    });
  }
  function init() {
    $('#personalSummary').addEventListener('click', (e) => {
      const recent = e.target.closest('[data-home-case]');
      if (recent) { BF.bitacora.open(recent.dataset.homeCase); return; }
      const button = e.target.closest('[data-home-scope]'); if (!button) return;
      if (button.dataset.homeScope === 'surgeon') BF.bitacora.setScope({ desde: '', hasta: '', role: 'surgeon' }, 'Como cirujano · Todo el historial');
      else {
        BF.bitacora.clearScope();
        if (button.dataset.homeScope === 'hours') $('#tableSort').value = 'duracion-desc';
        else $('#tableSort').value = 'fecha-desc';
      }
      BF.app.show('bitacora');
    });
    $('#practicePeriodButtons').addEventListener('click', (e) => {
      const button = e.target.closest('[data-home-period]'); if (!button) return;
      $('#practicePeriod').value = button.dataset.homePeriod;
      $('#practicePeriod').dispatchEvent(new Event('change', { bubbles: true }));
      syncPeriods();
    });
    $('#homeGoalFocus').addEventListener('click', (e) => {
      const button = e.target.closest('[data-focus-goal]'); if (!button) return;
      const row = Array.from(document.querySelectorAll('#progressList .goal')).find((node) => node.dataset.goalProc === button.dataset.focusGoal);
      const target = row || $('#cardProgreso');
      target.scrollIntoView({ block: 'center', behavior: allowsMotion() ? 'smooth' : 'instant' });
      document.querySelectorAll('#progressList .is-focused').forEach((node) => node.classList.remove('is-focused'));
      clearTimeout(focusTimer);
      target.classList.add('is-focused');
      target.tabIndex = -1; target.focus({ preventScroll: true });
      focusTimer = setTimeout(() => target.classList.remove('is-focused'), 1600);
    });
  }
  BF.home = { init, renderSummary, renderFocus, syncPeriods, animateTiles, enter };
})();
