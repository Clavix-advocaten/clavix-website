/**
 * JSON-LD schema markup generators voor SEO + AI-citation optimization.
 * Per pagina-type een aparte functie, geinjecteerd in de <head>.
 */

const SITE_URL = 'https://clavix.nl' // Pas aan naar staging voor staging-build
const ORG_NAME = 'Clavix Advocaten'
const ORG_LEGAL = 'Clavix B.V.'
const GOOGLE_MAPS_URL = 'https://www.google.com/maps?cid=7869689075875714479'

/** Canonieke absolute URL: altijd met trailing slash (behalve bestanden en anchors). */
function canon(path: string): string {
  if (!path) return SITE_URL + '/'
  if (path.startsWith('http')) return path
  let p = path.startsWith('/') ? path : '/' + path
  if (!p.endsWith('/') && !/[.#?]/.test(p)) p += '/'
  return SITE_URL + p
}

export function organizationSchema(lang: 'nl' | 'en' = 'nl') {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    '@id': `${SITE_URL}/#organization`,
    name: ORG_NAME,
    legalName: ORG_LEGAL,
    url: `${SITE_URL}/`,
    description:
      lang === 'en'
        ? 'Boutique Dutch law firm in the Zuidas business district of Amsterdam, acting for companies and real estate investors. Corporate law, real estate, insolvency and litigation.'
        : 'Boutique advocatenkantoor in Amsterdam Zuidas voor ondernemers met vastgoed. Ondernemingsrecht, vastgoedrecht en insolventie.',
    inLanguage: lang === 'en' ? 'en' : 'nl',
    availableLanguage: ['Dutch', 'English'],
    vatID: 'NL867766839B01',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Strawinskylaan 257',
      addressLocality: 'Amsterdam',
      postalCode: '1077 XX',
      addressCountry: 'NL',
    },
    telephone: '+31207471121',
    email: 'info@clavix.nl',
    areaServed: { '@type': 'Country', name: 'Netherlands' },
    knowsAbout: [
      'Ondernemingsrecht',
      'Vastgoedrecht',
      'Insolventierecht',
      'Burgerlijk procesrecht',
      'Bestuurdersaansprakelijkheid',
      'Aandeelhoudersgeschillen',
    ],
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    }],
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 52.3393,
      longitude: 4.8730,
    },
    hasMap: GOOGLE_MAPS_URL,
    priceRange: '€€€',
    image: 'https://cdn.sanity.io/images/74qey4fk/production/d692d2c9a732c5010a38270d4a3afc220e84c7a9-4350x6490.jpg?w=1200&h=630&fit=crop&crop=top&fm=jpg&q=85',
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/clavix-logo.svg` },
    sameAs: [
      'https://www.linkedin.com/company/106861158/',
      'https://www.instagram.com/clavix_nl/',
      'https://www.facebook.com/clavixnl/',
      GOOGLE_MAPS_URL,
    ],
  }
}

export function personSchema(attorney: any) {
  if (!attorney) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/kumar#person`,
    name: attorney.name,
    jobTitle: attorney.title,
    image: attorney.photoUrl,
    email: attorney.email,
    telephone: attorney.phone,
    url: `${SITE_URL}/kumar/`,
    nationality: { '@type': 'Country', name: 'Netherlands' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Strawinskylaan 257',
      addressLocality: 'Amsterdam',
      postalCode: '1077 XX',
      addressCountry: 'NL',
    },
    worksFor: {
      '@type': 'LegalService',
      '@id': `${SITE_URL}/#organization`,
      name: ORG_NAME,
      url: `${SITE_URL}/`,
    },
    memberOf: {
      '@type': 'Organization',
      name: 'Nederlandse Orde van Advocaten',
      url: 'https://www.advocatenorde.nl',
    },
    alumniOf: [
      { '@type': 'CollegeOrUniversity', name: 'Vrije Universiteit Amsterdam' },
      { '@type': 'CollegeOrUniversity', name: 'University of Leeds' },
      { '@type': 'CollegeOrUniversity', name: 'Universiteit van Amsterdam' },
    ],
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Advocaat',
      occupationLocation: { '@type': 'City', name: 'Amsterdam' },
      skills: 'Ondernemingsrecht, vastgoedrecht, insolventierecht, bestuurdersaansprakelijkheid, aandeelhoudersgeschillen',
    },
    knowsAbout: [
      'Ondernemingsrecht',
      'Vastgoedrecht',
      'Insolventierecht',
      'Bestuurdersaansprakelijkheid',
      'Aandeelhoudersgeschillen',
      'Faillissementsrecht',
      'Burgerlijk procesrecht',
      'WHOA',
      'Pre-pack doorstart',
    ],
    knowsLanguage: attorney.languages || ['nl', 'en'],
    sameAs: [...(attorney.sameAs || []), 'https://zoekeenadvocaat.advocatenorde.nl/'],
    award: (attorney.awards || []).map((a: any) => a.title),
  }
}

