# Revision editorial: invitados

Fecha: 2026-05-14

Tema revisado: `invitados`

Estado editorial recomendado: evidencia insuficiente para sostener patrones comparados.

## Veredicto

La capa generada para `invitados` no debe presentarse como una comparativa fiable de practicas documentadas. La revision de los extractos y secciones fuente disponibles muestra que la mayoria de las referencias no regulan visitas, invitados, pernoctas ni uso de espacios comunes por personas invitadas.

La clasificacion actual `evidenceHealth: weak` es prudente, pero sigue sobreestimando la evidencia porque mantiene cinco afirmaciones como `inferred` con confianza `medium`. Editorialmente, el tema deberia tratarse como `insufficient` hasta localizar documentos que traten expresamente visitas, invitados o pernoctas.

## Hallazgos principales

1. No hay evidencia explicita sobre permiso general para invitar a terceros.

La afirmacion `invitados-guests_allowed` se apoya en referencias que hablan de operaciones con terceras personas, portada/indice de guia, capitulos organicos o relaciones societarias. Ninguna de las secciones revisadas establece que una persona socia pueda invitar a terceros a las instalaciones.

2. No hay evidencia suficiente sobre aviso o autorizacion previa.

La afirmacion `invitados-notice` aparece como inferida, pero los extractos citados tratan servicios para personas socias y convivientes, actas del Consejo Rector o convocatoria de organos sociales. Estos textos no permiten inferir una regla de aviso o autorizacion para invitados.

3. No hay evidencia sobre limites de noches o estancias.

La afirmacion `invitados-guest_limit` ya esta marcada como `weak_evidence` y sin referencias. Esta clasificacion es correcta, pero el modelo de decision genera enfoques de limites de pernocta con `evidenceLevel: medium`, lo que contradice la evidencia disponible.

4. No hay evidencia especifica sobre responsabilidad por danos causados por invitados.

Los extractos citan responsabilidad social, responsabilidad de organos o responsabilidad de la persona socia por deudas sociales. Esto no equivale a responsabilidad por danos causados por personas invitadas.

5. No hay evidencia especifica sobre uso de espacios comunes por invitados.

Las secciones de Elciempies y Los Girasoles reconocen derechos de personas socias respecto a vivienda, local y elementos comunes, pero no regulan acceso o uso por invitados. La inferencia hacia invitados es excesiva.

6. No hay evidencia sobre invitados sin presencia de la persona socia.

Los extractos citados no tratan acompanamiento, presencia de anfitrion, estancias autonomas ni acceso independiente. Esta afirmacion deberia marcarse como evidencia insuficiente.

## Revision de fuentes citadas

### `docs-otros-modelo-estatutos-viviendas`

La referencia principal es el Articulo 43, "Operaciones con terceras personas". El texto regula operaciones cooperativas con terceros respecto de construcciones complementarias, enajenacion, cesion de uso, arrendamiento, derecho de retracto e ingresos obtenidos. No regula visitas, invitados ni pernoctas.

Uso editorial recomendado: no usar como soporte de reglas de invitados.

### `docs-rri-rri-vallecas2homes`

El Articulo 27 regula cesion de derechos a familiares cuando una persona socia no puede cumplir compromisos con la cooperativa. El Articulo 28 regula cesion de derechos a terceros y sustitucion en derechos y obligaciones. No se trata de visitas, estancia temporal ni invitados.

Uso editorial recomendado: no usar como soporte de reglas de invitados.

### `docs-estatutos-estatutos-elciempies`

El CAPITULO II reconoce personas socias de vivienda con derechos y obligaciones respecto de vivienda, local y elementos comunes, y define convivencia habitual para personas socias o beneficiarias. El CAPITULO III regula organos sociales, Asamblea General, Consejo Rector y acuerdos. No regula invitados.

Uso editorial recomendado: puede servir, como mucho, para contexto general sobre elementos comunes y convivencia habitual de socias o beneficiarias; no para afirmar reglas de invitados.

### `docs-estatutos-estatutos-los-girasoles`

El contenido es equivalente al de Elciempies en lo relevante: clases de personas socias, elementos comunes, convivencia habitual y organos sociales. No contiene una regla sobre visitas o invitados en las secciones revisadas.

Uso editorial recomendado: no usar para sostener claims sobre invitados; solo contexto general sobre socias, beneficiarias y elementos comunes.

### `docs-guias-guia-redaccion-estatutos-de-cooperativas-de-cohousing-senior-2024`

La seccion disponible en `sections.json` es portada, creditos, aviso legal e indice. El propio texto indica que la informacion es informativa y no constituye recomendacion. Los extractos citados para `invitados` proceden de esta seccion general, no de apartados sustantivos sobre visitas.

Uso editorial recomendado: no usar como soporte sustantivo salvo que se extraigan y revisen apartados concretos que traten invitados, convivencia, uso de espacios o pernoctas.

## Problemas en `evidence/invitados.json`

Los siguientes claims deberian degradarse a `weak_evidence` o retirarse de la capa de evidencia hasta encontrar soporte documental directo:

