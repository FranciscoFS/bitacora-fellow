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

test('El catálogo ampliado distingue discoide, tallado y motivos múltiples de revisión', () => {
  const {context,S,E}=app(), C=context.BF.CONFIG;
  assert.ok(C.DIAGNOSTICOS.Menisco.includes('Menisco lateral discoide'));
  const tallado='Meniscoplastia / tallado meniscal (saucerización)';
  for(const p of [tallado,'Reinserción de raíz meniscal']) {
    assert.ok(C.PROCEDIMIENTOS_PRINCIPALES.includes(p)); assert.equal(C.procedureArea(p),'Menisco');
  }
  for(const p of ['Fijación de fragmento osteocondral','Perforaciones por osteocondritis disecante']) assert.equal(C.procedureArea(p),'Cartílago');
  for(const p of ['Desbridamiento y retención de implantes (DAIR)','Retiro de prótesis y colocación de espaciador','Reimplantación protésica']) assert.equal(C.procedureArea(p),'Artroplastia');
  assert.equal(C.procedureArea('Injerto óseo de túneles'),'Ligamentos');
  const diagnoses=['Aflojamiento aséptico de prótesis','Inestabilidad protésica'].map((nombre,i)=>({id:'r'+i,nombre,grupo:'Revisión protésica',tipo:nombre}));
  S.add(caso('revision',{diagnosticos:diagnoses,procedimientoPrincipal:'Prótesis de revisión',autoTags:[]}));
  assert.equal(S.get('revision').diagnosticos.length,2);
  S.setObjetivo('Prótesis de revisión',10);
  assert.equal(S.progreso(S.all()).find(g=>g.proc==='Prótesis de revisión').logrado,1);
  assert.match(E.toCsv(S.all()),/Aflojamiento aséptico de prótesis/);
  assert.equal(C.diagnosisEntry('Infección periprotésica','Infección').diagnosticoGrupo,'Infección');
  assert.equal(C.diagnosisEntry('Infección periprotésica','Revisión protésica').diagnosticoGrupo,'Revisión protésica');
});

test('Varios diagnósticos con detalles sobreviven a JSON, CSV y cambios independientes', () => {
  const { S, E, U, downloads } = app();
  const lca = { id: 'lca', nombre: 'Lesión de LCA', grupo: 'Ligamentos', tipo: 'Lesión de LCA' };
  const menisco = { id: 'menisco', nombre: 'Lesión de menisco lateral', grupo: 'Menisco', tipo: 'Lesión de menisco lateral', patronMeniscal: 'Radial' };
  S.add(caso('multiple', { diagnosticos: [lca, menisco], autoTags: [], manualTags: ['Personal'], procedimientosAsociados: ['Reparación meniscal (sutura)'] }));
  assert.equal(S.get('multiple').diagnosticos.length, 2);
  assert.match(S.get('multiple').diagnostico, /LCA.*menisco lateral.*Radial/);
  assert.ok(S.get('multiple').tags.includes('Lesión de menisco lateral · Radial'));
  U.store.del('draft'); E.exportJson();
  const target = app(); target.E.applyImport(target.E.previewImport(JSON.parse(downloads[0].content)), 'replace');
  target.S.loadLocal();
  assert.equal(target.S.get('multiple').diagnosticos[1].patronMeniscal, 'Radial');
  assert.match(target.E.toCsv(target.S.all()), /Diagnósticos y detalles/);
  assert.match(target.E.toCsv(target.S.all()), /Lesión de menisco lateral · Radial/);
  S.update('multiple', { diagnosticos: [menisco] });
  assert.equal(S.get('multiple').diagnosticos[0].id, 'menisco');
  assert.equal(S.get('multiple').diagnosticos[0].patronMeniscal, 'Radial');
  assert.ok(!S.get('multiple').tags.includes('Lesión de LCA'));
  assert.ok(S.get('multiple').tags.includes('Personal'));
  S.update('multiple', { diagnosticos: [] });
  assert.equal(S.get('multiple').diagnostico, '');
  assert.equal(S.get('multiple').diagnosticoTipo, '');
});

