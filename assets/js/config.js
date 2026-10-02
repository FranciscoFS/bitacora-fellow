/* ════════ config.js · catálogos clínicos y constantes ════════ */
window.BF = window.BF || {};

BF.CONFIG = {
  APP_NAME: 'Bitácora Fellow · Rodilla',
  DATA_VERSION: 1,
  DEFAULT_BRANCH: 'main',
  DEFAULT_PATH: 'data/bitacora.json',
  LS_PREFIX: 'bf.',
  AUTO_PUSH_DEBOUNCE: 1500,
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
    'Laxitud multiligamentaria: tenodesis',
    // Rótula / patelofemoral
    'Estabilización de rótula (MPFL)',
    'Trocleoplastia',
    'Osteotomía de tuberosidad tibial (Fulkerson / Elmslie)',
    'Luxación patelar: liberación lateral',
    'Artroplastia patelofemoral',
    'Fractura de rótula: osteosíntesis',
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
    'Fractura de meseta tibial: osteosíntesis',
    'Fractura de cóndilo femoral: osteosíntesis',
    'Fractura supracondílea femoral: osteosíntesis',
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
    'Fractura de meseta tibial: osteosíntesis': 10
  }
};

/* Roles en los que el fellow actúa como cirujano */
BF.CONFIG.ROLES_CIRUJANO = ['Cirujano (supervisado)', 'Cirujano (independiente)'];

/* Alias cortos, por comodidad al leer el código */
BF.ROLES = BF.CONFIG.ROLES;
BF.ROLES_CIRUJANO = BF.CONFIG.ROLES_CIRUJANO;
BF.ABORDAJES = BF.CONFIG.ABORDAJES;
BF.ANESTESIAS = BF.CONFIG.ANESTESIAS;
BF.PROCEDIMIENTOS = BF.CONFIG.PROCEDIMIENTOS;
BF.FOLLOWUP_FIELDS = BF.CONFIG.FOLLOWUP_FIELDS;
BF.CLAVIEN = BF.CONFIG.CLAVIEN;
