/* ════════ config.js · catálogos clínicos y constantes ════════ */
window.BF = window.BF || {};

BF.CONFIG = {
  APP_NAME: 'Bitácora Fellow · Rodilla',
  DATA_VERSION: 2,
  DEFAULT_BRANCH: 'main',
  DEFAULT_PATH: 'data/bitacora.json',
  LS_PREFIX: 'bf.',
  AUTO_PUSH_DEBOUNCE: 1500,
  isMultiligamentaryDiagnosis(diagnosis) {
    return /multiligament|luxacion de (?:la )?rodilla/i.test(String(diagnosis || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  },
  procedureDetailsFor(procedures) {
    return {
      injertoLca: procedures.some((p) => /reconstrucción de LCA|tibial alta \+ LCA/i.test(p)),
      tecnicaMeniscal: procedures.includes('Reparación meniscal (sutura)'),
      osteotomiaTibial: procedures.some((p) => /^Osteotomía tibial alta/i.test(p)),
      osteotomiaFemoral: procedures.includes('Osteotomía femoral distal (DFO)')
    };
  },

  /* Rol del fellow durante la cirugía (de menor a mayor participación) */
  ROLES: [
    'Observador',
    'Segundo ayudante',
    'Primer ayudante',
    'Cirujano (supervisado)',
    'Cirujano (independiente)'
  ],

  ABORDAJES: ['Artroscópico', 'Artroscópico + mini-abierto', 'Abierto', 'Percutáneo', 'Mixto'],

  ANESTESIAS: [
    'Raquídea',
    'General',
    'General + bloqueo',
    'Regional (bloqueo)',
    'Local + sedación',
    'Otra'
  ],

  OSTEOTOMIA_TIPOS: ['Apertura', 'Cierre'],
  OSTEOTOMIA_LADOS: ['Medial', 'Lateral'],
  SCHATZKER: ['I', 'II', 'III', 'IV', 'V', 'VI'],
  SCHENCK: ['KD I', 'KD II', 'KD III-M', 'KD III-L', 'KD IV', 'KD V'],
  PATRONES_MENISCALES: ['Radial', 'Longitudinal', 'Horizontal', 'Asa de balde', 'Compleja', 'Otra'],
  DIAGNOSTICOS: {
    'Fracturas': ['Fractura de platillo tibial', 'Fractura de fémur distal', 'Fractura de rótula', 'Fractura de espinas tibiales', 'Fractura periprotésica', 'Otra fractura de rodilla'],
    'Menisco': ['Menisco lateral discoide', 'Déficit meniscal posmeniscectomía', 'Lesión de menisco medial', 'Lesión de menisco lateral', 'Lesión de raíz meniscal', 'Lesión de rampa meniscal', 'Quiste parameniscal'],
    'Ligamentos': ['Falla de plastia de LCA', 'Lesión de LCA', 'Lesión de LCP', 'Lesión de LCM', 'Lesión de LCL', 'Lesión de esquina posteromedial', 'Lesión de esquina posterolateral', 'Lesión multiligamentaria', 'Luxación de rodilla'],
    'Patelofemoral': ['Inestabilidad patelofemoral', 'Luxación de rótula', 'Lesión del ligamento patelofemoral medial', 'Displasia troclear'],
    'Aparato extensor': ['Rotura de tendón patelar', 'Rotura de tendón rotuliano', 'Rotura de tendón cuadricipital', 'Falla de reparación de tendón patelar', 'Falla de reparación de tendón cuadricipital', 'Insuficiencia del aparato extensor'],
    'Revisión protésica': ['Infección periprotésica', 'Aflojamiento aséptico de prótesis', 'Inestabilidad protésica', 'Desgaste de polietileno', 'Osteólisis periprotésica', 'Rigidez tras artroplastia', 'Otro motivo de revisión protésica'],
    'Artrosis': ['Gonartrosis', 'Artrosis femorotibial medial', 'Artrosis femorotibial lateral', 'Artrosis patelofemoral'],
    'Cartílago': ['Lesión condral', 'Lesión osteocondral', 'Osteocondritis disecante'],
    'Infección': ['Artritis séptica de rodilla', 'Infección periprotésica', 'Infección de sitio quirúrgico'],
    'Otros': ['Lesión de cíclope', 'Artrofibrosis', 'Cuerpo libre intraarticular', 'Sinovitis', 'Rotura de tendón rotuliano', 'Rotura de tendón cuadricipital']
  },
  SEXOS: ['Femenino', 'Masculino', 'Otro'],
  LATERALIDADES: ['Derecha', 'Izquierda', 'Bilateral'],
  CLAVIEN: ['', 'I', 'II', 'IIIa', 'IIIb', 'IVa', 'IVb', 'V'],

  /* Procedimientos de rodilla agrupados por área */
  PROCEDIMIENTOS: [
    // Artroscopia y meniscos
    'Artroscopia diagnóstica',
    'Meniscoplastia / tallado meniscal (saucerización)',
    'Reinserción de raíz meniscal',
    'Meniscectomía parcial',
    'Meniscectomía subtotal/total',
    'Reparación meniscal (sutura)',
    'Menisco: regularización por artroscopia',
    'Trasplante meniscal',
    'Quiste meniscal / parameniscal',
    // Ligamentos
    'Reconstrucción de LCA',
    'Revisión de reconstrucción de LCA',
    'Injerto óseo de túneles',
    'Reconstrucción de LCP',
    'Reconstrucción multiligamentaria',
    'Reparación / reconstrucción de LCM',
    'Reconstrucción de LCL',
    'Reconstrucción de esquina posterolateral (EPL)',
    'Reconstrucción de esquina posteromedial (EPM)',
    'Luxación de rodilla: reducción y estabilización',
    'Tenodesis extraarticular lateral (LET)',
    // Rótula / patelofemoral
    'Reconstrucción del ligamento patelofemoral medial (RLPFM / MPFL)',
    'Trocleoplastia',
    'Osteotomía de tuberosidad tibial (Fulkerson / Elmslie)',
    'Luxación patelar: liberación lateral',
    'Artroplastia patelofemoral',
    // Artroplastia
    'Prótesis total de rodilla (PTR)',
    'Prótesis unicompartimental (PUC)',
    'Prótesis total con navegación/robótica',
    'Prótesis de revisión',
    'Prótesis tumoral',
    'Recambio protésico de 1 componente',
    'Recambio protésico de 2 componentes',
    'Desbridamiento y retención de implantes (DAIR)',
    'Retiro de prótesis y colocación de espaciador',
    'Reimplantación protésica',
    'Artrodesis de rodilla',
    // Osteotomías
    'Osteotomía tibial alta (HTO)',
    'Osteotomía femoral distal (DFO)',
    'Osteotomía tibial alta + LCA',
    // Cartílago
    'Condroplastia / regularización',
    'Reinserción condral',
    'Fijación de fragmento osteocondral',
    'Perforaciones por osteocondritis disecante',
    'Microfracturas',
    'Mosaicoplastia / OATS',
    'Implante de condrocitos (ACI/MACI)',
    'Aloinjerto osteocondral',
    'Implante de matriz de colágeno',
    // Fracturas
    'Fractura Fémur Distal',
    'Reducción',
    'Osteosíntesis',
    'Reducción y osteosíntesis',
    'Fractura Periprotésica',
    'Fractura Platillos Tibiales',
    'Fractura de Rótula',
    'Fractura Avulsiva Espinas Tibiales LCA / LCP',
    'Fractura de tibia proximal: osteosíntesis',
    'Politrauma de rodilla',
    'Retiro de material de osteosíntesis',
    // Aparato extensor
    'Reparación / reinserción de tendón patelar',
    'Reparación / reinserción de tendón cuadricipital',
    'Revisión de reparación de tendón patelar',
    'Revisión de reparación de tendón cuadricipital',
    'Reconstrucción de tendón patelar',
    'Reconstrucción de tendón cuadricipital',
    'Reconstrucción del aparato extensor',
    'Refuerzo / aumentación de reparación tendinosa',
    'Tendón cuadricipital o rotuliano: reparación',
    'Transferencia/avance de tendón',
    // Sinovial, infección y otros
    'Sinovectomía (artroscópica/abierta)',
    'Toilette articular por infección',
    'Aseo quirúrgico',
    'Cambio de VAC',
    'Recambio de espaciador por IPR',
    'Resección de lesión de cíclope',
    'Movilización bajo anestesia',
    'Artrofibrosis: liberación artroscópica',
    'Plicae sinovial / banda de Lannelongue',
    'Cuerpo libre intraarticular',
    'Bursectomía / quiste de Baker',
    'Biopsia articular / lesión tumoral',
    'Artrodesis / fijador externo',
    'Infiltración / procedimiento menor',
    'Otro (especificar en notas)'
  ],

  PROCEDIMIENTOS_SOLO_ADICIONALES: ['Cambio de VAC'],

  /* Campos del control evolutivo (se repiten en cada fila del repeater) */
  FOLLOWUP_FIELDS: [
    { key: 'fecha',     label: 'Fecha',       type: 'date',   cls: 'fup-date' },
    { key: 'eva',       label: 'EVA',         type: 'number', min: 0, max: 10 },
    { key: 'flexion',   label: 'Flexión °',   type: 'number', min: 0, max: 160 },
    { key: 'extension', label: 'Extensión °', type: 'number', min: -30, max: 30 },
    { key: 'score',     label: 'Score',       type: 'number', min: 0, max: 100 },
    { key: 'notas',     label: 'Notas',       type: 'text',   cls: 'fup-notas' }
  ],

  /* Metas de progresión sugeridas para arrancar (se editan desde el dashboard) */
  DEFAULT_OBJETIVOS: {
    'Artroscopia diagnóstica': 50,
    'Meniscectomía parcial': 40,
    'Reconstrucción de LCA': 30,
    'Reparación meniscal (sutura)': 20,
    'Prótesis total de rodilla (PTR)': 20,
    'Fractura Platillos Tibiales': 10
  }
};

/* Catálogo principal; los adicionales siguen disponibles para asociar y contar. */
BF.CONFIG.PROCEDIMIENTOS_PRINCIPALES = BF.CONFIG.PROCEDIMIENTOS.filter((p) => !BF.CONFIG.PROCEDIMIENTOS_SOLO_ADICIONALES.includes(p));

/* Roles en los que el fellow actúa como cirujano */
BF.CONFIG.ROLES_CIRUJANO = ['Cirujano (supervisado)', 'Cirujano (independiente)'];

/* Compatibilidad de nombres anteriores del catálogo. */
BF.CONFIG.PROCEDIMIENTO_ALIAS = {
  'Estabilización de rótula (MPFL)': 'Reconstrucción del ligamento patelofemoral medial (RLPFM / MPFL)',
  'Reconstrucción de esquina posterolateral': 'Reconstrucción de esquina posterolateral (EPL)',
  'Laxitud multiligamentaria: tenodesis': 'Tenodesis extraarticular lateral (LET)',
  'Fractura de meseta tibial: osteosíntesis': 'Fractura Platillos Tibiales',
  'Fractura de cóndilo femoral: osteosíntesis': 'Fractura Fémur Distal',
  'Fractura supracondílea femoral: osteosíntesis': 'Fractura Fémur Distal',
  'Fractura de rótula: osteosíntesis': 'Fractura de Rótula'
};
BF.CONFIG.procedureName = (name) => BF.CONFIG.PROCEDIMIENTO_ALIAS[name] || name;
BF.CONFIG.procedureArea = (name) => {
  const p = BF.CONFIG.procedureName(name);
  const index = BF.CONFIG.PROCEDIMIENTOS.indexOf(p);
  if (index < 0) return 'Otros';
  const boundaries = [
    ['Artroscopia diagnóstica', 'Menisco'], ['Reconstrucción de LCA', 'Ligamentos'],
    ['Reconstrucción del ligamento patelofemoral medial (RLPFM / MPFL)', 'Patelofemoral'], ['Prótesis total de rodilla (PTR)', 'Artroplastia'],
    ['Osteotomía tibial alta (HTO)', 'Osteotomías'], ['Condroplastia / regularización', 'Cartílago'],
    ['Fractura Fémur Distal', 'Fracturas'], ['Reparación / reinserción de tendón patelar', 'Aparato extensor'],
    ['Sinovectomía (artroscópica/abierta)', 'Otros']
  ];
  return boundaries.reverse().find(([first]) => index >= BF.CONFIG.PROCEDIMIENTOS.indexOf(first))[1];
};
BF.CONFIG.procedureObjectives = (objectives) => {
  const normalized = {};
  for (const [name, goal] of Object.entries(objectives)) {
    const canonical = BF.CONFIG.procedureName(name);
    normalized[canonical] = Math.max(normalized[canonical] || 0, goal);
  }
  return normalized;
};

/* El catálogo ayuda a registrar; no deduce clasificaciones clínicas. */
BF.CONFIG.diagnosisKey = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
BF.CONFIG.diagnosisEntry = (value, preferredGroup = '') => {
  const key = BF.CONFIG.diagnosisKey(value);
  const preferred = BF.CONFIG.DIAGNOSTICOS[preferredGroup];
  const preferredType = Array.isArray(preferred) ? preferred.find((name) => BF.CONFIG.diagnosisKey(name) === key) : null;
  if (preferredType) return { diagnosticoGrupo: preferredGroup, diagnosticoTipo: preferredType };
  for (const [grupo, names] of Object.entries(BF.CONFIG.DIAGNOSTICOS)) {
    const tipo = names.find((name) => BF.CONFIG.diagnosisKey(name) === key);
    if (tipo) return { diagnosticoGrupo: grupo, diagnosticoTipo: tipo };
  }
  return null;
};
BF.CONFIG.isTibialPlateauDiagnosis = (value) => {
  const text = BF.CONFIG.diagnosisKey(value);
  return /\bfractura\b/.test(text) && /\b(?:platillos?|mesetas?)\b/.test(text) && /\btibia(?:l|les)?\b/.test(text);
};
BF.CONFIG.diagnosisFields = (c) => {
  const group = String(c.diagnosticoGrupo || '');
  const type = String(c.diagnosticoTipo || '');
  const diagnosis = BF.CONFIG.diagnosisKey(c.diagnostico);
  const base = BF.CONFIG.diagnosisKey(type);
  const options = BF.CONFIG.DIAGNOSTICOS[group];
  const selected = Array.isArray(options) && options.includes(type) &&
    (diagnosis === base || (diagnosis.startsWith(base) && /^[\s,;:.(\/-]/.test(diagnosis.slice(base.length))));
  return {
    diagnosticoGrupo: selected ? group : '',
    diagnosticoTipo: selected ? type : '',
    clasificacionSchatzker: BF.CONFIG.isTibialPlateauDiagnosis(c.diagnostico) && BF.CONFIG.SCHATZKER.includes(c.clasificacionSchatzker) ? c.clasificacionSchatzker : ''
  };
};

BF.CONFIG.optionalBoolean = (value) => value === true || value === 'true' ? true : value === false || value === 'false' ? false : null;
BF.CONFIG.isMeniscalDiagnosis = (name) => /menisc/i.test(name);
BF.CONFIG.isChondralDiagnosis = (name) => /condral|osteocondr|cartilag/i.test(BF.CONFIG.diagnosisKey(name));
/* Un caso antiguo sigue siendo un diagnóstico: nunca se separa texto clínico automáticamente. */
BF.CONFIG.caseDiagnoses = (c = {}) => {
  const legacy = { id: 'legacy', nombre: c.diagnostico, grupo: c.diagnosticoGrupo, tipo: c.diagnosticoTipo,
    clasificacionSchatzker: c.clasificacionSchatzker, clasificacionMultiligamentaria: c.clasificacionMultiligamentaria,
    patronMultiligamentario: c.patronMultiligamentario };
  const source = Array.isArray(c.diagnosticos) ? c.diagnosticos : c.diagnostico ? [legacy] : [];
  const ids = new Set();
  return source.filter((d) => d && typeof d === 'object' && typeof d.nombre === 'string' && d.nombre.trim()).map((d, i) => {
    let id = String(d.id || 'dx-' + i);
    if (ids.has(id)) id = 'dx-' + i;
    while (ids.has(id)) id += '-';
    ids.add(id);
    const nombre = d.nombre.trim(), detalle = String(d.detalle || '').trim();
    const full = nombre + ' ' + detalle;
    const metadata = BF.CONFIG.diagnosisFields({ diagnostico: nombre, diagnosticoGrupo: d.grupo, diagnosticoTipo: d.tipo, clasificacionSchatzker: d.clasificacionSchatzker });
    const multi = BF.CONFIG.isMultiligamentaryDiagnosis(full);
    return { id, nombre, grupo: metadata.diagnosticoGrupo, tipo: metadata.diagnosticoTipo, detalle,
      patronMeniscal: BF.CONFIG.isMeniscalDiagnosis(nombre) && BF.CONFIG.PATRONES_MENISCALES.includes(d.patronMeniscal) ? d.patronMeniscal : '',
      condralReinsertable: BF.CONFIG.isChondralDiagnosis(nombre) ? BF.CONFIG.optionalBoolean(d.condralReinsertable) : null,
      clasificacionSchatzker: BF.CONFIG.isTibialPlateauDiagnosis(full) && BF.CONFIG.SCHATZKER.includes(d.clasificacionSchatzker) ? d.clasificacionSchatzker : '',
      clasificacionMultiligamentaria: multi && BF.CONFIG.SCHENCK.includes(d.clasificacionMultiligamentaria) ? d.clasificacionMultiligamentaria : '',
      patronMultiligamentario: multi ? String(d.patronMultiligamentario || '') : '' };
  });
};
BF.CONFIG.diagnosisDescription = (d, classifications = true) => [d.nombre, d.patronMeniscal,
  d.condralReinsertable === true ? 'Reinsertable' : d.condralReinsertable === false ? 'No reinsertable' : '', d.detalle,
  classifications && d.clasificacionSchatzker ? 'Schatzker ' + d.clasificacionSchatzker : '',
  classifications && d.clasificacionMultiligamentaria ? 'Schenck ' + d.clasificacionMultiligamentaria : '',
  classifications ? d.patronMultiligamentario : ''].filter(Boolean).join(' · ');
BF.CONFIG.withDiagnoses = (c) => {
  const list = BF.CONFIG.caseDiagnoses(c), first = list[0];
  return { ...c, diagnosticos: list, diagnostico: list.map((d) => BF.CONFIG.diagnosisDescription(d, false)).join(' + '),
    diagnosticoGrupo: first?.grupo || '', diagnosticoTipo: first?.tipo || '',
    clasificacionSchatzker: list.find((d) => d.clasificacionSchatzker)?.clasificacionSchatzker || '',
    clasificacionMultiligamentaria: list.find((d) => d.clasificacionMultiligamentaria)?.clasificacionMultiligamentaria || '',
    patronMultiligamentario: list.find((d) => d.patronMultiligamentario)?.patronMultiligamentario || '' };
};
BF.CONFIG.procedureShortName = (name) => ({ 'Reconstrucción de LCA': 'RLCA', 'Reconstrucción de LCP': 'RLCP',
  'Reconstrucción del ligamento patelofemoral medial (RLPFM / MPFL)': 'RLPFM', 'Reconstrucción de esquina posteromedial (EPM)': 'EPM',
  'Reconstrucción de esquina posterolateral (EPL)': 'EPL', 'Prótesis total de rodilla (PTR)': 'PTR',
  'Reparación meniscal (sutura)': 'Sutura meniscal' })[BF.CONFIG.procedureName(name)] || name;
BF.CONFIG.procedureMatches = (name, query) => BF.CONFIG.diagnosisKey(name + ' ' + BF.CONFIG.procedureShortName(name)).includes(BF.CONFIG.diagnosisKey(query));
BF.CONFIG.procedureSummary = (c) => {
  const list = [...new Set([c.procedimientoPrincipal, ...(c.procedimientosAsociados || [])].filter(Boolean).map(BF.CONFIG.procedureName))];
  return list.length > 1 ? list.map(BF.CONFIG.procedureShortName).join(' + ') : list[0] || 'Procedimiento sin registrar';
};

BF.CONFIG.personalStepsFor = (c) => {
  const procedures = [c.procedimientoPrincipal, ...(c.procedimientosAsociados || [])].filter(Boolean).map(BF.CONFIG.procedureName);
  if (!procedures.length) return [];
  const text = procedures.join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const steps = ['Cx completa', 'Abordaje'];
  const arthroscopic = /artroscop/.test(String(c.abordaje || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()) || /artroscop/.test(text);
  const acl = BF.CONFIG.procedureDetailsFor(procedures).injertoLca;
  const diagnosis = String(c.diagnostico || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const cartilage = procedures.some((p) => BF.CONFIG.procedureArea(p) === 'Cartílago') || /condral|condropat|cartilag/.test(diagnosis);
  if (arthroscopic) steps.push('Artroscopia diagnóstica');
  if (acl) steps.push('Desbridamiento del remanente de LCA', 'Preparación de la escotadura');
  if (cartilage) steps.push('Desbridamiento condral');
  if (arthroscopic && !acl && !cartilage) steps.push('Desbridamiento artroscópico');
  if (/meniscectomia/.test(text)) steps.push('Meniscectomía');
  if (/reparacion meniscal/.test(text)) steps.push('Sutura meniscal');
  if (/reconstruccion/.test(text)) steps.push('Preparación del injerto', 'Preparación de túneles', 'Fijación del injerto');
  if (/\blet\b/.test(text)) steps.push('Tenodesis extraarticular lateral (LET)');
  if (/fractura|luxacion|reduccion/.test(text)) steps.push('Reducción');
  if (/fractura|osteosintesis/.test(text)) steps.push('Osteosíntesis');
  if (/protesis|recambio|artroplastia/.test(text)) steps.push('Preparación ósea', 'Colocación de componentes');
  if (/osteotomia/.test(text)) steps.push('Osteotomía', 'Fijación');
  if (/condroplastia/.test(text)) steps.push('Condroplastia');
  if (/microfracturas/.test(text)) steps.push('Microfracturas');
  return [...new Set([...steps, 'Cierre'])];
};

/* Etiquetas basadas exclusivamente en los datos registrados. */
BF.CONFIG.suggestTags = (c) => {
  const procedures = [c.procedimientoPrincipal, ...(c.procedimientosAsociados || [])].filter(Boolean).map(BF.CONFIG.procedureName);
  const text = procedures.join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const tags = [];
  const add = (tag) => { if (!tags.includes(tag)) tags.push(tag); };
  procedures.forEach((p) => { const area = BF.CONFIG.procedureArea(p); if (area !== 'Otros') add(area); });
  if (/\blca\b/.test(text)) add('LCA');
  if (/\blcp\b/.test(text)) add('LCP');
  if (/\blet\b/.test(text)) add('LET');
  if (/\brlpfm\b|\bmpfl\b/.test(text)) add('RLPFM');
  if (/\bepm\b/.test(text)) add('EPM');
  if (/\bepl\b/.test(text)) add('EPL');
  if (/revision|recambio/.test(text)) add('Revisión');
  if (/reparacion meniscal/.test(text)) add('Sutura meniscal');
  if (BF.CONFIG.isMultiligamentaryDiagnosis(c.diagnostico) || /multiligament/.test(text)) add('Multiligamentaria');
  const details = BF.CONFIG.procedureDetailsFor(procedures);
  if (details.injertoLca && c.injertoLca) add(`Injerto: ${c.injertoLca}`);
  if (details.tecnicaMeniscal && c.tecnicaMeniscal) add(`Técnica meniscal: ${c.tecnicaMeniscal}`);
  for (const d of BF.CONFIG.caseDiagnoses(c)) {
    if (d.grupo) add(d.grupo);
    if (d.tipo) add(d.tipo);
    if (d.patronMeniscal) add(`${d.tipo || d.nombre} · ${d.patronMeniscal}`);
    if (d.condralReinsertable != null) add(`${d.tipo || d.nombre} · ${d.condralReinsertable ? 'Reinsertable' : 'No reinsertable'}`);
    if (d.clasificacionSchatzker) add(`Schatzker ${d.clasificacionSchatzker}`);
    if (d.clasificacionMultiligamentaria) add(`Schenck ${d.clasificacionMultiligamentaria}`);
  }
  if (tags.includes('LCA') && tags.includes('Sutura meniscal')) add('LCA + sutura meniscal');
  if (tags.includes('LCA') && tags.includes('LET')) add('LCA + LET');
  return tags;
};
BF.CONFIG.withAutoTags = (c) => {
  const key = (s) => String(s).trim().toLocaleLowerCase();
  const previous = new Set((c.autoTags || []).map(key));
  const manual = Array.isArray(c.manualTags) ? c.manualTags : (c.tags || []).filter((t) => !previous.has(key(t)));
  const excluded = new Set((c.excludedAutoTags || []).map(key));
  const autoTags = BF.CONFIG.suggestTags(c).filter((t) => !excluded.has(key(t)));
  const seen = new Set();
  const tags = [...manual, ...autoTags].filter((t) => { const k = key(t); if (!k || seen.has(k)) return false; seen.add(k); return true; });
  return { ...c, tags, autoTags, manualTags: manual };
};

/* Alias cortos, por comodidad al leer el código */
BF.ROLES = BF.CONFIG.ROLES;
BF.ROLES_CIRUJANO = BF.CONFIG.ROLES_CIRUJANO;
BF.ABORDAJES = BF.CONFIG.ABORDAJES;
BF.ANESTESIAS = BF.CONFIG.ANESTESIAS;
BF.PROCEDIMIENTOS = BF.CONFIG.PROCEDIMIENTOS;
BF.FOLLOWUP_FIELDS = BF.CONFIG.FOLLOWUP_FIELDS;
BF.CLAVIEN = BF.CONFIG.CLAVIEN;
