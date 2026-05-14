import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type {
  DecisionModelExtract,
  DecisionQuestion,
  EvidenceHealth,
  EvidenceLevel,
  EvidenceTopicLayer,
  ExtractedSection,
  SolutionApproach,
  SourceDocument,
  TaxonomyTopic,
  TopicDecisionModel
} from '../src/lib/content/types';

interface ConceptRule {
  id: string;
  label: string;
  terms: string[];
  contextTerms?: string[];
  negativeTerms?: string[];
  window?: number;
}

interface ApproachBlueprint {
  name: string;
  summary: string;
  concepts: string[];
  characteristics: string[];
  advantages: string[];
  risks: string[];
  suitableFor: string[];
}

interface QuestionBlueprint {
  id: string;
  question: string;
  concepts: string[];
  whyItMatters: string[];
  approaches: ApproachBlueprint[];
  tradeoffs: string[];
  recommendations: string[];
  statutes: string[];
  rri: string[];
}

interface TopicBlueprint {
  slug: string;
  concepts: ConceptRule[];
  questions: QuestionBlueprint[];
}

interface SectionMatch {
  section: ExtractedSection;
  document: SourceDocument;
  score: number;
  matchedConceptIds: string[];
  matchedConcepts: string[];
}

const root = process.cwd();
const taxonomyPath = join(root, 'taxonomy/topics.json');
const documentsPath = join(root, 'src/content/documents/documents.json');
const sectionsDir = join(root, 'src/content/generated/sections');
const evidenceDir = join(root, 'src/content/generated/evidence');
const outputDir = join(root, 'src/content/generated/decision-models');
const reportPath = join(root, 'src/content/generated/decision-models-report.json');
const maxExtractsPerQuestion = 5;
const maxExtractLength = 520;
const minimumQuestionScore = 8;

const sharedUseConcepts: ConceptRule[] = [
  {
    id: 'calendar',
    label: 'calendario o reserva operativa',
    terms: ['reserva', 'reservas', 'reservar', 'calendario', 'turno', 'turnos'],
    contextTerms: ['estancia', 'estancias', 'habitacion', 'habitaciones', 'invitados', 'pernocta', 'pernoctas', 'noche', 'noches', 'espacio', 'espacios', 'uso', 'disponibilidad'],
    negativeTerms: ['fondo de reserva', 'reserva legal', 'reservas legales', 'reserva obligatoria', 'reservas voluntarias', 'contable', 'capital social'],
    window: 18
  },
  {
    id: 'overnight_limit',
    label: 'límite de noches o estancias',
    terms: ['pernocta', 'pernoctas', 'estancia', 'estancias', 'noche', 'noches', 'dias', 'duracion'],
    contextTerms: ['invitados', 'visitas', 'habitacion', 'habitaciones', 'limite', 'maximo', 'reserva', 'uso'],
    window: 22
  },
  {
    id: 'priority',
    label: 'prioridad de uso',
    terms: ['prioridad', 'preferencia', 'preferente', 'prelacion'],
    contextTerms: ['socios', 'socias', 'personas socias', 'invitados', 'espacio', 'habitacion', 'uso', 'reserva'],
    window: 24
  },
  {
    id: 'common_space',
    label: 'uso de espacios comunes',
    terms: ['espacios comunes', 'zonas comunes', 'espacio comun', 'uso comun', 'sala comun', 'comedor', 'habitacion de invitados'],
    contextTerms: ['uso', 'reserva', 'convivencia', 'limpieza', 'cuidado', 'prioridad', 'invitados'],
    window: 26
  },
  {
    id: 'host_responsibility',
    label: 'responsabilidad de quien invita o usa',
    terms: ['responsabilidad', 'responsable', 'danos', 'daños', 'limpieza', 'cuidado', 'desperfectos'],
    contextTerms: ['invitados', 'visitas', 'anfitrion', 'anfitriona', 'espacio', 'uso', 'estancia'],
    window: 24
  }
];

