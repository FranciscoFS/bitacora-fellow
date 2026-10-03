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
  for (const file of ['config', 'util', 'store', 'practice']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', `${file}.js`), 'utf8'), context);
  context.BF.util.choose = async (options) => { messages.push(options); return choices.shift() ?? null; };
  context.BF.util.toast = () => {};
  context.BF.util.download = (name, content) => downloads.push({ name, content });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'export.js'), 'utf8'), context);
  context.BF.store.loadLocal();
  return { context, S: context.BF.store, E: context.BF.exporter, U: context.BF.util, values, tasks, downloads, messages };
}
const caso = (id, patch = {}) => ({ id, codigo: id, fecha: '2026-10-01', procedimientoPrincipal: 'Reconstrucción de LCA', diagnostico: 'Caso ficticio', rol: 'Cirujano (supervisado)', lateralidad: 'Derecha', abordaje: 'Artroscópico', actualizado: '2026-10-01T12:00:00Z', ...patch });
const json = (value) => JSON.parse(JSON.stringify(value));

test('La práctica reciente respeta fechas inclusivas, año, DST y el rol de cirujano', () => {
  const { context } = app(), P=context.BF.practice;
  assert.deepEqual(json(P.dateRange('28','2026-10-02')),{desde:'2026-09-05',hasta:'2026-10-02'});
  assert.deepEqual(json(P.dateRange('84','2026-01-03')),{desde:'2025-10-12',hasta:'2026-01-03'});
  assert.deepEqual(json(P.dateRange('28','2024-03-01')),{desde:'2024-02-03',hasta:'2024-03-01'});
  const cases=[caso('before',{fecha:'2026-09-04'}),caso('start',{fecha:'2026-09-05'}),caso('end',{fecha:'2026-10-02',rol:'Cirujano (independiente)'}),caso('future',{fecha:'2026-10-03'}),caso('observer',{rol:'Observador'}),caso('missing',{fecha:''})];
  const scope={...P.dateRange('28','2026-10-02'),role:'surgeon'};
  assert.equal(P.summarize(cases,scope).total,2);
  assert.equal(P.summarize(cases,{...scope,role:'Observador'}).total,1);
  assert.equal(P.summarize(cases,{...P.dateRange('all'),role:''}).total,6);
});

test('El mosaico cuenta principales una vez, agrupa la cola y permite abrir el mismo conjunto', () => {
  const { context }=app(), P=context.BF.practice;
  const cases=Array.from({length:9},(_,i)=>caso(String(i),{procedimientoPrincipal:'Procedimiento '+i,procedimientosAsociados:['Procedimiento 0']}));
  cases.push(caso('repeat',{procedimientoPrincipal:'Procedimiento 0'}));
  const scope={role:''}, summary=P.summarize(cases,scope);
  assert.equal(summary.total,10);assert.equal(summary.procedures[0].value,2);
  assert.equal(summary.tiles.length,6);assert.equal(summary.tiles[5].value,4);
  for(const tile of summary.tiles)assert.equal(cases.filter(c=>P.matches(c,{...scope,procedures:tile.procedures})).length,tile.value);
  assert.equal(P.summarize([],scope).tiles.length,0);
});

test('Los rectángulos cubren el mosaico sin solaparse y su área corresponde al conteo', () => {
  const { context }=app(), P=context.BF.practice;
  const boxes=P.layout([{value:40},{value:20},{value:15},{value:10},{value:8},{value:7}]);
  assert.ok(Math.abs(boxes.reduce((s,p)=>s+p.w*p.h,0)-10000)<1e-8);
  boxes.forEach(p=>assert.ok(Math.abs(p.w*p.h/100-p.value)<1e-8));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const a=boxes[i],b=boxes[j];
    const overlapW=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),overlapH=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
    assert.ok(overlapW<1e-8||overlapH<1e-8);
  }
});