test('Las clasificaciones pertenecen a su diagnóstico y se eliminan al quitarlo', () => {
  const { S, context } = app(), C = context.BF.CONFIG;
  const plateau = { id: 'plateau', nombre: 'Fractura de platillo tibial', grupo: 'Fracturas', tipo: 'Fractura de platillo tibial', clasificacionSchatzker: 'II' };
  const dislocation = { id: 'dislocation', nombre: 'Luxación de rodilla', grupo: 'Ligamentos', tipo: 'Luxación de rodilla', clasificacionMultiligamentaria: 'KD III-M' };
  S.add(caso('classifications', { diagnosticos: [plateau, dislocation], autoTags: [] }));
  assert.ok(C.isMultiligamentaryDiagnosis('Luxación de rodilla'));
  assert.ok(!C.isMultiligamentaryDiagnosis('Luxación de rótula'));
  assert.equal(S.get('classifications').clasificacionMultiligamentaria, 'KD III-M');
  assert.equal(S.filter({q:'Schenck KD III-M'}).length, 1);
  S.update('classifications', { diagnosticos: [dislocation] });
  assert.equal(S.get('classifications').clasificacionSchatzker, '');
  assert.ok(!S.get('classifications').tags.includes('Schatzker II'));
  assert.equal(S.get('classifications').diagnosticos[0].clasificacionMultiligamentaria, 'KD III-M');
  S.update('classifications', { diagnosticos: [{ ...dislocation, nombre: 'Gonartrosis' }] });
  assert.equal(S.get('classifications').clasificacionMultiligamentaria, '');
  assert.equal(S.get('classifications').diagnosticos[0].clasificacionMultiligamentaria, '');
});

test('La lesión condral reinsertable y las cirugías combinadas se conservan sin sustituir procedimientos', () => {
  const { S, context } = app(), C = context.BF.CONFIG;
  S.add(caso('cartilage', { procedimientoPrincipal: 'Reconstrucción del ligamento patelofemoral medial (RLPFM / MPFL)', procedimientosAsociados: ['Reinserción condral'], diagnosticos: [{id:'patella',nombre:'Luxación de rótula'}, {id:'cartilage',nombre:'Lesión condral',grupo:'Cartílago',tipo:'Lesión condral',condralReinsertable:true}],autoTags:[] }));
  assert.ok(C.PROCEDIMIENTOS_PRINCIPALES.includes('Reinserción condral'));
  assert.equal(C.procedureArea('Reinserción condral'), 'Cartílago');
  assert.equal(S.get('cartilage').diagnosticos[1].condralReinsertable, true);
  assert.ok(S.get('cartilage').tags.includes('Lesión condral · Reinsertable'));
  assert.equal(C.procedureSummary(S.get('cartilage')), 'RLPFM + Reinserción condral');
  assert.equal(C.procedureSummary(caso('multi',{procedimientosAsociados:['Reconstrucción de LCP','Reconstrucción de esquina posteromedial (EPM)']})), 'RLCA + RLCP + EPM');
  assert.ok(C.procedureMatches('Reconstrucción de LCA','rlca'));
  assert.ok(C.procedureMatches('Reconstrucción de LCP','RLCP'));
  assert.ok(!C.procedureMatches('Reconstrucción de LCP','RLCA'));
});

test('Los datos antiguos mantienen texto, clasificaciones y respuestas negativas explícitas', () => {
  const { S } = app();
  const text = 'Lesión de LCA + lesión radial menisco lateral';
  const legacy = S.normalize(caso('legacy',{diagnostico:text,torniquete:false,complicacionIntraop:false}));
  assert.equal(legacy.diagnostico,text);
  assert.equal(legacy.diagnosticos.length,1);
  assert.equal(legacy.diagnosticos[0].nombre,text);
  assert.equal(legacy.torniquete,false);
  assert.equal(legacy.complicacionIntraop,false);
  S.add(legacy); S.update('legacy',{diagnostico:'Diagnóstico escrito por cliente antiguo'});
  assert.equal(S.get('legacy').diagnosticos[0].nombre,'Diagnóstico escrito por cliente antiguo');
});

