import { toHTML, type PortableTextHtmlComponents } from '@portabletext/to-html'

/**
 * Custom serializers voor Sanity portable text → HTML.
 * Voegt Tailwind-classes toe aan headings, lists, etc. zodat ze stylebewust zijn.
 */

const components: Partial<PortableTextHtmlComponents> = {
  block: {
    normal: ({ children }) => `<p>${children}</p>`,
    h2: ({ children }) =>
      `<h2 class="text-h2 font-bold mt-12 mb-4 tracking-tight">${children}</h2>`,
    h3: ({ children }) =>
      `<h3 class="text-h3 font-semibold mt-8 mb-3">${children}</h3>`,
    h4: ({ children }) =>
      `<h4 class="text-h4 font-semibold mt-6 mb-2">${children}</h4>`,
    blockquote: ({ children }) =>
      `<blockquote class="border-l-4 border-brand-secondary pl-6 my-6 italic text-text-secondary">${children}</blockquote>`,
  },
  list: {
    bullet: ({ children }) => `<ul class="list-disc list-outside ml-6 mb-6 space-y-2">${children}</ul>`,
    number: ({ children }) => `<ol class="list-decimal list-outside ml-6 mb-6 space-y-2">${children}</ol>`,
  },
  listItem: {
    bullet: ({ children }) => `<li class="text-text">${children}</li>`,
    number: ({ children }) => `<li class="text-text">${children}</li>`,
  },
  marks: {
    strong: ({ children }) => `<strong class="font-semibold text-text">${children}</strong>`,
    em: ({ children }) => `<em class="italic">${children}</em>`,
    code: ({ children }) =>
      `<code class="font-mono text-small bg-bg-tinted px-1.5 py-0.5 rounded">${children}</code>`,
    link: ({ children, value }) => {
      const href = value?.href || '#'
      const isInternal = value?.internal || href.startsWith('/')
      const target = isInternal ? '' : 'target="_blank" rel="noopener noreferrer"'
      return `<a href="${href}" ${target} class="text-text-accent underline underline-offset-2 hover:text-action-hover">${children}</a>`
    },
  },
}

export function renderPortableText(blocks: any): string {
  if (!blocks) return ''
  return toHTML(blocks, { components })
}
