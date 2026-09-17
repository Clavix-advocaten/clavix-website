/**
 * Bouwt dist/llms.txt uit de gebouwde site.
 *
 * WAAROM DIT BESTAAT. llms.txt werd met de hand bijgehouden in public/ en liep
 * daardoor achter: op 17-9-2026 stonden er 121 van de 147 pagina's in, de
 * homepage ontbrak. Dit bestand is juist wat AI-zoekmachines lezen, dus een
 * gat van 26 pagina's kost citaties. Nu wordt het na elke build gegenereerd uit
 * de titels en meta-omschrijvingen van de pagina's zelf, zodat het niet meer
 * kan verouderen.
 *
 * Draait als postbuild (npm run build), dus ook op Netlify.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const DIST = 'dist'
const SITE = 'https://clavix.nl'

const SECTIES = [
  ['Praktijkgebieden', (p) => p.startsWith('/praktijkgebieden/')],
  ['Specialismen', (p) => p.startsWith('/specialisme/')],
  ['Sectoren', (p) => p.startsWith('/sectoren/')],
  ['Kennisbank', (p) => p.startsWith('/clusters/')],
  ['Notities', (p) => p.startsWith('/notities/')],
  ['Kennis en hulpmiddelen', (p) => ['/kennisbank/', '/veelgestelde-vragen/', '/woordenlijst/', '/modelbrieven/',
    '/wettelijke-rente-berekenen/', '/incassokosten-berekenen/', '/proceskosten-berekenen/', '/zoeken/'].includes(p)],
  ['Het kantoor', (p) => ['/kumar/', '/werkwijze/', '/kosten/', '/advocaat-zuidas/', '/juridisch-abonnement/', '/nieuwsbrief/'].includes(p)],
  ['Contact', (p) => p === '/contact/'],
  ['English', (p) => p.startsWith('/en')],
  ['Juridisch en voorwaarden', (p) => ['/algemene-voorwaarden/', '/privacy/', '/cookies/', '/disclaimer/',
    '/klachtenregeling/', '/toegankelijkheid/'].includes(p)],
]

async function paginas(dir) {
  const uit = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const pad = join(dir, entry.name)
    if (entry.isDirectory()) uit.push(...await paginas(pad))
    else if (entry.name === 'index.html') uit.push(pad)
  }
  return uit
}

const tekst = (html, re) => {
  const m = html.match(re)
  if (!m) return ''
  return m[1].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

const bestanden = (await paginas(DIST)).sort()
const rijen = []
for (const f of bestanden) {
  const rel = relative(DIST, f).replace(/index\.html$/, '')
  const pad = '/' + rel.replace(/\\/g, '/')
  if (pad === '/404/') continue
  const html = await readFile(f, 'utf8')
  const titel = tekst(html, /<title>([\s\S]*?)<\/title>/)
    .replace(/\s*\|\s*Clavix.*$/, '')
    .replace(/^Clavix\s*\|\s*/, '')
  const omschrijving = tekst(html, /<meta name="description" content="([^"]*)"/)
  if (titel) rijen.push({ pad, titel, omschrijving })
}

const home = rijen.find((r) => r.pad === '/')
const regels = [
  '# Clavix',
  '',
  `> ${home?.omschrijving || 'Advocatenkantoor in Amsterdam Zuidas voor ondernemers met vastgoed.'}`,
  '',
  `- [Home](${SITE}/): ${home?.titel || 'Clavix'}. Start van de site, met de praktijkgebieden en de rekenhulpen.`,
  '',
]
const gebruikt = new Set(['/'])
for (const [naam, hoort] of SECTIES) {
  const groep = rijen.filter((r) => !gebruikt.has(r.pad) && hoort(r.pad))
  if (!groep.length) continue
  groep.forEach((r) => gebruikt.add(r.pad))
  regels.push(`## ${naam}`, '')
  for (const r of groep.sort((a, b) => a.titel.localeCompare(b.titel, 'nl'))) {
    regels.push(`- [${r.titel}](${SITE}${r.pad})${r.omschrijving ? ': ' + r.omschrijving : ''}`)
  }
  regels.push('')
}
const rest = rijen.filter((r) => !gebruikt.has(r.pad))
if (rest.length) {
  regels.push('## Overig', '')
  for (const r of rest) regels.push(`- [${r.titel}](${SITE}${r.pad})${r.omschrijving ? ': ' + r.omschrijving : ''}`)
  regels.push('')
}
await writeFile(join(DIST, 'llms.txt'), regels.join('\n'))
console.log(`llms.txt: ${gebruikt.size + rest.length} pagina's, ${regels.length} regels`)
