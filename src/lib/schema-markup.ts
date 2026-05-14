/**
 * JSON-LD schema markup generators voor SEO + AI-citation optimization.
 * Per pagina-type een aparte functie, geinjecteerd in de <head>.
 */

const SITE_URL = 'https://clavix.nl' // Pas aan naar staging voor staging-build
const ORG_NAME = 'Clavix Advocaten'
const ORG_LEGAL = 'Clavix B.V.'

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: ORG_NAME,
    legalName: ORG_LEGAL,
    url: SITE_URL,
    description:
      'Boutique advocatenkantoor in Amsterdam Zuidas voor ondernemers met vastgoed. Ondernemingsrecht, vastgoedrecht en insolventie.',
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
    priceRange: '€€€',
    image: 'https://cdn.sanity.io/images/74qey4fk/production/d692d2c9a732c5010a38270d4a3afc220e84c7a9-4350x6490.jpg?w=1200&h=630&fit=crop&crop=top&fm=jpg&q=85',
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/clavix-logo.svg` },
    sameAs: [
      'https://www.linkedin.com/company/106861158/',
      'https://www.instagram.com/clavix_nl/',
      'https://www.facebook.com/clavixnl/',
    ],
  }
}

export function personSchema(attorney: any) {
  if (!attorney) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: attorney.name,
    jobTitle: attorney.title,
    image: attorney.photoUrl,
    email: attorney.email,
    telephone: attorney.phone,
    url: `${SITE_URL}/mukesh`,
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
      name: ORG_NAME,
      url: SITE_URL,
    },
    memberOf: {
      '@type': 'Organization',
      name: 'Nederlandse Orde van Advocaten',
      url: 'https://www.advocatenorde.nl',
    },
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
    sameAs: attorney.sameAs || [],
    award: (attorney.awards || []).map((a: any) => a.title),
  }
}

export function articleSchema(page: any, attorneyName: string = 'mr. Mukesh Kumar') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.tldr?.body || page.subtitle,
    image: page.imageUrl || page.coverImage?.url || 'https://cdn.sanity.io/images/74qey4fk/production/d692d2c9a732c5010a38270d4a3afc220e84c7a9-4350x6490.jpg?w=1200&h=630&fit=crop&crop=top&fm=jpg&q=85',
    author: { '@type': 'Person', name: attorneyName, url: `${SITE_URL}/mukesh` },
    publisher: {
      '@type': 'LegalService',
      name: ORG_NAME,
      url: SITE_URL,
      telephone: '+31 20 747 1121',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Strawinskylaan 257',
        addressLocality: 'Amsterdam',
        postalCode: '1077 XX',
        addressCountry: 'NL',
      },
      image: 'https://cdn.sanity.io/images/74qey4fk/production/d692d2c9a732c5010a38270d4a3afc220e84c7a9-4350x6490.jpg?w=1200&h=630&fit=crop&crop=top&fm=jpg&q=85',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/clavix-logo.svg` },
    },
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
      item: `${SITE_URL}${item.url}`,
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
    url: `${SITE_URL}${service.url}`,
    serviceType: service.serviceType || 'Juridische dienstverlening',
    provider: { '@type': 'LegalService', name: ORG_NAME, url: SITE_URL },
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
      name: attorneyName,
      url: `${SITE_URL}/mukesh`,
    },
    publisher: {
      '@type': 'LegalService',
      name: ORG_NAME,
      url: SITE_URL,
      telephone: '+31 20 747 1121',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Strawinskylaan 257',
        addressLocality: 'Amsterdam',
        postalCode: '1077 XX',
        addressCountry: 'NL',
      },
      image: 'https://cdn.sanity.io/images/74qey4fk/production/d692d2c9a732c5010a38270d4a3afc220e84c7a9-4350x6490.jpg?w=1200&h=630&fit=crop&crop=top&fm=jpg&q=85',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/clavix-logo.svg` },
    },
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt || post.publishedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/notities/${post.slug?.current || post.slug}` },
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
      { '@type': 'SiteNavigationElement', position: 1, name: 'Home', url: SITE_URL },
      { '@type': 'SiteNavigationElement', position: 2, name: 'Vastgoed x Ondernemers', url: `${SITE_URL}/praktijkgebieden/vastgoed-en-ondernemers` },
      { '@type': 'SiteNavigationElement', position: 3, name: 'Ondernemingsrecht', url: `${SITE_URL}/praktijkgebieden/ondernemingsrecht` },
      { '@type': 'SiteNavigationElement', position: 4, name: 'Vastgoedrecht', url: `${SITE_URL}/praktijkgebieden/vastgoedrecht` },
      { '@type': 'SiteNavigationElement', position: 5, name: 'Insolventie & herstructurering', url: `${SITE_URL}/praktijkgebieden/insolventie-en-herstructurering` },
      { '@type': 'SiteNavigationElement', position: 6, name: 'Over mr. Kumar', url: `${SITE_URL}/mukesh` },
      { '@type': 'SiteNavigationElement', position: 7, name: 'Werkwijze', url: `${SITE_URL}/werkwijze` },
      { '@type': 'SiteNavigationElement', position: 8, name: 'Notities', url: `${SITE_URL}/notities` },
      { '@type': 'SiteNavigationElement', position: 9, name: 'Veelgestelde vragen', url: `${SITE_URL}/veelgestelde-vragen` },
      { '@type': 'SiteNavigationElement', position: 10, name: 'Woordenlijst', url: `${SITE_URL}/woordenlijst` },
      { '@type': 'SiteNavigationElement', position: 11, name: 'Contact', url: `${SITE_URL}/contact` },
    ],
  }
}

