/* ════════ store.js · estado, persistencia local y sincronización ════════ */
window.BF = window.BF || {};

(function () {
  const { store, uuid, nowISO, num, monthKey, tally, avg, median, pct } = BF.util;
  const C = BF.CONFIG;

  const listeners = {};
  const on = (evt, cb) => (listeners[evt] = (listeners[evt] || []).concat(cb));
  const emit = (evt, payload) => (listeners[evt] || []).forEach((cb) => cb(payload));

  const KEYS = { casos: 'casos', cfg: 'cfg', meta: 'meta', objetivos: 'objetivos' };

  /* ═════════ Modelo ═════════ */

  const TEXT_FIELDS = [
    'codigo', 'fecha', 'hora', 'sexo', 'lateralidad', 'institucion', 'diagnostico',
    'antecedentesRodilla', 'comorbilidades', 'cirujano', 'rol', 'procedimientoPrincipal',
    'abordaje', 'anestesia', 'hallazgos', 'implantes', 'profilaxis', 'rehabilitacion', 'injertoLca', 'tecnicaMeniscal', 'patronMultiligamentario', 'clasificacionMultiligamentaria',
    'osteotomiaTibialTipo', 'osteotomiaTibialLado', 'osteotomiaFemoralTipo', 'osteotomiaFemoralLado',
    'complicacionIntraopDetalle', 'complicacionPostopDetalle', 'complicacionClavienDindo', 'notas'
  ];
  const NUM_FIELDS = ['edad', 'imc', 'duracionMin', 'torniqueteMin', 'internacionDias'];
  const BOOL_FIELDS = ['torniquete', 'complicacionIntraop', 'uti', 'complicacionPostop', 'presentadoEnAteneo', 'publicable'];

  /** Completa un caso con todos los campos del modelo (evita `undefined` en la UI). */
  function normalize(raw) {
    const c = Object.assign({}, raw);
    c.id = c.id || uuid();
    for (const f of TEXT_FIELDS) c[f] = c[f] == null ? '' : String(c[f]);
    const originalProcedure = c.procedimientoPrincipal;
    c.procedimientoPrincipal = C.procedureName(originalProcedure);
    if (originalProcedure !== c.procedimientoPrincipal) c.procedimientoPrincipalAnterior = c.procedimientoPrincipalAnterior || originalProcedure;
    for (const f of NUM_FIELDS) c[f] = num(c[f]);
    for (const f of BOOL_FIELDS) c[f] = !!c[f];
    if (Array.isArray(c.procedimientosAsociados) && c.procedimientosAsociados.some((p) => C.procedureName(p) !== p)) c.procedimientosAsociadosAnteriores = c.procedimientosAsociadosAnteriores || [...c.procedimientosAsociados];
    c.procedimientosAsociados = Array.isArray(c.procedimientosAsociados) ? [...new Set(c.procedimientosAsociados.filter(Boolean).map(C.procedureName))].filter((p) => p !== c.procedimientoPrincipal) : [];
    c.tags = Array.isArray(c.tags) ? c.tags.filter(Boolean) : [];
    c.pasosRealizados = Array.isArray(c.pasosRealizados) ? [...new Set(c.pasosRealizados.filter((s) => typeof s === 'string' && s.trim()))] : [];
    if (Array.isArray(c.autoTags)) Object.assign(c, C.withAutoTags(c));
    c.seguimiento = Array.isArray(c.seguimiento) ? c.seguimiento.filter(Boolean).map(normalizeFollowup) : [];
    c.creado = c.creado || nowISO();
    c.actualizado = c.actualizado || c.creado;
    return c;
  }

  function normalizeFollowup(f) {
    return {
      fecha: f.fecha || '',
      eva: num(f.eva),
      flexion: num(f.flexion),
      extension: num(f.extension),
      score: num(f.score),
      notas: f.notas || ''
    };
  }

  /** Todos los procedimientos de un caso (principal + asociados). */
  const proceduresOf = (c) => [c.procedimientoPrincipal, ...(c.procedimientosAsociados || [])].filter(Boolean);
  const isSurgeon = (c) => C.ROLES_CIRUJANO.includes(c.rol);
  const hasComplication = (c) => c.complicacionIntraop;

  /* ═════════ Estado ═════════ */

  const state = {
    casos: [],
    objetivos: {},
    gruposObjetivos: {},
    deleted: {},
    replaceRemote: false,
    cfg: { owner: '', repo: '', branch: C.DEFAULT_BRANCH, path: C.DEFAULT_PATH, token: '', auto: true, objetivoModo: 'todos' },
    sha: null,
    lastSync: null,
    dirty: false,
    status: 'off',     // off | idle | busy | ok | error
    statusText: 'Sin configurar',
    message: ''
  };

  function loadLocal() {
    state.cfg = Object.assign(state.cfg, store.get(KEYS.cfg, {}) || {});
    const meta = store.get(KEYS.meta, {}) || {};
    state.sha = meta.sha || null;
    state.lastSync = meta.lastSync || null;
    const raw = store.get(KEYS.casos, []);
    state.casos = (Array.isArray(raw) ? raw : []).map(normalize);
    state.dirty = !!meta.dirty;
    state.deleted = meta.deleted || {};
    state.replaceRemote = !!meta.replaceRemote;
    state.gruposObjetivos = store.get('gruposObjetivos', {}) || {};

    // Las metas se siembran una sola vez: si el fellow las borra todas, no vuelven.
    const objetivos = store.get(KEYS.objetivos, null);
    if (objetivos && typeof objetivos === 'object') {
      state.objetivos = C.procedureObjectives(objetivos);
    } else {
      state.objetivos = Object.assign({}, C.DEFAULT_OBJETIVOS);
      store.set(KEYS.objetivos, state.objetivos);
    }
  }

  function saveLocal() {
    const saved = [
      store.set(KEYS.casos, state.casos),
      store.set(KEYS.meta, { sha: state.sha, lastSync: state.lastSync, dirty: state.dirty, deleted: state.deleted, replaceRemote: state.replaceRemote }),
      store.set(KEYS.objetivos, state.objetivos),
      store.set('gruposObjetivos', state.gruposObjetivos)
    ];
    return saved.every(Boolean);
  }

  const saveCfg = (patch) => {
    if (['owner', 'repo', 'branch', 'path'].some((key) => key in patch && patch[key] !== state.cfg[key])) {
      state.sha = null; state.lastSync = null; state.dirty = true;
    }
    state.cfg = Object.assign({}, state.cfg, patch);
    store.set(KEYS.cfg, state.cfg);
    // Al cambiar la configuración se limpia un error anterior para poder reintentar.
    if (state.status === 'error') state.status = 'idle';
    refreshStatus();
    emit('cfg', state.cfg);
    return state.cfg;
  };

  const isConfigured = () => !!(state.cfg.owner && state.cfg.repo && state.cfg.token);

  function refreshStatus() {
    if (!store.reliable()) return setStatus('error', 'Guardado local fallido');
    if (!isConfigured()) return setStatus('off', 'En este dispositivo');
    if (state.status === 'busy' || state.status === 'error') return;
    setStatus(state.dirty ? 'pending' : state.lastSync ? 'ok' : 'idle', state.dirty ? 'Pendiente de sincronizar' : state.lastSync ? 'Sincronizado' : 'Conexión configurada');
  }

  function setStatus(status, text) {
    state.status = status;
    state.statusText = text;
    emit('status', { status, text });
  }

  /* ═════════ CRUD ═════════ */

  const sorted = () => state.casos.slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || b.creado.localeCompare(a.creado));

  const get = (id) => state.casos.find((c) => c.id === id) || null;

  function nextCodigo() {
    const max = state.casos.reduce((acc, c) => {
      const m = /^CIR-(\d+)$/.exec(c.codigo || '');
      return m ? Math.max(acc, Number(m[1])) : acc;
    }, 0);
    return `CIR-${String(max + 1).padStart(4, '0')}`;
  }

  function add(caso) {
    const c = normalize(caso);
    c.codigo = c.codigo || nextCodigo();
    c.creado = nowISO();
    c.actualizado = c.creado;
    state.casos.push(c);
    touch(`Agrega caso ${c.codigo}`);
    return c;
  }

  function update(id, patch) {
    const i = state.casos.findIndex((c) => c.id === id);
    if (i < 0) return null;
    const c = normalize(Object.assign({}, state.casos[i], patch, { id, actualizado: nowISO() }));
    c.codigo = c.codigo || nextCodigo();
    state.casos[i] = c;
    touch(`Actualiza caso ${c.codigo}`);
    return c;
  }

  function remove(id) {
    const c = get(id);
    if (!c) return false;
    state.casos = state.casos.filter((x) => x.id !== id);
    state.deleted[id] = nowISO();
    touch(`Elimina caso ${c.codigo}`);
    return true;
  }

  function replaceAll(casos, opts = {}) {
    const ids = new Set((casos || []).map((c) => c.id));
    state.casos.filter((c) => !ids.has(c.id)).forEach((c) => { state.deleted[c.id] = nowISO(); });
    state.casos = (casos || []).map(normalize);
    if (opts.replaceRemote) state.replaceRemote = true;
    revision++;
    state.dirty = true;
    saveLocal();
    emit('change', { reason: opts.reason || 'replace' });
    refreshStatus();
  }

  /** Marca cambios pendientes y programa el guardado local (y remoto si está activo). */
  let revision = 0;
  function touch(commitMsg) {
    revision++;
    state.dirty = true;
    state.pendingMsg = commitMsg;
    saveLocal();
    emit('change', { reason: 'crud' });
    refreshStatus();
    if (state.cfg.auto && isConfigured()) schedulePush();
  }

  /* ═════════ Sincronización con GitHub ═════════ */

  const packageData = () => ({
    version: C.DATA_VERSION,
    actualizado: nowISO(),
    objetivos: state.objetivos,
    gruposObjetivos: state.gruposObjetivos,
    preferencias: { objetivoModo: getGoalMode() },
    deleted: state.deleted,
    casos: state.casos
  });

  /** Fusiona dos listas de casos quedándose con la versión más reciente de cada id. */
  function merge(local, remote) {
    const byId = new Map();
    for (const c of remote || []) byId.set(c.id, normalize(c));
    let conflictos = 0;
    for (const c of local || []) {
      const other = byId.get(c.id);
      if (!other) { byId.set(c.id, normalize(c)); continue; }
      const a = c.actualizado || '';
      const b = other.actualizado || '';
      if (a > b) byId.set(c.id, normalize(c));
      else if (b > a) conflictos++;
    }
    return { casos: Array.from(byId.values()).filter((c) => !state.deleted[c.id] || c.actualizado > state.deleted[c.id]), conflictos };
  }

  async function pull({ mergeLocal = true, silent = false } = {}) {
    if (!isConfigured()) throw new Error('Configura primero el repositorio en Ajustes.');
    setStatus('busy', 'Descargando…');
    try {
      const res = await BF.github.read(state.cfg);
      if (!res.exists || !res.data) {
        if (!silent) BF.util.toast('El repositorio todavía no tiene archivo de datos. Se creará al subir.', '');
        state.sha = res.sha;
        setStatus(state.dirty ? 'pending' : 'idle', res.exists ? 'Archivo vacío' : 'Sin datos en el repositorio');
        return { imported: 0, existed: false };
      }
      const remote = Array.isArray(res.data.casos) ? res.data.casos : [];
      for (const [id, date] of Object.entries(res.data.deleted || {})) {
        if (!state.deleted[id] || state.deleted[id] < date) state.deleted[id] = date;
      }
      let nuevos = 0;
      let conflictos = 0;

      if (state.replaceRemote) {
        nuevos = state.casos.length;
      } else if (mergeLocal && (state.casos.length || Object.keys(state.deleted).length)) {
        const m = merge(state.casos, remote);
        nuevos = m.casos.length - remote.length;
        conflictos = m.conflictos;
        state.casos = m.casos;
      } else {
        nuevos = remote.length;
        state.casos = remote.map(normalize);
      }

      // Las metas también viajan en el archivo, para no recargarlas en cada dispositivo.
      if (!state.dirty && res.data.objetivos && typeof res.data.objetivos === 'object') {
        state.objetivos = C.procedureObjectives(res.data.objetivos);
        state.gruposObjetivos = res.data.gruposObjetivos || {};
      }
      if (!state.dirty && ['todos', 'cirujano'].includes(res.data.preferencias?.objetivoModo)) saveCfg({ objetivoModo: res.data.preferencias.objetivoModo });

      state.sha = res.sha || null;
      state.lastSync = nowISO();
      state.dirty = state.dirty || JSON.stringify(state.casos.slice().sort((a, b) => a.id.localeCompare(b.id))) !== JSON.stringify(remote.map(normalize).sort((a, b) => a.id.localeCompare(b.id)));
      saveLocal();
      setStatus(state.dirty ? 'pending' : 'ok', state.dirty ? 'Pendiente de sincronizar' : 'Sincronizado');
      if (state.dirty && state.cfg.auto) schedulePush();
      emit('change', { reason: 'pull' });
      if (!silent) {
        BF.util.toast(`Datos descargados: ${remote.length} caso(s) en el repo${conflictos ? `, ${conflictos} versión(es) remotas conservadas` : ''}.`, 'ok');
      }
      return { imported: nuevos, existed: true, conflictos };    } catch (e) {
      setStatus('error', e.message || 'Error de conexión');
      throw e;
    }
  }

  let pushTimer = null;
  function schedulePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push().catch(() => { /* el estado ya quedó en error */ }), C.AUTO_PUSH_DEBOUNCE);
  }

  /** Sube los datos al repositorio, reintentando una vez si cambió el sha. */
  let activePush = null;
  function push(options = {}) {
    clearTimeout(pushTimer);
    if (activePush) return activePush.then((res) => state.dirty ? push(options) : res);
    activePush = performPush(options).finally(() => { activePush = null; });
    return activePush;
  }
  async function performPush({ message, silent = false } = {}) {
    if (!isConfigured()) throw new Error('Configura primero el repositorio en Ajustes.');
    setStatus('busy', 'Subiendo…');
    const msg = message || state.pendingMsg || `Actualiza bitácora (${state.casos.length} casos)`;
    try {
      let res, sentRevision = revision;
      try {
        res = await BF.github.write(state.cfg, packageData(), state.sha, msg);
      } catch (e) {
        if (e.status !== 409 && e.status !== 422) throw e;
        // El archivo remoto cambió: re-leer, fusionar y reintentar.
        const fresh = await BF.github.read(state.cfg);
        const remoteCases = (fresh.data && fresh.data.casos) || [];
        if (state.replaceRemote) {
          const ids = new Set(state.casos.map((c) => c.id));
          remoteCases.filter((c) => !ids.has(c.id)).forEach((c) => { state.deleted[c.id] = nowISO(); });
        } else {
          for (const [id, date] of Object.entries(fresh.data?.deleted || {})) if (!state.deleted[id] || state.deleted[id] < date) state.deleted[id] = date;
          state.casos = merge(state.casos, remoteCases).casos;
        }
        state.sha = fresh.sha;
        sentRevision = revision;
        res = await BF.github.write(state.cfg, packageData(), state.sha, msg);
      }
      state.sha = res.sha || state.sha;
      state.lastSync = nowISO();
      state.dirty = revision !== sentRevision;
      if (!state.dirty) state.replaceRemote = false;
      state.pendingMsg = null;
      saveLocal();
      setStatus(state.dirty ? 'pending' : 'ok', state.dirty ? 'Pendiente de sincronizar' : 'Sincronizado');
      if (state.dirty && state.cfg.auto) schedulePush();
      emit('change', { reason: 'push' });
      if (!silent) BF.util.toast('Datos guardados en GitHub.', 'ok');
      return res;
    } catch (e) {
      setStatus('error', e.message || 'Error al subir');
      if (!silent) BF.util.toast(e.message || 'No se pudo subir a GitHub.', 'err', 6000);
      throw e;
    }
  }

  async function testConnection(cfg) {
    return BF.github.test(cfg || state.cfg);
  }

  /* ═════════ Filtros y métricas ═════════ */

  function matches(c, f) {
    if (f.desde && (c.fecha || '') < f.desde) return false;
    if (f.hasta && (c.fecha || '') > f.hasta) return false;
    if (f.rol && c.rol !== f.rol) return false;
    if (f.lateralidad && c.lateralidad !== f.lateralidad) return false;
    if (f.abordaje && c.abordaje !== f.abordaje) return false;
    if (f.procedimiento && !proceduresOf(c).includes(f.procedimiento)) return false;
    if (f.q) {
      const blob = [
        c.codigo, c.diagnostico, c.hallazgos, c.implantes, c.cirujano, c.institucion,
        c.procedimientoPrincipal, (c.procedimientosAsociados || []).join(' '),
        c.notas, (c.tags || []).join(' '), c.complicacionIntraopDetalle, c.complicacionPostopDetalle
      ].join(' ').toLowerCase();
      if (!blob.includes(f.q.toLowerCase())) return false;
    }
    return true;
  }

  const filter = (f = {}) => sorted().filter((c) => matches(c, f));

  /** Métricas del dashboard para un conjunto de casos. */
  function metrics(casos) {
    const total = casos.length;
    const comoCirujano = casos.filter(isSurgeon);
    const complicaciones = casos.filter(hasComplication);
    const duraciones = casos.map((c) => c.duracionMin).filter((v) => v != null);
    const anio = new Date().getFullYear();
    const delAnio = casos.filter((c) => (c.fecha || '').startsWith(String(anio)));
    const meses = {};
    for (const c of casos) {
      const k = monthKey(c.fecha);
      if (k) meses[k] = (meses[k] || 0) + 1;
    }
    const claves = Object.keys(meses).sort();
    const porMes = claves.map((k) => ({ key: k, value: meses[k] }));
    const porMesCirujano = claves.map((k) => ({
      key: k,
      value: casos.filter((c) => monthKey(c.fecha) === k && isSurgeon(c)).length
    }));

    return {
      total,
      delAnio: delAnio.length,
      comoCirujano: comoCirujano.length,
      comoCirujanoIndependiente: casos.filter((c) => c.rol === 'Cirujano (independiente)').length,
      pctCirujano: pct(comoCirujano.length, total),
      complicaciones: complicaciones.length,
      tasaComplicaciones: pct(complicaciones.length, total),
      duracionPromedio: avg(duraciones),
      duracionMediana: median(duraciones),
      duracionTotal: duraciones.reduce((a, b) => a + b, 0),
      isquemiaPromedio: avg(casos.filter((c) => c.torniquete).map((c) => c.torniqueteMin).filter((v) => v != null)),
      internacionPromedio: avg(casos.map((c) => c.internacionDias).filter((v) => v != null)),
      porMes, porMesCirujano,
      porRol: C.ROLES.map((r) => ({ name: r, value: casos.filter((c) => c.rol === r).length })).filter((x) => x.value),
      porLateralidad: tally(casos, (c) => c.lateralidad),
      porAbordaje: tally(casos, (c) => c.abordaje),
      porProcedimiento: tally(casos, (c) => proceduresOf(c)),
      porClavien: BF.CLAVIEN.filter(Boolean).map((g) => ({
        name: g,
        value: casos.filter((c) => c.complicacionPostop && c.complicacionClavienDindo === g).length
      })).filter((x) => x.value),
      porComplicacion: tally(casos, (c) => [
        c.complicacionIntraop ? 'Intraoperatoria' : '',
        c.complicacionPostop ? 'Postoperatoria' : ''
      ]),
      publicables: casos.filter((c) => c.publicable).length,
      academicos: casos.filter((c) => c.publicable || c.presentadoEnAteneo).length,
      presentados: casos.filter((c) => c.presentadoEnAteneo).length,
      ultimo: sorted()[0] || null
    };
  }

  /** Valores únicos ya usados (para autocompletar). */
  const distinctCirujanos = () => Array.from(new Set(state.casos.map((c) => c.cirujano).filter(Boolean))).sort();

  /* ═════════ Metas de progresión ═════════ */

  const getObjetivos = () => state.objetivos;
  const getGoalGroups = () => state.gruposObjetivos;
  function setGoalGroup(proc, members) {
    if (!(proc in state.objetivos) || !Array.isArray(members) || members.some((p) => !C.PROCEDIMIENTOS.includes(p))) return false;
    state.gruposObjetivos[proc] = [...new Set([proc, ...members])];
    touch(`Actualiza los procedimientos de la meta de "${proc}"`);
    return true;
  }

  function setObjetivo(proc, meta) {
    const n = Math.round(num(meta) || 0);
    if (!proc || n < 1) return false;
    state.objetivos[proc] = n;
    touch(`Actualiza la meta de "${proc}" a ${n}`);
    return true;
  }

  function removeObjetivo(proc) {
    if (!(proc in state.objetivos)) return false;
    delete state.objetivos[proc];
    delete state.gruposObjetivos[proc];
    touch(`Quita la meta de "${proc}"`);
    return true;
  }

  const getGoalMode = () => (state.cfg.objetivoModo === 'cirujano' ? 'cirujano' : 'todos');
  const setGoalMode = (modo) => { saveCfg({ objetivoModo: modo === 'cirujano' ? 'cirujano' : 'todos' }); touch('Actualiza el criterio de las metas'); };

  /**
   * Avance de cada meta contra un conjunto de casos.
   * Cuenta el procedimiento como realizado tanto si fue principal como asociado.
   */
  function progreso(base) {
    return Object.keys(state.objetivos).map((proc) => {
      const meta = num(state.objetivos[proc]) || 0;
      const members = state.gruposObjetivos[proc] || [proc];
      const logrado = base.filter((c) => proceduresOf(c).some((p) => members.includes(p))).length;
      return {
        proc,
        members,
        meta,
        logrado,
        faltan: Math.max(0, meta - logrado),
        pct: meta > 0 ? Math.round((logrado / meta) * 100) : 0,
        cumplida: meta > 0 && logrado >= meta
      };
    }).sort((a, b) => a.proc.localeCompare(b.proc, 'es'));
  }

  BF.store = {
    state, on, emit, normalize, normalizeFollowup,
    loadLocal, saveLocal, saveCfg, isConfigured, setStatus, refreshStatus,
    all: () => state.casos, sorted, get, add, update, remove, replaceAll,
    nextCodigo, proceduresOf, isSurgeon, hasComplication,
    filter, matches, metrics, distinctCirujanos,
    getObjetivos, setObjetivo, removeObjetivo, getGoalGroups, setGoalGroup, getGoalMode, setGoalMode, progreso,
    pull, push, schedulePush, testConnection, packageData
  };
})();
