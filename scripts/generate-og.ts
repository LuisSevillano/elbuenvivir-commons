/**
 * Genera las imágenes para compartir (Open Graph, 1200x630) "fotografiando"
 * la ruta /og-preview con un navegador headless. Lo que ves en esa página es
 * exactamente lo que se guarda como PNG.
 *
 * Uso:
 *   1) en una terminal:  pnpm dev
 *   2) en otra:          pnpm og:gen
 *
 * Requiere Playwright + Chromium (una sola vez):
 *   pnpm add -D playwright && pnpm exec playwright install chromium
 *
 * Variables opcionales:
 *   OG_BASE_URL   URL del servidor de desarrollo (por defecto http://localhost:5173)
 *   OG_SCALE      factor de densidad de la imagen (por defecto 2 => PNG nítido)
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = (process.env.OG_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
const SCALE = Number(process.env.OG_SCALE ?? '2');
const OUT_DIR = path.resolve('static/og');
const MANIFEST = path.resolve('src/lib/og/manifest.json');

interface TargetList {
  temas: string[];
  documentos: string[];
}

async function fetchTargets(): Promise<TargetList> {
  const res = await fetch(`${BASE}/og-preview/data.json`);
  if (!res.ok) {
    throw new Error(
      `No pude leer ${BASE}/og-preview/data.json (${res.status}). ¿Está corriendo "pnpm dev"?`
    );
  }
  return (await res.json()) as TargetList;
}

async function main() {
  const targets = await fetchTargets();
  const browser = await chromium.launch();
  const page = await browser.newPage({
    // Algo más ancho/alto que la tarjeta (1200x630) para que no haya recortes;
    // la captura se limita al elemento .og-card, que mide exactamente 1200x630.
    viewport: { width: 1320, height: 760 },
    deviceScaleFactor: SCALE
  });

  const done: { temas: string[]; documentos: string[] } = { temas: [], documentos: [] };
  const shoot = async (type: 'tema' | 'documento', slug: string, dir: 'temas' | 'documentos') => {
    await page.goto(`${BASE}/og-preview?type=${type}&slug=${encodeURIComponent(slug)}`, {
      waitUntil: 'networkidle'
    });
    const card = page.locator('.og-card');
    await card.waitFor({ state: 'visible' });
    // Da un instante a que asiente la tipografía antes de capturar.
    await page.waitForTimeout(120);
    await mkdir(path.join(OUT_DIR, dir), { recursive: true });
    await card.screenshot({ path: path.join(OUT_DIR, dir, `${slug}.png`) });
    done[dir].push(slug);
  };

  for (const slug of targets.temas) await shoot('tema', slug, 'temas');
  for (const slug of targets.documentos) await shoot('documento', slug, 'documentos');

  await browser.close();

  // Deja constancia de qué imágenes existen; seo.ts solo enlaza las que están aquí.
  await writeFile(MANIFEST, `${JSON.stringify(done, null, 2)}\n`, 'utf-8');
  console.log(
    `OG listo: ${done.temas.length + done.documentos.length} imágenes en ${OUT_DIR} y manifiesto actualizado.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
