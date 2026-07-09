# Ingesta y actualización de datos

Cómo se alimenta este proyecto con material del Drive y cómo incorporar cosas
nuevas (sobre todo **una acta nueva**), de forma que se pueda reproducir desde
**cualquier equipo**. Nada de esto vive en el repo por sí solo: la carpeta
`docs/` y las credenciales de Drive están fuera de git, así que en una máquina
nueva hay que rehacer este montaje una vez.

## 0. Requisitos (una vez por equipo)

- **Node + pnpm** (ver `NODE_VERSION`/`PNPM_VERSION` en `netlify.toml`). Instala dependencias: `pnpm install`.
- **rclone** (`brew install rclone` en macOS) — para leer el Drive.
- **Netlify CLI** ya viene como dependencia; para desplegar necesitas sesión: `pnpm exec netlify login`.
- (Opcional, para hornear imágenes OG) Playwright: `pnpm exec playwright install chromium`. Ver [OG-IMAGENES.md](OG-IMAGENES.md).

## 1. Autenticar Google Drive con rclone

El material fuente está en el **Drive personal** del proyecto (cuenta de Google
del grupo), no en un Drive de empresa. El acceso es de **solo lectura**.

```
rclone config
```
En el asistente:
1. `n` → **New remote**.
2. Nombre: **`gdrive`** (importante: el resto de comandos usan `gdrive:`).
3. Storage: **`drive`** (Google Drive).
4. `client_id` / `client_secret`: en blanco (usa los de rclone).
5. Scope: **`drive.readonly`** (solo lectura — no escribimos nunca en el Drive).
6. Advanced config: `n`. Auto config: `y` → se abre el navegador → **inicia sesión con la cuenta de Google del proyecto** y autoriza.
7. Team/Shared drive: `n`. Confirma y sal (`q`).

El token queda en `~/.config/rclone/rclone.conf` y se refresca solo. Verifica:
```
rclone lsf "gdrive:🏡EPICLIFE🏡/"
```

> **Por qué rclone y no el conector de la app.** Claude Code no hereda el
> conector de Google Drive de la app de claude.ai. Además, algunos navegadores
> corporativos bloquean `drive.google.com`. rclone con OAuth de la cuenta
> personal es la vía que funciona de forma reproducible.

## 2. Cómo está organizado el Drive

- `🏡EPICLIFE🏡/COMISIONES/Forma Jurídica/Commons/` → **documentos de referencia** (públicos): subcarpetas `leyes/ estatutos/ rri/ guias/ otros/`. Reflejan exactamente la carpeta local `docs/` (gitignored).
- `🏡EPICLIFE🏡/Reuniones/` → **actas** de las asambleas. **Material interno: NO se publica** en la web. Se consultan para fundamentar el contenido, pero no se ingestan como documentos.

---

## 3. Caso A — Documento de referencia nuevo (estatuto, guía, ley…)

Cuando se añade un estatuto de otra cooperativa, una guía o una norma:

```
# 1) Traer/actualizar la carpeta de referencia a docs/ (local, gitignored)
rclone copy "gdrive:🏡EPICLIFE🏡/COMISIONES/Forma Jurídica/Commons" docs

# 2) Reconstruir el índice de contenido
pnpm run content:pipeline      # ingest → extract → split → build:index → validate:content

# 3) Publicar
pnpm run deploy
```

Notas:
- Solo se ingestan `.pdf/.txt/.md/.docx` (los `.doc` antiguos se ignoran).
- La ingesta es **determinista y local**: no usa ninguna API de IA.
- Existen scripts de una "capa editorial" (`generate:*`, `build:*`). **No los uses para redactar contenido**: en su día generaban afirmaciones no fiables. El contenido real de cada tema se mantiene a mano en `src/content/topics/<slug>.json` (ver Caso B).

---

## 4. Caso B — Incorporar una acta nueva  ← el caso habitual

Las actas **no** pasan por el pipeline (no se publican). El trabajo es
**leerlas y traducir sus decisiones** a los temas de la web.

