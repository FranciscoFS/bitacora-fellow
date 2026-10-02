const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
process.env.TZ = 'America/Santiago';

function app({ choices = [], storageFails = false } = {}) {
  const values = new Map(), tasks = [], downloads = [], messages = [];
  const context = vm.createContext({
    console, crypto: webcrypto, Date, setTimeout, clearTimeout, Map, Set,
    document: { querySelector: () => null },
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { if (storageFails) throw new Error('Quota exceeded'); values.set(key, value); },
      removeItem: (key) => values.delete(key)
    },
    FileReader: class {
      readAsText(file) { this.result = file.content; tasks.push(this.onload()); }
    }
  });
  context.window = context;
  for (const file of ['config', 'util', 'store']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', `${file}.js`), 'utf8'), context);
  context.BF.util.choose = async (options) => { messages.push(options); return choices.shift() ?? null; };
  context.BF.util.toast = () => {};
  context.BF.util.download = (name, content) => downloads.push({ name, content });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'export.js'), 'utf8'), context);
  context.BF.store.loadLocal();
  return { context, S: context.BF.store, E: context.BF.exporter, U: context.BF.util, values, tasks, downloads, messages };
}
const caso = (id, patch = {}) => ({ id, codigo: id, fecha: '2026-10-01', procedimientoPrincipal: 'Reconstrucción de LCA', diagnostico: 'Caso ficticio', rol: 'Cirujano (supervisado)', lateralidad: 'Derecha', abordaje: 'Artroscópico', actualizado: '2026-10-01T12:00:00Z', ...patch });
const json = (value) => JSON.parse(JSON.stringify(value));

test('LET reemplaza la etiqueta antigua y conserva los casos existentes', () => {
  const { S, context } = app();
  const old = 'Laxitud multiligamentaria: tenodesis';
  const current = 'Tenodesis extraarticular lateral (LET)';
  S.add(caso('let', { procedimientosAsociados: [old] }));
  assert.deepEqual(json(S.get('let').procedimientosAsociados), [current]);
  assert.ok(!context.BF.CONFIG.PROCEDIMIENTOS.includes(old));
  assert.equal(context.BF.CONFIG.procedureArea(current), 'Ligamentos');
});

test('El patrón y Schenck se conservan al editar y recuperar el JSON', () => {
  const { S, E, context } = app();
  assert.ok(context.BF.CONFIG.isMultiligamentaryDiagnosis('Lesión MULTILIGAMENTARIA'));
  assert.equal(context.BF.CONFIG.isMultiligamentaryDiagnosis('Rotura de LCA'), false);
  S.add(caso('multi', { diagnostico: 'Lesión multiligamentaria', patronMultiligamentario: 'LCA + LCP + medial', clasificacionMultiligamentaria: 'KD III-M' }));
  S.update('multi', { notas: 'Registro ficticio actualizado' });
  const target = app();
  target.E.applyImport(target.E.previewImport(json(S.packageData())), 'replace');
  assert.equal(target.S.get('multi').patronMultiligamentario, 'LCA + LCP + medial');
  assert.equal(target.S.get('multi').clasificacionMultiligamentaria, 'KD III-M');
  assert.equal(S.normalize(caso('old')).clasificacionMultiligamentaria, '');
});

test('Trauma usa los nombres del servicio sin desplazar las otras áreas', () => {
  const { context } = app();
  const C = context.BF.CONFIG;
  for (const procedure of ['Fractura Fémur Distal', 'Fractura Periprotésica', 'Fractura Platillos Tibiales', 'Fractura de Rótula', 'Fractura Avulsiva Espinas Tibiales LCA / LCP']) {
    assert.ok(C.PROCEDIMIENTOS.includes(procedure));
    assert.equal(C.procedureArea(procedure), 'Trauma');
  }
  assert.equal(C.procedureArea('Prótesis total de rodilla (PTR)'), 'Artroplastia');
  assert.equal(C.procedureArea('Microfracturas'), 'Cartílago');
  assert.equal(C.procedureArea('Sinovectomía (artroscópica/abierta)'), 'Otros');
});

test('Los nombres antiguos de Trauma conservan casos y metas sin duplicar procedimientos', () => {
  const { S, E } = app();
  const preview = E.previewImport({ casos: [caso('trauma', { procedimientoPrincipal: 'Fractura de meseta tibial: osteosíntesis', procedimientosAsociados: ['Fractura de rótula: osteosíntesis', 'Fractura de Rótula'] })], objetivos: { 'Fractura de meseta tibial: osteosíntesis': 19 } });
  E.applyImport(preview, 'replace');
  assert.equal(S.get('trauma').procedimientoPrincipal, 'Fractura Platillos Tibiales');
  assert.equal(S.get('trauma').procedimientoPrincipalAnterior, 'Fractura de meseta tibial: osteosíntesis');
  assert.deepEqual(json(S.get('trauma').procedimientosAsociados), ['Fractura de Rótula']);
  assert.equal(S.getObjetivos()['Fractura Platillos Tibiales'], 19);
  assert.equal(S.all().length, 1);
  assert.equal(S.normalize(caso('femur', { procedimientoPrincipal: 'Fractura supracondílea femoral: osteosíntesis' })).procedimientoPrincipal, 'Fractura Fémur Distal');
});

