/* ════════ export.js · CSV, respaldo JSON y datos de ejemplo ════════ */
window.BF = window.BF || {};

(function () {
  const { download, todayISO, uuid, esc } = BF.util;
  const C = BF.CONFIG;
  const S = BF.store;

  const COLUMNS = [
    ['codigo', 'Código'], ['fecha', 'Fecha'], ['hora', 'Hora'], ['edad', 'Edad'], ['sexo', 'Sexo'],
    ['lateralidad', 'Lateralidad'], ['imc', 'IMC'], ['institucion', 'Institución'],
    ['diagnostico', 'Diagnóstico'], ['antecedentesRodilla', 'Antecedentes rodilla'],
    ['comorbilidades', 'Comorbilidades'], ['cirujano', 'Cirujano supervisor'], ['rol', 'Mi rol'],
    ['procedimientoPrincipal', 'Procedimiento principal'], ['_asociados', 'Procedimientos asociados'],
    ['injertoLca', 'Tipo de injerto LCA'], ['tecnicaMeniscal', 'Técnica de sutura meniscal'],
    ['abordaje', 'Abordaje'], ['anestesia', 'Anestesia'], ['duracionMin', 'Duración (min)'],
    ['torniquete', 'Torniquete'], ['torniqueteMin', 'Isquemia (min)'], ['hallazgos', 'Hallazgos'],
    ['implantes', 'Implantes'], ['complicacionIntraop', 'Complicación intraop.'],
    ['complicacionIntraopDetalle', 'Detalle complicación intraop.'], ['internacionDias', 'Internación (días)'],
    ['uti', 'UTI'], ['profilaxis', 'Profilaxis'], ['rehabilitacion', 'Rehabilitación'],
    ['complicacionPostop', 'Complicación postop.'], ['complicacionPostopDetalle', 'Detalle complicación postop.'],
    ['complicacionClavienDindo', 'Clavien-Dindo'], ['_controles', 'Controles de seguimiento'],
    ['presentadoEnAteneo', 'Presentado en ateneo'], ['publicable', 'Publicable'],
    ['_tags', 'Etiquetas'], ['notas', 'Notas'], ['creado', 'Creado'], ['actualizado', 'Actualizado']
  ];

  const cell = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    return '"' + String(v).replace(/\r?\n/g, ' / ').replace(/"/g, '""') + '"';
  };

  function toCsv(casos) {
    const head = COLUMNS.map(([, label]) => label).join(';');
    const lines = casos.map((c) => COLUMNS.map(([key]) => {
      if (key === '_asociados') return cell((c.procedimientosAsociados || []).join(' | '));
      if (key === '_tags') return cell((c.tags || []).join(', '));
      if (key === '_controles') return cell((c.seguimiento || []).length);
      return cell(c[key]);
    }).join(';'));
    // BOM + punto y coma: Excel en español lo abre en columnas directamente.
    return '\uFEFF' + [head, ...lines].join('\r\n');
  }

  function exportCsv(casos = S.all()) {
    if (!casos.length) return BF.util.toast('No hay casos para exportar.', 'err');
    download(`bitacora-rodilla-${todayISO()}.csv`, toCsv(casos), 'text/csv;charset=utf-8');
    BF.util.toast(`CSV exportado (${casos.length} caso(s)).`, 'ok');
  }

  function exportJson() {
    const payload = {
      app: C.APP_NAME,
      version: C.DATA_VERSION,
      exportado: new Date().toISOString(),
      casos: S.all(),
      objetivos: S.getObjetivos(), preferencias: { objetivoModo: S.getGoalMode() }
    };
    const draft = BF.util.store.get('draft');
    if (draft?.caso) payload.borrador = draft;
    download(`bitacora-rodilla-${todayISO()}.json`, JSON.stringify(payload, null, 2), 'application/json');
    BF.util.toast(`Respaldo JSON exportado (${S.all().length} caso(s)).`, 'ok');
  }

  function previewImport(parsed) {
    const casos = Array.isArray(parsed) ? parsed : parsed && parsed.casos;
    if (!Array.isArray(casos)) throw new Error('El archivo debe contener una lista de casos.');
    if (casos.some((c) => !c || typeof c !== 'object' || Array.isArray(c) || typeof c.fecha !== 'string' || typeof c.procedimientoPrincipal !== 'string')) throw new Error('Hay casos con un formato inválido. No se modificaron los datos.');
    const ids = casos.map((c) => c.id).filter(Boolean);
    if (new Set(ids).size !== ids.length) throw new Error('El archivo contiene identificadores duplicados.');
    const objetivos = !Array.isArray(parsed) && parsed.objetivos;
    if (objetivos && (typeof objetivos !== 'object' || Array.isArray(objetivos) || Object.entries(objetivos).some(([p, n]) => !p.trim() || !Number.isInteger(n) || n < 1 || n > 999))) throw new Error('Las metas del respaldo no son válidas.');
    const borrador = parsed?.borrador;
    if (borrador && (!borrador.caso || typeof borrador.caso !== 'object' || Array.isArray(borrador.caso))) throw new Error('El borrador del respaldo no es válido.');
    for (const caso of [...casos, ...(borrador ? [borrador.caso] : [])]) {
      if (['tags', 'procedimientosAsociados', 'seguimiento'].some((key) => caso[key] != null && !Array.isArray(caso[key]))) throw new Error('Hay listas de datos con un formato inválido. No se modificaron los datos.');
      if (caso.seguimiento?.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) throw new Error('El seguimiento contiene datos inválidos. No se modificaron los datos.');
    }
    return { casos, objetivos: objetivos ? Object.fromEntries(Object.entries(objetivos)) : null, modo: parsed?.preferencias?.objetivoModo, borrador };
  }

  function applyImport(preview, mode) {
    if (!['merge', 'replace'].includes(mode)) return false;
    const casos = mode === 'merge' ? mergeById(S.all(), preview.casos) : preview.casos.map(S.normalize);
    if (preview.objetivos) S.state.objetivos = mode === 'merge' ? Object.assign({}, S.getObjetivos(), preview.objetivos) : preview.objetivos;
    if (mode === 'replace' && ['todos', 'cirujano'].includes(preview.modo)) S.saveCfg({ objetivoModo: preview.modo });
    S.replaceAll(casos, { reason: 'import', replaceRemote: mode === 'replace' });
    if (S.isConfigured() && S.state.cfg.auto) S.schedulePush();
    return true;
  }

  function importJsonFile(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result);
        const preview = previewImport(parsed);
        const mode = await BF.util.choose({ title: 'Importar respaldo', message: `${file.name}\n${preview.casos.length} casos en el archivo · ${S.all().length} en esta bitácora.\n\nFusionar conserva los casos actuales y combina las versiones por identificador. Reemplazar sustituye todos los casos actuales.${S.isConfigured() ? '\nLos cambios afectarán al repositorio conectado al sincronizar.' : ''}`, choices: [{ label: 'Fusionar', value: 'merge', className: 'btn-primary' }, { label: 'Reemplazar', value: 'replace', className: 'btn-danger' }, { label: 'Cancelar', value: null }] });
        if (mode === null) return;
        if (mode === 'replace') {
          const confirmed = await BF.util.choose({ title: 'Reemplazar la bitácora', message: `Se sustituirán ${S.all().length} casos por los ${preview.casos.length} del archivo. Exporta un respaldo antes de continuar.${S.isConfigured() ? '\nEste cambio también afectará a GitHub al sincronizar.' : ''}`, confirmText: 'REEMPLAZAR', choices: [{ label: 'Reemplazar casos', value: true, className: 'btn-danger' }, { label: 'Cancelar', value: null }] });
          if (confirmed !== true) return;
        }
        applyImport(preview, mode);
        BF.util.toast(`Importación completada: ${S.all().length} caso(s) en este dispositivo.`, 'ok');
        if (preview.borrador && BF.form) {
          const restore = await BF.util.choose({ title: 'Este respaldo incluye un borrador', message: 'Puedes recuperarlo para completar el registro. Los casos ya fueron importados.', choices: [{ label: 'Recuperar borrador', value: true, className: 'btn-primary' }, { label: 'Ahora no', value: null }] });
          if (restore === true) await BF.form.restoreDraft(preview.borrador);
        }
      } catch (e) {
        BF.util.toast('No se pudo importar: ' + (e.message || 'archivo inválido'), 'err', 6000);
      }
    };
    reader.onerror = () => BF.util.toast('No se pudo leer el archivo. No se modificaron los datos.', 'err');
    reader.readAsText(file);
  }

  function mergeById(base, incoming) {
    const map = new Map(base.map((c) => [c.id, c]));
    for (const raw of incoming) {
      const c = S.normalize(raw);
      const prev = map.get(c.id);
      if (!prev || (c.actualizado || '') >= (prev.actualizado || '')) map.set(c.id, c);
    }
    return Array.from(map.values());
  }

  /* ───────── Casos de ejemplo ───────── */

  const DEMO = [
    { d: 330, diag: 'Rotura de LCA rodilla derecha, inestabilidad', proc: 'Reconstrucción de LCA', rol: 'Primer ayudante', lat: 'Derecha', ab: 'Artroscópico', dur: 95, hall: 'Rotura completa del LCA, meniscos indemnes' },
    { d: 300, diag: 'Lesión degenerativa menisco medial', proc: 'Meniscectomía parcial', rol: 'Primer ayudante', lat: 'Izquierda', ab: 'Artroscópico', dur: 45, hall: 'Rotura en asa de balde menisco medial' },
    { d: 265, diag: 'Gonartrosis tricompartimental avanzada', proc: 'Prótesis total de rodilla (PTR)', rol: 'Segundo ayudante', lat: 'Derecha', ab: 'Abierto', dur: 105, hall: 'Desgaste grado IV compartimento medial' },
    { d: 240, diag: 'Rotura meniscal + rotura de LCA', proc: 'Reconstrucción de LCA', rol: 'Primer ayudante', lat: 'Izquierda', ab: 'Artroscópico', dur: 120, hall: 'Rotura meniscal lateral reparada', asoc: ['Reparación meniscal (sutura)'] },
    { d: 210, diag: 'Gonartrosis medial, paciente joven activo', proc: 'Osteotomía tibial alta (HTO)', rol: 'Primer ayudante', lat: 'Derecha', ab: 'Abierto', dur: 90, hall: 'Varus de 8°' },
    { d: 185, diag: 'Luxación recidivante de rótula', proc: 'Estabilización de rótula (MPFL)', rol: 'Primer ayudante', lat: 'Izquierda', ab: 'Artroscópico + mini-abierto', dur: 75, hall: 'Inestabilidad con displasia troclear leve' },
    { d: 160, diag: 'Rotura de LCA en deportista', proc: 'Reconstrucción de LCA', rol: 'Cirujano (supervisado)', lat: 'Derecha', ab: 'Artroscópico', dur: 110, hall: 'Rotura completa, pivot shift +++', cir: 'Dr. Bértoli' },
    { d: 140, diag: 'Artrofibrosis postquirúrgica', proc: 'Artrofibrosis: liberación artroscópica', rol: 'Primer ayudante', lat: 'Derecha', ab: 'Artroscópico', dur: 60, hall: 'Flexión limitada a 70°', compl: true },
    { d: 120, diag: 'Lesión condral femoral medial', proc: 'Microfracturas', rol: 'Primer ayudante', lat: 'Izquierda', ab: 'Artroscópico', dur: 55, hall: 'Lesión ICRS grado III, 2 cm²' },
    { d: 95, diag: 'Gonartrosis unicompartimental medial', proc: 'Prótesis unicompartimental (PUC)', rol: 'Segundo ayudante', lat: 'Derecha', ab: 'Abierto', dur: 80, hall: 'Compartimento lateral conservado' },
    { d: 70, diag: 'Rotura de LCA. Segundo tiempo de rehabilitación', proc: 'Reconstrucción de LCA', rol: 'Cirujano (supervisado)', lat: 'Izquierda', ab: 'Artroscópico', dur: 100, hall: 'Sitio donante: isquiotibiales', cir: 'Dra. Lagos' },
    { d: 45, diag: 'Fractura de meseta tibial lateral', proc: 'Fractura de meseta tibial: osteosíntesis', rol: 'Primer ayudante', lat: 'Derecha', ab: 'Abierto', dur: 130, hall: 'Schatzker II, hundimiento 5 mm' },
    { d: 25, diag: 'Sospecha de infección periprotésica crónica', proc: 'Recambio de espaciador por IPR', rol: 'Segundo ayudante', lat: 'Izquierda', ab: 'Abierto', dur: 115, hall: 'Debris abundante, cultivo pendiente', compl: true, clav: 'IIIb' },
    { d: 10, diag: 'Rotura de LCA con lesión meniscal medial', proc: 'Reconstrucción de LCA', rol: 'Cirujano (independiente)', lat: 'Derecha', ab: 'Artroscópico', dur: 105, hall: 'Rotura completa, menisco medial suturado', asoc: ['Reparación meniscal (sutura)'] }
  ];

  const shift = (iso, days) => new Date(new Date(iso).getTime() + days * 864e5).toISOString().slice(0, 10);

  function demoCases() {
    const base = Date.now();
    return DEMO.map((t, i) => {
      const fecha = new Date(base - t.d * 864e5).toISOString().slice(0, 10);
      const fups = i % 3 === 0 ? [
        { fecha: shift(fecha, 30), eva: i % 2 ? 3 : 2, flexion: 110, extension: 0, score: 72, notas: 'Buena evolución, continúa kinesiología' },
        { fecha: shift(fecha, 90), eva: 1, flexion: 130, extension: -2, score: 88, notas: 'Retorno deportivo progresivo' }
      ] : [];
      return {
        id: uuid(),
        codigo: `CIR-${String(i + 1).padStart(4, '0')}`,
        fecha, hora: ['08:00', '10:30', '14:00'][i % 3],
        edad: 22 + (i * 7) % 45,
        sexo: i % 3 === 0 ? 'Femenino' : 'Masculino',
        lateralidad: t.lat,
        imc: Math.round((22 + (i % 8)) * 10) / 10,
        institucion: ['Hospital Universitario', 'Clínica de la Ciudad', 'Sanatorio Norte'][i % 3],
        diagnostico: t.diag,
        antecedentesRodilla: i % 4 === 0 ? 'Cirugía previa hace 3 años' : '',
        comorbilidades: i % 5 === 0 ? 'HTA en tratamiento' : '',
        cirujano: t.cir || ['Dr. Bértoli', 'Dra. Lagos', 'Dr. Miranda'][i % 3],
        rol: t.rol,
        procedimientoPrincipal: t.proc,
        procedimientosAsociados: t.asoc || [],
        abordaje: t.ab,
        anestesia: t.ab === 'Abierto' ? 'Raquídea' : 'General + bloqueo',
        duracionMin: t.dur,
        torniquete: t.ab !== 'Artroscópico',
        torniqueteMin: t.ab === 'Abierto' ? Math.round(t.dur * 0.7) : null,
        hallazgos: t.hall,
        implantes: t.proc.includes('Prótesis') || t.proc.includes('Recambio') ? 'Implante cementado, cromo-cobalto / polietileno' : (t.proc.includes('LCA') ? 'Autoinjerto isquiotibiales, tornillos interferenciales' : ''),
        complicacionIntraop: false,
        complicacionIntraopDetalle: '',
        internacionDias: t.ab === 'Abierto' ? 2 + (i % 2) : 0,
        uti: false,
        profilaxis: t.ab === 'Abierto' ? 'Enoxaparina 40 mg/día 28 días' : 'Enoxaparina 40 mg/día 14 días',
        rehabilitacion: 'Carga progresiva según protocolo del servicio',
        complicacionPostop: !!t.compl,
        complicacionPostopDetalle: t.compl ? 'Movilización bajo anestesia al mes / cultivos positivos' : '',
        complicacionClavienDindo: t.clav || (t.compl ? 'I' : ''),
        seguimiento: fups,
        presentadoEnAteneo: i % 6 === 0,
        publicable: i % 5 === 0,
        tags: [t.proc.split(' ')[0], i % 4 === 0 ? 'interesante' : ''].filter(Boolean),
        notas: i % 3 === 0 ? 'Caso útil para revisar técnica de tunelización.' : ''
      };
    });
  }

  function loadDemo() {
    window.open(location.pathname + '?demo=1#dashboard', '_blank', 'noopener');
  }

  BF.exporter = { toCsv, exportCsv, exportJson, importJsonFile, previewImport, applyImport, demoCases, loadDemo };
})();