const blueprints: TopicBlueprint[] = [
  {
    slug: 'invitados',
    concepts: [
      ...sharedUseConcepts,
      { id: 'guests', label: 'personas invitadas', terms: ['invitados', 'invitadas', 'visitas', 'familiares', 'terceros'], contextTerms: ['socio', 'socia', 'uso', 'espacio', 'pernocta', 'estancia', 'convivencia'], window: 24 },
      { id: 'notice', label: 'aviso o comunicación previa', terms: ['avisar', 'aviso', 'comunicar', 'comunicacion', 'solicitud', 'autorizacion'], contextTerms: ['invitados', 'visitas', 'pernocta', 'estancia', 'reserva', 'espacio'], window: 24 },
      { id: 'alone', label: 'presencia sin persona socia', terms: ['sola', 'solo', 'sin presencia', 'sin estar presente', 'terceros'], contextTerms: ['invitados', 'visitas', 'socio', 'socia', 'espacio', 'vivienda'], window: 28 }
    ],
    questions: [
      decisionQuestion('guests_allowed', '¿Puede una persona socia invitar a terceros?', ['guests', 'notice', 'host_responsibility'], ['Determina el equilibrio entre vida privada, hospitalidad y convivencia común.', 'Evita que cada invitación se convierta en una negociación ad hoc.'], guestApproaches(), ['hospitalidad flexible vs disponibilidad e intimidad comunitaria'], ['Acordar una regla simple de aviso y responsabilidad antes de fijar límites duros.'], ['principio general de convivencia y responsabilidad de la persona socia'], ['avisos, responsabilidades, límites de uso y gestión de incidencias']),
      decisionQuestion('overnight_limits', '¿Existen límites de noches o estancias?', ['overnight_limit', 'calendar', 'priority'], ['Los límites evitan usos intensivos difíciles de gestionar después.', 'Permiten diferenciar visita puntual, estancia recurrente y ocupación de hecho.'], guestApproaches(), ['apertura a redes afectivas vs saturación de espacios'], ['Si la evidencia es débil, empezar con límite revisable en RRI y evaluación comunitaria.'], ['criterio general de compatibilidad con el uso cooperativo'], ['número de noches, excepciones, calendario y revisión']),
      decisionQuestion('guest_common_spaces', '¿Pueden usarse espacios comunes libremente?', ['common_space', 'priority', 'host_responsibility'], ['Los espacios comunes son donde más rápido aparecen conflictos de uso, limpieza y prioridad.', 'Una regla clara protege a quienes conviven sin cerrar la comunidad.'], guestApproaches(), ['uso espontáneo vs reserva preventiva'], ['Separar uso ordinario acompañado de usos que requieren reserva o aviso.'], ['principio de uso común y respeto a acuerdos internos'], ['espacios reservables, limpieza, prioridades y responsabilidades'])
    ]
  },
  {
    slug: 'reservas_estancias_pernoctas',
    concepts: sharedUseConcepts,
    questions: [
      decisionQuestion('booking_system', '¿Qué usos requieren calendario, reserva o turno?', ['calendar', 'common_space', 'priority'], ['Distingue una reserva real de menciones económicas o legales a reservas.', 'Ayuda a prevenir apropiaciones informales de espacios escasos.'], stayApproaches(), ['flexibilidad cotidiana vs reparto temporal equitativo'], ['Usar calendario solo para espacios o periodos con saturación real.'], ['principio general de uso compartido'], ['calendario, turnos, prioridades, cancelaciones y excepciones']),
      decisionQuestion('saturated_periods', '¿Qué ocurre en fines de semana, festivos o periodos saturados?', ['calendar', 'priority', 'overnight_limit'], ['Los picos de demanda suelen generar más conflictos que el uso ordinario.', 'Conviene decidir si prima el orden de solicitud, la rotación o la necesidad.'], stayApproaches(), ['primer llegado vs rotación justa'], ['Definir criterios mínimos para picos de demanda y revisarlos tras experiencia real.'], ['principios de igualdad de uso'], ['criterios de prioridad, rotación y cancelación']),
      decisionQuestion('cancellations_intensive_use', '¿Cómo se gestionan cancelaciones y usos intensivos?', ['calendar', 'host_responsibility', 'overnight_limit'], ['Las cancelaciones y usos recurrentes pueden bloquear disponibilidad sin aparecer como conflicto formal.', 'Permite distinguir uso puntual de patrón repetido.'], stayApproaches(), ['confianza informal vs trazabilidad mínima'], ['Registrar solo lo necesario para detectar saturación o abuso de uso.'], ['principio general de cuidado y convivencia'], ['avisos de cancelación, límites revisables y seguimiento de usos intensivos'])
    ]
  },
  {
    slug: 'uso_espacios_comunes',
    concepts: sharedUseConcepts,
    questions: [
      decisionQuestion('shared_space_rules', '¿Qué espacios comunes necesitan reglas específicas?', ['common_space', 'calendar', 'priority'], ['No todos los espacios necesitan el mismo nivel de regulación.', 'Permite reservar reglas fuertes para espacios escasos o sensibles.'], stayApproaches(), ['espontaneidad comunitaria vs previsibilidad'], ['Diferenciar espacios de uso libre, uso reservado y uso comunitario prioritario.'], ['principio general de uso común'], ['horarios, reservas, limpieza, prioridades y cuidados']),
      decisionQuestion('care_responsibility', '¿Quién cuida, limpia o responde por daños?', ['host_responsibility', 'common_space'], ['El cuidado material suele ser una fuente de carga invisible.', 'Aclarar responsabilidades reduce reproches y conflictos acumulados.'], stayApproaches(), ['autogestión flexible vs distribución explícita de cargas'], ['Hacer explícitas responsabilidades tras usos reservados o intensivos.'], ['deber general de cuidado'], ['turnos, limpieza, reparación y comunicación de incidencias'])
    ]
  },
  {
    slug: 'desigualdad_aportaciones',
    concepts: [
      { id: 'unequal_contribution', label: 'aportaciones desiguales', terms: ['aportaciones desiguales', 'aportacion desigual', 'diferentes aportaciones', 'aportacion voluntaria', 'aportaciones voluntarias', 'prestamo', 'prestamos'], contextTerms: ['capital', 'socio', 'socia', 'financiacion', 'cuota', 'reembolso', 'derechos'], negativeTerms: ['fondo de reserva'], window: 28 },
      { id: 'one_member_one_vote', label: 'igualdad política', terms: ['un socio un voto', 'una persona socia un voto', 'igualdad de voto', 'derecho de voto', 'voto'], contextTerms: ['igualdad', 'socios', 'socias', 'participacion', 'derechos politicos', 'aportaciones'], window: 30 },
      { id: 'economic_rights', label: 'derechos económicos diferenciados', terms: ['reembolso', 'retorno', 'interes', 'intereses', 'deduccion', 'liquidacion'], contextTerms: ['aportacion', 'capital', 'prestamo', 'socio', 'socia', 'baja'], window: 30 }
    ],
    questions: [
      decisionQuestion('money_without_power', '¿Cómo evitar que aportar más dinero dé más poder?', ['unequal_contribution', 'one_member_one_vote'], ['La desigualdad económica puede transformarse en privilegio informal si no se separa de voto, uso y decisiones.', 'Es una decisión estructural para un grupo pequeño.'], contributionApproaches(), ['financiación suficiente vs igualdad cooperativa real'], ['Separar capital obligatorio, préstamo, cuota y aportación voluntaria con efectos distintos.'], ['igualdad política y límites a privilegios por aportación'], ['registro, calendario, comunicación y seguimiento económico']),
      decisionQuestion('financial_instruments', '¿Qué instrumento usar para aportaciones distintas?', ['unequal_contribution', 'economic_rights'], ['No es lo mismo capital, cuota, préstamo o aportación voluntaria.', 'La elección afecta reembolso, expectativas y estabilidad financiera.'], contributionApproaches(), ['claridad jurídica vs flexibilidad financiera'], ['No mezclar aportación societaria con necesidades temporales de tesorería.'], ['naturaleza de aportaciones y reglas generales de reembolso'], ['procedimiento de préstamos, pagos fraccionados y trazabilidad'])
    ]
  },
  {
    slug: 'baja_socio',
    concepts: [
      { id: 'voluntary_exit', label: 'baja voluntaria', terms: ['baja voluntaria', 'solicitud de baja', 'perdida de condicion', 'salida'], contextTerms: ['socio', 'socia', 'preaviso', 'reembolso', 'aportacion'], window: 28 },
      { id: 'reimbursement', label: 'reembolso de aportaciones', terms: ['reembolso', 'devolucion', 'liquidacion', 'deduccion', 'deducciones'], contextTerms: ['baja', 'aportacion', 'capital', 'socio', 'socia', 'plazo'], window: 32 },
      { id: 'replacement', label: 'sustitución o lista de espera', terms: ['lista de espera', 'sustitucion', 'nueva persona socia', 'admision'], contextTerms: ['baja', 'salida', 'derecho de uso', 'vivienda'], window: 32 }
    ],
    questions: [
      decisionQuestion('exit_process', '¿Qué pasos sigue una persona socia para darse de baja?', ['voluntary_exit', 'replacement'], ['La salida afecta convivencia, uso de espacios y continuidad económica.', 'Evita improvisar cuando la relación ya está tensionada.'], exitApproaches(), ['libertad de salida vs estabilidad del proyecto'], ['Definir preaviso y cierre práctico sin bloquear salidas legítimas.'], ['causas, clases de baja y efectos básicos'], ['comunicación, acompañamiento, llaves, uso y transición']),
      decisionQuestion('exit_money', '¿Cuándo y cómo se devuelve el dinero?', ['reimbursement', 'voluntary_exit'], ['El reembolso puede tensionar la liquidez común.', 'Una regla ambigua genera expectativas opuestas entre quien sale y quienes permanecen.'], exitApproaches(), ['derecho de reembolso vs liquidez colectiva'], ['Prever plazos, deducciones y escenarios de falta de liquidez.'], ['derecho de reembolso, deducciones y plazos máximos'], ['calendario interno, documentación y comunicación'])
    ]
  },
  {
    slug: 'toma_decisiones',
    concepts: [
      { id: 'majority', label: 'mayorías y quorum', terms: ['mayoria', 'mayoria simple', 'mayoria cualificada', 'quorum', 'votacion'], contextTerms: ['asamblea', 'acuerdo', 'decision', 'socios', 'socias'], window: 30 },
      { id: 'consensus', label: 'consenso', terms: ['consenso', 'unanimidad', 'bloqueo', 'facilitacion'], contextTerms: ['decision', 'acuerdo', 'asamblea', 'conflicto'], window: 30 },
      { id: 'delegation', label: 'delegación y órganos', terms: ['consejo rector', 'organo de administracion', 'delegacion', 'comision', 'grupo de trabajo'], contextTerms: ['competencias', 'acuerdo', 'asamblea', 'decision'], window: 30 }
    ],
    questions: [
      decisionQuestion('which_majority', '¿Qué decisiones requieren consenso, mayoría reforzada o mayoría ordinaria?', ['majority', 'consensus'], ['La regla de decisión define cuánta protección tienen minorías y cuánta agilidad conserva el grupo.', 'Conviene separar decisiones estructurales de decisiones cotidianas.'], decisionApproaches(), ['consenso protector vs bloqueo'], ['Usar reglas más fuertes solo para materias irreversibles o sensibles.'], ['quorum, mayorías y materias protegidas'], ['preparación de decisiones, facilitación y desbloqueo']),
      decisionQuestion('delegated_decisions', '¿Qué puede decidir un órgano o grupo delegado?', ['delegation', 'majority'], ['Delegar agiliza, pero puede alejar decisiones del grupo si no hay rendición de cuentas.', 'Un grupo pequeño necesita claridad sin burocracia excesiva.'], decisionApproaches(), ['agilidad operativa vs control colectivo'], ['Delegar ejecución y reservar orientación estratégica a asamblea.'], ['competencias de órganos y límites'], ['mandatos, seguimiento, actas y rendición de cuentas'])
    ]
  },
  {
    slug: 'conflictos_y_mediacion',
    concepts: [
      { id: 'mediation', label: 'mediación', terms: ['mediacion', 'mediador', 'mediadora', 'resolucion de conflictos'], contextTerms: ['conflicto', 'convivencia', 'acuerdo', 'procedimiento'], window: 30 },
      { id: 'discipline', label: 'régimen disciplinario', terms: ['sancion', 'falta grave', 'falta muy grave', 'expulsion', 'procedimiento sancionador'], contextTerms: ['incumplimiento', 'socio', 'socia', 'audiencia', 'recurso'], window: 32 },
      { id: 'escalation', label: 'escalado del conflicto', terms: ['audiencia', 'alegaciones', 'recurso', 'plazo', 'procedimiento'], contextTerms: ['conflicto', 'sancion', 'mediacion', 'asamblea', 'consejo rector'], window: 32 }
    ],
    questions: [
      decisionQuestion('conflict_path', '¿Qué conflictos se gestionan informalmente y cuáles requieren procedimiento?', ['mediation', 'escalation'], ['No todos los desacuerdos deben convertirse en expediente.', 'Un cauce escalonado evita tanto la evitación como la judicialización interna.'], conflictApproaches(), ['cuidado relacional vs garantías formales'], ['Definir una primera vía de escucha/mediación antes de activar sanciones.'], ['principios, garantías y régimen disciplinario básico'], ['pasos de mediación, plazos, documentación y personas de referencia']),
      decisionQuestion('last_resort', '¿Cuándo un conflicto puede llegar a sanción o expulsión?', ['discipline', 'escalation'], ['Las sanciones necesitan garantías para proteger al grupo y a la persona afectada.', 'Evita que conflictos convivenciales acaben en decisiones arbitrarias.'], conflictApproaches(), ['protección del grupo vs garantías individuales'], ['Reservar sanciones para incumplimientos graves y documentados.'], ['faltas, órgano competente, audiencia y recurso'], ['mediación previa, preparación del expediente y acompañamiento'])
    ]
  },
  {
    slug: 'convivencia',
    concepts: [
      { id: 'daily_rules', label: 'normas de convivencia cotidiana', terms: ['convivencia', 'normas de convivencia', 'vida comunitaria', 'normas internas'], contextTerms: ['uso', 'espacios', 'cuidados', 'limpieza', 'respeto', 'conflicto'], window: 32 },
      { id: 'care_tasks', label: 'cuidados, limpieza y mantenimiento ordinario', terms: ['limpieza', 'mantenimiento', 'cuidados', 'tareas comunes', 'responsabilidad'], contextTerms: ['espacio', 'comun', 'convivencia', 'turnos', 'uso'], window: 32 },
      { id: 'conflict_prevention', label: 'prevención de conflictos convivenciales', terms: ['conflicto', 'desacuerdo', 'mediacion', 'facilitacion'], contextTerms: ['convivencia', 'normas', 'uso', 'espacios', 'acuerdo'], window: 32 }
    ],
    questions: [
      decisionQuestion('daily_rules_scope', '¿Qué reglas de convivencia conviene acordar desde el inicio?', ['daily_rules', 'care_tasks'], ['La convivencia cotidiana acumula tensiones pequeñas si no hay criterios compartidos.', 'Un grupo flexible necesita pocas reglas, pero suficientemente claras.'], coexistenceApproaches(), ['autonomía personal vs cuidado común'], ['Empezar por reglas mínimas sobre uso, cuidado y revisión periódica.'], ['principios generales de respeto, cuidado y participación'], ['normas prácticas, turnos, revisión y gestión de incidencias']),
      decisionQuestion('informal_or_formal_conflict', '¿Cuándo una tensión cotidiana pasa a mediación o procedimiento?', ['daily_rules', 'conflict_prevention'], ['Permite no sobrerregular cada desacuerdo, pero evita dejar conflictos sin cauce.', 'Distingue malestar ordinario, incumplimiento reiterado y conflicto grave.'], coexistenceApproaches(), ['confianza informal vs cauce claro'], ['Definir una primera conversación facilitada antes de activar mecanismos formales.'], ['principios de convivencia y garantías básicas'], ['pasos de escucha, mediación y seguimiento'])
    ]
  }
];

