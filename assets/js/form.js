window.BF = window.BF || {};
(function () {
  const { $, $$, el, esc, todayISO, store, choose } = BF.util;
  const C = BF.CONFIG, S = BF.store;
  let form, selectedProc = new Set(), editingId = null, baseline = '', dirty = false;
  let legacyDetails = {};
  let excludedAutoTags = new Set();
  let personalSteps = new Set();
  const keepLegacyDetails = (caso = {}) => ({
    seguimiento: caso.seguimiento || [], presentadoEnAteneo: !!caso.presentadoEnAteneo, publicable: !!caso.publicable,
    internacionDias: caso.internacionDias ?? null, uti: !!caso.uti,
    profilaxis: caso.profilaxis || '', rehabilitacion: caso.rehabilitacion || '',
    complicacionPostop: !!caso.complicacionPostop, complicacionPostopDetalle: caso.complicacionPostopDetalle || '',
    complicacionClavienDindo: caso.complicacionClavienDindo || ''
  });
  const normalizedQuery = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const fields = () => Array.from(form.elements).filter((f) => f.name && !f.name.startsWith('fup_'));
  const areas = ['Todas', 'Menisco', 'Ligamentos', 'Patelofemoral', 'Artroplastia', 'Osteotomías', 'Cartílago', 'Fracturas', 'Otros'];
  let principalArea = 'Todas', associatedArea = 'Todas', principalExpanded = true;
  const areaOf = C.procedureArea;
  const optionMarkup = (p, selected, attr) => `<button class="catalog-option${selected ? ' is-selected' : ''}" type="button" ${attr}="${esc(p)}" aria-pressed="${selected}"><span><small>${esc(areaOf(p))}</small><strong>${esc(p)}</strong></span><span class="option-action" aria-hidden="true">${selected ? '✓' : '+'}</span></button>`;
  function renderCategories(id, current) {
    $(id).innerHTML = areas.map((a) => `<button type="button" data-area="${esc(a)}" aria-pressed="${a === current}">${esc(a === 'Todas' && id === '#principalCategories' ? 'Frecuentes' : a)}</button>`).join('');
  }
  function renderDiagnosis() {
    const query = normalizedQuery(form.elements.diagnostico.value.trim());
    const previous = [...new Set(S.all().map((c) => c.diagnostico).filter(Boolean))];
    const matches = query ? previous.filter((d) => normalizedQuery(d).includes(query) && normalizedQuery(d) !== query).slice(0, 4) : [];
    $('#diagnosisOptions').hidden = !matches.length;
    $('#diagnosisOptions').innerHTML = matches.map((d) => `<button type="button" data-diagnosis="${esc(d)}"><span>${esc(d)}</span><span aria-hidden="true">↗</span></button>`).join('');
  }

  function initChoices() {
    const labels = { Derecha: 'D', Izquierda: 'Izq' };
    for (const [name, values] of [['lateralidad', C.LATERALIDADES], ['rol', C.ROLES], ['abordaje', C.ABORDAJES], ['osteotomiaTibialTipo', C.OSTEOTOMIA_TIPOS], ['osteotomiaTibialLado', C.OSTEOTOMIA_LADOS], ['osteotomiaFemoralTipo', C.OSTEOTOMIA_TIPOS], ['osteotomiaFemoralLado', C.OSTEOTOMIA_LADOS]]) {
      fillSelect(form.elements[name], values, '');
      const group = form.querySelector('[data-choice="' + name + '"]');
      group.innerHTML = values.map((value) => `<button type="button" data-choice-value="${esc(value)}" aria-pressed="false" aria-label="${esc(value)}">${esc(labels[value] || value)}</button>`).join('');
      group.addEventListener('click', (e) => {
        const button = e.target.closest('[data-choice-value]'); if (!button) return;
        const field = form.elements[name];
        field.value = field.value === button.dataset.choiceValue ? '' : button.dataset.choiceValue;
        changed();
      });
    }
  }

  function syncChoices() {
    $$('[data-choice]', form).forEach((group) => {
      const field = form.elements[group.dataset.choice];
      $$('[data-choice-value]', group).forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.choiceValue === field.value)));
      if (field.hasAttribute('aria-invalid')) group.setAttribute('aria-invalid', 'true');
      else group.removeAttribute('aria-invalid');
      if (field.hasAttribute('aria-describedby')) group.setAttribute('aria-describedby', field.getAttribute('aria-describedby'));
      else group.removeAttribute('aria-describedby');
    });
  }

  function focusField(field) {
    if (field.name === 'procedimientoPrincipal') {
      principalExpanded = true;
      $('#principalCatalog').hidden = false;
      $('#principalSearch').focus();
    } else if (form.querySelector('[data-choice="' + field.name + '"]')) {
      form.querySelector('[data-choice="' + field.name + '"] button').focus();
    } else field.focus();
  }

  function frequentProcedures() {
    const counts = new Map();
    S.all().forEach((c) => {
      const p = C.procedureName(c.procedimientoPrincipal);
      if (C.PROCEDIMIENTOS.includes(p)) counts.set(p, (counts.get(p) || 0) + 1);
    });
    return [...new Set([...Array.from(counts).sort((a, b) => b[1] - a[1]).map(([p]) => p), ...Object.keys(C.DEFAULT_OBJETIVOS), ...C.PROCEDIMIENTOS])].slice(0, 6);
  }

  function fillSelect(select, values, placeholder) {
    const value = select.value;
    select.innerHTML = `<option value="">${esc(placeholder)}</option>` + values.map((p) => `<option>${esc(p)}</option>`).join('');
    select.value = value;
  }

  function renderPrincipal() {
    const query = normalizedQuery($('#principalSearch').value.trim());
    const current = form.elements.procedimientoPrincipal.value;
    const matches = !query && principalArea === 'Todas' ? frequentProcedures() : C.PROCEDIMIENTOS.filter((p) => normalizedQuery(p).includes(query) && (principalArea === 'Todas' || areaOf(p) === principalArea));
    // Keep the complete catalog in the form control, independently of visible results.
    const options = current && !C.PROCEDIMIENTOS.includes(current) ? [current, ...C.PROCEDIMIENTOS] : C.PROCEDIMIENTOS;
    fillSelect(form.elements.procedimientoPrincipal, options, 'Elegir procedimiento');
    $('#principalSelected').hidden = !current;
    $('#principalSelected').innerHTML = current ? `<span class="selection-check" aria-hidden="true">✓</span><strong>${esc(current)}</strong><button class="btn btn-ghost" type="button" id="changePrincipal" aria-expanded="${principalExpanded}" aria-controls="principalCatalog">Cambiar</button>` : '';
    $('#principalCatalog').hidden = !!current && !principalExpanded;
    renderTraumaContext();
    renderCategories('#principalCategories', principalArea);
    $('#principalOptions').innerHTML = matches.length ? matches.map((p) => optionMarkup(p, p === current, 'data-principal')).join('') : '<p class="picker-empty">Sin coincidencias.</p>';
  }

  function renderTraumaContext() {
    const current = form.elements.procedimientoPrincipal.value;
    const paired = ['Reducción', 'Osteosíntesis', 'Reducción y osteosíntesis'].includes(current);
    $('#traumaProcedureContext').hidden = !paired;
    $('#traumaProcedureContext').textContent = paired ? form.elements.diagnostico.value.trim() ? `${current} · ${form.elements.diagnostico.value.trim()}` : 'Escribe el diagnóstico para completar este caso de Fracturas.' : '';
  }

  function renderChips() {
    const principal = form.elements.procedimientoPrincipal.value;
    selectedProc.delete(principal);
    $('#procChips').innerHTML = Array.from(selectedProc).map((p) => `<button type="button" class="chip on" data-proc="${esc(p)}" aria-pressed="true" aria-label="Quitar ${esc(p)}">${esc(p)} <span aria-hidden="true">×</span></button>`).join('');
    const query = normalizedQuery($('#associatedSearch').value);
    const options = C.PROCEDIMIENTOS.filter((p) => p !== principal && !selectedProc.has(p) && normalizedQuery(p).includes(query) && (associatedArea === 'Todas' || areaOf(p) === associatedArea));
    renderCategories('#associatedCategories', associatedArea);
    $('#procOptions').innerHTML = options.length ? (query || associatedArea !== 'Todas' ? options : options.slice(0, 4)).map((p) => optionMarkup(p, false, 'data-proc')).join('') : '<p class="picker-empty">Sin coincidencias disponibles. Cambia el área o la búsqueda.</p>';
    $('#procChips').hidden = !selectedProc.size;
  }

  function capture() {
    const caso = { ...legacyDetails };
    for (const field of fields()) caso[field.name] = field.type === 'checkbox' ? field.checked : field.value;
    caso.tags = String(caso.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
    caso.manualTags = [...caso.tags];
    caso.procedimientosAsociados = Array.from(selectedProc);
    caso.pasosRealizados = [...personalSteps];
    caso.autoTags = [];
    caso.excludedAutoTags = [...excludedAutoTags];
    return C.withAutoTags(caso);
  }

  function fingerprint() {
    const c = capture();
    delete c.codigo;
    return JSON.stringify(c);
  }

  function read() {
    const c = capture();
    const applicable = C.procedureDetailsFor([c.procedimientoPrincipal, ...c.procedimientosAsociados]);
    if (!applicable.injertoLca) c.injertoLca = '';
    if (!applicable.tecnicaMeniscal) c.tecnicaMeniscal = '';
    for (const family of ['Tibial', 'Femoral']) {
      if (!applicable['osteotomia' + family]) {
        c['osteotomia' + family + 'Tipo'] = '';
        c['osteotomia' + family + 'Lado'] = '';
      }
    }
    if (!C.isMultiligamentaryDiagnosis(c.diagnostico)) { c.patronMultiligamentario = ''; c.clasificacionMultiligamentaria = ''; }
    if (!c.torniquete) c.torniqueteMin = null;
    if (!c.complicacionIntraop) c.complicacionIntraopDetalle = '';
    return C.withAutoTags(c);
  }

  function updateSections() {
    for (const [selector, count] of [['.associated-picker', selectedProc.size], ['.personal-details', personalSteps.size]]) {
      const section = $(selector);
      section.querySelector('summary .optional-label').textContent = count ? `${count} seleccionado${count === 1 ? '' : 's'}` : 'Opcional';
    }
    $$('.form-section').forEach((section) => {
      const filled = $$('input,select,textarea', section).filter((f) => f.name !== 'codigo' && (f.type === 'checkbox' ? f.checked : f.value !== '')).length;
      const extra = section.querySelector('#procChips') ? selectedProc.size : 0;
      section.querySelector('.section-state').textContent = filled + extra ? 'Con datos' : 'Opcional';
    });
  }

  function conditionals() {
    renderTraumaContext();
    const multiligamentary = C.isMultiligamentaryDiagnosis(form.elements.diagnostico.value);
    $('#multiligamentaryDetails').hidden = !multiligamentary;
    for (const key of ['patronMultiligamentario', 'clasificacionMultiligamentaria']) form.elements[key].disabled = !multiligamentary;
    const applicable = C.procedureDetailsFor([form.elements.procedimientoPrincipal.value, ...selectedProc]);
    $('#procedureSpecific').hidden = !Object.values(applicable).some(Boolean);
    for (const [field, key] of [['#graftField', 'injertoLca'], ['#meniscalTechniqueField', 'tecnicaMeniscal']]) {
      $(field).hidden = !applicable[key];
      form.elements[key].disabled = !applicable[key];
    }
    for (const family of ['Tibial', 'Femoral']) {
      const visible = applicable['osteotomia' + family];
      $('#osteotomy' + family + 'Details').hidden = !visible;
      for (const suffix of ['Tipo', 'Lado']) form.elements['osteotomia' + family + suffix].disabled = !visible;
    }
    $$('[data-conditional]', form).forEach((container) => {
      const visible = form.elements[container.dataset.conditional].checked;
      container.hidden = !visible;
      $$('input,select,textarea', container).forEach((f) => { f.disabled = !visible; });
    });
    renderTags();
    renderPersonalSteps();
  }

  function renderPersonalSteps() {
    const options = [...new Set([...C.personalStepsFor(capture()), ...personalSteps])];
    $('#personalStepsOptions').innerHTML = options.length ? options.map((step) => `<button type="button" class="chip${personalSteps.has(step) ? ' on' : ''}" data-personal-step="${esc(step)}" aria-pressed="${personalSteps.has(step)}">${esc(step)} <span aria-hidden="true">${personalSteps.has(step) ? '✓' : '+'}</span></button>`).join('') : '';
  }

  function renderTags() {
    const suggested = C.suggestTags(capture());
    $('#autoTagChips').innerHTML = suggested.length ? suggested.map((tag) => {
      const included = !excludedAutoTags.has(tag);
      return `<button type="button" class="chip${included ? ' on' : ''}" data-auto-tag="${esc(tag)}" aria-pressed="${included}" aria-label="${included ? 'Quitar' : 'Incluir'} etiqueta ${esc(tag)}">${esc(tag)} <span aria-hidden="true">${included ? '×' : '+'}</span></button>`;
    }).join('') : '';
  }

  function persistDraft() {
    dirty = fingerprint() !== baseline;
    if (!dirty) { store.del('draft'); $('#draftStatus').textContent = ''; return; }
    const saved = store.set('draft', { caso: capture(), editingId, baseline, updated: new Date().toISOString() });
    $('#draftStatus').textContent = saved ? 'Borrador guardado' : 'Borrador en memoria. Exporta los datos antes de cerrar esta pestaña.';
  }

  function clearInvalid() {
    $('#principalSearch').removeAttribute('aria-describedby');
    $$('.field-error', form).forEach((e) => e.remove());
    $$('[aria-invalid]', form).forEach((f) => { f.removeAttribute('aria-invalid'); f.removeAttribute('aria-describedby'); f.classList.remove('is-invalid'); });
    $$('.has-error', form).forEach((s) => s.classList.remove('has-error'));
    syncChoices();
  }

  function changed() {
    conditionals(); updateSections();
    $$('input[aria-invalid],select[aria-invalid],textarea[aria-invalid]', form).forEach((f) => {
      if (f.checkValidity()) {
        if (f.name === 'procedimientoPrincipal') $('#principalSearch').removeAttribute('aria-describedby');
        const error = document.getElementById(f.getAttribute('aria-describedby'));
        if (error) error.remove();
        f.removeAttribute('aria-invalid'); f.removeAttribute('aria-describedby'); f.classList.remove('is-invalid');
      }
    });
    syncChoices(); persistDraft();
  }

  function write(caso) {
    caso = { ...caso, procedimientoPrincipal: C.procedureName(caso.procedimientoPrincipal), procedimientosAsociados: [...new Set((caso.procedimientosAsociados || []).map(C.procedureName))] };
    legacyDetails = keepLegacyDetails(caso);
    excludedAutoTags = new Set(caso.excludedAutoTags || []);
    personalSteps = new Set(caso.pasosRealizados || []);
    for (const field of fields()) {
      if (field.type === 'checkbox') field.checked = !!caso[field.name];
      else field.value = caso[field.name] ?? '';
    }
    const auto = new Set((caso.autoTags || []).map((t) => t.toLocaleLowerCase()));
    form.elements.tags.value = (Array.isArray(caso.manualTags) ? caso.manualTags : (caso.tags || []).filter((t) => !auto.has(t.toLocaleLowerCase()))).join(', ');
    principalArea = associatedArea = 'Todas'; principalExpanded = !caso.procedimientoPrincipal; renderDiagnosis(); syncChoices();
    $('#principalSearch').value = ''; $('#associatedSearch').value = '';
    if (caso.procedimientoPrincipal && !Array.from(form.elements.procedimientoPrincipal.options).some((o) => o.value === caso.procedimientoPrincipal)) {
      form.elements.procedimientoPrincipal.add(new Option(caso.procedimientoPrincipal, caso.procedimientoPrincipal));
      form.elements.procedimientoPrincipal.value = caso.procedimientoPrincipal;
    }
    renderPrincipal(); selectedProc = new Set(caso.procedimientosAsociados || []); renderChips();
    conditionals(); updateSections();
    $('.associated-picker').open = selectedProc.size > 0;
    $('.personal-details').open = personalSteps.size > 0;
  }

  function setMeta() {
    $('#formTitle').textContent = editingId ? `Editar ${form.elements.codigo.value}` : 'Nuevo caso';
    $('#formSubtitle').textContent = '';
    $('#btnCancelEdit').hidden = !editingId;
    $('#btnSaveCase').textContent = editingId ? 'Guardar cambios' : 'Guardar caso';
  }

  function resetForm({ keepDate = false, keepSurgeon = false } = {}) {
    const fecha = form.elements.fecha.value, surgeon = form.elements.cirujano.value;
    form.reset(); editingId = null; selectedProc.clear(); legacyDetails = keepLegacyDetails();
    excludedAutoTags.clear();
    personalSteps.clear();
    principalArea = associatedArea = 'Todas'; principalExpanded = true;
    fillSelect(form.elements.procedimientoPrincipal, C.PROCEDIMIENTOS, 'Elegir procedimiento');
    form.elements.id.value = ''; form.elements.codigo.value = S.nextCodigo();
    form.elements.fecha.value = keepDate ? fecha : todayISO();
    if (keepSurgeon) form.elements.cirujano.value = surgeon;
    $('#principalSearch').value = ''; $('#associatedSearch').value = '';
    $$('.form-section, .associated-picker, .personal-details').forEach((s) => { s.open = false; });
    clearInvalid(); renderPrincipal(); renderChips(); renderDiagnosis(); conditionals(); updateSections(); setMeta();
    $('#formMsg').textContent = ''; $('#formMsg').classList.remove('err');
    baseline = fingerprint(); dirty = false;
    store.del('draft'); $('#draftStatus').textContent = '';
  }

  async function allowDiscard() {
    if (!dirty) return true;
    return await choose({ title: '¿Descartar este borrador?', message: 'El contenido sin registrar se eliminará. Puedes volver y guardar el caso antes de continuar.', choices: [{ label: 'Descartar borrador', value: true, className: 'btn-danger' }, { label: 'Volver al borrador', value: null }] }) === true;
  }

  async function startNew() {
    if (!await allowDiscard()) { BF.app.show('nuevo'); return false; }
    resetForm(); BF.app.show('nuevo'); form.elements.fecha.focus(); return true;
  }

  async function edit(id) {
    if (!await allowDiscard()) { BF.app.show('nuevo'); return false; }
    const c = S.get(id); if (!c) return false;
    clearInvalid(); fillSelect(form.elements.procedimientoPrincipal, C.PROCEDIMIENTOS, 'Elegir procedimiento');
    write(c); editingId = id; setMeta(); baseline = fingerprint(); dirty = false;
    $('#draftStatus').textContent = 'Editando caso';
    $('#formMsg').textContent = ''; BF.app.show('nuevo');
    form.elements.fecha.focus();
    return true;
  }

  function validate() {
    clearInvalid();
    const invalid = fields().filter((f) => !f.checkValidity());
    if (invalid.length) {
      invalid.forEach((f, i) => {
        const detail = f.closest('details'); if (detail) { detail.open = true; detail.classList.add('has-error'); }
        const id = `field-error-${i}`;
        const message = f.validity.valueMissing ? 'Completa este campo obligatorio.' : f.validity.rangeUnderflow || f.validity.rangeOverflow ? `Ingresa un valor entre ${f.min} y ${f.max}.` : 'Revisa el formato o el valor ingresado.';
        f.classList.add('is-invalid'); f.setAttribute('aria-invalid', 'true'); f.setAttribute('aria-describedby', id);
        if (f.name === 'procedimientoPrincipal') $('#principalSearch').setAttribute('aria-describedby', id);
        f.parentElement.append(el('span', { id, class: 'field-error', text: message }));
      });
      syncChoices(); focusField(invalid[0]);
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
    const message = reliable ? `${saved.codigo} ${wasEditing ? 'actualizado' : 'guardado'}. ${S.isConfigured() ? S.state.cfg.auto ? 'Enviando los cambios a GitHub…' : 'Guardado en este dispositivo. Pulsa «Sincronizar ahora» para enviarlo a GitHub.' : 'Guardado en este dispositivo. Conecta GitHub en Ajustes para sincronizar.'}` : `${saved.codigo} permanece en memoria. No se pudo guardar en este dispositivo.`;
    BF.util.toast(message, reliable ? 'ok' : 'err', 6000);
    if (andNew) { $('#formMsg').textContent = message; form.elements.diagnostico.focus(); }
    else { BF.bitacora.clearScope(); BF.app.show('bitacora'); }
    return true;
  }

  function refreshDatalist() { $('#dlCirujanos').innerHTML = S.distinctCirujanos().map((c) => `<option value="${esc(c)}">`).join(''); }

  function init() {
    form = $('#caseForm');
    initChoices();
    fillSelect(form.elements.anestesia, C.ANESTESIAS, ''); fillSelect(form.elements.procedimientoPrincipal, C.PROCEDIMIENTOS, 'Elegir procedimiento');
    const draft = store.get('draft'); resetForm(); refreshDatalist();
    if (draft && draft.caso) {
      write(draft.caso); editingId = S.get(draft.editingId) ? draft.editingId : null;
      if (!editingId) { form.elements.id.value = ''; form.elements.codigo.value = S.nextCodigo(); }
      baseline = draft.baseline || baseline; dirty = true; setMeta();
      store.set('draft', { ...draft, editingId, caso: capture() });
      $('#draftStatus').textContent = 'Borrador recuperado';
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); save(); });
    $('#personalStepsOptions').addEventListener('click', (e) => {
      const button = e.target.closest('[data-personal-step]'); if (!button) return;
      const step = button.dataset.personalStep;
      personalSteps.has(step) ? personalSteps.delete(step) : personalSteps.add(step);
      changed();
    });
    $('#autoTagChips').addEventListener('click', (e) => {
      const button = e.target.closest('[data-auto-tag]'); if (!button) return;
      const tag = button.dataset.autoTag;
      excludedAutoTags.has(tag) ? excludedAutoTags.delete(tag) : excludedAutoTags.add(tag);
      changed();
    });
    form.addEventListener('input', (e) => { if (e.target.name) changed(); });
    form.addEventListener('change', (e) => {
      if (e.target.name === 'procedimientoPrincipal') renderChips();
      if (e.target.name) changed();
    });
    $('#principalSearch').addEventListener('input', renderPrincipal);
    $('#principalOptions').addEventListener('click', (e) => {
      const b = e.target.closest('[data-principal]'); if (!b) return;
      form.elements.procedimientoPrincipal.value = b.dataset.principal;
      principalExpanded = false;
      renderPrincipal(); renderChips(); changed(); $('#changePrincipal').focus();
    });
    $('#principalSelected').addEventListener('click', (e) => {
      if (!e.target.closest('#changePrincipal')) return;
      principalExpanded = !principalExpanded;
      renderPrincipal();
      if (principalExpanded) $('#principalSearch').focus();
      else $('#changePrincipal').focus();
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
