(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const descriptions={station:['Estación clínica','Una estación de trabajo: navegación lateral estable, registros compactos y metas a la vista. Prioriza rapidez y familiaridad.'],pulse:['Pulso','Tipografía condensada, bloques celestes y una grilla de alto contraste. Más carácter visual, con acciones directas y datos legibles.'],daybook:['Cuaderno digital','Actividad reciente en una superficie personal y amable. Una lista fácil de reconocer y metas que acompañan el registro.'],atlas:['Atlas académico','Un mapa de exposición por procedimiento. El registro vive en la columna celeste y las metas se leen como una matriz.']};
  let comparing=false;
  function update(){
    const a=$('#leftStyle').value,b=$('#rightStyle').value,empty=$('#previewState').value==='empty';
    document.querySelectorAll('[data-style]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.style===a)));
    $('#directionName').textContent=comparing?'Comparación de propuestas':descriptions[a][0];
    $('#directionDescription').textContent=comparing?'Misma información y tareas. Compara la distribución, la lectura y la sensación de trabajo.':descriptions[a][1];
    $('#openFull').href=a+'.html'+(empty?'?empty=1':'');
    for(const [id,name] of [['leftFrame',a],['rightFrame',b]]){const url=name+'.html?embedded=1'+(empty?'&empty=1':'');const frame=$('#'+id);if(frame.getAttribute('src')!==url)frame.src=url;frame.title=descriptions[name][0]+': maqueta interactiva';}
    $('#previewGrid').classList.toggle('comparing',comparing);$('#secondPreview').hidden=!comparing;$('.compare-select').hidden=!comparing;
    $('#compareMode').setAttribute('aria-pressed',String(comparing));$('#compareMode').textContent=comparing?'Ver una propuesta':'Comparar dos';
  }
  document.querySelectorAll('[data-style]').forEach(n=>n.addEventListener('click',()=>{$('#leftStyle').value=n.dataset.style;update();}));
  $('#compareMode').addEventListener('click',()=>{comparing=!comparing;update();});
  for(const id of ['leftStyle','rightStyle','previewState'])$('#'+id).addEventListener('change',update);
  $('#leftStyle').value='daybook';
  update();
})();