function decisionQuestion(
  id: string,
  question: string,
  concepts: string[],
  whyItMatters: string[],
  approaches: ApproachBlueprint[],
  tradeoffs: string[],
  recommendations: string[],
  statutes: string[],
  rri: string[]
): QuestionBlueprint {
  return { id, question, concepts, whyItMatters, approaches, tradeoffs, recommendations, statutes, rri };
}

function guestApproaches(): ApproachBlueprint[] {
  return [
    approach('Uso libre con comunicación informal', 'Permite visitas con aviso ligero y responsabilidad de la persona anfitriona.', ['guests', 'notice'], ['aviso simple', 'responsabilidad personal', 'poca burocracia'], ['mantiene hospitalidad', 'encaja en grupos pequeños con confianza'], ['puede invisibilizar usos recurrentes'], ['grupos pequeños con baja saturación']),
    approach('Límite anual o periódico de pernoctas', 'Fija un máximo revisable de noches o estancias para evitar uso intensivo.', ['overnight_limit'], ['límite de noches', 'revisión periódica', 'excepciones acordables'], ['reduce ambigüedad', 'ayuda a detectar abuso'], ['puede sentirse rígido si hay poca demanda'], ['espacios con habitaciones o periodos saturados']),
    approach('Reserva previa obligatoria', 'Exige calendario o autorización para estancias y usos sensibles.', ['calendar'], ['calendario', 'solicitud previa', 'trazabilidad mínima'], ['ordena periodos de alta demanda'], ['puede burocratizar visitas puntuales'], ['grupos con espacios escasos']),
    approach('Prioridad absoluta para personas socias', 'Reconoce invitados, pero subordina su uso a necesidades de socias.', ['priority'], ['prioridad socia', 'uso condicionado', 'posibles excepciones'], ['protege disponibilidad cotidiana'], ['puede limitar hospitalidad'], ['grupos con mucha demanda interna']),
    approach('Evaluación comunitaria caso por caso', 'Deja estancias no ordinarias a acuerdo comunitario previo.', ['guests', 'calendar', 'priority'], ['decisión comunitaria', 'excepciones', 'criterios abiertos'], ['flexible para situaciones especiales'], ['puede generar discrecionalidad'], ['grupos pequeños con cultura deliberativa'])
  ];
}

