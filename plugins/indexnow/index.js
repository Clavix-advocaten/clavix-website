/**
 * Netlify-bouwplugin: meldt nieuwe en gewijzigde pagina's aan bij IndexNow
 * (Bing en de zoekmachines die daarop meelezen).
 *
 * WAAROM DIT BESTAAT. De sleutel stond sinds 16-8-2026 op de site, maar niets
 * stuurde ooit een melding. Bing moest elke nieuwe pagina zelf vinden; in
 * september 2026 kende Bing 55 van de 147 pagina's.
 *
 * HOE HET WERKT.
 *  1. onPreBuild: de oude versie staat nog live. Lees de live sitemap en onthoud
 *     per adres de lastmod. Voor adressen zonder lastmod (de sjabloonpagina's:
 *     specialismen, Engelse pagina's, /kumar/, /kosten/ ...) de tekst van de
 *     live pagina.
 *  2. onSuccess: draait pas als de uitrol is geslaagd (Netlify: "runs when the
 *     deploy succeeds"). Lees de gebouwde sitemap en vergelijk. Nieuw, gewijzigd
 *     of verdwenen gaat in één POST naar IndexNow.
 *
 * WAT HET NOOIT DOET.
 *  - Buiten productie versturen: een voorbeeldbouw of taktak meldt niets.
 *  - De hele site versturen: is de oude stand niet te lezen, dan gaat er niets weg.
 *  - De bouw laten mislukken: elke fout wordt afgevangen en gelogd.
 *
 * Eenmalig alles aanmelden kan met scripts/indexnow-alles.mjs.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SITE, sitemapsInIndex, leesSitemap, vingerafdruk, besluit, meldAan, uitleg } from './vergelijk.js'

const log = (...a) => console.log('[indexnow]', ...a)
const GELIJKTIJDIG = 6

// De stand van de live site vóór de uitrol. Blijft null als hij niet te lezen was.
let oud = null

async function haal(adres) {
  const res = await fetch(adres, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'clavix-indexnow-bouwplugin' } })
  if (!res.ok) throw new Error(`${adres} gaf ${res.status}`)
  return res.text()
}

/** Voer taak() uit over de lijst, met een grens aan het aantal tegelijk. */
async function inDelen(lijst, taak) {
  const rij = [...lijst]
  await Promise.all(Array.from({ length: Math.min(GELIJKTIJDIG, rij.length) }, async () => {
    while (rij.length) await taak(rij.shift())
  }))
}

async function standLive() {
  const delen = sitemapsInIndex(await haal(`${SITE}/sitemap-index.xml`)).filter((u) => u.startsWith(`${SITE}/`))
  if (delen.length === 0) throw new Error('de sitemapindex noemt geen sitemap')
  const stand = new Map()
  for (const deel of delen) for (const [adres, lastmod] of leesSitemap(await haal(deel))) stand.set(adres, { lastmod, tekst: null })
  // Zonder lastmod is de tekst het enige houvast. Lukt het ophalen niet, dan
  // blijft tekst null en wordt dat adres straks niet aangemeld.
  await inDelen([...stand].filter(([, v]) => !v.lastmod), async ([adres, v]) => {
    try { v.tekst = vingerafdruk(await haal(adres)) } catch { /* blijft null */ }
  })
  return stand
}

async function standGebouwd(map) {
  let delen = ['sitemap-0.xml']
  try { delen = sitemapsInIndex(await readFile(join(map, 'sitemap-index.xml'), 'utf8')).map((u) => new URL(u).pathname.replace(/^\//, '')) } catch { /* val terug op sitemap-0.xml */ }
  const stand = new Map()
  for (const deel of delen) for (const [adres, lastmod] of leesSitemap(await readFile(join(map, deel), 'utf8'))) stand.set(adres, { lastmod, tekst: null })
  await inDelen([...stand].filter(([, v]) => !v.lastmod), async ([adres, v]) => {
    try { v.tekst = vingerafdruk(await readFile(join(map, new URL(adres).pathname, 'index.html'), 'utf8')) } catch { /* blijft null */ }
  })
  return stand
}

export const onPreBuild = async () => {
  try {
    oud = await standLive()
    const zonder = [...oud.values()].filter((v) => !v.lastmod)
    log(`live stand onthouden: ${oud.size} adressen, ${oud.size - zonder.length} met lastmod, ${zonder.length} op tekst (${zonder.filter((v) => v.tekst).length} gelezen)`)
  } catch (fout) {
    oud = null
    log(`de live sitemap is niet te lezen (${fout.message}); na deze bouw wordt niets aangemeld`)
  }
}

export const onSuccess = async ({ constants }) => {
  try {
    const nieuw = await standGebouwd(constants.PUBLISH_DIR)
    const b = besluit({ context: process.env.CONTEXT, oud, nieuw })
    if (b.delen) {
      log(`vergeleken: ${b.delen.nieuw.length} nieuw, ${b.delen.gewijzigd.length} gewijzigd, ${b.delen.verdwenen.length} verdwenen, ${b.delen.onbekend.length} niet te vergelijken`)
      for (const adres of b.urls.slice(0, 50)) log(`  ${adres}`)
      if (b.urls.length > 50) log(`  ... en ${b.urls.length - 50} meer`)
    }
    if (!b.sturen) return log(`niets aangemeld: ${b.reden}`)
    const antwoord = await meldAan(b.urls)
    log(`${antwoord.goed ? 'aangemeld' : 'NIET aangenomen'}: ${b.urls.length} adressen, antwoord ${antwoord.status} (${uitleg(antwoord.status)})`)
  } catch (fout) {
    log(`fout, niets aangemeld: ${fout.message}`)
  }
}