test('Las metas agrupadas cuentan cada caso una vez y respetan el criterio de cirujano', () => {
  const { S } = app(); const ptr = 'Prótesis total de rodilla (PTR)', robot = 'Prótesis total con navegación/robótica';
  S.setObjetivo(ptr, 7);
  S.add(caso('conv', { procedimientoPrincipal: ptr, rol: 'Primer ayudante' }));
  S.add(caso('robot', { procedimientoPrincipal: robot }));
  S.add(caso('both', { procedimientoPrincipal: ptr, procedimientosAsociados: [robot] }));
  assert.equal(S.progreso(S.all()).find(g => g.proc === ptr).logrado, 2);
  assert.ok(S.setGoalGroup(ptr, [ptr, robot]));
  assert.equal(S.progreso(S.all()).find(g => g.proc === ptr).logrado, 3);
  assert.equal(S.progreso(S.all().filter(S.isSurgeon)).find(g => g.proc === ptr).logrado, 2);
  assert.equal(S.getObjetivos()[ptr], 7);
  S.setGoalGroup(ptr, [ptr]); assert.equal(S.progreso(S.all()).find(g => g.proc === ptr).logrado, 2);
});

test('Las combinaciones de metas viajan en JSON, almacenamiento local y sincronización', async () => {
  const { S, E } = app(); const ptr = 'Prótesis total de rodilla (PTR)', robot = 'Prótesis total con navegación/robótica';
  S.setGoalGroup(ptr, [ptr, robot]); S.loadLocal();
  assert.deepEqual(json(S.getGoalGroups()[ptr]), [ptr, robot]);
  const target = app(); target.E.applyImport(target.E.previewImport(json(S.packageData())), 'replace');
  assert.deepEqual(json(target.S.getGoalGroups()[ptr]), [ptr, robot]);
  const remote = app(); remote.S.saveCfg({ owner: 'ficticio', repo: 'ficticio', token: 'ficticio', auto: false }); remote.S.state.dirty = false;
  remote.context.BF.github = { read: async () => ({ exists: true, data: json(S.packageData()), sha: 'remote' }) };
  await remote.S.pull({ silent: true });
  assert.deepEqual(json(remote.S.getGoalGroups()[ptr]), [ptr, robot]);
  assert.throws(() => E.previewImport({ casos: [], gruposObjetivos: { [ptr]: robot } }));
  target.S.removeObjetivo(ptr); assert.equal(target.S.getGoalGroups()[ptr], undefined);
});

test('Reducción y osteosíntesis son procedimientos de Trauma y se vinculan al diagnóstico sin cambiarlo', () => {
  const { context, S, E } = app(); const C = context.BF.CONFIG;
  for (const p of ['Reducción', 'Osteosíntesis', 'Reducción y osteosíntesis']) {
    assert.ok(C.PROCEDIMIENTOS.includes(p));
    assert.equal(C.procedureArea(p), 'Trauma');
  }
  S.add(caso('trauma-pair', { diagnostico: 'Fractura Platillos Tibiales', procedimientoPrincipal: 'Reducción y osteosíntesis' }));
  const steps = C.personalStepsFor(S.get('trauma-pair'));
  assert.ok(steps.includes('Reducción')); assert.ok(steps.includes('Osteosíntesis'));
  const target = app(); target.E.applyImport(target.E.previewImport(json(S.packageData())), 'replace');
  assert.equal(target.S.get('trauma-pair').diagnostico, 'Fractura Platillos Tibiales');
  assert.equal(target.S.get('trauma-pair').procedimientoPrincipal, 'Reducción y osteosíntesis');
});

