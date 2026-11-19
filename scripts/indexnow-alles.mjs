/**
 * Meldt één keer alle adressen uit de live sitemap aan bij IndexNow (Bing).
 *
 * WAAROM DIT BESTAAT. De bouwplugin (plugins/indexnow/) meldt alleen wat bij een
 * uitrol verandert. Wat al live stond toen de plugin erbij kwam, is nooit
 * aangemeld. Dit script haalt die achterstand in. Daarna is het niet meer nodig;
 * herhaald alles aanmelden kan als spam worden gezien (antwoord 429).
 *
 * Gebruik:  node scripts/indexnow-alles.mjs          proef: toont wat er zou gaan
 *           node scripts/indexnow-alles.mjs --echt   verstuurt
 */
import { SITE, SLEUTEL, SLEUTELADRES, sitemapsInIndex, leesSitemap, meldAan, uitleg } from '../plugins/indexnow/vergelijk.js'

const ECHT = process.argv.includes('--echt')

async function haal(adres) {
  const res = await fetch(adres, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`${adres} gaf ${res.status}`)
  return res.text()
}

// Zonder een kloppend sleutelbestand weigert IndexNow (403); dan heeft versturen geen zin.
if ((await haal(SLEUTELADRES)).trim() !== SLEUTEL) {
  console.error(`GEWEIGERD: ${SLEUTELADRES} bevat niet de sleutel uit plugins/indexnow/vergelijk.js`)
  process.exit(1)
}

const delen = sitemapsInIndex(await haal(`${SITE}/sitemap-index.xml`)).filter((u) => u.startsWith(`${SITE}/`))
const adressen = []
for (const deel of delen) adressen.push(...leesSitemap(await haal(deel)).keys())
const urls = [...new Set(adressen)].filter((u) => u.startsWith(`${SITE}/`))

console.log(`${urls.length} adressen uit ${delen.length} sitemap(s); het sleutelbestand staat live en klopt`)
for (const u of urls.slice(0, 5)) console.log(`  ${u}`)
if (urls.length > 5) console.log(`  ... en ${urls.length - 5} meer`)

if (urls.length === 0) {
  console.error('GEWEIGERD: de sitemap is leeg')
  process.exit(1)
}
if (!ECHT) {
  console.log('proef: er is niets verstuurd. Versturen: node scripts/indexnow-alles.mjs --echt')
  process.exit(0)
}

const antwoord = await meldAan(urls)
console.log(`${antwoord.goed ? 'aangemeld' : 'NIET aangenomen'}: ${urls.length} adressen, antwoord ${antwoord.status} (${uitleg(antwoord.status)})`)
process.exit(antwoord.goed ? 0 : 1)
