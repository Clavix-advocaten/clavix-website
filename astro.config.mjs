import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import { readFileSync } from 'node:fs'

const lastmod = JSON.parse(readFileSync(new URL('./src/data/lastmod.json', import.meta.url), 'utf8'))

export default defineConfig({
  site: 'https://clavix.nl',
  trailingSlash: 'always',
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('/zoeken'),
      serialize(item) {
        const pad = new URL(item.url).pathname
        if (lastmod[pad]) item.lastmod = lastmod[pad]
        return item
      },
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
})
