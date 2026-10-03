/* All example data stays in memory. No access to the application's storage. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const names = ['Reconstrucción de LCA','Reparación meniscal','Prótesis total de rodilla','Meniscectomía parcial','Artroscopia diagnóstica','Fractura de platillos tibiales'];
  const goals = [30,20,20,40,50,10];
  const roles = ['Cirujano supervisado','Primer ayudante','Cirujano independiente','Segundo ayudante'];
  const fixture = Array.from({length:14},(_,i) => ({id:i+1,code:`CIR-${String(14-i).padStart(4,'0')}`,date:`2026-${i<5?'10':'09'}-${String(i<5?2-i:28-(i-5)*2).padStart(2,'0')}`,proc:names[i%6],role:roles[i%4],side:i%2?'Izquierda':'Derecha',minutes:60+(i%5)*15,diagnosis:['Rotura de ligamento cruzado anterior','Lesión meniscal','Gonartrosis','Lesión meniscal','Dolor de rodilla','Fractura de platillos tibiales'][i%6],approach:i%6===2||i%6===5?'Abierto':'Artroscópico'}));
  /* Fixed, coherent dates are design data, independent of the host clock. */
  fixture.forEach((c,i)=>{ if(i<5)c.date=['2026-10-02','2026-10-01','2026-09-30','2026-09-29','2026-09-28'][i]; });
  let cases = fixture.map(c=>({...c})), section = 'overview', editId = null;
  const draft = {};
  let practiceScope = null;
  const roleMatches = (c,r) => !r || (r==='surgeon' ? c.role.startsWith('Cirujano') : c.role===r);
  const periodStart = days => { if(days==='all')return ''; const d=new Date('2026-10-02T12:00:00Z');d.setUTCDate(d.getUTCDate()-Number(days)+1);return d.toISOString().slice(0,10); };
  function practiceCases(days,role){const start=periodStart(days);return cases.filter(c=>roleMatches(c,role)&&(!start||(c.date>=start&&c.date<='2026-10-02')));}
  function renderPractice(){
    if(!$('#practiceTiles'))return;
    const days=$('#practicePeriod').value, role=$('#practiceRole').value;
    const list=practiceCases(days,role), all=names.map((name,i)=>({name,i,value:list.filter(c=>c.proc===name).length})).filter(c=>c.value).sort((a,b)=>b.value-a.value||a.i-b.i);
    $('#practiceContext').textContent=`${list.length} ${list.length===1?'caso registrado':'casos registrados'} · ${$('#practicePeriod').selectedOptions[0].textContent} · ${$('#practiceRole').selectedOptions[0].textContent}`;
    const tiles=all.slice(0,5);if(all.length>5)tiles.push({name:'Otros procedimientos',i:'other',value:all.slice(5).reduce((s,c)=>s+c.value,0)});
    const boxes=[];const absDistance=(a,b)=>Math.abs(a-b);
    function layout(items,x,y,w,h){if(items.length===1){boxes.push({...items[0],x,y,w,h});return;}const sum=items.reduce((s,c)=>s+c.value,0);let cut=1,left=items[0].value;while(cut<items.length-1&&absDistance(left+items[cut].value,sum/2)<absDistance(left,sum/2)){left+=items[cut++].value;}const ratio=left/sum;if(w*2>=h){layout(items.slice(0,cut),x,y,w*ratio,h);layout(items.slice(cut),x+w*ratio,y,w*(1-ratio),h);}else{layout(items.slice(0,cut),x,y,w,h*ratio);layout(items.slice(cut),x,y+h*ratio,w,h*(1-ratio));}}
    if(tiles.length)layout(tiles,0,0,100,100);
    $('#practiceTiles').classList.toggle('practice-small',list.length<5||tiles.length<3);
    $('#practiceTiles').innerHTML=boxes.map(c=>`<button type="button" class="practice-tile" data-practice="${c.i}" style="--x:${c.x}%;--y:${c.y}%;--w:${c.w}%;--h:${c.h}%;--bar:${c.value/all[0].value*100}%;background:hsl(204 65% ${92-16*c.value/all[0].value}%)"><strong>${esc(c.name)}</strong><span>${c.value} ${c.value===1?'caso':'casos'} <small>· ${Math.round(c.value/list.length*100)}%</small></span></button>`).join('')||'<p class="practice-empty">No hay casos en este período y participación. Prueba otro filtro o registra un caso.</p>';
  }
  const dateLabel = s => new Intl.DateTimeFormat('es-CL',{day:'2-digit',month:'short'}).format(new Date(s+'T12:00:00'));
  const count = i => cases.filter(c=>c.proc===names[i]).length;
  const iconArrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>';
  const row = c => `<button class="case-row" data-case="${c.id}"><span class="row-date">${esc(dateLabel(c.date))}</span><span class="row-procedure"><strong>${esc(c.proc)}</strong><small>${esc(c.side)} · ${esc(c.code)}</small></span><span class="row-role">${esc(c.role)}</span><span class="row-duration">${c.minutes} min</span>${iconArrow}</button>`;
  function render() {
    const surgeon = cases.filter(c=>c.role.startsWith('Cirujano')).length;
    const hours = (cases.reduce((sum,c)=>sum+c.minutes,0)/60).toLocaleString('es-CL',{maximumFractionDigits:1});
    $$('[data-stat="total"]').forEach(n=>n.textContent=cases.length);
    $$('[data-stat="surgeon"]').forEach(n=>n.textContent=surgeon);
    $$('[data-stat="hours"]').forEach(n=>n.textContent=hours);
    $$('[data-stat="month"]').forEach(n=>n.textContent=cases.filter(c=>c.date.startsWith('2026-10')).length);
    $$('[data-stat="goals"]').forEach(n=>n.textContent=names.filter((_,i)=>count(i)>=goals[i]).length);
    $$('[data-recent]').forEach(n=>n.innerHTML=cases.slice(0,4).map(row).join(''));
    $$('[data-goals]').forEach(n=>n.innerHTML=names.map((name,i)=>`<button class="goal-row" data-goal="${i}"><span class="goal-title">${esc(name)}</span><span class="goal-score"><b>${count(i)}</b><span> / ${goals[i]}</span></span><span class="goal-track"><i style="--progress:${Math.min(count(i)/goals[i],1)}"></i></span><span class="goal-percent">${Math.round(count(i)/goals[i]*100)}%</span>${iconArrow}</button>`).join(''));
    $$('[data-procedure-summary]').forEach(n=>n.innerHTML=names.map((name,i)=>`<div class="procedure-summary"><span>${esc(name)}</span><b>${count(i)}</b></div>`).join(''));
    $$('[data-monthly]').forEach(n=>n.innerHTML=[['Jul',0],['Ago',0],['Sep',cases.filter(c=>c.date.startsWith('2026-09')).length],['Oct',cases.filter(c=>c.date.startsWith('2026-10')).length]].map(([m,v])=>`<div class="month-column"><b>${v}</b><div class="month-track"><i style="--height:${Math.max(v,0)/14*100}%"></i></div><span>${m}</span></div>`).join(''));
    $$('[data-empty-state]').forEach(n=>n.hidden=cases.length>0);
    $$('[data-populated]').forEach(n=>n.hidden=cases.length===0);
    $$('[data-empty-toggle]').forEach(n=>n.textContent=cases.length?'Ver primer uso':'Ver con casos');
    renderPractice();filterRecords();
  }
  function filterRecords() {
    const q = $('#caseSearch').value.trim().toLocaleLowerCase('es');
    const selected = $('#roleFilter').value;
    const source=practiceScope?practiceCases(practiceScope.days,'').filter(c=>practiceScope.names.includes(c.proc)):cases;
    const list=source.filter(c=>roleMatches(c,selected)&&`${c.proc} ${c.diagnosis} ${c.code}`.toLocaleLowerCase('es').includes(q));
    if($('#practiceScope')){$('#practiceScope').hidden=!practiceScope;$('#practiceScopeText').textContent=practiceScope?practiceScope.label.replace(/ · [^·]+$/, '')+' · '+$('#roleFilter').selectedOptions[0].textContent:'';}
    $('#recordRows').innerHTML=list.map(row).join('');
    $('#recordCount').textContent=`${list.length} ${list.length===1?'caso':'casos'}`;
    $('#searchEmpty').hidden=list.length>0;
  }
  function show(name, moveFocus = true) {
    section=name;
    $$('[data-section]').forEach(n=>n.hidden=n.dataset.section!==name);
    $$('[data-nav]').forEach(n=>{const active=n.dataset.nav===name;n.classList.toggle('active',active);if(active)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');});
    const heading=$(`[data-section="${name}"] h1`); if(heading && moveFocus){heading.tabIndex=-1; heading.focus({preventScroll:true});}
    window.scrollTo({top:0,behavior:'instant'});
  }
  function notify(text){ $('#feedback').textContent=text; $('#feedback').hidden=false; clearTimeout(notify.timer); notify.timer=setTimeout(()=>{$('#feedback').hidden=true;},4200); }
  function newCase(c=null) {
    const form=$('#prototypeForm'); form.reset(); editId=c?.id??null;
    $('#registerTitle').textContent=c?'Editar caso':'Registrar caso';
    $('#saveButton').textContent=c?'Guardar cambios':'Guardar caso';
    for(const [k,v] of Object.entries(c||draft))if(form.elements[k])form.elements[k].value=v;
    if(!form.elements.date.value) form.elements.date.value='2026-10-02';
    $('#draftNote').textContent=Object.keys(draft).length&&!c?'Borrador recuperado durante esta visita.':'Los campos marcados con * son obligatorios.';
    $('#registration').showModal();
  }
  function detail(id){const c=cases.find(c=>c.id===id);if(!c)return; $('#detailTitle').textContent=c.proc;$('#detailContent').innerHTML=`<p class="detail-code">${esc(c.code)} · ${esc(dateLabel(c.date))}</p><dl><dt>Diagnóstico</dt><dd>${esc(c.diagnosis)}</dd><dt>Mi rol</dt><dd>${esc(c.role)}</dd><dt>Lateralidad</dt><dd>${esc(c.side)}</dd><dt>Abordaje</dt><dd>${esc(c.approach)}</dd><dt>Duración</dt><dd>${c.minutes} minutos</dd></dl>`; $('#editCase').dataset.id=id;$('#caseDetail').showModal();}
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-nav]');if(nav)show(nav.dataset.nav);
    if(e.target.closest('[data-new]'))newCase();
    const c=e.target.closest('[data-case]');if(c)detail(Number(c.dataset.case));
    const goal=e.target.closest('[data-goal]');if(goal){practiceScope=null;show('records');$('#roleFilter').value='';$('#caseSearch').value=names[Number(goal.dataset.goal)];filterRecords();}
    const tile=e.target.closest('[data-practice]');if(tile){const days=$('#practicePeriod').value,role=$('#practiceRole').value;const ranked=names.map((name,i)=>({name,i,value:practiceCases(days,role).filter(c=>c.proc===name).length})).filter(c=>c.value).sort((a,b)=>b.value-a.value||a.i-b.i);const selected=tile.dataset.practice==='other'?ranked.slice(5).map(c=>c.name):[names[Number(tile.dataset.practice)]];practiceScope={days,role,names:selected,label:`${tile.dataset.practice==='other'?'Otros procedimientos':selected[0]} · ${$('#practicePeriod').selectedOptions[0].textContent} · ${$('#practiceRole').selectedOptions[0].textContent}`};$('#caseSearch').value='';$('#roleFilter').value=role;filterRecords();show('records');}
    const close=e.target.closest('[data-close]');if(close)close.closest('dialog').close();
    if(e.target.closest('[data-empty-toggle]')){practiceScope=null;cases=cases.length?[]:fixture.map(c=>({...c}));render();show('overview');notify(cases.length?'Casos ficticios restaurados.':'Así se ve la primera visita, sin casos.');}
    if(e.target.closest('[data-reset-search]')){practiceScope=null;$('#caseSearch').value='';$('#roleFilter').value='';filterRecords();}
    if(e.target.closest('[data-back]'))window.top.location.href='index.html';
  });
  $('#caseSearch').addEventListener('input',filterRecords); $('#roleFilter').addEventListener('change',filterRecords);
  $('#editCase').addEventListener('click',()=>{const c=cases.find(c=>c.id===Number($('#editCase').dataset.id));$('#caseDetail').close();newCase(c);});
  $('#prototypeForm').addEventListener('input',e=>{if(!editId){draft[e.target.name]=e.target.value;$('#draftNote').textContent='Borrador conservado durante esta visita.';}});
  $('#prototypeForm').addEventListener('submit',e=>{
    e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;
    const record=Object.fromEntries(new FormData(form));record.minutes=Number(record.minutes)||0;
    record.id=editId||Math.max(0,...cases.map(c=>c.id))+1;record.code=editId?cases.find(c=>c.id===editId).code:`CIR-${String(record.id).padStart(4,'0')}`;
    if(editId)cases=cases.map(c=>c.id===editId?record:c);else cases.unshift(record);
    for(const k of Object.keys(draft))delete draft[k]; practiceScope=null;$('#registration').close();render();show('records');$('#caseSearch').value='';$('#roleFilter').value='';filterRecords();notify(`${record.code} ${editId?'actualizado':'registrado'} en esta maqueta. Datos solo en memoria.`);
  });
  $('#goalsForm').addEventListener('submit',e=>{e.preventDefault();$$('[name="goal"]',e.currentTarget).forEach((n,i)=>goals[i]=Number(n.value));render();notify('Metas actualizadas en esta maqueta.');});
  $('#goalInputs').innerHTML=names.map((n,i)=>`<label>${esc(n)}<input name="goal" type="number" min="1" max="999" required value="${goals[i]}"></label>`).join('');
  $('#procedureSelect').innerHTML='<option value="">Elegir procedimiento</option>'+names.map(n=>`<option>${esc(n)}</option>`).join('');
  $('#roleFilter').innerHTML='<option value="">Todos los roles</option>'+roles.map(n=>`<option>${esc(n)}</option>`).join('');
  if($('#practiceTiles')){ $('#roleFilter').insertAdjacentHTML('beforeend','<option value="surgeon">Como cirujano</option>');$('.filters').insertAdjacentHTML('afterend','<div id="practiceScope" class="practice-scope" hidden><span id="practiceScopeText"></span><button type="button" class="text-button" data-reset-search>Quitar filtros</button></div>');$('#practicePeriod').addEventListener('change',renderPractice);$('#practiceRole').addEventListener('change',renderPractice); }
  $('#prototypeForm select[name="role"]').innerHTML='<option value="">Elegir rol</option>'+roles.map(n=>`<option>${esc(n)}</option>`).join('');
  if(new URLSearchParams(location.search).has('embedded'))document.body.classList.add('embedded');
  if(new URLSearchParams(location.search).has('empty'))cases=[];
  render();show(section, false);
})();