test('No responder, Sí y No son estados diferentes y se exportan como tales', () => {
  const { S, E } = app();
  const unknown=S.normalize(caso('unknown'));
  assert.equal(unknown.torniquete,null); assert.equal(unknown.complicacionIntraop,null);
  assert.equal(S.hasComplication(unknown),false);
  for(const value of [true,false,null]) {
    const saved=S.normalize(caso('value',{torniquete:value,complicacionIntraop:value}));
    assert.equal(saved.torniquete,value); assert.equal(saved.complicacionIntraop,value);
    const [header,line]=E.toCsv([saved]).split('\r\n').map((row)=>row.split(';'));
    assert.equal(line[header.indexOf('Torniquete')],value===null?'':value?'Sí':'No');
  }
  assert.equal(S.normalize(caso('string',{torniquete:'false'})).torniquete,false);
  assert.equal(S.metrics([unknown]).tasaComplicaciones,null);
  const metrics=S.metrics([unknown,S.normalize(caso('yes',{complicacionIntraop:true})),S.normalize(caso('no',{complicacionIntraop:false}))]);
  assert.equal(metrics.complicacionesRegistradas,2);
  assert.equal(metrics.tasaComplicaciones,50);
});

test('Un respaldo con diagnósticos múltiples inválidos se rechaza antes de cambiar casos', () => {
  const { S,E }=app(); S.add(caso('existing'));
  for(const diagnoses of ['incorrecto',[null],[{nombre:123}],[{nombre:''}]]) assert.throws(()=>E.previewImport({casos:[caso('bad',{diagnosticos:diagnoses})]}));
  assert.equal(S.all().length,1); assert.equal(S.all()[0].id,'existing');
});

test('Diagnóstico estructurado y Schatzker sobreviven a JSON, CSV y almacenamiento sin clasificar casos antiguos', () => {
  const { context, S, E, U, downloads } = app();
  const diagnosis = 'Fractura de platillo tibial';
  S.add(context.BF.CONFIG.withAutoTags(caso('plateau', { diagnostico: diagnosis, diagnosticoGrupo: 'Fracturas', diagnosticoTipo: diagnosis, clasificacionSchatzker: 'IV', procedimientoPrincipal: 'Reducción y osteosíntesis' })));
  U.store.del('draft'); E.exportJson();
  const payload = JSON.parse(downloads[0].content);
  const target = app(); target.E.applyImport(target.E.previewImport(payload), 'replace');
  target.S.loadLocal();
  const restored = target.S.get('plateau');
  assert.equal(restored.diagnostico, diagnosis);
  assert.equal(restored.diagnosticoGrupo, 'Fracturas');
  assert.equal(restored.diagnosticoTipo, diagnosis);
  assert.equal(restored.clasificacionSchatzker, 'IV');
  assert.ok(restored.tags.includes('Schatzker IV'));
  assert.ok(restored.tags.includes(diagnosis));
  assert.ok(target.E.toCsv([restored]).includes('Clasificación de Schatzker'));
  assert.ok(target.E.toCsv([restored]).includes('"IV"'));
  target.S.update('plateau', { excludedAutoTags: ['Schatzker IV'] });
  assert.ok(!target.S.get('plateau').tags.includes('Schatzker IV'));
  assert.equal(target.S.filter({ q: 'Schatzker IV' }).length, 1);
  assert.equal(S.normalize(caso('old', { diagnostico: 'Fractura de meseta tibial Schatzker II' })).clasificacionSchatzker, '');
  assert.equal(S.normalize(caso('old')).diagnosticoGrupo, '');
});