test('Los datos postoperatorios antiguos se conservan sin contar como complicación intraoperatoria', () => {
  const { S } = app();
  S.add(caso('antiguo', { complicacionPostop: true, complicacionClavienDindo: 'IIIb', internacionDias: 4, profilaxis: 'Dato ficticio' }));
  assert.equal(S.hasComplication(S.get('antiguo')), false);
  S.update('antiguo', { diagnostico: 'Diagnóstico ficticio actualizado' });
  const saved = S.packageData().casos[0];
  assert.equal(saved.internacionDias, 4);
  assert.equal(saved.complicacionClavienDindo, 'IIIb');
  assert.equal(saved.profilaxis, 'Dato ficticio');
  assert.equal(S.hasComplication(caso('intraop', { complicacionIntraop: true })), true);
});

test('Injerto y técnica corresponden al procedimiento principal o asociado y se conservan en el JSON', () => {
  const { context, S, E } = app();
  const details = context.BF.CONFIG.procedureDetailsFor;
  assert.deepEqual(json(details(['Reconstrucción de LCA', 'Reparación meniscal (sutura)'])), { injertoLca: true, tecnicaMeniscal: true });
  assert.equal(details(['Revisión de reconstrucción de LCA']).injertoLca, true);
  assert.equal(details(['Osteotomía tibial alta + LCA']).injertoLca, true);
  assert.deepEqual(json(details(['Meniscectomía parcial'])), { injertoLca: false, tecnicaMeniscal: false });
  S.add(caso('tecnica', { injertoLca: 'Isquiotibiales', tecnicaMeniscal: 'All-inside', procedimientosAsociados: ['Reparación meniscal (sutura)'] }));
  const saved = json(S.packageData());
  assert.equal(saved.casos[0].injertoLca, 'Isquiotibiales');
  assert.equal(saved.casos[0].tecnicaMeniscal, 'All-inside');
  E.applyImport(E.previewImport(saved), 'replace');
  assert.equal(S.get('tecnica').tecnicaMeniscal, 'All-inside');
  assert.ok(E.toCsv(S.all()).includes('Isquiotibiales'));
  assert.equal(S.normalize(caso('antiguo')).injertoLca, '');
});

test('La fecha local no se adelanta al día UTC y las medianas son reales', () => {
  const { U } = app();
  assert.equal(U.localDateISO(new Date('2026-10-02T01:00:00Z')), '2026-10-01');
  assert.equal(U.median([]), null);
  assert.equal(U.median([1, 100, 2]), 2);
  assert.equal(U.median([95, 45, 105, 120, 90, 75, 110, 60, 55, 80, 100, 130, 115, 105]), 97.5);
});

test('Cancelar la importación no modifica casos, metas ni estado de sincronización', async () => {
  const { S, E, tasks } = app({ choices: [null] });
  S.add(caso('original'));
  const before = JSON.stringify(S.packageData().casos);
  E.importJsonFile({ name: 'ficticio.json', content: JSON.stringify({ casos: [caso('nuevo')] }) });
  await tasks.pop();
  assert.equal(JSON.stringify(S.all()), before);
  assert.equal(S.state.replaceRemote, false);
});

test('Cancelar la segunda confirmación de reemplazo conserva los datos', async () => {
  const { S, E, tasks, messages } = app({ choices: ['replace', null] });
  S.add(caso('original'));
  E.importJsonFile({ name: 'ficticio.json', content: JSON.stringify({ casos: [caso('nuevo')] }) });
  await tasks.pop();
  assert.equal(S.all()[0].id, 'original');
  assert.equal(messages[1].confirmText, 'REEMPLAZAR');
});

test('Importación inválida no vacía datos; la fusión preserva la versión más reciente', () => {
  const { S, E } = app();
  S.add(caso('a', { actualizado: '2026-10-01T23:00:00Z' }));
  assert.throws(() => E.previewImport({ casos: [null] }));
  assert.throws(() => E.previewImport({ casos: [caso('b')], objetivos: { LCA: -1 } }));
  assert.throws(() => E.previewImport({ casos: [caso('b'), caso('b')] }));
  assert.throws(() => E.previewImport({ casos: [caso('b', { seguimiento: [null] })] }));
  assert.throws(() => E.previewImport({ casos: [], borrador: { caso: { tags: 'incorrecto' } } }));
  E.applyImport(E.previewImport({ casos: [caso('a', { actualizado: '2000-01-01T00:00:00Z' }), caso('b')] }), 'merge');
  assert.equal(S.all().length, 2);
  assert.notEqual(S.get('a').actualizado, '2000-01-01T00:00:00Z');
});

