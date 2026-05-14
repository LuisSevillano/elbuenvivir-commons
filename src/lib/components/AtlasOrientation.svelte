<section class="atlas-orientation">
  <h2>Cómo explorar el atlas</h2>

  <div class="orientation-grid">
    <div class="orient-block">
      <h3><a href="/temas">Temas</a></h3>
      <p>
        Para explorar cuestiones concretas: baja de personas socias, aportaciones económicas,
        convivencia, invitados, toma de decisiones o uso de espacios comunes. Cada tema distingue
        entre evidencia documental sólida, enfoques detectados, hipótesis de trabajo y cuestiones
        que requieren interpretación prudente.
      </p>
    </div>

    <div class="orient-block">
      <h3><a href="/documentos">Documentos</a></h3>
      <p>
        Para consultar directamente estatutos, reglamentos internos, leyes y materiales de referencia
        utilizados en el análisis comparado. La herramienta permite recorrer el corpus documental
        sin necesidad de leer todos los documentos completos desde el principio.
      </p>
    </div>

    <div class="orient-block">
      <h3><a href="/patrones">Patrones</a></h3>
      <p>
        Para detectar tensiones habituales, enfoques recurrentes y diferencias entre proyectos
        cooperativos. Útil para identificar qué cuestiones suelen generar más regulación, dónde
        aparecen modelos incompatibles y qué decisiones dependen especialmente del contexto
        de cada grupo.
      </p>
    </div>
  </div>

  <p class="closure">
    La herramienta funciona mejor como apoyo para conversaciones colectivas y redacción de
    primeros borradores de trabajo.
  </p>
</section>

<style>
  .atlas-orientation {
    max-width: 62ch;
    margin: 0 auto 3rem;
  }

  h2 {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--heading);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 1.4rem;
  }

  .orientation-grid {
    display: grid;
    gap: 1.5rem;
  }

  .orient-block {
    padding: 0;
  }

  .orient-block h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.4rem;
  }

  .orient-block h3 a {
    color: var(--accent);
    text-decoration: none;
  }

  .orient-block h3 a:hover {
    text-decoration: underline;
  }

  .orient-block p {
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--text);
    margin: 0;
  }

  .closure {
    margin-top: 1.65rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
    font-size: 0.85rem;
    color: var(--muted);
    font-style: italic;
  }
</style>