test('Cambiar diagnóstico elimina metadatos incompatibles y etiquetas automáticas, conservando el texto libre', () => {
  const { context, S } = app(), C = context.BF.CONFIG;
  const diagnosis = 'Fractura de platillo tibial';
  S.add(C.withAutoTags(caso('change', { diagnostico: diagnosis + ', caso ficticio', diagnosticoGrupo: 'Fracturas', diagnosticoTipo: diagnosis, clasificacionSchatzker: 'II', manualTags: ['Revisar'], procedimientoPrincipal: 'Osteosíntesis' })));
  assert.equal(S.get('change').diagnosticoTipo, diagnosis);
  S.update('change', { diagnostico: 'Lesión meniscal: descripción libre' });
  const changed = S.get('change');
  assert.equal(changed.diagnostico, 'Lesión meniscal: descripción libre');
  for (const field of ['diagnosticoGrupo', 'diagnosticoTipo', 'clasificacionSchatzker']) assert.equal(changed[field], '');
  assert.ok(!changed.tags.includes('Schatzker II'));
  assert.ok(!changed.tags.includes(diagnosis));
  assert.ok(changed.tags.includes('Revisar'));
  assert.equal(C.diagnosisFields({ diagnostico: diagnosis, clasificacionSchatzker: 'VII' }).clasificacionSchatzker, '');
  assert.equal(C.diagnosisFields({ diagnostico: 'Fractura de rótula', clasificacionSchatzker: 'II' }).clasificacionSchatzker, '');
  for (const text of [diagnosis, 'Fractura Platillos Tibiales', 'Fractura de meseta tibial lateral']) assert.ok(C.isTibialPlateauDiagnosis(text));
  assert.ok(!C.isTibialPlateauDiagnosis('Microfracturas'));
});

test('RLPFM, EPM y EPL son distintos; sus alias conservan casos, metas y agrupaciones', () => {
  const { context, S, E } = app(), C = context.BF.CONFIG;
  const mpfl = 'Reconstrucción del ligamento patelofemoral medial (RLPFM / MPFL)';
  const epm = 'Reconstrucción de esquina posteromedial (EPM)', epl = 'Reconstrucción de esquina posterolateral (EPL)';
  E.applyImport(E.previewImport({ casos: [caso('old', { procedimientoPrincipal: 'Estabilización de rótula (MPFL)', procedimientosAsociados: ['Reconstrucción de esquina posterolateral', epl, epm] })], objetivos: { 'Estabilización de rótula (MPFL)': 8, [mpfl]: 10, 'Reconstrucción de esquina posterolateral': 6 }, gruposObjetivos: { 'Estabilización de rótula (MPFL)': ['Estabilización de rótula (MPFL)', epm] } }), 'replace');
  assert.equal(S.get('old').procedimientoPrincipal, mpfl);
  assert.equal(S.get('old').procedimientoPrincipalAnterior, 'Estabilización de rótula (MPFL)');
  assert.deepEqual(json(S.get('old').procedimientosAsociados), [epl, epm]);
  assert.equal(S.getObjetivos()[mpfl], 10);
  assert.equal(S.getObjetivos()[epl], 6);
  assert.equal(S.progreso(S.all()).find((g) => g.proc === mpfl).logrado, 1);
  for (const [p, area, tag] of [[mpfl, 'Patelofemoral', 'RLPFM'], [epm, 'Ligamentos', 'EPM'], [epl, 'Ligamentos', 'EPL']]) {
    assert.ok(C.PROCEDIMIENTOS_PRINCIPALES.includes(p));
    assert.equal(C.procedureArea(p), area);
    assert.ok(C.suggestTags(caso('tags', { procedimientoPrincipal: p })).includes(tag));
    assert.ok(C.personalStepsFor(caso('steps', { procedimientoPrincipal: p })).includes('Preparación del injerto'));
  }
});

