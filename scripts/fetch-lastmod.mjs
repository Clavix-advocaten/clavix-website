// Haalt _updatedAt per pagina uit Sanity en schrijft src/data/lastmod.json
// Draait vóór elke build (zie package.json "prebuild").
import { writeFileSync, mkdirSync } from 'node:fs'

const Q = encodeURIComponent(`{
  "clusters": *[_type=="clusterPage" && !(_id in path("drafts.**"))]{"slug": slug.current, _updatedAt},
  "pillars": *[_type=="pillarPage" && !(_id in path("drafts.**"))]{"slug": slug.current, _updatedAt},
  "sectoren": *[_type=="sectorPage" && !(_id in path("drafts.**"))]{"slug": slug.current, _updatedAt},
  "notities": *[_type=="blogPost" && !(_id in path("drafts.**"))]{"slug": slug.current, _updatedAt}
}`)

const res = await fetch(`https://74qey4fk.api.sanity.io/v2024-12-01/data/query/production?query=${Q}`)
const { result } = await res.json()

const map = {}
for (const c of result.clusters) map[`/clusters/${c.slug}/`] = c._updatedAt
for (const p of result.pillars) map[`/praktijkgebieden/${p.slug}/`] = p._updatedAt
for (const s of result.sectoren) map[`/sectoren/${s.slug}/`] = s._updatedAt
for (const n of result.notities) map[`/notities/${n.slug}/`] = n._updatedAt

mkdirSync('src/data', { recursive: true })
writeFileSync('src/data/lastmod.json', JSON.stringify(map, null, 1))
console.log(`lastmod.json: ${Object.keys(map).length} paden`)
