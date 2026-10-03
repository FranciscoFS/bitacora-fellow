/* Frequency of principal procedures. Local dates and real store data only. */
window.BF = window.BF || {};
(function () {
  const { $, esc, todayISO, fmtDate } = BF.util;
  const S = BF.store;

  function dateRange(period, today = todayISO()) {
    if (period === 'all') return { desde: '', hasta: '' };
    const date = new Date(today + 'T12:00:00');
    date.setDate(date.getDate() - (period === '84' ? 83 : 27));
    const desde = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    return { desde, hasta: today };
  }

  function matches(c, scope) {
    if (scope.desde && (!c.fecha || c.fecha < scope.desde)) return false;
    if (scope.hasta && (!c.fecha || c.fecha > scope.hasta)) return false;
    if (scope.role === 'surgeon' ? !S.isSurgeon(c) : scope.role && c.rol !== scope.role) return false;
    return !scope.procedures || scope.procedures.includes(c.procedimientoPrincipal || 'Sin procedimiento');
  }

  function summarize(cases, scope) {
    const selected = cases.filter(c => matches(c, scope));
    const counts = new Map();
    selected.forEach(c => { const name = c.procedimientoPrincipal || 'Sin procedimiento'; counts.set(name, (counts.get(name) || 0)+1); });
    const procedures = [...counts].map(([name,value]) => ({ name,value })).sort((a,b) => b.value-a.value || a.name.localeCompare(b.name,'es'));
    const tiles = procedures.slice(0,5).map(p => ({ ...p, procedures: [p.name] }));
    if (procedures.length > 5) tiles.push({ name:'Otros procedimientos', value:procedures.slice(5).reduce((sum,p)=>sum+p.value,0), procedures:procedures.slice(5).map(p=>p.name) });
    return { total:selected.length, procedures, tiles };
  }

  function layout(tiles, aspect = 2) {
    const boxes = [];
    function split(items, x,y,w,h) {
      if (!items.length) return;
      if (items.length === 1) { boxes.push({ ...items[0], x,y,w,h }); return; }
      const sum = items.reduce((s,p)=>s+p.value,0);
      let cut=1, left=items[0].value;
      while (cut<items.length-1 && Math.abs(left+items[cut].value-sum/2)<Math.abs(left-sum/2)) left+=items[cut++].value;
      const ratio=left/sum;
      if(w*aspect>=h) { split(items.slice(0,cut),x,y,w*ratio,h);split(items.slice(cut),x+w*ratio,y,w*(1-ratio),h); }
      else { split(items.slice(0,cut),x,y,w,h*ratio);split(items.slice(cut),x,y+h*ratio,w,h*(1-ratio)); }
    }
    split(tiles,0,0,100,100);
    return boxes;
  }

  let currentScope, currentSummary;
  function render() {
    currentScope = { ...dateRange($('#practicePeriod').value), role:$('#practiceRole').value };
    currentSummary = summarize(S.all(), currentScope);
    const { total, tiles, procedures } = currentSummary;
    const period = $('#practicePeriod').selectedOptions[0].textContent;
    const role = $('#practiceRole').selectedOptions[0].textContent;
    $('#practiceContext').textContent = `${total} ${total === 1 ? 'caso' : 'casos'}`;
    $('#practiceContext').title = `${period} · ${role}`;
    const host = $('#practiceTiles');
    const width = host.clientWidth;
    const boxes = layout(tiles, width ? width / 320 : 2);
    const needsRows = total < 5 || tiles.length < 3 || boxes.some(p => {
      const tileWidth = p.w * width / 100, tileHeight = p.h * 320 / 100;
      const labelCapacity = Math.floor((tileWidth - 28) / 8) * Math.floor((tileHeight - 70) / 20);
      return tileWidth < 145 || tileHeight < 100 || p.name.length > labelCapacity;
    });
    host.classList.toggle('practice-small', needsRows);
    const max = Math.max(1,...tiles.map(p=>p.value));
    host.innerHTML = boxes.map((p,i)=>`<button class="practice-tile" type="button" data-practice-index="${i}" data-practice-tone="${Math.min(3,Math.floor((1-p.value/max)*4))}" style="--x:${p.x}%;--y:${p.y}%;--w:${p.w}%;--h:${p.h}%;--bar:${p.value/max*100}%"><strong>${esc(p.name)}</strong><span>${p.value} ${p.value===1?'caso':'casos'} <small>· ${Math.round(p.value/total*100)}%</small></span></button>`).join('') || '<p class="empty">No hay casos en este período y participación. Cambia los filtros o registra un caso.</p>';
    $('#practiceAll').disabled = !total;
  }
  function openScope(procedures, name) {
    const label = `${name} · ${$('#practicePeriod').selectedOptions[0].textContent} · ${$('#practiceRole').selectedOptions[0].textContent}`;
    BF.bitacora.setScope({ ...currentScope, procedures }, label);
    BF.app.show('bitacora');
    $('#view-bitacora h2').tabIndex=-1;$('#view-bitacora h2').focus({preventScroll:true});
  }
  function init() {
    $('#practiceRole').innerHTML = '<option value="">Todos los roles</option><option value="surgeon">Como cirujano</option>'+BF.CONFIG.ROLES.map(r=>`<option>${esc(r)}</option>`).join('');
    $('#practicePeriod').addEventListener('change',render);
    $('#practiceRole').addEventListener('change',render);
    $('#practiceTiles').addEventListener('click',e=>{
      const button=e.target.closest('[data-practice-index]');if(!button)return;
      // The layout preserves tile order; index refers to that same rendered list.
      const tile=layout(currentSummary.tiles)[Number(button.dataset.practiceIndex)];
      if(tile)openScope(tile.procedures,tile.name);
    });
    $('#practiceAll').addEventListener('click',()=>openScope(undefined,'Todos los procedimientos'));
    S.on('change',render);
    // Width changes when switching layout or returning from another view.
    if (typeof ResizeObserver !== 'undefined') {
      let previousWidth = -1;
      new ResizeObserver(([entry]) => {
        const width = Math.round(entry.contentRect.width);
        if (width && width !== previousWidth) { previousWidth = width; render(); }
      }).observe($('#practiceTiles'));
    }
    render();
  }
  BF.practice = { init, render, dateRange, matches, summarize, layout };
})();
