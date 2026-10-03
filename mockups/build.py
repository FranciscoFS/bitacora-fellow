"""Generate four independent, static prototype pages. No application files touched."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
icons = {
    'overview': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    'records': '<path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"/>',
    'goals': '<path d="M4 20V12m5 8V8m5 12V4m5 16V10"/>',
    'settings': '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'arrow': '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    'close': '<path d="m6 6 12 12M18 6 6 18"/>'
}
def svg(name): return f'<svg viewBox="0 0 24 24" aria-hidden="true">{icons[name]}</svg>'
def primary(text='Registrar caso'): return f'<button type="button" class="primary" data-new>{svg("plus")}{text}</button>'
def nav(with_icons=False):
    return '<nav class="nav" aria-label="Secciones">'+''.join(f'<button type="button" data-nav="{k}">{svg(k) if with_icons else ""}{n}</button>' for k,n in [('overview','Inicio'),('records','Bitácora'),('goals','Metas'),('settings','Ajustes')])+'</nav>'
def logo(): return '<div class="logo"><span class="logo-mark" aria-hidden="true">BF</span><div><b>Bitácora Fellow</b><small>Cirugía de rodilla · UC Chile</small></div></div>'
state='<span class="local-state">En este dispositivo</span>'
def title(text,action,heading='h2'): return f'<div class="section-title"><{heading}>{text}</{heading}><button class="text-button" type="button" data-nav="{action}">Ver {"bitácora" if action=="records" else "metas"} {svg("arrow")}</button></div>'
recent='<div data-recent></div>'
goals='<div data-goals></div>'
empty='''<div class="empty-start" data-empty-state hidden><h2>Tu primera cirugía empieza aquí.</h2><p>Guarda fecha, diagnóstico y procedimiento. Puedes completar los detalles del caso más adelante.</p>'''+primary('Registrar mi primer caso')+'''<div class="start-list"><div class="start-item"><div><h3>¿Ya tienes una bitácora?</h3><p>Conserva tu trabajo y continúa desde tus registros anteriores.</p></div><button class="secondary" type="button" data-nav="settings">Ver cómo recuperarla</button></div><div class="start-item"><div><h3>Define tus metas</h3><p>Establece tu exposición objetivo por procedimiento.</p></div><button class="secondary" type="button" data-nav="goals">Configurar metas</button></div></div></div>'''
footer='''<footer class="prototype-footer"><span>Maqueta interactiva · Datos ficticios</span><div><button type="button" data-empty-toggle>Ver primer uso</button><button type="button" data-back>Comparar estilos</button></div></footer>'''
other_sections='''
<section data-section="records" hidden>
<div class="head-row"><div><h1>Bitácora</h1><p><span id="recordCount"></span> · Abre un caso para consultar o editar.</p></div>'''+primary()+'''</div>
<div class="filters"><label>Buscar casos<input type="search" id="caseSearch" placeholder="Procedimiento, diagnóstico o código…"></label><label>Mi participación<select id="roleFilter"></select></label></div>
<div class="record-heading"><span>Fecha</span><span>Procedimiento</span><span>Mi rol</span><span>Duración</span></div><div id="recordRows"></div>
<div class="no-results" id="searchEmpty" hidden><p>No hay casos para esta búsqueda.</p><button class="secondary" type="button" data-reset-search>Ver todos los casos</button></div>
</section>
<section data-section="goals" hidden>
<div class="head-row"><div><h1>Metas del fellowship</h1><p>Exposición acumulada por procedimiento.</p></div>'''+primary()+'''</div>
<p class="scope-note">Incluye todos los roles y todos los casos. Toca un procedimiento para ver sus registros.</p>
<div data-goals></div><details class="goal-edit"><summary>Editar objetivos</summary><form id="goalsForm"><div id="goalInputs"></div><button class="primary" type="submit">Guardar metas</button></form></details>
</section>
<section data-section="settings" hidden>
<div class="head-row"><div><h1>Ajustes</h1><p>Tus registros, tu respaldo y tu apariencia.</p></div>'''+primary()+'''</div>
<div class="settings-sheet"><h2>Guardado y sincronización</h2>'''+state+'''<p class="settings-copy">En la app puedes registrar sin conexión y sincronizar con un repositorio privado de GitHub. Esta maqueta no se conecta a GitHub ni guarda datos al cerrar.</p></div>
<div class="settings-sheet"><h2>¿Ya tienes una bitácora?</h2><p>En la app puedes importar tu respaldo JSON o conectar el repositorio privado que ya utilizas. Estos pasos se conservan al implementar el estilo elegido.</p></div>
<div class="settings-sheet"><h2>Apariencia</h2><p>Estas cuatro propuestas parten del modo claro, con amarillo para acciones y celeste como complemento.</p></div>
</section>'''
dialogs='''
<dialog id="registration" class="register-dialog" aria-labelledby="registerTitle"><div class="dialog-top"><h2 id="registerTitle">Registrar caso</h2><button type="button" class="close-button" data-close aria-label="Cerrar registro">'''+svg('close')+'''</button></div><div class="dialog-content"><p class="form-note" id="draftNote">Los campos marcados con * son obligatorios.</p><form id="prototypeForm"><div class="form-grid">
<label>Fecha *<input type="date" name="date" required></label><label>Lateralidad<select name="side"><option>Sin registrar</option><option>Derecha</option><option>Izquierda</option><option>Bilateral</option></select></label>
<label class="full">Diagnóstico *<input name="diagnosis" required placeholder="Sin nombres ni datos identificatorios" autocomplete="off"></label>
<label class="full">Procedimiento principal *<select name="proc" id="procedureSelect" required></select></label>
<label>Mi rol *<select name="role" required></select></label><label>Abordaje *<select name="approach" required><option value="">Elegir abordaje</option><option>Artroscópico</option><option>Abierto</option><option>Percutáneo</option><option>Mixto</option></select></label>
<label class="full">Duración en minutos · Opcional<input name="minutes" type="number" min="0" max="900" inputmode="numeric"></label>
</div><div class="dialog-actions"><button type="button" class="text-button" data-close>Volver</button><button type="submit" class="primary" id="saveButton">Guardar caso</button></div></form><p class="prototype-note">Prueba con información ficticia. Los cambios de esta maqueta viven solo durante esta visita. El formulario completo y sus detalles se conservan en la app.</p></div></dialog>
<dialog id="caseDetail" class="detail-dialog" aria-labelledby="detailTitle"><div class="dialog-top"><h2 id="detailTitle"></h2><button type="button" class="close-button" data-close aria-label="Cerrar detalle">'''+svg('close')+'''</button></div><div class="dialog-content"><div id="detailContent"></div><div class="dialog-actions"><button type="button" class="text-button" data-close>Cerrar</button><button type="button" class="primary" id="editCase">Editar caso</button></div></div></dialog>
<div id="feedback" role="status" hidden></div>'''

station='''<div class="shell"><aside class="side">'''+logo()+nav(True)+'''<div class="side-note">Tu experiencia quirúrgica,<br>caso a caso.</div></aside><div class="workspace"><header class="workspace-top"><span>Fellowship de cirugía de rodilla</span>'''+state+'''</header><main class="content" id="main"><section data-section="overview"><div class="head-row"><div><h1>Inicio</h1><p>Viernes, 2 de octubre de 2026</p></div>'''+primary()+'''</div>'''+empty+'''<div data-populated><div class="quick-stats"><div><b data-stat="total"></b><span>casos</span></div><div><b data-stat="surgeon"></b><span>como cirujano</span></div><div><b data-stat="hours"></b><span>h de quirófano</span></div><div><b data-stat="month"></b><span>en octubre</span></div></div><div class="desk-grid"><div class="sheet">'''+title('Casos recientes','records')+recent+'''<div class="lower"><div><h2>Actividad mensual</h2><div class="month-chart" data-monthly aria-label="Casos por mes"></div></div><div class="short-note"><h2>Registro esencial</h2><p>Fecha, diagnóstico, procedimiento y tu participación. Los detalles pueden esperar.</p></div></div></div><div class="sheet">'''+title('Exposición acumulada','goals')+'''<p class="scope-note">Todos los casos, en cualquier rol.</p>'''+goals+'''</div></div></div></section>'''+other_sections+footer+'''</main></div></div>'''
pulse='''<header class="top">'''+logo()+nav()+'''</header><main class="content" id="main"><section data-section="overview"><div class="head-row"><div><h1>Actividad quirúrgica</h1><p>Tu registro de cirugía de rodilla.</p></div>'''+primary()+'''</div>'''+empty+'''<div data-populated><div class="pulse-band"><div><b data-stat="total"></b><span>casos registrados</span></div><div><b data-stat="surgeon"></b><span>como cirujano</span></div><div><b data-stat="hours"></b><span>horas de quirófano</span></div><div><b data-stat="month"></b><span>casos en octubre</span></div></div><div class="pulse-columns"><div>'''+title('Últimos registros','records')+recent+'''<div class="lower"><div><h2>Casos por mes</h2><div class="month-chart" data-monthly aria-label="Casos por mes"></div></div><div><h2>Por procedimiento</h2><div data-procedure-summary></div></div></div></div><div class="goals-panel">'''+title('Progreso del fellowship','goals')+'''<p class="scope-note">Exposición acumulada · Todos los roles</p>'''+goals+'''</div></div></div></section>'''+other_sections+footer+'''</main>'''
practice='''<section class="practice-panel" aria-labelledby="practiceTitle"><div class="section-title"><h2 id="practiceTitle">Tu práctica reciente</h2></div><p class="scope-note">En qué procedimientos estás acumulando experiencia.</p><div class="practice-controls"><label>Período<select id="practicePeriod"><option value="28">Últimas 4 semanas</option><option value="84">Últimas 12 semanas</option><option value="all">Todo el historial</option></select></label><label>Participación<select id="practiceRole"><option value="">Todos los roles</option><option value="surgeon">Como cirujano</option><option>Cirujano supervisado</option><option>Cirujano independiente</option><option>Primer ayudante</option><option>Segundo ayudante</option></select></label></div><p id="practiceContext" class="practice-context" role="status"></p><div id="practiceTiles" class="practice-tiles"></div><p class="scope-note">Mayor superficie = más casos. Abre un procedimiento para consultar sus registros. Frecuencia registrada, no nivel de competencia.</p><small class="muted">Demostración con fecha de referencia: 2 oct 2026.</small></section>'''
daybook='''<header class="top">'''+logo()+nav()+'''</header><main class="content" id="main"><section data-section="overview"><div class="head-row"><div><h1>Tu bitácora</h1><p>Retoma donde quedaste o registra la cirugía de hoy.</p></div>'''+primary()+'''</div>'''+empty+'''<div data-populated><div class="daybook-grid"><div class="activity-column"><div class="activity">'''+title('Lo más reciente','records')+recent+'''</div>'''+practice+'''<div class="month-panel"><div class="section-title"><h2>Tu actividad</h2><span class="muted">Casos por mes</span></div><div class="month-chart" data-monthly aria-label="Casos por mes"></div></div></div><aside class="goals-panel"><div class="personal-summary"><div><b data-stat="total"></b><span>casos registrados</span></div><div><b data-stat="surgeon"></b><span>como cirujano</span></div><div><b data-stat="hours"></b><span>horas</span></div></div>'''+title('Tus metas','goals')+'''<p class="scope-note">Cada procedimiento suma experiencia.<br>Conteo acumulado en cualquier rol.</p>'''+goals+'''</aside></div></div></section>'''+other_sections+footer+'''</main>'''
atlas='''<header class="top">'''+logo()+nav()+'''</header><main class="content" id="main"><section data-section="overview">'''+empty+'''<div data-populated><div class="overview-split"><aside class="atlas-rail"><h1>Tu experiencia<br>quirúrgica.</h1><p>Registra una cirugía y revisa cómo contribuye a tu experiencia.</p>'''+primary()+'''<div class="rail-stats"><div class="rail-stat"><span>Casos registrados</span><b data-stat="total"></b></div><div class="rail-stat"><span>Como cirujano</span><b data-stat="surgeon"></b></div><div class="rail-stat"><span>Horas de quirófano</span><b data-stat="hours"></b></div><div class="rail-stat"><span>Metas cumplidas</span><b><span data-stat="goals"></span> / 6</b></div></div><p class="rail-foot">Las metas cuentan toda tu participación.<br>Objetivos editables según tu programa.</p></aside><div class="atlas-main">'''+title('Mapa de experiencia','goals')+'''<p class="scope-note">Todos los casos · Todos los roles · Selecciona un procedimiento para consultar sus registros.</p><div class="goal-map" data-goals></div><div class="atlas-history">'''+title('Últimos casos','records')+recent+'''</div></div></div></div></section>'''+other_sections+footer+'''</main>'''

variants = [
    ('station','Estación clínica',station,'Clinical desktop with a persistent navy rail, dense white work surface and compact status strip.','Side rail 212px, register button at upper right, recent cases left and cumulative goals right.'),
    ('pulse','Pulso',pulse,'Swiss information design with condensed Barlow, flat sky-blue data band and sharp yellow tools.','Top navigation, 68px activity title, visible yellow register action, asymmetric records and goals columns.'),
    ('daybook','Cuaderno digital',daybook,'Personal activity rhythm on a cool-blue surface, rounded Outfit and one white working sheet.','Activity left, personal overview and goals right, yellow register action above the timeline.'),
    ('atlas','Atlas académico',atlas,'Academic exposure map with a pale-blue navigation plane and ruled procedure matrix.','Register action and summary on left rail, six procedure goals in a matrix on the right, recent cases below.')
]
for slug,name,body,world,viewport in variants:
    contract=f'''<!-- THESIS: Four user-requested alternatives; this one explores {name}. Task: register a just-finished case.
OWN-WORLD: {world}
STORY: Register, inspect records, review cumulative exposure. Same fictional dataset and flows across variants.
FIRST VIEWPORT: {viewport}
FORM: Explicit four-variant user brief overrides single-direction selection. Seed 75aaaece; grounded pool included clinical console, Swiss data, activity log, training map, theatre schedule, personal daybook, teaching roster. Daybook was assigned sixth.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md -->'''
    html=f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>{name} · Bitácora Fellow</title><link rel="stylesheet" href="assets/prototype.css?v=4"></head><body class="{slug}">{contract}
<a class="skip" href="#main">Saltar al contenido</a>
{body}
{dialogs}
<script src="assets/prototype.js?v=4"></script></body></html>'''
    (ROOT/f'{slug}.html').write_text(html,encoding='utf-8')
print('Generated:', ', '.join(slug+'.html' for slug,*_ in variants))