function stayApproaches(): ApproachBlueprint[] {
  return [
    approach('Calendario compartido de uso', 'Ordena reservas, estancias y espacios escasos mediante una agenda común.', ['calendar'], ['calendario visible', 'turnos', 'cancelaciones'], ['reduce solapamientos', 'hace comparable el uso'], ['puede sobrerregular si apenas hay demanda'], ['grupos con espacios reservables']),
    approach('Prioridades y rotación', 'Define quién tiene preferencia y cómo se reparte el uso en periodos saturados.', ['priority', 'calendar'], ['prioridades', 'rotación', 'criterios para picos de demanda'], ['evita capturas por orden de llegada'], ['requiere seguimiento mínimo'], ['fines de semana, festivos o habitaciones limitadas']),
    approach('Uso libre salvo conflicto', 'No exige reserva ordinaria y activa reglas solo ante saturación o daño.', ['common_space', 'host_responsibility'], ['confianza inicial', 'responsabilidad posterior', 'revisión si aparece conflicto'], ['ligero y adaptable'], ['puede llegar tarde si hay abuso recurrente'], ['grupos pequeños y flexibles'])
  ];
}

function contributionApproaches(): ApproachBlueprint[] {
  return [
    approach('Igualdad política con financiación separada', 'Las aportaciones diferentes se documentan sin alterar voto, uso ni prioridad.', ['unequal_contribution', 'one_member_one_vote'], ['una persona socia un voto', 'financiación separada', 'sin privilegios de uso'], ['protege igualdad cooperativa', 'permite cubrir necesidades económicas'], ['requiere mucha claridad documental'], ['grupos con capacidades económicas distintas']),
    approach('Préstamos o aportaciones voluntarias trazadas', 'Canaliza dinero adicional fuera de derechos políticos o de convivencia.', ['unequal_contribution', 'economic_rights'], ['instrumento separado', 'condiciones claras', 'seguimiento interno'], ['reduce confusión entre pertenencia y financiación'], ['puede generar expectativas de retorno'], ['grupos con financiación transitoria'])
  ];
}

