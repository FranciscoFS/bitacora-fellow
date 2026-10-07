/* ════════ dashboard.js · indicadores y gráficos ════════ */
window.BF = window.BF || {};

(function () {
  const { $, esc, num, fmtMonth, monthRange } = BF.util;
  const C = BF.CONFIG;
  const S = BF.store;
  const Ch = BF.charts;
  let editingGoals = false;

  const num1 = (v, suffix = '') => (v == null ? '—' : `${Math.round(v * 10) / 10}${suffix}`);

  /* ───────── Filtros ───────── */

  function fillFilterSelects() {
    const setOptions = (name, values, placeholder) => {
      const sel = $('#filterForm [name="' + name + '"]');
      const cur = sel.value;
      sel.innerHTML = `<option value="">${placeholder}</option>` +
        values.map((v) => `<option value="${BF.util.esc(v)}">${BF.util.esc(v)}</option>`).join('');
      sel.value = cur;
    };
    setOptions('rol', C.ROLES, 'Todos');
    setOptions('procedimiento', C.PROCEDIMIENTOS, 'Todos');
    setOptions('lateralidad', C.LATERALIDADES, 'Todas');
    setOptions('abordaje', C.ABORDAJES, 'Todos');
  }

  function getFilters() {
    const f = {};
    new FormData($('#filterForm')).forEach((v, k) => { f[k] = String(v).trim(); });
    return f;
  }

  const hasFilters = (f) => Object.values(f).some(Boolean);

  /* ───────── KPIs ───────── */

  function kpi({ label, value, hint = '', tone = '' }) {
    return `<div class="kpi ${tone}">
      <div class="label">${BF.util.esc(label)}</div>
      <div class="value">${BF.util.esc(value)}</div>
      ${hint ? `<div class="hint">${BF.util.esc(hint)}</div>` : ''}
    </div>`;
  }

  function renderKpis(m) {
    /* El color del número sólo se usa cuando comunica algo:
       el acento para el dato clave del fellowship, verde/rojo para el riesgo. */
    $('#kpis').innerHTML = [
      kpi({ label: 'Casos totales', value: m.total, hint: `${m.delAnio} en ${new Date().getFullYear()}` }),
      kpi({ label: 'Como cirujano', value: m.comoCirujano, hint: `${m.pctCirujano}% del total`, tone: 'accent' }),
      kpi({ label: 'Horas de quirófano', value: num1(m.duracionTotal / 60, ' h'), hint: `${m.duracionTotal} min acumulados` }),
      kpi({
        label: 'Complicaciones intraop.', value: m.complicaciones,
        hint: `${m.tasaComplicaciones}% de los casos`,
        tone: m.total ? (m.complicaciones ? 'bad' : 'good') : ''
      }),
      kpi({ label: 'Duración promedio', value: num1(m.duracionPromedio, ' min'), hint: 'promedio de los tiempos registrados' }),
      kpi({ label: 'Cirujano independiente', value: m.comoCirujanoIndependiente, hint: 'sin supervisión directa' }),
      kpi({ label: 'Isquemia promedio', value: num1(m.isquemiaPromedio, ' min'), hint: 'casos con torniquete' }),
      kpi({ label: 'Duración mediana', value: num1(m.duracionMediana, ' min'), hint: 'valor central de los tiempos registrados' })
    ].join('');
  }

  /* ───────── Guía de arranque (bitácora vacía) ───────── */

  function renderGettingStarted() {
    const host = $('#gettingStarted');
    const cargando = S.isConfigured() && S.state.status === 'busy';

    if (cargando) {
      host.innerHTML = `<div class="gs-skeleton">${'<div class="skel kpi"></div>'.repeat(4)}</div>
        <p class="muted small" style="margin-top:14px">Descargando tu bitácora desde GitHub…</p>`;
      return;
    }

    const paso = (n, titulo, texto, accion, etiqueta, primario) => `<li>
        <span class="gs-num">${n}</span>
        <div>
          <b>${titulo}</b>
          <p class="muted small">${texto}</p>
          <button class="btn btn-sm${primario ? ' btn-primary' : ''}" type="button" data-accion="${accion}">${etiqueta}</button>
        </div>
      </li>`;

    host.innerHTML = `<div class="card getting-started">
      <h3>Empecemos la bitácora</h3>
      <p class="muted">Registra tu primera cirugía. Puedes trabajar en este dispositivo y conectar la sincronización cuando lo necesites.</p>
      <ol class="gs-steps">
        ${paso(1, 'Registra tu primer caso',
          'Completa los campos esenciales y pulsa Guardar caso. Los detalles pueden esperar.',
          'nuevo', 'Nuevo caso', true)}
        ${paso(2, '¿Ya tienes una bitácora?',
          'Importa tu respaldo o conecta tu repositorio privado desde Ajustes.',
          'ajustes', 'Recuperar bitácora', false)}
        ${paso(3, 'Define tus metas',
          'Define los objetivos del fellowship (por ejemplo 30 LCA) y el dashboard te muestra cuánto te falta.',
          'metas', 'Ver metas', false)}
      </ol>
      <p class="gs-foot muted small">
        Para ver cómo queda con datos:
        <button class="btn btn-ghost btn-sm" type="button" data-accion="demo">abrir demostración independiente</button>
      </p>
    </div>`;
  }

  /* ───────── Gráficos ───────── */

  function renderCharts(m) {
    // Casos por mes (rellenando meses sin actividad)
    if (m.porMes.length) {
      const keys = monthRange(m.porMes[0].key, m.porMes[m.porMes.length - 1].key);
      const cumMap = new Map(m.porMesCirujano.map((d) => [d.key, d.value]));
      let acc = 0;
      const acum = keys.map((k) => {
        acc += cumMap.get(k) || 0;
        return { key: k, label: fmtMonth(k), value: acc };
      });
      Ch.line($('#chartCirujano'), acum.length ? acum : [], { aria: 'casos como cirujano acumulados' });
    } else {
      Ch.empty($('#chartCirujano'), 'Sin casos como cirujano todavía');
    }

    Ch.donut($('#chartRol'), m.porRol, { centerLabel: 'casos', aria: 'participación por rol' });
    Ch.hbars($('#chartProc'), m.porProcedimiento, { limit: 8, legend: false, aria: 'procedimientos más frecuentes' });
    Ch.donut($('#chartLateralidad'), m.porLateralidad, { centerLabel: 'rodillas', aria: 'lateralidad' });

    Ch.hbars($('#chartAbordaje'), m.porAbordaje, { aria: 'abordajes utilizados' });
  }

  /* ───────── Progresión del fellow ───────── */

  /**
   * Las metas se miden sobre TODOS los casos, no sobre los filtrados:
   * el objetivo es la exposición acumulada del fellowship.
   */
  function renderProgreso() {
    const soloCirujano = S.getGoalMode() === 'cirujano';
    const base = soloCirujano ? S.all().filter(S.isSurgeon) : S.all();
    const filas = S.progreso(base);
    const cumplidas = filas.filter((f) => f.cumplida).length;

    $('#goalMode').checked = soloCirujano;
    BF.home.renderFocus(filas, soloCirujano);

    $('#goalsSummary').innerHTML = filas.length
      ? `<b>${cumplidas}</b> / ${filas.length} cumplidas`
      : 'Sin metas definidas: agrega una abajo para medir tu avance en el fellowship.';

    $('#progressList').innerHTML = filas.map((f) => `
      <div class="goal${f.cumplida ? ' cumplida' : ''}" data-goal-proc="${esc(f.proc)}">
        <span class="goal-name" title="${esc(f.members.join(' · '))}">${esc(f.proc)}${f.members.length > 1 ? `<small class="goal-group-label">${f.members.length} procedimientos combinados</small>` : ''}</span>
        <span class="goal-bar"><i style="--pct:${(Math.min(100, f.pct) / 100).toFixed(3)}"></i></span>
        <span class="goal-count">
          <b>${f.logrado}</b>/${editingGoals ? `<input class="goal-meta" type="number" min="1" max="999"
            data-proc="${esc(f.proc)}" value="${f.meta}"
            title="Editar la meta" aria-label="Meta de ${esc(f.proc)}">` : `<span>${f.meta}</span>`}
          <span class="goal-pct">${Math.min(100, f.pct)}%</span>
        </span>
        ${editingGoals ? `<button class="icon-btn goal-remove" type="button" data-proc="${esc(f.proc)}"
          title="Quitar meta" aria-label="Quitar meta de ${esc(f.proc)}">×</button>` : ''}
      </div>`).join('') ||
      '<p class="empty">Todavía no hay metas. Elige un procedimiento y su objetivo abajo.</p>';

    // Selector: sólo procedimientos que aún no tienen meta.
    const libres = C.PROCEDIMIENTOS.filter((p) => !(p in S.getObjetivos()));
    const sel = $('#goalProc');
    const previo = sel.value;
    sel.innerHTML = libres.length
      ? libres.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')
      : '<option value="">Todas las metas ya están definidas</option>';
    if (libres.includes(previo)) sel.value = previo;
    $('#btnAddGoal').disabled = !libres.length;
    const target = $('#goalGroupTarget'), previousTarget = target.value;
    target.innerHTML = Object.keys(S.getObjetivos()).map((p) => `<option>${esc(p)}</option>`).join('');
    if (previousTarget in S.getObjetivos()) target.value = previousTarget;
    loadGoalGroup();
  }

  let groupMembers = new Set();
  function loadGoalGroup() {
    const target = $('#goalGroupTarget').value;
    groupMembers = new Set(S.getGoalGroups()[target] || (target ? [target] : []));
    renderGoalGroup();
  }
  function renderGoalGroup() {
    const target = $('#goalGroupTarget').value;
    const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const query = normalize($('#goalGroupSearch').value);
    const options = C.PROCEDIMIENTOS.filter((p) => groupMembers.has(p) || normalize(p).includes(query));
    $('#goalGroupOptions').innerHTML = options.map((p) => `<button type="button" class="chip${groupMembers.has(p) ? ' on' : ''}" data-goal-member="${esc(p)}" aria-pressed="${groupMembers.has(p)}"${p === target ? ' disabled' : ''}>${esc(p)} ${groupMembers.has(p) ? '✓' : '+'}</button>`).join('');
    $('#btnSaveGoalGroup').disabled = !target;
  }

  /* ───────── Render general ───────── */

  function renderOverview() {
    const cases = S.sorted(), m = S.metrics(cases);
    $('.daybook-activity').hidden = !cases.length;
    $('#personalSummary').hidden = !cases.length;
    $('#daybookOverview').classList.toggle('is-empty',!cases.length);
    BF.home.renderSummary(cases, m);
    if (m.porMes.length) {
      const keys=monthRange(m.porMes[0].key,m.porMes[m.porMes.length-1].key);
      const values=new Map(m.porMes.map(d=>[d.key,d.value]));
      Ch.monthly($('#chartPorMes'),keys.map(key=>({key,label:fmtMonth(key),value:values.get(key)||0})),{aria:'Casos por mes, todo el historial'});
      $('#capPorMes').textContent='Todo el historial';
    } else { Ch.empty($('#chartPorMes'),'Sin casos registrados');$('#capPorMes').textContent=''; }
  }

  function render() {
    const f = getFilters();
    const casos = S.filter(f);
    const m = S.metrics(casos);
    const vacio = S.all().length === 0;
    renderOverview();

    $('#btnClearFilters').hidden = !hasFilters(f) || vacio;

    /* Con la bitácora vacía, ocho KPI en cero y cinco gráficos "sin datos" no
       comunican nada: se muestran una guía de arranque y la tarjeta de metas
       (que sí sirve antes de cargar el primer caso). */
    $('#gettingStarted').hidden = !vacio;
    $('.advanced-analysis').hidden = vacio;
    $('#dashboardData').hidden = vacio;
    $('#chartsGrid').hidden = vacio || !casos.length;
    $('#kpis').hidden = !casos.length;
    $('#dashEmpty').hidden = casos.length > 0;
    $('#filterSummary').textContent = hasFilters(f) ? `${casos.length} de ${S.all().length} casos` : 'Todos los registros';

    if (vacio) {
      renderGettingStarted();
      renderProgreso();
      return;
    }

    renderKpis(m);
    renderProgreso();
    renderCharts(m);
  }

  function init() {
    BF.home.init();
    const layoutButtons = Array.from(document.querySelectorAll('[data-dashboard-layout]'));
    const setLayout = (value) => {
      const layout = value === 'single' ? 'single' : 'split';
      $('#view-dashboard').dataset.layout = layout;
      layoutButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.dashboardLayout === layout)));
    };
    setLayout(BF.util.store.get('dashboardLayout', 'split'));
    layoutButtons.forEach((button) => button.addEventListener('click', () => {
      setLayout(button.dataset.dashboardLayout);
      BF.util.store.set('dashboardLayout', button.dataset.dashboardLayout);
    }));
    fillFilterSelects();
    $('#filterForm').addEventListener('input', render);
    $('#filterForm').addEventListener('change', render);
    const clearFilters = () => { $('#filterForm').reset(); render(); };
    $('#btnClearFilters').addEventListener('click', clearFilters);
    $('#btnResetFilters').addEventListener('click', clearFilters);
    BF.practice.init();
    $('#btnEditGoals').addEventListener('click', () => {
      editingGoals = !editingGoals;
      $('#goalsEditor').hidden = !editingGoals;
      $('#btnEditGoals').setAttribute('aria-expanded', String(editingGoals));
      $('#btnEditGoals').textContent = editingGoals ? 'Listo' : 'Editar metas';
      $('#progressList').classList.toggle('editing', editingGoals);
      renderProgreso();
    });

    // Guía de arranque (bitácora vacía)
    $('#gettingStarted').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-accion]');
      if (!btn) return;
      const accion = btn.dataset.accion;
      if (accion === 'ajustes') BF.app.show('ajustes');
      else if (accion === 'nuevo') BF.form.startNew();
      else if (accion === 'metas') $('#cardProgreso').scrollIntoView({ block: 'start' });
      else if (accion === 'demo') BF.exporter.loadDemo();
    });

    // Metas: editar, quitar y agregar
    $('#progressList').addEventListener('change', (e) => {
      const input = e.target.closest('.goal-meta');
      if (!input) return;
      if (!S.setObjetivo(input.dataset.proc, input.value)) renderProgreso();
    });
    $('#progressList').addEventListener('click', (e) => {
      const btn = e.target.closest('.goal-remove');
      if (btn) S.removeObjetivo(btn.dataset.proc);
    });
    $('#btnAddGoal').addEventListener('click', () => {
      const proc = $('#goalProc').value;
      const meta = num($('#goalMeta').value);
      if (!proc) return BF.util.toast('Ya están definidas todas las metas disponibles.', '');
      if (!meta || meta < 1) return BF.util.toast('Escribe una meta mayor a 0.', 'err');
      $('#goalMeta').value = '';
      S.setObjetivo(proc, meta);
    });
    $('#goalMeta').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#btnAddGoal').click(); } });
    $('#goalMode').addEventListener('change', () => S.setGoalMode($('#goalMode').checked ? 'cirujano' : 'todos'));
    $('#goalGroupTarget').addEventListener('change', loadGoalGroup);
    $('#goalGroupSearch').addEventListener('input', renderGoalGroup);
    $('#goalGroupOptions').addEventListener('click', (e) => {
      const button = e.target.closest('[data-goal-member]'); if (!button) return;
      const p = button.dataset.goalMember;
      groupMembers.has(p) ? groupMembers.delete(p) : groupMembers.add(p);
      renderGoalGroup();
    });
    $('#btnSaveGoalGroup').addEventListener('click', () => {
      if (S.setGoalGroup($('#goalGroupTarget').value, [...groupMembers])) BF.util.toast('Combinación de procedimientos guardada.', 'ok');
    });
    $('#btnGroupPtr').addEventListener('click', () => {
      const conventional = 'Prótesis total de rodilla (PTR)', robotic = 'Prótesis total con navegación/robótica';
      if (!(conventional in S.getObjetivos())) S.setObjetivo(conventional, 20);
      S.setGoalGroup(conventional, [conventional, robotic]);
      $('#goalGroupTarget').value = conventional; loadGoalGroup();
      BF.util.toast('La meta de PTR incluye convencional y navegación/robótica.', 'ok');
    });

    S.on('change', () => { fillFilterSelects(); render(); });
    S.on('cfg', renderProgreso);
    render();
  }

  BF.dashboard = { init, render, getFilters };
})();