export function articleSchema(page: any, attorneyName: string = 'mr. Mukesh Kumar', pagePath?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.tldr?.body || page.subtitle,
    image: page.imageUrl || page.coverImage?.url || 'https://cdn.sanity.io/images/74qey4fk/production/d692d2c9a732c5010a38270d4a3afc220e84c7a9-4350x6490.jpg?w=1200&h=630&fit=crop&crop=top&fm=jpg&q=85',
    ...(pagePath ? { mainEntityOfPage: { '@type': 'WebPage', '@id': canon(pagePath) } } : {}),
    inLanguage: 'nl-NL',
    author: { '@type': 'Person', '@id': `${SITE_URL}/kumar#person`, name: attorneyName, url: `${SITE_URL}/kumar/` },
    reviewedBy: { '@type': 'Person', '@id': `${SITE_URL}/kumar#person`, name: attorneyName, jobTitle: 'Advocaat', url: `${SITE_URL}/kumar/` },
    publisher: { '@type': 'LegalService', '@id': `${SITE_URL}/#organization`, name: ORG_NAME, url: `${SITE_URL}/` },
    datePublished: page.publishedAt,
    dateModified: page.modifiedAt || page.publishedAt,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable]'],
    },
  }
}

export function faqPageSchema(faqs: any[]) {
  if (!faqs || faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: extractTextFromBlocks(faq.answer),
      },
    })),
  }
}

export function legalCaseSchema(caseDoc: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalCase',
    name: caseDoc.title,
    description: caseDoc.summary,
    docketNumber: caseDoc.isConfidential ? undefined : caseDoc.ecli,
    dateCreated: caseDoc.dateDecided,
  }
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canon(item.url),
    })),
  }
}

/**
 * Helper om plain text te extraheren uit portable text blocks
 */
function extractTextFromBlocks(blocks: any): string {
  if (!blocks || !Array.isArray(blocks)) return ''
  return blocks
    .filter((block: any) => block._type === 'block')
    .map((block: any) => block.children?.map((child: any) => child.text).join('') || '')
    .join('\n\n')
}

export function serviceSchema(service: { name: string; description: string; url: string; serviceType?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    url: canon(service.url),
    serviceType: service.serviceType || 'Juridische dienstverlening',
    provider: { '@type': 'LegalService', '@id': `${SITE_URL}/#organization`, name: ORG_NAME, url: `${SITE_URL}/` },
    areaServed: { '@type': 'Country', name: 'Netherlands' },
  }
}

export function blogPostingSchema(post: any, attorneyName: string = 'mr. Mukesh Kumar') {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.tldr?.body || post.subtitle || post.excerpt,
    image: post.coverImage?.url || post.imageUrl,
    author: {
      '@type': 'Person',
      '@id': `${SITE_URL}/kumar#person`,
      name: attorneyName,
      url: `${SITE_URL}/kumar/`,
    },
    publisher: { '@type': 'LegalService', '@id': `${SITE_URL}/#organization`, name: ORG_NAME, url: `${SITE_URL}/` },
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt || post.publishedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canon(`/notities/${post.slug?.current || post.slug}`) },
    articleSection: post.category || 'Juridische analyses',
    inLanguage: 'nl-NL',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable]'],
    },
  }
}

export function siteNavigationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Hoofdmenu Clavix Advocaten',
    itemListElement: [
      { name: 'Home', url: '/' },
      { name: 'Vastgoed x Ondernemers', url: '/praktijkgebieden/vastgoed-en-ondernemers/' },
      { name: 'Ondernemingsrecht', url: '/praktijkgebieden/ondernemingsrecht/' },
      { name: 'Vastgoedrecht', url: '/praktijkgebieden/vastgoedrecht/' },
      { name: 'Insolventie & herstructurering', url: '/praktijkgebieden/insolventie-en-herstructurering/' },
      { name: 'Burgerlijk procesrecht', url: '/praktijkgebieden/burgerlijk-procesrecht/' },
      { name: 'Kennisbank', url: '/kennisbank/' },
      { name: 'Kosten', url: '/kosten/' },
      { name: 'Over mr. Kumar', url: '/kumar/' },
      { name: 'Werkwijze', url: '/werkwijze/' },
      { name: 'Notities', url: '/notities/' },
      { name: 'Contact', url: '/contact/' },
    ].map((item, index) => ({
      '@type': 'SiteNavigationElement',
      position: index + 1,
      name: item.name,
      url: canon(item.url),
    })),
  }
}