function exitApproaches(): ApproachBlueprint[] {
  return [
    approach('Salida con preaviso y cierre práctico', 'Regula comunicación, transición de uso y cierre de responsabilidades.', ['voluntary_exit'], ['preaviso', 'entrega de uso', 'acompañamiento'], ['facilita salidas no conflictivas'], ['puede quedarse corto ante tensiones económicas'], ['grupos pequeños con baja rotación']),
    approach('Reembolso condicionado por reglas claras', 'Fija plazos, deducciones y coordinación con liquidez o nueva entrada.', ['reimbursement'], ['plazos', 'deducciones', 'liquidez', 'documentación'], ['protege a quien sale y al proyecto'], ['puede ser rígido si no contempla excepciones'], ['proyectos con aportaciones significativas']),
    approach('Sustitución o lista de espera coordinada', 'Conecta la salida con entrada posterior sin privatizar la transmisión.', ['replacement'], ['lista de espera', 'sustitución', 'gestión cooperativa'], ['ordena continuidad', 'evita compraventas informales'], ['puede retrasar salidas'], ['proyectos con derecho de uso asociado'])
  ];
}

function decisionApproaches(): ApproachBlueprint[] {
  return [
    approach('Mayorías diferenciadas por materia', 'Usa mayorías ordinarias, reforzadas o consenso según impacto de la decisión.', ['majority'], ['materias clasificadas', 'quorum', 'mayoría reforzada'], ['equilibra agilidad y protección'], ['requiere clasificar bien las decisiones'], ['grupos que necesitan operar sin bloqueo']),
    approach('Consenso con mecanismos de desbloqueo', 'Busca acuerdo amplio pero prevé salida si la decisión queda bloqueada.', ['consensus', 'majority'], ['consenso', 'tiempos', 'segunda vuelta'], ['protege cohesión'], ['puede alargar decisiones'], ['decisiones sensibles o identitarias']),
    approach('Delegación con rendición de cuentas', 'Permite que órganos o grupos ejecuten dentro de mandatos claros.', ['delegation'], ['mandato', 'límites', 'seguimiento'], ['mejora agilidad cotidiana'], ['puede concentrar información'], ['gestión ordinaria y tareas técnicas'])
  ];
}