test('La práctica reciente respeta fechas inclusivas, año, DST y el rol de cirujano', () => {
  const { context } = app(), P=context.BF.practice;
  assert.deepEqual(json(P.dateRange('28','2026-10-02')),{desde:'2026-09-05',hasta:'2026-10-02'});
  assert.deepEqual(json(P.dateRange('84','2026-01-03')),{desde:'2025-10-12',hasta:'2026-01-03'});
  assert.deepEqual(json(P.dateRange('28','2024-03-01')),{desde:'2024-02-03',hasta:'2024-03-01'});
  assert.deepEqual(json(P.dateRange('30','2024-03-01')),{desde:'2024-02-01',hasta:'2024-03-01'});
  assert.deepEqual(json(P.dateRange('90','2026-01-03')),{desde:'2025-10-06',hasta:'2026-01-03'});
  assert.deepEqual(json(P.dateRange('year','2026-01-03')),{desde:'2026-01-01',hasta:'2026-01-03'});
  const yearCases=[caso('previous',{fecha:'2025-12-31'}),caso('start',{fecha:'2026-01-01'}),caso('today',{fecha:'2026-01-03'}),caso('future',{fecha:'2026-01-04'})];
  assert.equal(P.summarize(yearCases,P.dateRange('year','2026-01-03')).total,2);
  const cases=[caso('before',{fecha:'2026-09-04'}),caso('start',{fecha:'2026-09-05'}),caso('end',{fecha:'2026-10-02',rol:'Cirujano (independiente)'}),caso('future',{fecha:'2026-10-03'}),caso('observer',{rol:'Observador'}),caso('missing',{fecha:''})];
  const scope={...P.dateRange('28','2026-10-02'),role:'surgeon'};
  assert.equal(P.summarize(cases,scope).total,2);
  assert.equal(P.summarize(cases,{...scope,role:'Observador'}).total,1);
  assert.equal(P.summarize(cases,{...P.dateRange('all'),role:''}).total,6);
});

