/* ════════ app.js · navegación, estado de sincronización y ajustes ════════ */
window.BF = window.BF || {};

(function () {
  const { $, $$ } = BF.util;
  const C = BF.CONFIG;
  const S = BF.store;

  const VIEWS = ['dashboard', 'bitacora', 'nuevo', 'ajustes'];
  let activeView = 'dashboard';

  /* ───────── Navegación ───────── */

  function show(view) {
    if (!VIEWS.includes(view)) view = 'dashboard';
    activeView = view;
    for (const v of VIEWS) {
      const section = $('#view-' + v);
      if (section) section.hidden = v !== view;
    }
    $$('#mainNav .tab').forEach((t) => {
      const activo = t.dataset.view === view;
      t.classList.toggle('active', activo);
      // Marca la sección actual para lectores de pantalla, no sólo con color.
      if (activo) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
    if (view === 'dashboard') BF.dashboard.render();
    if (view === 'bitacora') BF.bitacora.render();
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (location.hash !== '#' + view) history.pushState(null, '', '#' + view);
  }

  const currentView = () => activeView;

  /* ───────── Chip de estado ───────── */

  function paintStatus({ status, text }) {
    const chip = $('#syncStatus');
    chip.className = 'sync-chip' + (status === 'ok' ? ' ok' : status === 'busy' ? ' busy' : status === 'pending' ? ' pending' : status === 'error' ? ' err' : '');
    $('#syncText').textContent = text;
    chip.title = status === 'error' ? S.state.message || text : `Estado: ${text}`;
  }

  /* ───────── Ajustes ───────── */

  const CFG_INPUTS = { owner: 'cfgOwner', repo: 'cfgRepo', branch: 'cfgBranch', path: 'cfgPath', token: 'cfgToken' };

  function loadCfgIntoForm() {
    const cfg = S.state.cfg;
    for (const [key, id] of Object.entries(CFG_INPUTS)) $('#' + id).value = cfg[key] || '';
    $('#cfgAuto').checked = !!cfg.auto;
    $('#wipeScope').textContent = S.isConfigured() ? 'El borrado eliminará los casos de este dispositivo y se enviará al repositorio conectado de GitHub. Exporta un respaldo antes de continuar.' : 'Se eliminarán los casos de este dispositivo. Exporta un respaldo antes de continuar.';
    log('#cfgLog', S.isConfigured()
      ? `Configurado: ${cfg.owner}/${cfg.repo} · rama ${cfg.branch} · ${cfg.path}\nÚltima sincronización: ${BF.util.fmtDateTime(S.state.lastSync)}`
      : 'Pendiente de configurar.');
  }

  function readCfgForm() {
    const patch = {};
    for (const [key, id] of Object.entries(CFG_INPUTS)) patch[key] = $('#' + id).value.trim();
    patch.branch = patch.branch || C.DEFAULT_BRANCH;
    patch.path = patch.path || C.DEFAULT_PATH;
    patch.auto = $('#cfgAuto').checked;
    return patch;
  }

  const log = (sel, text) => { const node = $(sel); if (node) node.textContent = text; };

  function initSettings() {
    loadCfgIntoForm();
    $('#themeSelect').value = BF.util.store.get('theme', 'light');
    $('#themeSelect').addEventListener('change', () => {
      BF.util.store.set('theme', $('#themeSelect').value);
      document.documentElement.dataset.theme = $('#themeSelect').value;
    });

    $('#btnSaveCfg').addEventListener('click', () => {
      S.saveCfg(readCfgForm());
      loadCfgIntoForm();
      BF.util.toast(S.isConfigured() ? 'Configuración guardada.' : 'Faltan datos para conectar.', S.isConfigured() ? 'ok' : 'err');
    });

    $('#btnTestCfg').addEventListener('click', async () => {
      const cfg = Object.assign(readCfgForm(), { token: $('#cfgToken').value.trim() });
      log('#cfgLog', 'Probando conexión…');
      try {
        const info = await S.testConnection(cfg);
        const report = [
          `✔ Repositorio: ${info.fullName} (${info.private ? 'privado' : '⚠ PÚBLICO'})`,
          `✔ Permiso de escritura: ${info.canPush ? 'sí' : 'NO — revisa Contents: Read and write'}`,
          `✔ Rama por defecto: ${info.defaultBranch}`
        ].join('\n');
        log('#cfgLog', report);
        BF.util.toast('Conexión correcta.', 'ok');
      } catch (e) {
        log('#cfgLog', '✖ ' + e.message);
        BF.util.toast(e.message, 'err', 6000);
      }
    });

    $('#btnPull').addEventListener('click', async () => {
      try {
        S.saveCfg(readCfgForm());
        log('#cfgLog', 'Descargando desde GitHub…');
        const r = await S.pull();
        log('#cfgLog', r.existed ? `✔ Descargado. Casos en este navegador: ${S.all().length}` : 'El repositorio aún no tiene datos.');
      } catch (e) { log('#cfgLog', '✖ ' + e.message); }
    });

    $('#btnPush').addEventListener('click', async () => {
      try {
        S.saveCfg(readCfgForm());
        log('#cfgLog', 'Subiendo a GitHub…');
        const r = await S.push();
        log('#cfgLog', `✔ Subido (${S.all().length} casos).${r.commit ? '\nCommit: ' + r.commit : ''}`);
        loadCfgIntoForm();
      } catch (e) { log('#cfgLog', '✖ ' + e.message); }
    });

    $('#cfgAuto').addEventListener('change', () => S.saveCfg({ auto: $('#cfgAuto').checked }));

    $('#syncStatus').addEventListener('click', () => show('ajustes'));

    /* Datos */
    $('#btnExportCsv').addEventListener('click', () => BF.exporter.exportCsv());
    $('#btnExportJson').addEventListener('click', () => BF.exporter.exportJson());
    $('#btnBackupBeforeWipe').addEventListener('click', () => BF.exporter.exportJson());
    $('#btnEmergencyBackup').addEventListener('click', () => BF.exporter.exportJson());
    $('#btnImportJson').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) BF.exporter.importJsonFile(file);
      e.target.value = '';
    });
    $('#btnDemo').addEventListener('click', () => { BF.exporter.loadDemo(); loadCfgIntoForm(); });

    $('#btnWipe').addEventListener('click', async () => {
      if (!S.all().length) return BF.util.toast('No hay casos para borrar.', '');
      const n = S.all().length;
      const confirmed = await BF.util.choose({ title: 'Eliminar todos los casos', message: `Se eliminarán ${n} casos de este dispositivo.${S.isConfigured() ? '\nEl borrado también se enviará al repositorio conectado de GitHub y afectará a los otros dispositivos al sincronizar.' : ''}\n\nExporta un respaldo antes de continuar. Esta acción no puede deshacerse desde la app.`, confirmText: 'BORRAR', choices: [{ label: `Eliminar ${n} casos`, value: true, className: 'btn-danger' }, { label: 'Cancelar', value: null }] });
      if (confirmed !== true) return;
      S.replaceAll([], { reason: 'wipe', replaceRemote: true });
      log('#dataLog', `Se borraron ${n} caso(s) localmente.`);
      BF.util.toast(S.isConfigured() ? 'Casos eliminados localmente. Enviando el borrado a GitHub…' : 'Casos eliminados de este dispositivo.', '');
      if (S.isConfigured()) {
        try { await S.push({ message: 'Borra todos los casos de la bitácora' }); }
        catch (_) { BF.util.toast('No se pudo reflejar el borrado en GitHub.', 'err', 5000); }
      }
    });

    S.on('status', paintStatus);
    S.on('change', () => {
      $('#lastLocal').textContent = BF.util.fmtDateTime(S.state.lastSync);
    });
  }

  /* ───────── Arranque ───────── */

  async function boot() {
    if (new URLSearchParams(location.search).get('demo') === '1') C.LS_PREFIX = 'bf.demo.';
    document.documentElement.dataset.theme = BF.util.store.get('theme', 'light');
    S.loadLocal();
    if (C.LS_PREFIX === 'bf.demo.') {
      S.state.cfg = { ...S.state.cfg, owner: '', repo: '', token: '' };
      if (!S.all().length) S.replaceAll(BF.exporter.demoCases(), { reason: 'demo' });
      const banner = BF.util.el('aside', { class: 'demo-banner' });
      banner.innerHTML = '<span><strong>Demostración</strong> · Casos ficticios en una bitácora independiente.</span><a class="btn btn-sm" href="./">Volver a mi bitácora</a>';
      $('main').prepend(banner);
    }
    S.refreshStatus();
    paintStatus({ status: S.state.status, text: S.state.statusText });

    BF.form.init();
    BF.bitacora.init();
    BF.dashboard.init();
    initSettings();

    const fromHash = (location.hash || '').replace('#', '');
    $$('#mainNav .tab').forEach((t) => t.addEventListener('click', () => show(t.dataset.view)));
    $$('[data-new-case]').forEach((b) => b.addEventListener('click', () => BF.form.startNew()));
    show(VIEWS.includes(fromHash) ? fromHash : 'dashboard');
    $('#lastLocal').textContent = BF.util.fmtDateTime(S.state.lastSync);

    window.addEventListener('hashchange', () => {
      const destination = (location.hash || '').replace('#', '');
      if (destination === 'contenido') $('#contenido').focus();
      else show(destination);
    });

    if (!S.all().length && !S.isConfigured()) {
      BF.util.toast('Empieza cargando un caso o configura tu repositorio en Ajustes.', '', 6000);
    }

    // Primera sincronización automática si ya está configurado.
    if (S.isConfigured()) {
      try { await S.pull({ silent: true }); }
      catch (e) { BF.util.toast('No se pudo sincronizar al iniciar: ' + e.message, 'err', 6000); }
    }

    window.addEventListener('beforeunload', (e) => {
      if (!BF.util.store.reliable()) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  BF.app = { show, currentView, boot };
  document.addEventListener('DOMContentLoaded', boot);
})();