function conflictApproaches(): ApproachBlueprint[] {
  return [
    approach('Mediación escalonada', 'Empieza por escucha y mediación antes de formalizar sanciones.', ['mediation', 'escalation'], ['primer contacto', 'mediación', 'escalado gradual'], ['cuida relaciones', 'evita expedientes prematuros'], ['puede dilatar conflictos graves'], ['conflictos convivenciales']),
    approach('Procedimiento garantista', 'Reserva sanciones para incumplimientos graves con audiencia y recurso.', ['discipline', 'escalation'], ['faltas', 'audiencia', 'órgano competente', 'recurso'], ['reduce arbitrariedad', 'protege al grupo'], ['puede ser pesado para conflictos menores'], ['incumplimientos graves o reiterados'])
  ];
}

function coexistenceApproaches(): ApproachBlueprint[] {
  return [
    approach('Reglas mínimas revisables', 'Acuerda pocas pautas de convivencia y las revisa tras experiencia real.', ['daily_rules'], ['mínimos claros', 'revisión periódica', 'lenguaje práctico'], ['evita sobrerregular', 'permite aprendizaje'], ['puede dejar zonas grises'], ['grupos pequeños y flexibles']),
    approach('Turnos y responsabilidades explícitas', 'Distribuye tareas comunes para evitar cargas invisibles.', ['care_tasks'], ['turnos', 'responsables', 'seguimiento ligero'], ['hace visible el cuidado', 'reduce reproches'], ['puede sentirse burocrático'], ['espacios comunes con mantenimiento recurrente']),
    approach('Cauce temprano de mediación', 'Activa escucha o facilitación antes de que el desacuerdo escale.', ['conflict_prevention'], ['conversación temprana', 'persona de referencia', 'seguimiento'], ['previene enquistamiento', 'cuida vínculos'], ['requiere confianza en el cauce'], ['conflictos cotidianos o repetidos'])
  ];
}

