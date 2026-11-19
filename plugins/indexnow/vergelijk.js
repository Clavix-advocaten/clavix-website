/**
 * Rekenwerk voor de IndexNow-melding: sitemap lezen, paginatekst vergelijken en
 * beslissen of er iets wordt aangemeld. Hier staat geen netwerkverkeer behalve
 * meldAan(); alles is los te toetsen (vergelijk.test.mjs).
 */
import { createHash } from 'node:crypto'

export const SITE = 'https://clavix.nl'
export const HOST = 'clavix.nl'
// De sleutel is openbaar: hij staat sinds 16-8-2026 als bestand op de site.
export const SLEUTEL = 'e928bb78e6cf7ea971703956e9a1047c'
export const SLEUTELADRES = `${SITE}/${SLEUTEL}.txt`
export const EINDPUNT = 'https://api.indexnow.org/indexnow'

/** Adressen van de deelsitemaps uit een sitemapindex. */
export function sitemapsInIndex(xml) {
  return [...xml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
}

/** Sitemap naar Map(adres -> lastmod); een adres zonder lastmod krijgt ''. */
export function leesSitemap(xml) {
  const uit = new Map()
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>([^<]+)<\/loc>/)
    if (!loc) continue
    const lastmod = m[1].match(/<lastmod>([^<]+)<\/lastmod>/)
    uit.set(loc[1].trim(), lastmod ? lastmod[1].trim() : '')
  }
  return uit
}

/**
 * Wat een lezer en een zoekmachine van de pagina zien: titel, omschrijving en de
 * tekst binnen <main>, met de doelen van de links. Opmaak, klassen en de namen
 * van css- en js-bestanden tellen niet mee; die veranderen bij elke bouw.
 */
export function paginatekst(html) {
  const titel = (html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1]
  const omschrijving = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [, ''])[1]
  const main = (html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) || [, html])[1]
  const tekst = main
    .replace(/<(script|style|template|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<a\b[^>]*?\bhref="([^"]*)"[^>]*>/gi, ' [$1] ')
    .replace(/<[^>]+>/g, ' ')
  return [titel, omschrijving, tekst].map((s) => s.replace(/\s+/g, ' ').trim()).join('\n')
}

export function vingerafdruk(html) {
  return createHash('sha256').update(paginatekst(html)).digest('hex')
}

/**
 * oud en nieuw: Map(adres -> { lastmod, tekst }), tekst is een vingerafdruk of null.
 * Een adres met een lastmod wordt op die datum vergeleken, een adres zonder
 * (de sjabloonpagina's) op zijn tekst. Kan er niet vergeleken worden, dan is de
 * uitkomst "onbekend" en wordt het adres niet aangemeld.
 */
export function vergelijk(oud, nieuw) {
  const uit = { nieuw: [], gewijzigd: [], verdwenen: [], onbekend: [] }
  for (const [adres, b] of nieuw) {
    const a = oud.get(adres)
    if (!a) uit.nieuw.push(adres)
    else if (a.lastmod || b.lastmod) {
      if (a.lastmod !== b.lastmod) uit.gewijzigd.push(adres)
    } else if (a.tekst && b.tekst) {
      if (a.tekst !== b.tekst) uit.gewijzigd.push(adres)
    } else uit.onbekend.push(adres)
  }
  for (const adres of oud.keys()) if (!nieuw.has(adres)) uit.verdwenen.push(adres)
  return uit
}

/**
 * Wordt er aangemeld, en wat? Alleen bij een productie-uitrol, alleen als de
 * stand van vóór de bouw bekend is, en alleen de adressen die verschillen.
 * Is de oude stand er niet, dan gaat er niets weg: nooit de hele site.
 */
export function besluit({ context, oud, nieuw }) {
  if (!oud || oud.size === 0) return { sturen: false, urls: [], reden: 'de stand van de live site vóór de bouw is niet bekend' }
  if (!nieuw || nieuw.size === 0) return { sturen: false, urls: [], reden: 'de gebouwde sitemap is niet te lezen' }
  const delen = vergelijk(oud, nieuw)
  const urls = [...delen.nieuw, ...delen.gewijzigd, ...delen.verdwenen]
  if (context !== 'production') return { sturen: false, urls, delen, reden: `dit is geen productie-uitrol (${context || 'onbekend'})` }
  if (urls.length === 0) return { sturen: false, urls, delen, reden: 'geen adres is nieuw, gewijzigd of verdwenen' }
  return { sturen: true, urls, delen, reden: 'productie-uitrol met verschillen' }
}

/** Eén POST naar IndexNow. Geeft de statuscode terug; gooit bij een netwerkfout. */
export async function meldAan(urls) {
  const res = await fetch(EINDPUNT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: SLEUTEL, keyLocation: SLEUTELADRES, urlList: urls.slice(0, 10000) }),
    signal: AbortSignal.timeout(15000),
  })
  return { status: res.status, goed: res.status === 200 || res.status === 202 }
}

/** Betekenis van de statuscodes volgens indexnow.org/documentation. */
export function uitleg(status) {
  return {
    200: 'ontvangen',
    202: 'ontvangen, de sleutel wordt nog nagekeken',
    400: 'verzoek ongeldig',
    403: 'sleutel niet geldig of sleutelbestand niet gevonden',
    422: 'adressen horen niet bij de host of de sleutel past niet',
    429: 'te vaak aangemeld',
  }[status] || 'onbekend antwoord'
}
