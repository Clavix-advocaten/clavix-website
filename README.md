# Clavix Frontend — Astro

Production-ready Astro frontend voor Clavix Advocaten. Pulls content uit Sanity CMS, gebruikt Tailwind met design-tokens (Royal Blue + Noble Sand + Montserrat), en deployed naar Netlify.

## Wat zit erin

```
clavix-frontend/
├── README.md                ← dit bestand
├── package.json             ← dependencies + scripts
├── astro.config.mjs         ← Astro configuratie
├── tailwind.config.mjs      ← Tailwind config met brand-tokens
├── tsconfig.json            ← TypeScript config
├── netlify.toml             ← Netlify deploy config
├── .env.example             ← Env-variables template
├── .gitignore
│
├── public/
│   ├── favicon.svg
│   ├── robots.txt           ← AI-crawlers expliciet whitelist
│   └── llms.txt             ← AI-agent discovery
│
└── src/
    ├── styles/
    │   └── tokens.css        ← Brand design tokens (light + dark mode)
    ├── lib/
    │   ├── sanity.ts         ← Sanity client
    │   ├── queries.ts        ← Alle GROQ queries
    │   ├── portable-text.ts  ← Portable text → HTML renderer
    │   └── schema-markup.ts  ← JSON-LD generators
    ├── components/
    │   ├── Navigation.astro
    │   ├── Footer.astro
    │   ├── CTABand.astro
    │   ├── AnswerCapsule.astro
    │   ├── TLDR.astro
    │   └── FAQAccordion.astro
    ├── layouts/
    │   └── BaseLayout.astro   ← Master layout met head + nav + footer
    └── pages/
        ├── index.astro                       ← Homepage
        ├── 404.astro
        ├── mukesh.astro                      ← Bio (uit Sanity)
        ├── werkwijze.astro                    ← Werkwijze (hardcoded)
        ├── praktijkgebieden/[slug].astro     ← Pillar template (uit Sanity)
        ├── clusters/[slug].astro              ← Cluster template (uit Sanity)
        └── notities/
            ├── index.astro                    ← Blog index
            └── [slug].astro                   ← Blog detail
```

## Setup

### 1. Bestanden op je Mac plaatsen

Maak ergens een nieuwe folder, bijvoorbeeld `~/clavix-frontend`. Plaats alle bestanden uit dit archief erin.

### 2. Environment variables

```bash
cd ~/clavix-frontend
cp .env.example .env
```

`.env` bevat al de juiste Sanity project-ID (`74qey4fk`). Niets te wijzigen.

### 3. Dependencies installeren

```bash
npm install
```

Duurt 1-2 minuten.

### 4. Lokaal draaien

```bash
npm run dev
```

Astro start de dev-server op `http://localhost:4321`. Open dat in je browser.

### 5. Wat je ziet

- **Homepage** (`/`): volledig werkend met alle 7 secties die we hebben gebouwd
- **/werkwijze**: volledig werkend (hardcoded copy)
- **/404**: testen door naar bv. `/test-niet-bestaande` te gaan
- **/mukesh**: laat "Bio nog niet ingevoerd" zien zolang je Sanity-bio niet hebt ingevuld
- **/praktijkgebieden/...**: 404 zolang je nog geen pillar-pages hebt aangemaakt in Sanity
- **/notities**: leeg zolang je geen blog-posts hebt aangemaakt in Sanity

Naarmate je content in Sanity Studio invoert, vult de site zich automatisch.

## Tech stack

- **Astro 5**: static-first met islands voor interactiviteit
- **Tailwind CSS 3**: utility classes met design-tokens
- **Sanity 6**: headless CMS via @sanity/client
- **TypeScript**: type-safe queries en components
- **Schema.org JSON-LD**: LegalService, Person, Article, FAQPage, LegalCase, BreadcrumbList

## Deploy naar Netlify

```bash
# Build lokaal testen
npm run build
npm run preview
```

Dan via Netlify-dashboard:
1. New site from Git → kies de repo
2. Build command: `npm run build` (al ingesteld via netlify.toml)
3. Publish directory: `dist`
4. Environment variables: kopieer uit `.env`
5. Custom domain: koppel `staging.clavix.nl` (en later `clavix.nl`)

## Sanity-data invoeren

Open je Sanity Studio (via `npm run dev` in de clavix-cms folder, of de gedeployde versie op clavix-cms.sanity.studio) en vul:

1. **Mukesh-bio singleton** — al je gegevens
2. **Pillar pages** — kopieer-plak de copy uit ons audit-document
3. **Notities** — wanneer je begint met blogs

De frontend pakt het direct op.

## Volgende stap

Na lokale verificatie: deploy naar `staging.clavix.nl` op Netlify. Dan zie je de site live en kunnen we eventuele design-aanpassingen iteratief doen.