test('Las opciones de participación dependen de los procedimientos sin marcar pasos automáticamente', () => {
  const { context, S } = app(); const C = context.BF.CONFIG;
  const combined = C.personalStepsFor(caso('combo', { abordaje: 'Artroscópico', procedimientosAsociados: ['Reparación meniscal (sutura)'] }));
  assert.ok(combined.includes('Artroscopia diagnóstica'));
  assert.ok(combined.includes('Sutura meniscal'));
  assert.ok(!combined.includes('Meniscectomía'));
  assert.ok(combined.includes('Desbridamiento del remanente de LCA'));
  assert.ok(combined.includes('Preparación de la escotadura'));
  const cartilage = C.personalStepsFor(caso('cartilage', { procedimientoPrincipal: 'Condroplastia / regularización', abordaje: 'Artroscópico' }));
  assert.ok(cartilage.includes('Desbridamiento condral'));
  assert.ok(!cartilage.includes('Desbridamiento del remanente de LCA'));
  assert.ok(C.personalStepsFor(caso('general', { procedimientoPrincipal: 'Artroscopia diagnóstica' })).includes('Desbridamiento artroscópico'));
  assert.ok(C.personalStepsFor(caso('combined', { procedimientosAsociados: ['Microfracturas'] })).includes('Desbridamiento condral'));
  assert.ok(C.personalStepsFor(caso('fracture', { procedimientoPrincipal: 'Fractura Fémur Distal' })).includes('Reducción'));
  assert.ok(!C.personalStepsFor(caso('avulsion', { procedimientoPrincipal: 'Fractura Avulsiva Espinas Tibiales LCA / LCP' })).includes('Preparación del injerto'));
  S.add(caso('no-steps')); assert.deepEqual(json(S.get('no-steps').pasosRealizados), []);
});

test('Los pasos seleccionados se conservan en edición, JSON y CSV', () => {
  const { S, E } = app(); S.add(caso('steps', { pasosRealizados: ['Abordaje', 'Sutura meniscal', 'Abordaje'] }));
  S.update('steps', { notas: 'Caso ficticio actualizado' });
  const target = app(); target.E.applyImport(target.E.previewImport(json(S.packageData())), 'replace');
  assert.deepEqual(json(target.S.get('steps').pasosRealizados), ['Abordaje', 'Sutura meniscal']);
  assert.ok(E.toCsv(S.all()).includes('Abordaje | Sutura meniscal'));
  assert.throws(() => E.previewImport({ casos: [caso('bad', { pasosRealizados: 'Abordaje' })] }));
});

test('Las etiquetas automáticas combinan procedimientos y detalles aplicables', () => {
  const { context } = app(); const C = context.BF.CONFIG;
  const tags = C.suggestTags(caso('tags', { procedimientosAsociados: ['Reparación meniscal (sutura)', 'Tenodesis extraarticular lateral (LET)'], injertoLca: 'Isquiotibiales', tecnicaMeniscal: 'All inside' }));
  for (const tag of ['LCA', 'LET', 'Sutura meniscal', 'LCA + LET', 'LCA + sutura meniscal', 'Injerto: Isquiotibiales', 'Técnica meniscal: All inside']) assert.ok(tags.includes(tag));
  const unrelated = C.suggestTags(caso('other', { procedimientoPrincipal: 'Meniscectomía parcial', injertoLca: 'Isquiotibiales', tecnicaMeniscal: 'All inside', clasificacionMultiligamentaria: 'KD III-M' }));
  assert.ok(!unrelated.some((t) => /Injerto|Técnica|Schenck/.test(t)));
});

test('Editar actualiza etiquetas automáticas, conserva las manuales y respeta exclusiones', () => {
  const { context, S } = app(); const C = context.BF.CONFIG;
  S.add(C.withAutoTags(caso('tags', { tags: ['Personal', 'lca'], excludedAutoTags: ['Ligamentos'], procedimientosAsociados: ['Tenodesis extraarticular lateral (LET)'] })));
  assert.equal(S.get('tags').tags.filter((t) => t.toLowerCase() === 'lca').length, 1);
  assert.ok(!S.get('tags').tags.includes('Ligamentos'));
  S.update('tags', { procedimientoPrincipal: 'Meniscectomía parcial', procedimientosAsociados: [] });
  assert.ok(S.get('tags').tags.includes('Personal'));
  assert.ok(S.get('tags').tags.includes('lca'));
  assert.ok(S.get('tags').tags.includes('Menisco'));
  assert.ok(!S.get('tags').tags.includes('LET'));
  const target = app(); target.E.applyImport(target.E.previewImport(json(S.packageData())), 'replace');
  assert.deepEqual(json(target.S.get('tags').excludedAutoTags), ['Ligamentos']);
  assert.ok(target.S.get('tags').tags.includes('Personal'));
});

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