```
# 1) Traer el acta (ejemplo)
rclone copy "gdrive:🏡EPICLIFE🏡/Reuniones/REUNIÓN_22_OD_ACTA(FECHA).docx" ./_tmp

# 2) Leer su texto sin abrir Word (docx = zip con XML):
python3 -c "import zipfile,re,sys; xml=zipfile.ZipFile(sys.argv[1]).read('word/document.xml').decode('utf-8'); print('\n'.join(l for l in (re.sub(r'<[^>]+>','',''.join(re.findall(r'<w:t[^>]*>(.*?)</w:t>',p,re.S))) for p in re.split(r'</w:p>',xml)) if l.strip()))" "_tmp/REUNIÓN_22_OD_ACTA(FECHA).docx"
```

Al leerla, **distingue con cuidado** (lección aprendida con el "Plan B"):
- **"Resumen de acuerdos alcanzados"** → esto **sí** es un acuerdo. Se refleja como decidido.
- **"Puntos pendientes" / "Propuesta" / "Pospuesto"** → **NO** son acuerdos. Se reflejan como *propuesta/decisión abierta*, nunca como algo aprobado.

Luego:
1. Actualiza los temas afectados en `src/content/topics/<slug>.json`. Los campos que se tocan suelen ser: `dossier.proposal` (rationale, articles, openDecisions), `decisionsForBuenVivir`, `risks`, `governancePlacement`. Marca lo pendiente como pendiente.
2. Convierte fechas relativas a **absolutas** ("la próxima asamblea" → la fecha real). Da **más peso a las actas recientes** que a documentos antiguos tipo "Ideas iniciales".
3. Valida y revisa:
   ```
   pnpm run validate:content
   pnpm dev            # abre /temas/<slug> y comprueba que se ve bien
   ```
4. Publica (ver §6). Las actas **no** se copian al repo; se borra `_tmp/` al terminar.

> Regla de oro: nunca afirmar "aprobado en la Reunión N" sin haberlo leído en el
> "Resumen de acuerdos alcanzados" de esa acta. Ante la duda, es propuesta.

---

## 5. Imágenes para compartir (OG)

Solo si cambiaste la plantilla o añadiste temas/documentos. Flujo completo en
[OG-IMAGENES.md](OG-IMAGENES.md): `pnpm dev` + `pnpm og:gen`, commitear `static/og`
y `src/lib/og/manifest.json`, y desplegar.

## 6. Publicar

```
pnpm run deploy      # netlify deploy --build --prod (requiere sesión de netlify)
```
El build de Netlify corre `pnpm build`; los assets de `static/` (incluidas las
imágenes OG) se copian tal cual. Si `deploy` da *"Unauthorized"*, falta
`pnpm exec netlify login`.

## 7. Chuleta rápida

| Quiero… | Comando |
|---|---|
| Comprobar acceso al Drive | `rclone lsf "gdrive:🏡EPICLIFE🏡/"` |
| Actualizar documentos de referencia | `rclone copy "gdrive:🏡EPICLIFE🏡/COMISIONES/Forma Jurídica/Commons" docs && pnpm run content:pipeline` |
| Leer una acta | `rclone copy "gdrive:🏡EPICLIFE🏡/Reuniones/<ACTA>.docx" ./_tmp` + el one-liner de python de §4 |
| Validar contenido | `pnpm run validate:content` |
| Previsualizar | `pnpm dev` |
| Regenerar imágenes OG | `pnpm og:gen` (con `pnpm dev` corriendo) |
| Publicar | `pnpm run deploy` |

## 8. Qué NO está en git (y hay que rehacer en un equipo nuevo)

`docs/` (documentos de referencia — se rehace con rclone, §3), las credenciales
de rclone (`~/.config/rclone/`, §1) y la sesión de Netlify. Todo lo demás
(contenido de los temas, componentes, imágenes OG ya generadas) sí está versionado.