test('Las tarjetas ordenan cada procedimiento por frecuencia y abren exactamente sus casos', () => {
  const { context }=app(), P=context.BF.practice;
  const cases=Array.from({length:9},(_,i)=>caso(String(i),{procedimientoPrincipal:'Procedimiento '+i,procedimientosAsociados:['Procedimiento 0']}));
  cases.push(caso('repeat',{procedimientoPrincipal:'Procedimiento 0'}));
  const scope={role:''}, summary=P.summarize(cases,scope);
  assert.equal(summary.total,10);assert.equal(summary.procedures[0].value,2);
  assert.equal(summary.tiles.length,9);assert.equal(summary.tiles[0].name,'Procedimiento 0');
  assert.equal(summary.tiles.reduce((sum,tile)=>sum+tile.value,0),summary.total);
  for(const tile of summary.tiles)assert.equal(cases.filter(c=>P.matches(c,{...scope,procedures:tile.procedures})).length,tile.value);
  assert.equal(P.summarize([],scope).tiles.length,0);
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

test('Reducción y osteosíntesis son procedimientos de Fracturas y se vinculan al diagnóstico sin cambiarlo', () => {
  const { context, S, E } = app(); const C = context.BF.CONFIG;
  for (const p of ['Reducción', 'Osteosíntesis', 'Reducción y osteosíntesis']) {
    assert.ok(C.PROCEDIMIENTOS.includes(p));
    assert.equal(C.procedureArea(p), 'Fracturas');
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
  assert.equal(combined[0], 'Cx completa');
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
  S.add(caso('complete', { pasosRealizados: ['Cx completa'] }));
  const completeTarget = app();
  completeTarget.E.applyImport(completeTarget.E.previewImport(json(S.packageData())), 'replace');
  assert.deepEqual(json(completeTarget.S.get('complete').pasosRealizados), ['Cx completa']);
  assert.ok(E.toCsv(S.all()).includes('Cx completa'));
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

test('Fracturas usa los nombres del servicio sin desplazar las otras áreas', () => {
  const { context } = app();
  const C = context.BF.CONFIG;
  for (const procedure of ['Fractura Fémur Distal', 'Fractura Periprotésica', 'Fractura Platillos Tibiales', 'Fractura de Rótula', 'Fractura Avulsiva Espinas Tibiales LCA / LCP']) {
    assert.ok(C.PROCEDIMIENTOS.includes(procedure));
    assert.equal(C.procedureArea(procedure), 'Fracturas');
  }
  assert.equal(C.procedureArea('Prótesis total de rodilla (PTR)'), 'Artroplastia');
  assert.equal(C.procedureArea('Microfracturas'), 'Cartílago');
  assert.equal(C.procedureArea('Sinovectomía (artroscópica/abierta)'), 'Otros');
});

test('Los nombres antiguos de Fracturas conservan casos y metas sin duplicar procedimientos', () => {
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
  assert.deepEqual(json(details(['Reconstrucción de LCA', 'Reparación meniscal (sutura)'])), { injertoLca: true, tecnicaMeniscal: true, osteotomiaTibial: false, osteotomiaFemoral: false });
  assert.equal(details(['Revisión de reconstrucción de LCA']).injertoLca, true);
  assert.equal(details(['Osteotomía tibial alta + LCA']).injertoLca, true);
  assert.deepEqual(json(details(['Meniscectomía parcial'])), { injertoLca: false, tecnicaMeniscal: false, osteotomiaTibial: false, osteotomiaFemoral: false });
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


test('Las osteotomías tibial y femoral conservan detalles independientes en almacenamiento, JSON y CSV', () => {
  const { context, S, E } = app(), C = context.BF.CONFIG;
  assert.equal(C.procedureDetailsFor(['Osteotomía tibial alta (HTO)']).osteotomiaTibial, true);
  assert.equal(C.procedureDetailsFor(['Osteotomía tibial alta + LCA']).osteotomiaTibial, true);
  assert.equal(C.procedureDetailsFor(['Osteotomía femoral distal (DFO)']).osteotomiaFemoral, true);
  const both = C.procedureDetailsFor(['Osteotomía tibial alta (HTO)', 'Osteotomía femoral distal (DFO)']);
  assert.equal(both.osteotomiaTibial, true); assert.equal(both.osteotomiaFemoral, true);
  assert.equal(C.procedureDetailsFor(['Reconstrucción de LCA']).osteotomiaTibial, false);
  assert.equal(C.procedureDetailsFor(['Reconstrucción de LCA']).osteotomiaFemoral, false);
  S.add(caso('osteotomias', {
    procedimientoPrincipal: 'Osteotomía tibial alta (HTO)', procedimientosAsociados: ['Osteotomía femoral distal (DFO)'],
    osteotomiaTibialTipo: 'Apertura', osteotomiaTibialLado: 'Medial',
    osteotomiaFemoralTipo: 'Cierre', osteotomiaFemoralLado: 'Lateral'
  }));
  S.loadLocal();
  const backup = json(S.packageData()), target = app();
  target.E.applyImport(target.E.previewImport(backup), 'replace');
  const saved = target.S.get('osteotomias');
  for (const [key, value] of Object.entries({ osteotomiaTibialTipo: 'Apertura', osteotomiaTibialLado: 'Medial', osteotomiaFemoralTipo: 'Cierre', osteotomiaFemoralLado: 'Lateral' })) {
    assert.equal(saved[key], value);
    assert.equal(S.normalize(caso('antiguo'))[key], '');
  }
  const csv = E.toCsv(S.all()).split('\r\n'), labels = csv[0].split(';'), values = csv[1].split(';');
  for (const [label, value] of [['Osteotomía tibial alta: tipo', 'Apertura'], ['Osteotomía tibial alta: lado de la cuña', 'Medial'], ['Osteotomía femoral distal: tipo', 'Cierre'], ['Osteotomía femoral distal: lado de la cuña', 'Lateral']]) {
    assert.equal(values[labels.indexOf(label)], '"' + value + '"');
  }
});