test('El respaldo restaura metas y criterio de conteo y nunca incluye credenciales', () => {
  const { S, E, U, downloads } = app();
  S.add(caso('original'));
  S.saveCfg({ token: 'CREDENCIAL_FICTICIA', objetivoModo: 'cirujano' });
  S.setObjetivo('Reconstrucción de LCA', 73);
  const draft = { caso: caso('borrador', { tags: ['ficticio'] }), editingId: null };
  U.store.set('draft', draft);
  E.exportJson();
  const saved = JSON.parse(downloads[0].content);
  assert.equal(saved.objetivos['Reconstrucción de LCA'], 73);
  assert.equal(saved.preferencias.objetivoModo, 'cirujano');
  assert.deepEqual(saved.borrador, draft);
  assert.ok(!downloads[0].content.includes('CREDENCIAL_FICTICIA'));
  const target = app(); target.E.applyImport(target.E.previewImport(saved), 'replace');
  assert.equal(target.S.getObjetivos()['Reconstrucción de LCA'], 73);
  assert.equal(target.S.getGoalMode(), 'cirujano');
});

test('CSV respeta la lista explícita y protege separadores, comillas y saltos de línea', () => {
  const { S, E, downloads } = app();
  S.add(caso('a', { notas: 'Texto; "citado"\nOtra línea' })); S.add(caso('b'));
  E.exportCsv([S.get('a')]);
  assert.equal(downloads[0].content.split('\r\n').length, 2);
  assert.ok(downloads[0].content.includes('"Texto; ""citado"" / Otra línea"'));
});

test('La actividad académica cuenta casos únicos y la isquemia sólo casos con torniquete', () => {
  const { S } = app();
  const metrics = S.metrics([S.normalize(caso('a', { presentadoEnAteneo: true, publicable: true, torniquete: false, torniqueteMin: 400 })), S.normalize(caso('b', { presentadoEnAteneo: true, torniquete: true, torniqueteMin: 20 }))]);
  assert.equal(metrics.academicos, 2);
  assert.equal(metrics.isquemiaPromedio, 20);
});

test('El fallo de almacenamiento se expone y la memoria no devuelve una versión vieja', () => {
  const { U } = app({ storageFails: true });
  assert.equal(U.store.set('draft', { diagnostico: 'Ficticio' }), false);
  assert.equal(U.store.reliable(), false);
  assert.deepEqual(json(U.store.get('draft')), { diagnostico: 'Ficticio' });
});

test('Los datos ficticios usan un espacio de almacenamiento independiente', () => {
  const { context, U, values } = app();
  U.store.set('casos', [caso('real-fixture')]);
  context.BF.CONFIG.LS_PREFIX = 'bf.demo.';
  U.store.set('casos', [caso('demo-fixture')]);
  assert.equal(JSON.parse(values.get('bf.casos'))[0].id, 'real-fixture');
  assert.equal(JSON.parse(values.get('bf.demo.casos'))[0].id, 'demo-fixture');
});

test('Un caso borrado no reaparece al resolver un conflicto remoto', async () => {
  const { context, S } = app(); S.add(caso('a'));
  const remote = json(S.packageData()); S.remove('a');
  S.saveCfg({ owner: 'ficticio', repo: 'ficticio', token: 'ficticio', auto: false });
  let writes = 0, payload;
  context.BF.github = { read: async () => ({ data: remote, sha: 'remote' }), write: async (cfg, data) => { writes++; if (writes === 1) { const e = new Error('Conflicto simulado'); e.status = 409; throw e; } payload = json(data); return { sha: 'new' }; } };
  await S.push({ silent: true });
  assert.equal(payload.casos.length, 0);
  assert.ok(payload.deleted.a);
});

test('Un reemplazo confirmado no fusiona casos remotos al reintentar', async () => {
  const { context, S, E } = app(); S.add(caso('original'));
  S.saveCfg({ owner: 'ficticio', repo: 'ficticio', token: 'ficticio', auto: false });
  E.applyImport(E.previewImport({ casos: [caso('importado')] }), 'replace');
  let writes = 0, payload;
  context.BF.github = { read: async () => ({ data: { casos: [caso('remoto')] }, sha: 'remote' }), write: async (cfg, data) => { writes++; if (writes === 1) { const e = new Error('Conflicto simulado'); e.status = 409; throw e; } payload = json(data); return { sha: 'new' }; } };
  await S.push({ silent: true });
  assert.deepEqual(payload.casos.map((c) => c.id), ['importado']);
});

test('Guardar durante una subida mantiene el siguiente cambio pendiente', async () => {
  const { context, S } = app(); S.add(caso('a')); S.saveCfg({ owner: 'ficticio', repo: 'ficticio', token: 'ficticio', auto: false });
  let release;
  context.BF.github = { write: () => new Promise((resolve) => { release = resolve; }) };
  const sending = S.push({ silent: true }); S.add(caso('b')); release({ sha: 'new' }); await sending;
  assert.equal(S.state.dirty, true); assert.equal(S.state.status, 'pending');
});
