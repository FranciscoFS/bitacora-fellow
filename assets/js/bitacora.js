/* ════════ bitacora.js · listado, búsqueda y detalle de casos ════════ */
window.BF = window.BF || {};

(function () {
  const { $, el, esc, fmtDate, fmtDateTime, num } = BF.util;
  const C = BF.CONFIG;
  const S = BF.store;

  let current = null;      // caso abierto en el panel
  let armado = null;       // temporizador de la confirmación en dos pasos
  let focoPrevio = null;   // elemento que tenía el foco antes de abrir el panel
  let scope = null;
  function setScope(value, label) { scope = value; $('#listScopeText').textContent=label; $('#tableSearch').value='';render(); }
  function clearScope() { scope=null;$('#tableSearch').value='';render(); }

  /* ───────── Foco del panel (diálogo accesible) ───────── */

  /** Mantiene el Tab dentro del panel mientras está abierto. */
  function atarFoco(e) {
    if (e.key !== 'Tab' || $('#modal').hidden) return;
    const focos = BF.util.$$(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      $('#modal')
    ).filter((n) => n.offsetWidth || n.offsetHeight);
    if (!focos.length) return;
    const primero = focos[0];
    const ultimo = focos[focos.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }

  /* ───────── Borrado en dos pasos (sin window.confirm) ───────── */

  function resetDelete() {
    clearTimeout(armado);
    armado = null;
    const btn = $('#modalDelete');
    btn.textContent = 'Eliminar';
    btn.classList.remove('btn-armed');
  }

  async function deleteCurrent() {
    if (!current) return;
    const c = current;
    resetDelete();
    S.remove(c.id);
    close();
    BF.util.toast(`Caso ${c.codigo} eliminado.`, '');
    if (!S.isConfigured()) return;
    try {
      await S.push({ message: `Elimina caso ${c.codigo}`, silent: true });
    } catch (_) {
      BF.util.toast('Se borró en este navegador pero no se pudo subir a GitHub.', 'err', 5000);
    }
  }

  /* ───────── Tabla ───────── */

  function sortCases(list) {
    const mode = $('#tableSort').value;
    const l = list.slice();
    if (mode === 'fecha-asc') l.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
    else if (mode === 'duracion-desc') l.sort((a, b) => (b.duracionMin || 0) - (a.duracionMin || 0));
    else if (mode === 'proc-asc') l.sort((a, b) => (a.procedimientoPrincipal || '').localeCompare(b.procedimientoPrincipal || '', 'es'));
    else l.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    return l;
  }

  function render() {
    $('#listScope').hidden=!scope;
    const q = $('#tableSearch').value.trim().toLowerCase();
    const rows = visibleCases();
    const tbody = $('#caseTable tbody');

    tbody.innerHTML = rows.map((c) => {
      const compl = c.complicacionIntraop;
      const complLabel = 'Intraop.';
      const lat = (c.lateralidad || '').charAt(0) || '—';
      return `<tr data-id="${c.id}">
        <td class="wrap-cell"><button class="procedure-link code-link" type="button" aria-label="Ver el detalle del caso ${esc(c.codigo)}">${esc(c.procedimientoPrincipal || 'Sin procedimiento')}</button>
          ${c.procedimientosAsociados.length ? `<span class="muted small"> +${c.procedimientosAsociados.length}</span>` : ''}</td>
        <td>${esc(fmtDate(c.fecha))}</td>
        <td><span class="pill ${S.isSurgeon(c) ? 'accent' : ''}">${esc(c.rol || '—')}</span></td>
        <td class="case-code">${esc(c.codigo)}</td>
        <td>${esc(c.lateralidad || '—')}</td>
        <td>${esc(c.abordaje || '—').replace('Artroscópico + mini-abierto', 'Artro + mini')}</td>
        <td class="num">${c.duracionMin ?? '—'}</td>
        <td>${compl ? `<span class="pill bad">${esc(complLabel)}</span>` : '<span class="muted">No</span>'}</td>
        <td class="col-actions"><button class="icon-btn" data-act="edit" title="Editar" aria-label="Editar">✎</button></td>
      </tr>`;
    }).join('');
    $('#mobileCases').innerHTML = rows.map((c) => `<article class="case-item" data-id="${esc(c.id)}"><button type="button" class="case-open" aria-label="Ver el detalle del caso ${esc(c.codigo)}"><strong>${esc(c.procedimientoPrincipal || 'Procedimiento sin registrar')}</strong><span class="case-meta">${esc(fmtDate(c.fecha))} · ${esc(c.lateralidad || 'Sin lateralidad')} · ${esc(c.codigo)}</span></button><div class="case-bottom"><span class="pill ${S.isSurgeon(c) ? 'accent' : ''}">${esc(c.rol || 'Sin rol')}</span><button class="icon-btn" type="button" data-act="edit" aria-label="Editar ${esc(c.codigo)}">✎</button></div>${S.hasComplication(c) ? '<p class="small case-warning">Complicación registrada</p>' : ''}</article>`).join('');

    const total = S.all().length;
    $('#tableCount').textContent = total === 0
      ? 'Todavía no hay casos registrados.'
      : `${rows.length} de ${total} ${total === 1 ? 'caso' : 'casos'} · ${S.metrics(rows).duracionTotal} min acumulados`;
    $('#tableEmpty').hidden = rows.length > 0;
    $('#caseTable').hidden = rows.length === 0;
    $('#tableWrap').hidden = rows.length === 0;
    $('#mobileCases').hidden = rows.length === 0;
    $('#tableEmptyText').textContent = total ? 'No hay casos para esta búsqueda.' : 'Todavía no hay casos. Registra tu primera cirugía.';
    $('#btnClearSearch').hidden = !q;
    $('#btnExportList').textContent = `Exportar resultados (${rows.length})`;
    $('#btnExportList').disabled = !rows.length;
  }
  function visibleCases() { const q = $('#tableSearch').value.trim().toLowerCase(); const list=q?S.filter({q}):S.all();return sortCases(scope?list.filter(c=>BF.practice.matches(c,scope)):list); }

  /* ───────── Modal de detalle ───────── */

  function row(label, value) {
    if (value === '' || value === null || value === undefined || (Array.isArray(value) && !value.length)) return '';
    return `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`;
  }

  function section(title) { return `<h4>${esc(title)}</h4>`; }

  function detailHtml(c) {
    return `<dl class="dl">
      ${section('Identificación')}
      ${row('Código', c.codigo)}
      ${row('Fecha', fmtDate(c.fecha) + (c.hora ? ` · ${c.hora} h` : ''))}
      ${row('Edad / sexo', [c.edad ? `${c.edad} años` : '', c.sexo].filter(Boolean).join(' · '))}
      ${row('Lateralidad', c.lateralidad)}
      ${row('IMC', c.imc)}
      ${row('Institución', c.institucion)}

      ${section('Preoperatorio')}
      ${row('Diagnóstico', c.diagnostico)}
      ${row('Patrón multiligamentario', c.patronMultiligamentario)}
      ${row('Clasificación de Schenck', c.clasificacionMultiligamentaria)}
      ${row('Antecedentes de rodilla', c.antecedentesRodilla)}
      ${row('Comorbilidades', c.comorbilidades)}

      ${section('Equipo y participación')}
      ${row('Cirujano supervisor', c.cirujano)}
      ${row('Mi rol', c.rol)}
      ${row('Pasos que realicé', (c.pasosRealizados || []).join(' · '))}
      ${row('Abordaje', c.abordaje)}
      ${row('Anestesia', c.anestesia)}

      ${section('Procedimiento')}
      ${row('Procedimiento principal', c.procedimientoPrincipal)}
      ${row('Procedimientos asociados', (c.procedimientosAsociados || []).join(' · '))}
      ${row('Tipo de injerto · LCA', c.injertoLca)}
      ${row('Técnica de sutura meniscal', c.tecnicaMeniscal)}
      ${row('Hallazgos', c.hallazgos)}
      ${row('Implantes', c.implantes)}

      ${section('Tiempos y técnica')}
      ${row('Duración', c.duracionMin != null ? `${c.duracionMin} min` : '')}
      ${row('Isquemia', c.torniquete ? `Sí${c.torniqueteMin != null ? ` · ${c.torniqueteMin} min` : ''}` : 'No')}
      ${row('Complicación intraoperatoria', c.complicacionIntraop ? `Sí — ${c.complicacionIntraopDetalle || 'sin detalle'}` : 'No')}

      ${section('Notas')}
      ${row('Etiquetas', (c.tags || []).join(', '))}
      ${row('Notas', c.notas)}
      ${row('Creado', fmtDateTime(c.creado))}
      ${row('Última modificación', fmtDateTime(c.actualizado))}
    </dl>`;
  }

  function open(id) {
    const c = S.get(id);
    if (!c) return;
    resetDelete();
    focoPrevio = document.activeElement;
    current = c;
    $('#modalTitle').textContent = `${c.codigo} · ${c.procedimientoPrincipal || 'Caso'}`;
    $('#modalBody').innerHTML = detailHtml(c);
    $('#modal').hidden = false;
    document.body.style.overflow = 'hidden';
    $('main').inert = true; $('.topbar').inert = true;
    $('#modalClose').focus();
  }

  function close() {
    $('#modal').hidden = true;
    current = null;
    document.body.style.overflow = '';
    $('main').inert = false; $('.topbar').inert = false;
    resetDelete();
    // Devolver el foco a la fila que abrió el panel, no al principio de la página.
    if (focoPrevio && document.contains(focoPrevio)) focoPrevio.focus();
    focoPrevio = null;
  }

  /* ───────── Init ───────── */

  function init() {
    const handleCase = (e) => {
      const tr = e.target.closest('[data-id]');
      if (!tr) return;
      const id = tr.dataset.id;
      if (e.target.closest('[data-act="edit"]')) {
        BF.form.edit(id);
        return;
      }
      open(id);
    };
    $('#caseTable tbody').addEventListener('click', handleCase);
    $('#mobileCases').addEventListener('click', handleCase);

    const search = BF.util.debounce(render, 180);
    $('#tableSearch').addEventListener('input', search);
    $('#tableSort').addEventListener('change', render);
    $('#btnNewFromList').addEventListener('click', () => BF.form.startNew());
    $('#btnClearSearch').addEventListener('click', clearScope);
    $('#btnClearScope').addEventListener('click', clearScope);
    $('#btnExportList').addEventListener('click', () => BF.exporter.exportCsv(visibleCases()));

    $('#modalClose').addEventListener('click', close);
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) close(); });
    document.addEventListener('keydown', atarFoco);

    $('#modalEdit').addEventListener('click', () => {
      const id = current && current.id;
      close();
      if (id) BF.form.edit(id);
    });

    $('#modalDelete').addEventListener('click', async () => {
      if (!current) return;
      const ok = await BF.util.choose({ title: `Eliminar ${current.codigo}`, message: `Se eliminará este caso.${S.isConfigured() ? ' El borrado también se enviará al repositorio conectado de GitHub.' : ' El borrado afecta a este dispositivo.'}`, choices: [{ label: 'Eliminar caso', value: true, className: 'btn-danger' }, { label: 'Cancelar', value: null }] });
      if (ok === true) deleteCurrent();
    });

    S.on('change', render);
    render();
  }

  BF.bitacora = { init, render, open, close, setScope, clearScope };
})();
