/**
 * Toets van de IndexNow-plugin. Er gaat niets het net op: fetch is vervangen
 * door een nagemaakte site, en elke POST wordt alleen geteld.
 *
 * Draaien: npm run test:indexnow
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { leesSitemap, sitemapsInIndex, paginatekst, vingerafdruk, vergelijk, besluit, EINDPUNT, SLEUTEL } from './vergelijk.js'
import { onPreBuild, onSuccess } from './index.js'

const S = 'https://clavix.nl'
const sitemap = (regels) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${
  regels.map(([pad, lastmod]) => `<url><loc>${S}${pad}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`).join('')}</urlset>`
const index = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${S}/sitemap-0.xml</loc></sitemap></sitemapindex>`
const pagina = (tekst, { titel = 'Kosten | Clavix', css = 'a1b2' } = {}) =>
  `<!doctype html><html><head><title>${titel}</title><meta name="description" content="Wat het kost."><link rel="stylesheet" href="/_astro/index.${css}.css"></head>` +
  `<body><nav>menu</nav><main id="main"><h1 class="t-${css}">Kosten</h1><p>${tekst}</p><script>var x = "${css}"</script></main><footer>2026</footer></body></html>`

// ---------- het rekenwerk ----------

test('sitemap lezen: met en zonder lastmod', () => {
  const m = leesSitemap(sitemap([['/clusters/a/', '2026-08-26T02:08:39.000Z'], ['/kosten/', '']]))
  assert.deepEqual([...m], [[`${S}/clusters/a/`, '2026-08-26T02:08:39.000Z'], [`${S}/kosten/`, '']])
  assert.deepEqual(sitemapsInIndex(index), [`${S}/sitemap-0.xml`])
})

test('paginatekst: opmaak en bestandsnamen tellen niet, tekst, titel en linkdoel wel', () => {
  const basis = vingerafdruk(pagina('Uurtarief conform bevestiging.'))
  assert.equal(vingerafdruk(pagina('Uurtarief conform bevestiging.', { css: 'zz99' })), basis, 'andere css-naam, klasse en script')
  assert.notEqual(vingerafdruk(pagina('Uurtarief conform bevestiging. Kantoorkosten worden niet berekend.')), basis, 'andere tekst')
  assert.notEqual(vingerafdruk(pagina('Uurtarief conform bevestiging.', { titel: 'Tarieven | Clavix' })), basis, 'andere titel')
  assert.notEqual(vingerafdruk(pagina('Zie <a href="/kosten/">kosten</a>.')), vingerafdruk(pagina('Zie <a href="/werkwijze/">kosten</a>.')), 'ander linkdoel')
  assert.ok(!paginatekst(pagina('x')).includes('var x'), 'script in main telt niet mee')
  assert.ok(!paginatekst(pagina('x')).includes('menu'), 'navigatie telt niet mee')
})

const stand = (regels) => new Map(regels.map(([pad, lastmod, tekst = null]) => [`${S}${pad}`, { lastmod, tekst }]))

test('vergelijken: nieuw, gewijzigd, ongewijzigd, verdwenen en niet te vergelijken', () => {
  const oud = stand([['/clusters/a/', 'd1'], ['/clusters/b/', 'd1'], ['/kosten/', '', 'h1'], ['/kumar/', '', 'h1'], ['/weg/', 'd1'], ['/contact/', '', null]])
  const nieuw = stand([['/clusters/a/', 'd1'], ['/clusters/b/', 'd2'], ['/kosten/', '', 'h2'], ['/kumar/', '', 'h1'], ['/clusters/c/', 'd3'], ['/contact/', '', 'h1']])
  assert.deepEqual(vergelijk(oud, nieuw), {
    nieuw: [`${S}/clusters/c/`],
    gewijzigd: [`${S}/clusters/b/`, `${S}/kosten/`],
    verdwenen: [`${S}/weg/`],
    onbekend: [`${S}/contact/`],
  })
})

test('besluit: geen oude stand betekent niets sturen, nooit alles', () => {
  const nieuw = stand([['/clusters/a/', 'd1'], ['/clusters/b/', 'd1']])
  for (const oud of [null, undefined, new Map()]) {
    const b = besluit({ context: 'production', oud, nieuw })
    assert.equal(b.sturen, false)
    assert.deepEqual(b.urls, [])
  }
})

test('besluit: alleen productie stuurt, en alleen bij een verschil', () => {
  const oud = stand([['/clusters/a/', 'd1']])
  const anders = stand([['/clusters/a/', 'd2']])
  assert.equal(besluit({ context: 'production', oud, nieuw: oud }).sturen, false, 'niets gewijzigd')
  assert.match(besluit({ context: 'production', oud, nieuw: oud }).reden, /geen adres/)
  assert.match(besluit({ context: 'deploy-preview', oud, nieuw: oud }).reden, /geen productie-uitrol \(deploy-preview\)/, 'buiten productie staat dat er altijd bij')
  for (const context of ['deploy-preview', 'branch-deploy', 'dev', undefined]) {
    const b = besluit({ context, oud, nieuw: anders })
    assert.equal(b.sturen, false, String(context))
    assert.deepEqual(b.urls, [`${S}/clusters/a/`], 'het verschil wordt wel gemeld in het logboek')
  }
  const b = besluit({ context: 'production', oud, nieuw: anders })
  assert.equal(b.sturen, true)
  assert.deepEqual(b.urls, [`${S}/clusters/a/`])
})

// ---------- de plugin zelf, tegen een nagemaakte site ----------

/** Vervangt fetch. live: { pad: inhoud }; een ontbrekend pad geeft 404. Telt elke POST. */
function namaak(live, { indexnowStatus = 200, netwerkfout = false, postfout = false } = {}) {
  const posts = []
  globalThis.fetch = async (adres, opties = {}) => {
    if (netwerkfout) throw new Error('geen verbinding')
    if (opties.method === 'POST') {
      posts.push({ adres: String(adres), body: JSON.parse(opties.body) })
      if (postfout) throw new Error('geen verbinding met IndexNow')
      return { ok: indexnowStatus < 300, status: indexnowStatus, text: async () => '' }
    }
    const pad = new URL(adres).pathname
    return pad in live ? { ok: true, status: 200, text: async () => live[pad] } : { ok: false, status: 404, text: async () => '' }
  }
  return posts
}

