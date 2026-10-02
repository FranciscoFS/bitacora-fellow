window.BF = window.BF || {};
(function () {
  const { $, $$, el, esc, todayISO, store, choose } = BF.util;
  const C = BF.CONFIG, S = BF.store;
  let form, selectedProc = new Set(), editingId = null, baseline = '', dirty = false;
  let followupSequence = 0;
  const normalizedQuery = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const fields = () => Array.from(form.elements).filter((f) => f.name && !f.name.startsWith('fup_'));
  const areas = ['Todas', 'Menisco', 'Ligamentos', 'Patelofemoral', 'Artroplastia', 'Osteotomías', 'Cartílago', 'Trauma', 'Otros'];
  let principalArea = 'Todas', associatedArea = 'Todas';
  const areaOf = (p) => {
    const index = C.PROCEDIMIENTOS.indexOf(p);
    return index < 0 ? 'Otros' : index < 7 ? 'Menisco' : index < 16 ? 'Ligamentos' : index < 22 ? 'Patelofemoral' : index < 28 ? 'Artroplastia' : index < 31 ? 'Osteotomías' : index < 37 ? 'Cartílago' : index < 43 ? 'Trauma' : 'Otros';
  };
  const optionMarkup = (p, selected, attr) => `<button class="catalog-option${selected ? ' is-selected' : ''}" type="button" ${attr}="${esc(p)}" aria-pressed="${selected}"><span><small>${esc(areaOf(p))}</small><strong>${esc(p)}</strong></span><span class="option-action" aria-hidden="true">${selected ? '✓' : '+'}</span></button>`;
  function renderCategories(id, current) {
    $(id).innerHTML = areas.map((a) => `<button type="button" data-area="${esc(a)}" aria-pressed="${a === current}">${esc(a)}</button>`).join('');
  }
  function renderDiagnosis() {
    const query = normalizedQuery(form.elements.diagnostico.value);
    const previous = [...new Set(S.all().map((c) => c.diagnostico).filter(Boolean))];
    const matches = previous.filter((d) => normalizedQuery(d).includes(query) && normalizedQuery(d) !== query).slice(0, 4);
    const message = previous.some((d) => normalizedQuery(d) === query) ? 'Este diagnóstico está en tus registros. Puedes ajustar el texto para este caso.' : 'Sin referencias coincidentes. Registra tu diagnóstico en el campo de arriba.';
    $('#diagnosisOptions').innerHTML = matches.length ? matches.map((d) => `<button type="button" data-diagnosis="${esc(d)}"><span>${esc(d)}</span><span aria-hidden="true">↗</span></button>`).join('') : `<p class="picker-empty">${message}</p>`;
  }

  function fillSelect(select, values, placeholder) {
    const value = select.value;
    select.innerHTML = `<option value="">${esc(placeholder)}</option>` + values.map((p) => `<option>${esc(p)}</option>`).join('');
    select.value = value;
  }

  function renderPrincipal() {
    const query = normalizedQuery($('#principalSearch').value);
    const current = form.elements.procedimientoPrincipal.value;
    const matches = C.PROCEDIMIENTOS.filter((p) => normalizedQuery(p).includes(query) && (principalArea === 'Todas' || areaOf(p) === principalArea));
    const options = current && !matches.includes(current) ? [current, ...matches] : matches;
    fillSelect(form.elements.procedimientoPrincipal, options, 'Elegir procedimiento');
    $('#principalSelected').innerHTML = current ? `<span class="selection-check" aria-hidden="true">✓</span><span><small>Seleccionado</small><strong>${esc(current)}</strong></span>` : '<span class="selection-check" aria-hidden="true">—</span><span>Selecciona una intervención del catálogo</span>';
    renderCategories('#principalCategories', principalArea);
    $('#principalOptions').innerHTML = matches.length ? matches.slice(0, 6).map((p) => optionMarkup(p, p === current, 'data-principal')).join('') : '<p class="picker-empty">No encontramos coincidencias. Prueba otra búsqueda o área.</p>';
    $('#principalCount').textContent = `${matches.length} procedimiento(s)${matches.length > 6 ? ' · Se muestran 6. Filtra por área o nombre para ver más.' : ''}`;
  }

  function renderChips() {
    const principal = form.elements.procedimientoPrincipal.value;
    selectedProc.delete(principal);
    $('#procChips').innerHTML = Array.from(selectedProc).map((p) => `<button type="button" class="chip on" data-proc="${esc(p)}" aria-pressed="true" aria-label="Quitar ${esc(p)}">${esc(p)} <span aria-hidden="true">×</span></button>`).join('');
    const query = normalizedQuery($('#associatedSearch').value);
    const options = C.PROCEDIMIENTOS.filter((p) => p !== principal && !selectedProc.has(p) && normalizedQuery(p).includes(query) && (associatedArea === 'Todas' || areaOf(p) === associatedArea));
    renderCategories('#associatedCategories', associatedArea);
    $('#procOptions').innerHTML = options.length ? options.slice(0, 4).map((p) => optionMarkup(p, false, 'data-proc')).join('') : '<p class="picker-empty">Sin coincidencias disponibles. Cambia el área o la búsqueda.</p>';
    if (!selectedProc.size) $('#procChips').innerHTML = '<span class="selection-placeholder">Aún no agregaste procedimientos adicionales</span>';
    $('#associatedCount').textContent = `${selectedProc.size} seleccionado(s) · ${options.length} disponibles${options.length > 4 ? ' · Refina la búsqueda para ver más.' : ''}`;
  }

  function followupRow(values = {}) {
    const row = el('div', { class: 'fup' });
    const n = ++followupSequence;
    for (const f of C.FOLLOWUP_FIELDS) {
      const input = el('input', { name: `fup_${f.key}`, id: `followup-${n}-${f.key}`, type: f.type, class: f.cls || '', inputmode: f.type === 'number' ? 'decimal' : null });
      if (f.min !== undefined) input.min = f.min;
      if (f.max !== undefined) input.max = f.max;
      input.value = values[f.key] ?? '';
      row.append(el('label', { class: 'field' + (f.key === 'notas' ? ' fup-notes' : '') }, [el('span', { text: f.label }), input]));
    }
    const remove = el('button', { type: 'button', class: 'icon-btn', 'aria-label': `Quitar control ${n}`, text: '×' });
    remove.addEventListener('click', () => { row.remove(); changed(); });
    row.append(remove);
    return row;
  }

  function addFollowup(values) { $('#followupList').append(followupRow(values)); }
  function readFollowup() {
    return $$('.fup', $('#followupList')).map((row) => {
      const values = {};
      for (const f of C.FOLLOWUP_FIELDS) values[f.key] = row.querySelector(`[name="fup_${f.key}"]`).value;
      return values;
    }).filter((v) => Object.values(v).some((value) => value !== ''));
  }

  function capture() {
    const caso = {};
    for (const field of fields()) caso[field.name] = field.type === 'checkbox' ? field.checked : field.value;
    caso.tags = String(caso.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
    caso.procedimientosAsociados = Array.from(selectedProc);
    caso.seguimiento = readFollowup();
    return caso;
  }

  function fingerprint() {
    const c = capture();
    delete c.codigo;
    return JSON.stringify(c);
  }

  function read() {
    const c = capture();
    if (!c.torniquete) c.torniqueteMin = null;
    if (!c.complicacionIntraop) c.complicacionIntraopDetalle = '';
    if (!c.complicacionPostop) { c.complicacionPostopDetalle = ''; c.complicacionClavienDindo = ''; }
    return c;
  }

  function updateSections() {
    $$('.form-section').forEach((section) => {
      const filled = $$('input,select,textarea', section).filter((f) => f.name !== 'codigo' && (f.type === 'checkbox' ? f.checked : f.value !== '')).length;
      const extra = section.querySelector('#procChips') ? selectedProc.size : 0;
      section.querySelector('.section-state').textContent = filled + extra ? 'Con datos' : 'Opcional';
    });
  }

  function conditionals() {
    $$('[data-conditional]', form).forEach((container) => {
      const visible = form.elements[container.dataset.conditional].checked;
      container.hidden = !visible;
      $$('input,select,textarea', container).forEach((f) => { f.disabled = !visible; });
    });
  }

  function persistDraft() {
    dirty = fingerprint() !== baseline;
    if (!dirty) { store.del('draft'); $('#draftStatus').textContent = 'Los campos con * son obligatorios.'; return; }
    const saved = store.set('draft', { caso: capture(), editingId, baseline, updated: new Date().toISOString() });
    $('#draftStatus').textContent = saved ? 'Borrador guardado en este dispositivo. Todavía no es un caso registrado.' : 'Borrador en memoria. Exporta los datos antes de cerrar esta pestaña.';
  }

  function clearInvalid() {
    $('#principalSearch').removeAttribute('aria-describedby');
    $$('.field-error', form).forEach((e) => e.remove());
    $$('[aria-invalid]', form).forEach((f) => { f.removeAttribute('aria-invalid'); f.removeAttribute('aria-describedby'); f.classList.remove('is-invalid'); });
    $$('.has-error', form).forEach((s) => s.classList.remove('has-error'));
  }

  function changed() {
    conditionals(); updateSections();
    $$('[aria-invalid]', form).forEach((f) => {
      if (f.checkValidity()) {
        if (f.name === 'procedimientoPrincipal') $('#principalSearch').removeAttribute('aria-describedby');
        const error = document.getElementById(f.getAttribute('aria-describedby'));
        if (error) error.remove();
        f.removeAttribute('aria-invalid'); f.removeAttribute('aria-describedby'); f.classList.remove('is-invalid');
      }
    });
    persistDraft();
  }

  function write(caso) {
    for (const field of fields()) {
      if (field.type === 'checkbox') field.checked = !!caso[field.name];
      else field.value = caso[field.name] ?? '';
    }
    form.elements.tags.value = (caso.tags || []).join(', ');
    principalArea = associatedArea = 'Todas'; renderDiagnosis();
    $('#principalSearch').value = ''; $('#associatedSearch').value = '';
    if (caso.procedimientoPrincipal && !Array.from(form.elements.procedimientoPrincipal.options).some((o) => o.value === caso.procedimientoPrincipal)) {
      form.elements.procedimientoPrincipal.add(new Option(caso.procedimientoPrincipal, caso.procedimientoPrincipal));
      form.elements.procedimientoPrincipal.value = caso.procedimientoPrincipal;
    }
    renderPrincipal(); selectedProc = new Set(caso.procedimientosAsociados || []); renderChips();
    $('#followupList').replaceChildren(); (caso.seguimiento || []).forEach(addFollowup);
    conditionals(); updateSections();
  }

  function setMeta() {
    $('#formTitle').textContent = editingId ? `Editar ${form.elements.codigo.value}` : 'Nuevo caso';
    $('#formSubtitle').textContent = editingId ? 'Actualiza los detalles y guarda los cambios del mismo registro.' : 'Completa lo esencial. Puedes agregar los detalles y el seguimiento después.';
    $('#btnCancelEdit').hidden = !editingId;
    $('#btnSaveCase').textContent = editingId ? 'Guardar cambios' : 'Guardar caso';
  }

  function resetForm({ keepDate = false, keepSurgeon = false } = {}) {
    const fecha = form.elements.fecha.value, surgeon = form.elements.cirujano.value;
    form.reset(); editingId = null; selectedProc.clear();
    principalArea = associatedArea = 'Todas';
    fillSelect(form.elements.procedimientoPrincipal, C.PROCEDIMIENTOS, 'Elegir procedimiento');
    form.elements.id.value = ''; form.elements.codigo.value = S.nextCodigo();
    form.elements.fecha.value = keepDate ? fecha : todayISO();
    if (keepSurgeon) form.elements.cirujano.value = surgeon;
    $('#principalSearch').value = ''; $('#associatedSearch').value = '';
    $('#followupList').replaceChildren();
    $$('.form-section').forEach((s) => { s.open = false; });
    clearInvalid(); renderPrincipal(); renderChips(); renderDiagnosis(); conditionals(); updateSections(); setMeta();
    $('#formMsg').textContent = ''; $('#formMsg').classList.remove('err');
    baseline = fingerprint(); dirty = false;
    store.del('draft'); $('#draftStatus').textContent = 'Los campos con * son obligatorios.';
  }

  async function allowDiscard() {
    if (!dirty) return true;
    return await choose({ title: '¿Descartar este borrador?', message: 'El contenido sin registrar se eliminará. Puedes volver y guardar el caso antes de continuar.', choices: [{ label: 'Descartar borrador', value: true, className: 'btn-danger' }, { label: 'Volver al borrador', value: null }] }) === true;
  }

  async function startNew() {
    if (!await allowDiscard()) { BF.app.show('nuevo'); return false; }
    resetForm(); BF.app.show('nuevo'); form.elements.fecha.focus(); return true;
  }

  async function edit(id, { followup = false } = {}) {
    if (!await allowDiscard()) { BF.app.show('nuevo'); return false; }
    const c = S.get(id); if (!c) return false;
    clearInvalid(); fillSelect(form.elements.procedimientoPrincipal, C.PROCEDIMIENTOS, 'Elegir procedimiento');
    write(c); editingId = id; setMeta(); baseline = fingerprint(); dirty = false;
    $('#draftStatus').textContent = 'Los cambios se registran al guardar.';
    $('#formMsg').textContent = ''; BF.app.show('nuevo');
    if (followup) {
      $('#followupSection').open = true; addFollowup();
      $('#followupList .fup:last-child input').focus();
    } else form.elements.fecha.focus();
    return true;
  }

  function validate() {
    clearInvalid();
    const invalid = fields().concat($$('input', $('#followupList'))).filter((f) => !f.checkValidity());
    if (invalid.length) {
      invalid.forEach((f, i) => {
        const detail = f.closest('details'); if (detail) { detail.open = true; detail.classList.add('has-error'); }
        const id = `field-error-${i}`;
        const message = f.validity.valueMissing ? 'Completa este campo obligatorio.' : f.validity.rangeUnderflow || f.validity.rangeOverflow ? `Ingresa un valor entre ${f.min} y ${f.max}.` : 'Revisa el formato o el valor ingresado.';
        f.classList.add('is-invalid'); f.setAttribute('aria-invalid', 'true'); f.setAttribute('aria-describedby', id);
        if (f.name === 'procedimientoPrincipal') $('#principalSearch').setAttribute('aria-describedby', id);
        f.parentElement.append(el('span', { id, class: 'field-error', text: message }));
      });
      (invalid[0].name === 'procedimientoPrincipal' ? $('#principalSearch') : invalid[0]).focus();
      $('#formMsg').textContent = `Revisa ${invalid.length} campo(s) marcado(s).`; $('#formMsg').classList.add('err');
      return false;
    }
    if (S.all().some((c) => c.codigo === form.elements.codigo.value && c.id !== editingId)) form.elements.codigo.value = S.nextCodigo();
    return true;
  }

  function save({ andNew = false } = {}) {
    if (!validate()) return false;
    const wasEditing = !!editingId, saved = wasEditing ? S.update(editingId, read()) : S.add(read());
    if (!saved) { $('#formMsg').textContent = 'No se encontró el caso. Conserva tu borrador.'; return false; }
    refreshDatalist(); resetForm({ keepDate: andNew, keepSurgeon: andNew });
    const reliable = store.reliable();
    const message = reliable ? `${saved.codigo} ${wasEditing ? 'actualizado' : 'guardado'} en este dispositivo.${S.isConfigured() ? ' Pendiente de sincronización.' : ''}` : `${saved.codigo} permanece en memoria. No se pudo guardar en este dispositivo.`;
    BF.util.toast(message, reliable ? 'ok' : 'err', 6000);
    if (andNew) { $('#formMsg').textContent = message; form.elements.diagnostico.focus(); }
    else BF.app.show('bitacora');
    return true;
  }

  function refreshDatalist() { $('#dlCirujanos').innerHTML = S.distinctCirujanos().map((c) => `<option value="${esc(c)}">`).join(''); }

  function init() {
    form = $('#caseForm');
    fillSelect(form.elements.rol, C.ROLES, 'Elegir rol'); fillSelect(form.elements.abordaje, C.ABORDAJES, 'Elegir abordaje');
    fillSelect(form.elements.anestesia, C.ANESTESIAS, 'Sin registrar'); fillSelect(form.elements.procedimientoPrincipal, C.PROCEDIMIENTOS, 'Elegir procedimiento');
    const draft = store.get('draft'); resetForm(); refreshDatalist();
    if (draft && draft.caso) {
      write(draft.caso); editingId = S.get(draft.editingId) ? draft.editingId : null;
      if (!editingId) { form.elements.id.value = ''; form.elements.codigo.value = S.nextCodigo(); }
      baseline = draft.baseline || baseline; dirty = true; setMeta();
      store.set('draft', { ...draft, editingId, caso: capture() });
      $('#draftStatus').textContent = 'Borrador recuperado. Complétalo y guarda el caso cuando esté listo.';
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); save(); });
    form.addEventListener('input', (e) => { if (e.target.name) changed(); });
    form.addEventListener('change', (e) => {
      if (e.target.name === 'procedimientoPrincipal') renderChips();
      if (e.target.name) changed();
    });
    $('#principalSearch').addEventListener('input', renderPrincipal);
    $('#principalOptions').addEventListener('click', (e) => {
      const b = e.target.closest('[data-principal]'); if (!b) return;
      form.elements.procedimientoPrincipal.value = b.dataset.principal;
      renderPrincipal(); renderChips(); changed(); $('#principalSearch').focus();
    });
    $('#principalCategories').addEventListener('click', (e) => { const b = e.target.closest('[data-area]'); if (b) { principalArea = b.dataset.area; renderPrincipal(); $('#principalCategories [aria-pressed="true"]').focus(); } });
    $('#associatedCategories').addEventListener('click', (e) => { const b = e.target.closest('[data-area]'); if (b) { associatedArea = b.dataset.area; renderChips(); $('#associatedCategories [aria-pressed="true"]').focus(); } });
    $('#diagnosisSearch').addEventListener('input', renderDiagnosis);
    $('#diagnosisOptions').addEventListener('click', (e) => { const b = e.target.closest('[data-diagnosis]'); if (b) { form.elements.diagnostico.value = b.dataset.diagnosis; renderDiagnosis(); changed(); form.elements.diagnostico.focus(); } });
    $('#associatedSearch').addEventListener('input', renderChips);
    const toggleProc = (e) => {
      const b = e.target.closest('[data-proc]'); if (!b) return;
      selectedProc.has(b.dataset.proc) ? selectedProc.delete(b.dataset.proc) : selectedProc.add(b.dataset.proc);
      renderChips(); changed();
      $('#associatedSearch').focus();
    };
    $('#procChips').addEventListener('click', toggleProc); $('#procOptions').addEventListener('click', toggleProc);
    $('#btnAddFollowup').addEventListener('click', () => { addFollowup(); $('#followupList .fup:last-child input').focus(); });
    $('#btnSaveAndNew').addEventListener('click', () => save({ andNew: true }));
    $('#btnResetForm').addEventListener('click', startNew);
    $('#btnCancelEdit').addEventListener('click', async () => { if (await allowDiscard()) { resetForm(); BF.app.show('bitacora'); } });
    S.on('change', () => { if (!editingId) form.elements.codigo.value = S.nextCodigo(); refreshDatalist(); });
  }
  async function restoreDraft(draft) {
    if (!draft || !draft.caso || !await allowDiscard()) return false;
    fillSelect(form.elements.procedimientoPrincipal, C.PROCEDIMIENTOS, 'Elegir procedimiento');
    write(draft.caso); editingId = S.get(draft.editingId) ? draft.editingId : null;
    if (!editingId) { form.elements.id.value = ''; form.elements.codigo.value = S.nextCodigo(); }
    baseline = draft.baseline || ''; dirty = true; setMeta(); persistDraft();
    BF.app.show('nuevo'); $('#draftStatus').textContent = 'Borrador recuperado del respaldo. Revísalo antes de guardar.';
    return true;
  }
  BF.form = { init, startNew, edit, read, write, refreshDatalist, resetForm, save, hasUnsaved: () => dirty, persistDraft, restoreDraft };
})();