function approach(
  name: string,
  summary: string,
  concepts: string[],
  characteristics: string[],
  advantages: string[],
  risks: string[],
  suitableFor: string[]
): ApproachBlueprint {
  return { name, summary, concepts, characteristics, advantages, risks, suitableFor };
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function cleanText(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9ñç\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(value: string): string[] {
  return cleanText(value).split(' ').filter(Boolean);
}

function phrasePositions(tokens: string[], phrase: string): number[] {
  const phraseTokens = words(phrase);
  const positions: number[] = [];

  if (phraseTokens.length === 0) {
    return positions;
  }

  for (let index = 0; index <= tokens.length - phraseTokens.length; index += 1) {
    if (phraseTokens.every((token, offset) => tokens[index + offset] === token)) {
      positions.push(index);
    }
  }

  return positions;
}

function hasNearContext(tokens: string[], positions: number[], contextTerms: string[], window: number): boolean {
  if (contextTerms.length === 0) {
    return true;
  }

  const contextPositions = contextTerms.flatMap((term) => phrasePositions(tokens, term));

  return positions.some((position) => contextPositions.some((contextPosition) => Math.abs(position - contextPosition) <= window));
}

function conceptScore(section: ExtractedSection, rule: ConceptRule): number {
  const tokens = words(`${section.heading} ${section.text}`);
  const text = cleanText(`${section.heading} ${section.text}`);
  const negativeHits = (rule.negativeTerms ?? []).reduce((total, term) => total + phrasePositions(tokens, term).length, 0);
  const contextTerms = rule.contextTerms ?? [];
  const window = rule.window ?? 24;
  let positiveScore = 0;

  for (const term of rule.terms) {
    const positions = phrasePositions(tokens, term);

    if (positions.length === 0) {
      continue;
    }

    if (!hasNearContext(tokens, positions, contextTerms, window)) {
      continue;
    }

    positiveScore += positions.length * (term.includes(' ') ? 6 : 3);
  }

  if (positiveScore === 0 || negativeHits > 0 && negativeHits * 8 >= positiveScore) {
    return 0;
  }

  const headingBoost = rule.terms.some((term) => cleanText(section.heading).includes(cleanText(term))) ? 4 : 0;
  const densityBoost = contextTerms.some((term) => text.includes(cleanText(term))) ? 2 : 0;
  return positiveScore + headingBoost + densityBoost - negativeHits * 5;
}

function readSections(): ExtractedSection[] {
  if (!existsSync(sectionsDir)) {
    return [];
  }

  return readdirSync(sectionsDir)
    .filter((file) => file.endsWith('.sections.json'))
    .toSorted()
    .flatMap((file) => readJson<ExtractedSection[]>(join(sectionsDir, file)));
}

function sectionMatches(
  blueprint: TopicBlueprint,
  question: QuestionBlueprint,
  sections: ExtractedSection[],
  documentsBySlug: Map<string, SourceDocument>
): SectionMatch[] {
  const rules = blueprint.concepts.filter((rule) => question.concepts.includes(rule.id));

  return sections
    .map((section): SectionMatch | undefined => {
      const document = documentsBySlug.get(section.documentSlug);
      if (!document) {
        return undefined;
      }

      const scoredRules = rules
        .map((rule) => ({ rule, score: conceptScore(section, rule) }))
        .filter(({ score }) => score > 0);
      const score = scoredRules.reduce((total, match) => total + match.score, 0);

      if (score < minimumQuestionScore) {
        return undefined;
      }

      return {
        section,
        document,
        score,
        matchedConceptIds: scoredRules.map(({ rule }) => rule.id),
        matchedConcepts: scoredRules.map(({ rule }) => rule.label)
      };
    })
    .filter((match): match is SectionMatch => match !== undefined)
    .toSorted((a, b) => b.score - a.score || a.document.title.localeCompare(b.document.title, 'es'));
}

function projectName(match: SectionMatch): string {
  return match.document.projectName || match.document.title;
}

function readEvidenceLayer(topicSlug: string): EvidenceTopicLayer | null {
  const path = join(evidenceDir, `${topicSlug}.json`);
  if (!existsSync(path)) return null;
  try {
    return readJson<EvidenceTopicLayer>(path);
  } catch {
    return null;
  }
}

function evidenceLevel(matches: SectionMatch[], evidenceHealth?: EvidenceHealth): EvidenceLevel {
  const projects = new Set(matches.map(projectName));

  const baseLevel: EvidenceLevel = (() => {
    if (matches.length >= 5 && projects.size >= 3) return 'high';
    if (matches.length >= 2 && projects.size >= 2) return 'medium';
    return 'low';
  })();

  if (evidenceHealth) {
    if (baseLevel === 'high' && (evidenceHealth === 'weak' || evidenceHealth === 'insufficient')) {
      return 'medium';
    }
    if (baseLevel === 'high' && evidenceHealth === 'moderate') {
      if (matches.length < 8 || projects.size < 4) return 'medium';
    }
    if (baseLevel === 'medium' && evidenceHealth === 'insufficient') {
      return 'low';
    }
  }

  return baseLevel;
}

function extractSnippet(text: string, matchedLabels: string[]): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const normalized = normalize(clean);
  const firstMatch = matchedLabels
    .flatMap((label) => words(label))
    .map((term) => normalized.indexOf(term))
    .filter((index) => index >= 0)
    .toSorted((a, b) => a - b)[0];
  const start = firstMatch === undefined ? 0 : Math.max(0, firstMatch - 120);
  const excerpt = clean.slice(start, start + maxExtractLength).trim();
  return `${start > 0 ? '...' : ''}${excerpt}${start + maxExtractLength < clean.length ? '...' : ''}`;
}

function extractFromMatch(topicSlug: string, questionId: string, match: SectionMatch, index: number): DecisionModelExtract {
  return {
    id: `${topicSlug}-${questionId}-${index + 1}`,
    documentSlug: match.document.slug,
    documentTitle: match.document.title,
    documentType: match.document.type,
    ...(match.document.projectName ? { projectName: match.document.projectName } : {}),
    sourcePath: match.document.sourcePath,
    articleOrSection: match.section.heading,
    excerpt: extractSnippet(match.section.text, match.matchedConcepts),
    matchedConcepts: match.matchedConcepts,
    score: match.score
  };
}

function buildApproaches(question: QuestionBlueprint, matches: SectionMatch[], evidenceHealth?: EvidenceHealth): SolutionApproach[] {
  return question.approaches
    .map((approachBlueprint) => {
      const matchedApproachConcepts = new Set(
        matches.flatMap((match) => match.matchedConceptIds.filter((concept) => approachBlueprint.concepts.includes(concept)))
      );
      const requiredConcepts = approachBlueprint.concepts.length > 1 ? 2 : 1;

      if (matchedApproachConcepts.size < requiredConcepts) {
        return undefined;
      }

      const approachMatches = matches.filter((match) =>
        approachBlueprint.concepts.some((concept) => match.matchedConceptIds.includes(concept))
      );

      if (approachMatches.length === 0) {
        return undefined;
      }

      const baseLevel = evidenceLevel(approachMatches);
      const syncedLevel = evidenceLevel(approachMatches, evidenceHealth);

      if (baseLevel !== syncedLevel) {
        console.log(`    [SYNC] ${approachBlueprint.name}: evidenceLevel ${baseLevel} -> ${syncedLevel} (health=${evidenceHealth})`);
      }

      return {
        name: approachBlueprint.name,
        summary: approachBlueprint.summary,
        characteristics: approachBlueprint.characteristics,
        advantages: approachBlueprint.advantages,
        risks: approachBlueprint.risks,
        suitableFor: approachBlueprint.suitableFor,
        detectedInProjects: [...new Set(approachMatches.map(projectName))].slice(0, 6),
        evidenceLevel: syncedLevel
      } satisfies SolutionApproach;
    })
    .filter((approach): approach is SolutionApproach => approach !== undefined);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function buildModel(
  topic: TaxonomyTopic,
  blueprint: TopicBlueprint,
  sections: ExtractedSection[],
  documentsBySlug: Map<string, SourceDocument>,
  evidenceLayer: EvidenceTopicLayer | null
): TopicDecisionModel {
  const allExtracts: DecisionModelExtract[] = [];
  const limits: string[] = [];
  const evidenceHealth = evidenceLayer?.evidenceHealth;
  const decisionQuestions: DecisionQuestion[] = blueprint.questions.map((question) => {
    const matches = sectionMatches(blueprint, question, sections, documentsBySlug).slice(0, maxExtractsPerQuestion);
    const extracts = matches.map((match, index) => extractFromMatch(topic.slug, question.id, match, index));
    allExtracts.push(...extracts);

    if (extracts.length === 0) {
      limits.push(`No se han encontrado suficientes ejemplos claros para: ${question.question}`);
    }

    return {
      id: question.id,
      question: question.question,
      whyItMatters: question.whyItMatters,
      detectedApproaches: extracts.length > 0 ? buildApproaches(question, matches, evidenceHealth) : [],
      commonTradeoffs: extracts.length > 0 ? question.tradeoffs : [],
      recommendationsForBuenVivir: extracts.length > 0 ? question.recommendations : [],
      relatedExtracts: extracts.map((extract) => extract.id),
      relatedProjects: unique(matches.map(projectName)).slice(0, 6),
      suggestedPlacement: {
        statutes: extracts.length > 0 ? question.statutes : [],
        rri: extracts.length > 0 ? question.rri : []
      }
    };
  });
  const usefulQuestions = decisionQuestions.filter((question) => question.relatedExtracts.length > 0);

  if (usefulQuestions.length === 0) {
    limits.push('Los documentos analizados apenas desarrollan esta cuestión de forma operativa.');
    limits.push('Este tema puede estar resolviéndose informalmente o aparecer poco documentado.');
  }

  return {
    topicSlug: topic.slug,
    generatedAt: new Date().toISOString(),
    decisionQuestions,
    practicalPatterns: usefulQuestions.flatMap((question) => question.detectedApproaches.map((approach) => approach.name)).slice(0, 8),
    commonTradeoffs: unique(usefulQuestions.flatMap((question) => question.commonTradeoffs)).slice(0, 8),
    frequentRisks: unique(usefulQuestions.flatMap((question) => question.detectedApproaches.flatMap((approach) => approach.risks))).slice(0, 8),
    recommendationsForBuenVivir: unique(usefulQuestions.flatMap((question) => question.recommendationsForBuenVivir)).slice(0, 8),
    suggestedPlacement: {
      statutes: unique(usefulQuestions.flatMap((question) => question.suggestedPlacement.statutes)).slice(0, 8),
      rri: unique(usefulQuestions.flatMap((question) => question.suggestedPlacement.rri)).slice(0, 8)
    },
    relevantProjects: unique(usefulQuestions.flatMap((question) => question.relatedProjects)).slice(0, 10),
    extracts: allExtracts,
    limits: unique(limits)
  };
}

const taxonomy = readJson<TaxonomyTopic[]>(taxonomyPath).filter((topic) => topic.status !== 'merged');
const documents = readJson<SourceDocument[]>(documentsPath);
const sections = readSections();
const documentsBySlug = new Map(documents.map((document) => [document.slug, document]));
const topicsBySlug = new Map(taxonomy.map((topic) => [topic.slug, topic]));
const models: TopicDecisionModel[] = [];

mkdirSync(outputDir, { recursive: true });

let syncedCount = 0;

for (const blueprint of blueprints) {
  const topic = topicsBySlug.get(blueprint.slug);

  if (!topic) {
    continue;
  }

  const evidenceLayer = readEvidenceLayer(blueprint.slug);
  if (evidenceLayer) {
    if (evidenceLayer.evidenceHealth === 'weak' || evidenceLayer.evidenceHealth === 'insufficient') {
      syncedCount++;
    }
  }

  const model = buildModel(topic, blueprint, sections, documentsBySlug, evidenceLayer);
  models.push(model);
  writeFileSync(join(outputDir, `${topic.slug}.json`), `${JSON.stringify(model, null, 2)}\n`);
}

writeFileSync(reportPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  topics: models.map((model) => ({
    topicSlug: model.topicSlug,
    questions: model.decisionQuestions.length,
    questionsWithEvidence: model.decisionQuestions.filter((question) => question.relatedExtracts.length > 0).length,
    extracts: model.extracts.length,
    relevantProjects: model.relevantProjects.length,
    limits: model.limits
  }))
}, null, 2)}\n`);

console.log(`Generated ${models.length} decision model file(s).`);
console.log('Wrote src/content/generated/decision-models/*.json.');
console.log('Wrote src/content/generated/decision-models-report.json.');
if (syncedCount > 0) console.log(`Synced ${syncedCount} topic(s) with evidence layer (downgraded evidenceLevel).`);