- `invitados-guests_allowed`
- `invitados-notice`
- `invitados-guest_responsibility`
- `invitados-guest_common_spaces`
- `invitados-guest_alone`

El claim `invitados-guest_limit` ya esta correctamente marcado como `weak_evidence`, pero deberia activar una degradacion mas fuerte del tema completo porque no hay ningun claim explicito.

Resumen editorial recomendado:

```json
{
  "topicSlug": "invitados",
  "evidenceHealth": "insufficient",
  "claims": [
    {
      "id": "invitados-guests_allowed",
      "evidenceType": "weak_evidence",
      "confidence": "low",
      "supportingReferences": []
    },
    {
      "id": "invitados-notice",
      "evidenceType": "weak_evidence",
      "confidence": "low",
      "supportingReferences": []
    },
    {
      "id": "invitados-guest_limit",
      "evidenceType": "weak_evidence",
      "confidence": "low",
      "supportingReferences": []
    },
    {
      "id": "invitados-guest_responsibility",
      "evidenceType": "weak_evidence",
      "confidence": "low",
      "supportingReferences": []
    },
    {
      "id": "invitados-guest_common_spaces",
      "evidenceType": "weak_evidence",
      "confidence": "low",
      "supportingReferences": []
    },
    {
      "id": "invitados-guest_alone",
      "evidenceType": "weak_evidence",
      "confidence": "low",
      "supportingReferences": []
    }
  ]
}
```

## Problemas en `decision-models/invitados.json`

Los modelos de decision actuales formulan enfoques razonables como opciones de gobernanza, pero los presentan como detectados en proyectos con `evidenceLevel: medium`. Esto no esta sostenido por las fuentes revisadas.

Deberian retirarse o reformularse como decisiones pendientes no detectadas documentalmente:

- "Uso libre con comunicacion informal"
- "Limite anual o periodico de pernoctas"
- "Prioridad absoluta para personas socias"

Reformulacion editorial recomendada:

```json
{
  "topicSlug": "invitados",
  "decisionQuestions": [
    {
      "id": "guests_allowed",
      "question": "¿Puede una persona socia invitar a terceros?",
      "detectedApproaches": [],
      "recommendationsForBuenVivir": [
        "Decidir expresamente si se permiten visitas, en que espacios y bajo que responsabilidad, porque las fuentes revisadas no aportan una regla comparada fiable."
      ]
    },
    {
      "id": "overnight_limits",
      "question": "¿Existen limites de noches o estancias?",
      "detectedApproaches": [],
      "recommendationsForBuenVivir": [
        "Si se quiere permitir pernocta, definir en RRI limites, excepciones y mecanismo de revision sin presentarlo como practica detectada en las fuentes actuales."
      ]
    },
    {
      "id": "guest_common_spaces",
      "question": "¿Pueden usarse espacios comunes por personas invitadas?",
      "detectedApproaches": [],
      "recommendationsForBuenVivir": [
        "Separar acceso acompanado, reserva de espacios, limpieza, responsabilidad e incidencias como puntos de decision comunitaria."
      ]
    }
  ],
  "limits": [
    "No se han identificado reglas documentales suficientes sobre invitados en las fuentes revisadas."
  ]
}
```

## Problemas en `syntheses/invitados.generated.json`

La sintesis generada es demasiado afirmativa para el soporte disponible. En particular, las frases sobre "extractos mas claros", "aparecen ejemplos en varios proyectos" y "visitas e invitados suelen conectarse" deberian suavizarse o sustituirse por una advertencia de falta de evidencia.

Texto editorial recomendado:

```text
Las fuentes revisadas no contienen reglas claras y comparables sobre visitas, personas invitadas o pernoctas. Algunos documentos tratan elementos comunes, convivencia habitual de personas socias o beneficiarias, transmision de derechos y operaciones con terceras personas, pero esas materias no permiten deducir una politica de invitados. El tema debe tratarse como una decision pendiente de la comunidad y no como una practica ya detectada en los documentos analizados.
```

## Tratamiento recomendado para la UI

Mostrar este tema con un aviso de evidencia insuficiente. No mostrar modelos detectados ni proyectos notables como si aportaran reglas sobre invitados.

Contenido util que si puede mostrarse:

- Preguntas para decidir: permiso de visitas, pernocta, uso de espacios comunes, presencia de la persona anfitriona, responsabilidad, aviso, excepciones y revision.
- Advertencia: las fuentes revisadas no ofrecen una regla documental suficiente.
- Recomendacion prudente: regular detalles operativos en RRI si la comunidad decide hacerlo, con revision tras uso real.

Contenido que no deberia mostrarse:

- "Detectado en proyectos" para los enfoques actuales.
- Confianza media en reglas de invitados.
- Referencias a Articulo 43 del modelo de estatutos como soporte de invitados.
- Referencias a capitulos organicos de Elciempies o Los Girasoles como soporte de invitados.
- Referencias a portada, indice o aviso legal de la guia Hispacoop como evidencia sustantiva.

## Decision editorial final

El tema `invitados` debe permanecer visible solo como materia pendiente de decision, no como comparativa documental. La salida generada actual requiere correccion antes de usarse para orientar una redaccion estatutaria o de RRI.
