/* ════════ config.js · catálogos clínicos y constantes ════════ */
window.BF = window.BF || {};

BF.CONFIG = {
  APP_NAME: 'Bitácora Fellow · Rodilla',
  DATA_VERSION: 1,
  DEFAULT_BRANCH: 'main',
  DEFAULT_PATH: 'data/bitacora.json',
  LS_PREFIX: 'bf.',
  AUTO_PUSH_DEBOUNCE: 1500,
  isMultiligamentaryDiagnosis(diagnosis) {
    return /multiligament/i.test(String(diagnosis || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  },
  procedureDetailsFor(procedures) {
    return {
      injertoLca: procedures.some((p) => /reconstrucción de LCA|tibial alta \+ LCA/i.test(p)),
      tecnicaMeniscal: procedures.includes('Reparación meniscal (sutura)')
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

  SEXOS: ['Femenino', 'Masculino', 'Otro'],
  LATERALIDADES: ['Derecha', 'Izquierda', 'Bilateral'],
  CLAVIEN: ['', 'I', 'II', 'IIIa', 'IIIb', 'IVa', 'IVb', 'V'],

  /* Procedimientos de rodilla agrupados por área */
  PROCEDIMIENTOS: [
    // Artroscopia y meniscos
    'Artroscopia diagnóstica',
    'Meniscectomía parcial',
    'Meniscectomía subtotal/total',
    'Reparación meniscal (sutura)',
    'Menisco: regularización por artroscopia',
    'Trasplante meniscal',
    'Quiste meniscal / parameniscal',
    // Ligamentos
    'Reconstrucción de LCA',
    'Revisión de reconstrucción de LCA',
    'Reconstrucción de LCP',
    'Reconstrucción multiligamentaria',
    'Reparación / reconstrucción de LCM',
    'Reconstrucción de LCL',
    'Reconstrucción de esquina posterolateral',
    'Luxación de rodilla: reducción y estabilización',
    'Tenodesis extraarticular lateral (LET)',
    // Rótula / patelofemoral
    'Estabilización de rótula (MPFL)',
    'Trocleoplastia',
    'Osteotomía de tuberosidad tibial (Fulkerson / Elmslie)',
    'Luxación patelar: liberación lateral',
    'Artroplastia patelofemoral',
    // Artroplastia
    'Prótesis total de rodilla (PTR)',
    'Prótesis unicompartimental (PUC)',
    'Prótesis total con navegación/robótica',
    'Recambio protésico de 1 componente',
    'Recambio protésico de 2 componentes',
    'Artrodesis de rodilla',
    // Osteotomías
    'Osteotomía tibial alta (HTO)',
    'Osteotomía femoral distal (DFO)',
    'Osteotomía tibial alta + LCA',
    // Cartílago
    'Condroplastia / regularización',
    'Microfracturas',
    'Mosaicoplastia / OATS',
    'Implante de condrocitos (ACI/MACI)',
    'Aloinjerto osteocondral',
    'Implante de matriz de colágeno',
    // Trauma
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
    // Sinovial, infección y otros
    'Sinovectomía (artroscópica/abierta)',
    'Toilette articular por infección',
    'Recambio de espaciador por IPR',
    'Artrofibrosis: liberación artroscópica',
    'Plicae sinovial / banda de Lannelongue',
    'Cuerpo libre intraarticular',
    'Bursectomía / quiste de Baker',
    'Tendón cuadricipital o rotuliano: reparación',
    'Transferencia/avance de tendón',
    'Biopsia articular / lesión tumoral',
    'Artrodesis / fijador externo',
    'Infiltración / procedimiento menor',
    'Otro (especificar en notas)'
  ],

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

/* Roles en los que el fellow actúa como cirujano */
BF.CONFIG.ROLES_CIRUJANO = ['Cirujano (supervisado)', 'Cirujano (independiente)'];

/* Compatibilidad de nombres anteriores del catálogo. */
BF.CONFIG.PROCEDIMIENTO_ALIAS = {
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
    ['Estabilización de rótula (MPFL)', 'Patelofemoral'], ['Prótesis total de rodilla (PTR)', 'Artroplastia'],
    ['Osteotomía tibial alta (HTO)', 'Osteotomías'], ['Condroplastia / regularización', 'Cartílago'],
    ['Fractura Fémur Distal', 'Trauma'], ['Sinovectomía (artroscópica/abierta)', 'Otros']
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

BF.CONFIG.personalStepsFor = (c) => {
  const procedures = [c.procedimientoPrincipal, ...(c.procedimientosAsociados || [])].filter(Boolean).map(BF.CONFIG.procedureName);
  if (!procedures.length) return [];
  const text = procedures.join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const steps = ['Abordaje'];
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
  if (/revision|recambio/.test(text)) add('Revisión');
  if (/reparacion meniscal/.test(text)) add('Sutura meniscal');
  if (BF.CONFIG.isMultiligamentaryDiagnosis(c.diagnostico) || /multiligament/.test(text)) add('Multiligamentaria');
  const details = BF.CONFIG.procedureDetailsFor(procedures);
  if (details.injertoLca && c.injertoLca) add(`Injerto: ${c.injertoLca}`);
  if (details.tecnicaMeniscal && c.tecnicaMeniscal) add(`Técnica meniscal: ${c.tecnicaMeniscal}`);
  if (BF.CONFIG.isMultiligamentaryDiagnosis(c.diagnostico) && c.clasificacionMultiligamentaria) add(`Schenck ${c.clasificacionMultiligamentaria}`);
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