async function gebouwd(regels, paginas) {
  const map = await mkdtemp(join(tmpdir(), 'indexnow-toets-'))
  await writeFile(join(map, 'sitemap-index.xml'), index)
  await writeFile(join(map, 'sitemap-0.xml'), sitemap(regels))
  for (const [pad, html] of Object.entries(paginas)) {
    await mkdir(join(map, pad), { recursive: true })
    await writeFile(join(map, pad, 'index.html'), html)
  }
  return map
}

const LIVE = {
  '/sitemap-index.xml': index,
  '/sitemap-0.xml': sitemap([['/clusters/a/', 'd1'], ['/clusters/b/', 'd1'], ['/kosten/', ''], ['/kumar/', '']]),
  '/kosten/': pagina('Uurtarief conform bevestiging.'),
  '/kumar/': pagina('Amsterdamse Orde van Advocaten.'),
}
// Nieuw artikel c, artikel b bijgewerkt, /kosten/ met een nieuwe zin, /kumar/ alleen andere css.
const NA = [[['/clusters/a/', 'd1'], ['/clusters/b/', 'd2'], ['/clusters/c/', 'd3'], ['/kosten/', ''], ['/kumar/', '']], {
  '/kosten/': pagina('Uurtarief conform bevestiging. Kantoorkosten worden niet berekend.', { css: 'zz99' }),
  '/kumar/': pagina('Amsterdamse Orde van Advocaten.', { css: 'zz99' }),
}]
const ZELFDE = [[['/clusters/a/', 'd1'], ['/clusters/b/', 'd1'], ['/kosten/', ''], ['/kumar/', '']], {
  '/kosten/': pagina('Uurtarief conform bevestiging.', { css: 'zz99' }),
  '/kumar/': pagina('Amsterdamse Orde van Advocaten.', { css: 'zz99' }),
}]

async function draai(context, live, na, opties) {
  const posts = namaak(live, opties)
  if (context === undefined) delete process.env.CONTEXT
  else process.env.CONTEXT = context
  const map = await gebouwd(...na)
  await onPreBuild()
  await onSuccess({ constants: { PUBLISH_DIR: map } })
  return posts
}

test('productie: één POST met precies de drie gewijzigde adressen', async () => {
  const posts = await draai('production', LIVE, NA)
  assert.equal(posts.length, 1)
  assert.equal(posts[0].adres, EINDPUNT)
  assert.deepEqual(posts[0].body, {
    host: 'clavix.nl',
    key: SLEUTEL,
    keyLocation: `${S}/${SLEUTEL}.txt`,
    urlList: [`${S}/clusters/c/`, `${S}/clusters/b/`, `${S}/kosten/`],
  })
})

test('voorbeeldbouw en taktak: zelfde verschillen, geen POST', async () => {
  for (const context of ['deploy-preview', 'branch-deploy', undefined]) assert.equal((await draai(context, LIVE, NA)).length, 0, String(context))
})

test('productie zonder verschil: geen POST', async () => {
  assert.equal((await draai('production', LIVE, ZELFDE)).length, 0)
})

test('live sitemap onbereikbaar: geen POST en geen fout, ook niet in productie', async () => {
  assert.equal((await draai('production', {}, NA)).length, 0, 'sitemap geeft 404')
  assert.equal((await draai('production', LIVE, NA, { netwerkfout: true })).length, 0, 'geen verbinding')
})

test('live pagina zonder lastmod onbereikbaar: dat adres gaat niet mee', async () => {
  const { '/kosten/': _, ...zonderKosten } = LIVE
  const posts = await draai('production', zonderKosten, NA)
  assert.deepEqual(posts[0].body.urlList, [`${S}/clusters/c/`, `${S}/clusters/b/`])
})

test('IndexNow weigert of de bouwmap is leeg: de bouw loopt niet stuk', async () => {
  assert.equal((await draai('production', LIVE, NA, { indexnowStatus: 403 })).length, 1, 'de weigering wordt gelogd, niet gegooid')
  assert.equal((await draai('production', LIVE, NA, { postfout: true })).length, 1, 'een netwerkfout bij het versturen wordt gelogd, niet gegooid')
  namaak(LIVE)
  process.env.CONTEXT = 'production'
  await onPreBuild()
  await onSuccess({ constants: { PUBLISH_DIR: join(tmpdir(), 'bestaat-niet-indexnow') } })
})
