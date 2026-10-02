#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convierte la planilla vieja (data/Old_answers.csv) al JSON que importa la app.

Decisiones acordadas:
  - 1er Cirujano -> Cirujano (supervisado) | 2do -> Primer ayudante | 3er -> Segundo ayudante
  - Lateralidad: se deja vacía, sin deducir nada.
  - "PTR rosa" = asistida por robot ROSA -> "Prótesis total con navegación/robótica".
  - Se DESCARTAN los RUT / ficha (datos identificatorios de pacientes).

Uso:  python tools/importar-legado.py
Salida: data/bitacora-legado.json  (+ reporte por consola)
"""

import csv
import io
import json
import os
import re
import hashlib
import unicodedata
from collections import Counter
from datetime import datetime

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRADA = os.path.join(RAIZ, "data", "Old_answers.csv")
SALIDA = os.path.join(RAIZ, "data", "bitacora-legado.json")

# ─────────────────────────── catálogos de la app ───────────────────────────

ROL = {
    "1er cirujano": "Cirujano (supervisado)",
    "2do cirujano": "Primer ayudante",
    "3er cirujano": "Segundo ayudante",
    "3er cirujano / ayudante": "Segundo ayudante",
}

CATEGORIA = {
    "ligamentaria": "Reconstrucción de LCA",
    "meniscal": "Meniscectomía parcial",
    "artroplastia": "Prótesis total de rodilla (PTR)",
    "fractura": "Fractura Platillos Tibiales",
    "aseo": "Toilette articular por infección",
    "condral": "Condroplastia / regularización",
    "osteotomia": "Osteotomía tibial alta (HTO)",
    "infeccion": "Toilette articular por infección",
    "artrolisis + mba": "Artrofibrosis: liberación artroscópica",
}

# Reglas ordenadas: la primera que coincide define el procedimiento principal.
# (patrón, procedimiento, confianza)  confianza: ok | dudoso
REGLAS = [
    (r"mutars", "Recambio protésico de 2 componentes", "dudoso"),
    (r"espaciador", "Recambio de espaciador por IPR", "ok"),
    (r"\baseo\b|cambio de vac|toilette|lavado", "Toilette articular por infección", "ok"),
    (r"revision.*(lca|ligament)", "Revisión de reconstrucción de LCA", "ok"),
    (r"artrolisis|artrofibrosis|rigidez|\bmba\b", "Artrofibrosis: liberación artroscópica", "ok"),
    (r"reinsercion con anclas|anclas|avulsiva|espinas tibiales",
     "Fractura Avulsiva Espinas Tibiales LCA / LCP", "ok"),
    (r"periprotesica", "Fractura Periprotésica", "ok"),
    (r"platillos|meseta", "Fractura Platillos Tibiales", "ok"),
    (r"\bots\b|osteosintesis|tornillos canulados", "Fractura Platillos Tibiales", "dudoso"),
    (r"red \+|reduccion", "Fractura Platillos Tibiales", "dudoso"),
    (r"ttr|fulkerson|transposicion.*tuberosidad|elmslie",
     "Osteotomía de tuberosidad tibial (Fulkerson / Elmslie)", "ok"),
    (r"trocleoplastia", "Trocleoplastia", "ok"),
    (r"ott.*femoral|osteotomia femoral|\bdfo\b", "Osteotomía femoral distal (DFO)", "ok"),
    (r"\bott\b|osteotomi|valguizante", "Osteotomía tibial alta (HTO)", "ok"),
    (r"patelofemoral|protesis pf", "Artroplastia patelofemoral", "ok"),
    (r"unimedial|unicompartimental|\bpuc\b", "Prótesis unicompartimental (PUC)", "ok"),
    (r"\brosa\b", "Prótesis total con navegación/robótica", "ok"),
    (r"\bptr\b|protesis total|artroplastia total|\batr\b|rodilla total",
     "Prótesis total de rodilla (PTR)", "ok"),
    (r"rlpfm|mpfl|lpfm", "Estabilización de rótula (MPFL)", "ok"),
    # Después de rótula: "RLPFM + MicroFx aumentado" es una plástica con aumento,
    # no un caso de microfracturas.
    (r"microfx|microfractura", "Microfracturas", "ok"),
    # La reconstrucción de LCA es el procedimiento mayor: si el caso además tuvo
    # gesto meniscal, el menisco va como asociado y no como principal.
    (r"rlca|ligamentoplastia|reconstruccion.*lca|plastia.*lca", "Reconstrucción de LCA", "ok"),
    (r"reinsercion.*(menisc|raiz|mm|ml)|sutura.*(menisc|mm|ml|raiz)|meniscoresis|all.?in.?side|dentro fuera|fuera dentro|tallado",
     "Reparación meniscal (sutura)", "ok"),
    (r"reinsercion", "Otro (especificar en notas)", "dudoso"),
    (r"menisectomia subtotal|meniscectomia subtotal", "Meniscectomía subtotal/total", "ok"),
    (r"\bmap\b|menisectomia|meniscectomia|asa de balde", "Meniscectomía parcial", "ok"),
    (r"quiste", "Bursectomía / quiste de Baker", "ok"),
    (r"sinovectomia", "Sinovectomía (artroscópica/abierta)", "ok"),
    (r"tendinosis|tendon patelar|tendon rotuliano|cuadricipital",
     "Tendón cuadricipital o rotuliano: reparación", "ok"),
    (r"reseccion|condrop|condral", "Condroplastia / regularización", "ok"),
    (r"artroscopia dg|artroscopia diagnostica|\bdg\b|diagnostica", "Artroscopia diagnóstica", "ok"),
]

# Gestos que se agregan como procedimientos asociados cuando aparecen junto a otro principal.
ASOCIADOS = [
    (r"\btea\b|\blet\b|tenodesis|esquina posterolateral",
     "Tenodesis extraarticular lateral (LET)"),
    (r"reinsercion.*(menisc|raiz|mm|ml)|sutura|meniscoresis|all.?in.?side|dentro fuera|fuera dentro|tallado|raiz",
     "Reparación meniscal (sutura)"),
    (r"\bmap\b|menisectomia|meniscectomia", "Meniscectomía parcial"),
    (r"microfx|microfractura", "Microfracturas"),
    (r"trocleoplastia", "Trocleoplastia"),
    (r"alargamiento lateral|liberacion lateral", "Luxación patelar: liberación lateral"),
    (r"quiste", "Bursectomía / quiste de Baker"),
    (r"artroscopia dg|diagnostica|\bdg\b", "Artroscopia diagnóstica"),
]

INJERTO = [
    (r"\bhth\b", "Autoinjerto HTH (hueso-tendón-hueso)"),
    (r"\bstg\b|isquiotibial", "Autoinjerto STG (isquiotibiales)"),
    (r"\balo\b|aloinjerto", "Aloinjerto"),
]

# Campos estructurados del formulario actual (el form los muestra como select,
# así que los valores tienen que coincidir EXACTAMENTE con las opciones).
INJERTO_APP = [
    (r"cuadricipital", "Tendón cuadricipital"),
    (r"\bhth\b|hueso.?tendon|tendon rotuliano", "Tendón rotuliano (HTH)"),
    (r"\bstg\b|isquiotibial|semitendinoso|gracilis", "Isquiotibiales"),
    (r"\balo\b|aloinjerto", "Aloinjerto"),
]

TECNICA_APP = [
    (r"all.?in.?side|todo dentro", "All-inside"),
    (r"dentro fuera|inside.?out", "Inside-out"),
    (r"fuera dentro|outside.?in", "Outside-in"),
]

# Diagnóstico inferido del procedimiento cuando el formulario viejo no lo registraba.
# Muy acotado a propósito: sólo mira tipo + procedimiento, NUNCA los comentarios.
# (Buscar en los comentarios producía falsos positivos, p. ej. "revisar quiste poplíteo".)
DX_INFERIDO = [
    (r"mutars|periprotesica", "Fractura periprotésica"),
    (r"protesis patelofemoral|patelofemoral", "Artrosis patelofemoral"),
    (r"\bptr\b|\batr\b|unimedial|protesis total|rodilla total", "Gonartrosis"),
    (r"rlpfm|mpfl", "Inestabilidad rotuliana"),
    (r"rlca|ligamentoplastia", "Rotura de LCA"),
    (r"menisc|\bmap\b", "Lesión meniscal"),
    (r"\bots\b|\bred \+|fractura", "Fractura"),
    (r"\baseo\b|infecc", "Infección articular"),
    (r"artrofibrosis|\bmba\b|artrolisis", "Artrofibrosis"),
    (r"sinovectomia", "Sinovitis"),
]

# Los 3 casos que no tenían ninguna pista: diagnósticos confirmados a mano.
# La clave es el procedimiento normalizado, tal como está en la planilla.
DX_MANUAL = {
    "reseccion @": "Lesión condral",
    "revision de lpfm con alo": "Inestabilidad rotuliana recidivante",
    "reseccion tendinosis tendon patelar": "Tendinopatía rotuliana",
}

# Vocabulario controlado de diagnósticos: el formulario viejo tenía ~60 formas
# distintas para ~15 diagnósticos reales. El texto original NUNCA se pierde:
# si cambia, se guarda en las notas del caso.
# El orden importa: lo más específico va primero.
DX_NORMALIZADO = [
    (r"infecc.*periprot|artritis septica.*protesis", "Infección periprotésica"),
    (r"fractura.*periprot|periprotesica", "Fractura periprotésica"),
    (r"artritis septica|infecc", "Infección articular"),
    (r"sinovitis", "Sinovitis"),
    (r"artrofibrosis", "Artrofibrosis"),
    (r"tendinopatia", "Tendinopatía rotuliana"),
    (r"rotura.*tendon|rotura.*tendon patelar", "Rotura del tendón rotuliano"),
    (r"inestabilidad|lpfm|ipfm", "Inestabilidad rotuliana"),
    (r"malalineamiento|genu varo|genu valgo", "Malalineamiento del eje"),
    (r"gonartrosis|artrosis medial|artrosis lateral|oa valgo", "Gonartrosis"),
    (r"artrosis patelofemoral|oa pf|artrosis pf", "Artrosis patelofemoral"),
    (r"condral", "Lesión condral"),
    (r"\blcm\b", "Lesión del LCM"),
    (r"avulsiv|espinas tibiales", "Fractura por avulsión"),
    (r"rotula", "Fractura de rótula"),
    (r"rotura.*lca|re rotura lca|\brlca\b", "Rotura de LCA"),
    (r"fractura|\bfx\b", "Fractura"),
    (r"menisc|balde|discoideo|radial|degenerativa|\bmm\b|\bml\b|\bme\b", "Lesión meniscal"),
]

# El texto del procedimiento a veces es ambiguo ("Reinsercion", "Red + OTS").
# Cuando el procedimiento queda genérico o sin mapear, el diagnóstico lo define.
DX_A_PROCEDIMIENTO = [
    (r"por avulsion|avulsiva", "Fractura Avulsiva Espinas Tibiales LCA / LCP"),
    (r"fractura de rotula|fx rotula", "Fractura de Rótula"),
    (r"\blcm\b", "Reparación / reconstrucción de LCM"),
]

PROCEDIMIENTOS_AMBIGUOS = {"", "Otro (especificar en notas)", "Fractura Platillos Tibiales"}

# "Otro" es un marcador de "no identificado", no un procedimiento: nunca va como asociado.
SIN_PROCEDIMIENTO = "Otro (especificar en notas)"

# Las 13 filas del formulario rico: columna -> (etiqueta, tabla de traducción)
RICAS = [
    (9, "Artroplastia", {"ptr primaria": "Prótesis total de rodilla (PTR)",
                         "protesis patelofemoral": "Artroplastia patelofemoral"}),
    (8, "Condral y osteotomías", {}),
    (5, "Gesto ligamentario", {"rlca primario": "Reconstrucción de LCA",
                               "rlpfm": "Estabilización de rótula (MPFL)",
                               "reinsercion con anclas": "Fractura Avulsiva Espinas Tibiales LCA / LCP"}),
    (11, "Trauma / infección / otros", {"sinovectomia": "Sinovectomía (artroscópica/abierta)",
                                        "reinsercion espinas tibiales": "Fractura Avulsiva Espinas Tibiales LCA / LCP",
                                        "reduccion + ots platillos tibiales": "Fractura Platillos Tibiales"}),
    (7, "Gesto meniscal", {"sutura meniscal all-inside": "Reparación meniscal (sutura)"}),
]

# ─────────────────────────── utilidades ───────────────────────────

def norm(s):
    """minúsculas, sin acentos, espacios colapsados: sólo para comparar."""
    s = unicodedata.normalize("NFKD", (s or "").lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", s.replace("_", " ")).strip()


def fecha_iso(v):
    """'2/06/2026' -> '2026-06-02'."""
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", (v or "").strip())
    return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}" if m else ""


def ts_iso(v):
    """'20/05/2026 13:43:18' -> '2026-05-20T13:43:18'."""
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$", (v or "").strip())
    if not m:
        return ""
    d, mo, y, h, mi, s = (int(x) for x in m.groups())
    return f"{y}-{mo:02d}-{d:02d}T{h:02d}:{mi:02d}:{s:02d}"


def clasificar(texto, categoria):
    """Devuelve (principal, asociados, confianza, injerto)."""
    t = norm(texto)
    principal, confianza, asociados = "", "sin-mapeo", []

    for pat, proc, conf in REGLAS:
        if re.search(pat, t):
            principal, confianza = proc, conf
            break

    if not principal and categoria:
        # El campo "Tipo de Cirugía" puede traer varios: "Ligamentaria, Meniscal".
        categorias = []
        for parte in (p.strip() for p in norm(categoria).split(",")):
            elegido = CATEGORIA.get(parte)
            if elegido and elegido not in categorias:
                categorias.append(elegido)
        if categorias:
            principal, confianza = categorias[0], "categoria"
            asociados = categorias[1:]

    for pat, proc in ASOCIADOS:
        if re.search(pat, t) and proc not in asociados and proc != principal:
            asociados.append(proc)

    injerto = ""
    for pat, val in INJERTO:
        if re.search(pat, t):
            injerto = val
            break
    return principal, asociados, confianza, injerto


def diagnostico_inferido(tipo, procedimiento, croquis):
    """Devuelve el diagnóstico deducible del procedimiento, o '' si no hay pista."""
    t = norm(procedimiento)
    if t in DX_MANUAL:
        return DX_MANUAL[t]
    texto = norm(f"{tipo} {procedimiento} {croquis}")
    for pat, val in DX_INFERIDO:
        if re.search(pat, texto):
            return val
    return ""


def procedimiento_por_diagnostico(principal, diagnostico):
    """Corrige el procedimiento cuando quedó ambiguo y el diagnóstico lo define.
    Ej.: "Reinsercion" + "Lesión del LCM" -> Reparación / reconstrucción de LCM."""
    if principal not in PROCEDIMIENTOS_AMBIGUOS:
        return principal
    t = norm(diagnostico)
    for pat, proc in DX_A_PROCEDIMIENTO:
        if re.search(pat, t):
            return proc
    return principal


def normalizar_diagnostico(texto):
    """Lleva el diagnóstico al vocabulario controlado. Devuelve (canónico, cambió)."""
    original = (texto or "").strip()
    if not original:
        return "", False
    t = norm(original)
    for pat, canonico in DX_NORMALIZADO:
        if re.search(pat, t):
            return canonico, canonico != original
    return original, False     # sin regla: se respeta tal cual


def injerto_de(valor):
    """'HTH' / 'STG (Isquiotibiales)' -> nombre completo. Si no reconoce, deja el texto original."""
    t = norm(valor)
    for pat, nombre in INJERTO:
        if re.search(pat, t):
            return nombre
    return valor.strip()


def injerto_app(texto):
    """Tipo de injerto en los valores exactos del select `injertoLca` de la app."""
    t = norm(texto)
    for pat, valor in INJERTO_APP:
        if re.search(pat, t):
            return valor
    return ""


def tecnica_app(texto):
    """Técnica de sutura meniscal en los valores del select `tecnicaMeniscal`."""
    t = norm(texto)
    hallados = [v for pat, v in TECNICA_APP if re.search(pat, t)]
    unicos = list(dict.fromkeys(hallados))          # sin repetir, conservando el orden
    if len(unicos) > 1:
        return "Mixta"                              # menciona más de una técnica
    return unicos[0] if unicos else ""


def rol_de(v):
    """Mapea el rol aceptando variantes largas: '1er Cirujano (Piel a piel o pasos principales)'."""
    t = norm(v)
    if not t:
        return ""
    for clave in sorted(ROL, key=len, reverse=True):
        if t.startswith(clave):
            return ROL[clave]
    return ""


def procedimiento_rico(fila):
    """Para las 13 filas del formulario rico: principal, asociados y detalle."""
    principal, asociados, detalle, confianza = "", [], [], "ok"
    for idx, etiqueta, tabla in RICAS:
        valor = fila[idx].strip()
        if not valor:
            continue
        detalle.append(f"{etiqueta}: {valor}")
        if principal:
            for pat, proc, _ in REGLAS:
                if re.search(pat, norm(valor)) and proc != principal and proc not in asociados:
                    asociados.append(proc)
                    break
            continue
        elegido = tabla.get(norm(valor))
        if not elegido:
            for pat, proc, conf in REGLAS:
                if re.search(pat, norm(valor)):
                    elegido, confianza = proc, conf
                    break
        if elegido:
            principal = elegido
        else:
            confianza = "dudoso"
    return principal, asociados, detalle, confianza


def id_estable(*partes):
    """Id determinista: reejecutar el script actualiza los casos en vez de duplicarlos."""
    return "legacy-" + hashlib.sha1("|".join(partes).encode("utf-8")).hexdigest()[:12]


# ─────────────────────────── conversión ───────────────────────────

def main():
    filas = list(csv.reader(io.StringIO(open(ENTRADA, "rb").read().decode("utf-8-sig"))))[1:]
    casos, dudosos, sin_procedimiento = [], [], []
    inferidos, sin_diagnostico, normalizados = [], [], []
    stats = Counter()

    for n, f in enumerate(filas):
        marca = ts_iso(f[0])
        es_rica = bool(f[3].strip())     # el formulario rico es el único que llena "Lateralidad"
        avisos = []

        if es_rica:
            stats["ricas"] += 1
            fecha = fecha_iso(f[1])
            lateralidad = f[3].strip()
            diagnostico = f[4].strip()
            rol = rol_de(f[12])
            principal, asociados, detalle, confianza = procedimiento_rico(f)
            injerto = injerto_de(f[6])
            pasos, aprendi = f[13].strip(), f[14].strip()
            crudo_proc = ""
            texto_clinico = " ".join([f[6].strip(), f[7].strip(), f[8].strip(),
                                      f[9].strip(), f[11].strip()])
        else:
            stats["simples"] += 1
            fecha = fecha_iso(f[16])
            lateralidad = ""
            diagnostico = f[23].strip()
            rol = rol_de(f[20])
            crudo_proc = f[19].strip()
            principal, asociados, confianza, injerto = clasificar(crudo_proc, f[18])
            detalle = []
            pasos, aprendi = f[21].strip(), f[22].strip()
            texto_clinico = crudo_proc

        # Campos estructurados que el formulario actual muestra como select.
        injerto_lca = injerto_app(texto_clinico)
        tecnica_men = tecnica_app(texto_clinico)
        if injerto_lca:
            stats["injerto_lca"] += 1
            injerto = ""        # el injerto pasó al campo estructurado: no se duplica
        if tecnica_men:
            stats["tecnica_meniscal"] += 1

        if f[17].strip():
            stats["rut_descartados"] += 1   # dato identificatorio: NO se copia
        if not fecha:
            avisos.append("sin fecha")
        if not rol:
            avisos.append("sin rol")

        # Si el formulario viejo no registró diagnóstico, se infiere del procedimiento
        # y se deja constancia en las notas de que fue inferido, no registrado.
        dx_inferido = False
        if not diagnostico:
            diagnostico = diagnostico_inferido(f[18] if not es_rica else "", crudo_proc, " ".join(detalle))
            if diagnostico:
                dx_inferido = True
                inferidos.append((n, fecha, crudo_proc or " / ".join(detalle), diagnostico))
            else:
                sin_diagnostico.append((n, fecha, (f[18].strip() + " · " + crudo_proc).strip(" ·")))

        # Unificación del vocabulario de diagnósticos (el texto original va a las notas)
        dx_original = diagnostico
        diagnostico, dx_cambio = normalizar_diagnostico(diagnostico)
        if dx_cambio:
            normalizados.append((n, dx_original, diagnostico))

        # El diagnóstico desambigua el procedimiento cuando el texto es genérico:
        # "Red + OTS" en una fractura de rótula, o "Reinsercion" de un LCM.
        # Va ANTES de asignar "Otro", si no el caso quedaría marcado como sin mapear.
        refinado = procedimiento_por_diagnostico(principal, diagnostico)
        if refinado != principal:
            if "procedimiento reasignado por el diagnóstico" not in avisos:
                avisos.append("procedimiento reasignado por el diagnóstico")
            principal = refinado

        if not principal:
            principal = "Otro (especificar en notas)"
            avisos.append("procedimiento sin mapear")
            sin_procedimiento.append((n, crudo_proc or f[18]))
            if "procedimiento reasignado por el diagnóstico" not in avisos:
                avisos.append("procedimiento reasignado por el diagnóstico")

        if confianza == "dudoso":
            dudosos.append((n, fecha, crudo_proc or " / ".join(detalle), principal))

        # Notas: se conserva el registro original completo, no se pierde nada.
        notas = []
        if crudo_proc:
            notas.append(f"Registro original: {crudo_proc}")
        if dx_inferido:
            notas.append("Diagnóstico inferido del procedimiento: el formulario anterior no lo registraba.")
        elif dx_cambio:
            notas.append(f"Diagnóstico según el registro original: {dx_original}")
        if detalle:
            notas.append("Detalle del formulario anterior: " + " · ".join(detalle))
        if pasos:
            notas.append(f"Pasos que realicé: {pasos}")
        if aprendi:
            notas.append(f"Aprendizaje: {aprendi}")

        # Etiquetas: la app ahora genera las clínicas sola (autoTags) a partir del
        # procedimiento, el injerto y la técnica. Como manuales quedan sólo las que
        # no puede deducir: el origen y la clasificación que traía el formulario viejo.
        manual_tags = ["importado"]
        if f[18].strip() and not es_rica:
            manual_tags.append(norm(f[18].strip()))

        casos.append({
            "id": id_estable(f[0], f[16], f[18], f[19], f[20], f[23]),
            "codigo": "",                    # se asigna después, por orden cronológico
            "fecha": fecha,
            "hora": "",
            "edad": None,
            "sexo": "",
            "imc": None,
            "lateralidad": lateralidad,
            "institucion": "",
            "diagnostico": diagnostico,
            "antecedentesRodilla": "",
            "comorbilidades": "",
            "cirujano": "",
            "rol": rol,
            "procedimientoPrincipal": principal,
            "procedimientosAsociados": [p for p in asociados if p != SIN_PROCEDIMIENTO],
            "abordaje": "",
            "anestesia": "",
            "hallazgos": "",
            "implantes": injerto,
            "injertoLca": injerto_lca,
            "tecnicaMeniscal": tecnica_men,
            # Sólo aplican a lesiones multiligamentarias; la planilla vieja no
            # registra ninguna, así que quedan vacíos (no se inventan).
            "patronMultiligamentario": "",
            "clasificacionMultiligamentaria": "",
            "duracionMin": None,
            "torniquete": False,
            "torniqueteMin": None,
            "complicacionIntraop": False,
            "complicacionIntraopDetalle": "",
            "internacionDias": None,
            "uti": False,
            "profilaxis": "",
            "rehabilitacion": "",
            "complicacionPostop": False,
            "complicacionPostopDetalle": "",
            "complicacionClavienDindo": "",
            "seguimiento": [],
            "presentadoEnAteneo": False,
            "publicable": False,
            "notas": "\n".join(notas),
            "tags": manual_tags,
            "manualTags": manual_tags,
            "autoTags": [],              # la app las completa al normalizar
            "excludedAutoTags": [],
            "creado": marca or (fecha + "T12:00:00" if fecha else ""),
            "actualizado": marca or (fecha + "T12:00:00" if fecha else ""),
            "_avisos": avisos,           # sólo para el reporte
        })

    # Códigos correlativos por orden cronológico
    casos.sort(key=lambda c: (c["fecha"] or "9999-99-99", c["creado"]))
    for i, c in enumerate(casos, 1):
        c["codigo"] = f"CIR-{i:04d}"

    # ─────────────────────────── reporte ───────────────────────────
    print("=" * 78)
    print(f"FILAS LEÍDAS: {len(filas)}   ·   CASOS CONVERTIDOS: {len(casos)}")
    print(f"  formulario rico: {stats['ricas']}   ·   formulario simple: {stats['simples']}")
    print(f"  RUT de pacientes descartados: {stats['rut_descartados']}")
    print(f"  sin fecha: {sum(1 for c in casos if not c['fecha'])}"
          f"  ·  sin rol: {sum(1 for c in casos if not c['rol'])}"
          f"  ·  sin diagnóstico: {sum(1 for c in casos if not c['diagnostico'])}")
    print(f"  con lateralidad: {sum(1 for c in casos if c['lateralidad'])}/{len(casos)}"
          f"  (el resto queda vacío, como acordamos)")

    print("\nPROCEDIMIENTO PRINCIPAL ASIGNADO")
    for v, n in Counter(c["procedimientoPrincipal"] for c in casos).most_common():
        print(f"  {n:4} x  {v}")

    asoc = Counter(p for c in casos for p in c["procedimientosAsociados"])
    print(f"\nASOCIADOS: {sum(asoc.values())} gestos en {sum(1 for c in casos if c['procedimientosAsociados'])} casos")
    for v, n in asoc.most_common():
        print(f"  {n:4} x  {v}")

    print("\nROL")
    for v, n in Counter(c["rol"] or "(sin rol)" for c in casos).most_common():
        print(f"  {n:4} x  {v}")

    if inferidos:
        print(f"\nDIAGNÓSTICO INFERIDO DEL PROCEDIMIENTO ({len(inferidos)})")
        print("  (queda anotado en cada caso que fue inferido, no registrado)")
        for n, fecha, proc, val in inferidos:
            print(f"  fila {n:3} {fecha}  {proc[:36]:<36} -> {val}")

    if sin_diagnostico:
        print(f"\nSIN DIAGNÓSTICO Y SIN PISTA — para completar a mano ({len(sin_diagnostico)})")
        for n, fecha, proc in sin_diagnostico:
            print(f"  fila {n:3} {fecha}  {proc!r}")

    if normalizados:
        print(f"\nVOCABULARIO DE DIAGNÓSTICOS UNIFICADO ({len(normalizados)} casos)")
        print("  (el texto original queda en las notas de cada caso)")
        for n, antes, despues in normalizados:
            print(f"  fila {n:3}  {antes[:44]:<44} -> {despues}")

    print("\nDIAGNÓSTICOS FINALES")
    for v, n in Counter(c["diagnostico"] for c in casos).most_common():
        print(f"  {n:4} x  {v or '(vacío)'}")

    print("\nCAMPOS ESTRUCTURADOS DEL FORMULARIO ACTUAL")
    print(f"  injertoLca       : {stats['injerto_lca']} casos")
    for v, n in Counter(c["injertoLca"] for c in casos if c["injertoLca"]).most_common():
        print(f"      {n:4} x  {v}")
    print(f"  tecnicaMeniscal  : {stats['tecnica_meniscal']} casos")
    for v, n in Counter(c["tecnicaMeniscal"] for c in casos if c["tecnicaMeniscal"]).most_common():
        print(f"      {n:4} x  {v}")

    if dudosos:
        print(f"\nMAPEO DUDOSO — CONVIENE REVISAR ({len(dudosos)})")
        for n, fecha, tex, proc in dudosos:
            print(f"  fila {n:3} {fecha}  {tex[:40]:<40} -> {proc}")

    if sin_procedimiento:
        print(f"\nSIN MAPEAR ({len(sin_procedimiento)})")
        for n, tex in sin_procedimiento:
            print(f"  fila {n:3}  {tex!r}")

    for c in casos:
        c.pop("_avisos", None)

    payload = {
        "version": 1,
        "actualizado": datetime.now().replace(microsecond=0).isoformat(),
        "origen": "Old_answers.csv (Google Forms) convertido con tools/importar-legado.py",
        "objetivos": {
            "Artroscopia diagnóstica": 50,
            "Meniscectomía parcial": 40,
            "Reconstrucción de LCA": 30,
            "Reparación meniscal (sutura)": 20,
            "Prótesis total de rodilla (PTR)": 20,
            "Fractura Platillos Tibiales": 10,
        },
        "casos": casos,
    }

    with open(SALIDA, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    print(f"\nOK -> {SALIDA}  ({os.path.getsize(SALIDA):,} bytes)")
    print("=" * 78)


if __name__ == "__main__":
    main()
