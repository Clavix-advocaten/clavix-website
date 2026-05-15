import { sanityClient } from './sanity'
import groq from 'groq'

/**
 * GROQ queries voor alle content uit Sanity.
 * Centrale plek zodat queries niet door pages versnipperd raken.
 */

// === ATTORNEY (Mukesh-bio singleton) ===

const attorneyQuery = groq`*[_type == "attorney" && !(_id in path("drafts.**"))][0] {
  name,
  shortName,
  title,
  "slug": slug.current,
  email,
  phone,
  mobile,
  linkedin,
  beediging,
  novaRegistrations,
  languages,
  memberships,
  education,
  tagline,
  quoteOnHomepage,
  bio,
  personalNote,
  substitutionInfo,
  awards[] { title, year, note },
  sameAs,
  "photoUrl": photo.asset->url + "?w=860&fm=webp&q=80&fit=max",
  "photoSmallUrl": photoSmall.asset->url
}`

export async function getAttorney() {
  return sanityClient.fetch(attorneyQuery)
}

// === PILLAR PAGES ===

const pillarPageBySlugQuery = groq`*[_type == "pillarPage" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
  title,
  shortTitle,
  subtitle,
  "slug": slug.current,
  leadParagraph,
  tldr,
  sections[] {
    heading,
    "anchor": anchor.current,
    answerCapsule,
    body
  },
  faqs[]-> {
    _id,
    question,
    answer
  },
  relatedCases[]-> {
    _id,
    title,
    "slug": slug.current,
    ecli,
    isConfidential,
    summary,
    tags,
    caseYear,
    court,
    externalLink
  },
  relatedClusters[]-> {
    _id,
    title,
    "slug": slug.current,
    subtitle
  },
  relatedPillars[]-> {
    _id,
    title,
    shortTitle,
    subtitle,
    "slug": slug.current
  },
  publishedAt,
  modifiedAt,
  seo,
  author-> {
    name,
    "slug": slug.current
  },
  "relatedSectors": *[_type == "sectorPage" && references(^._id)]{
    shortTitle,
    "slug": slug.current,
    subtitle,
    iconKey
  } | order(order asc)
}`

export async function getPillarPage(slug: string) {
  return sanityClient.fetch(pillarPageBySlugQuery, { slug })
}

const allPillarSlugsQuery = groq`*[_type == "pillarPage" && defined(slug.current) && !(_id in path("drafts.**"))] {
  "slug": slug.current,
  shortTitle
}`

export async function getAllPillarSlugs() {
  return sanityClient.fetch(allPillarSlugsQuery)
}

// === CLUSTER PAGES ===

const clusterPageBySlugQuery = groq`*[_type == "clusterPage" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
  title,
  subtitle,
  "slug": slug.current,
  parentPillar-> {
    shortTitle,
    "slug": slug.current
  },
  tldr,
  sections[] {
    heading,
    "anchor": anchor.current,
    answerCapsule,
    body
  },
  faqs[]-> {
    _id,
    question,
    answer
  },
  relatedCases[]-> {
    _id,
    title,
    "slug": slug.current,
    ecli,
    isConfidential,
    summary,
    tags,
    caseYear
  },
  relatedClusters[]-> {
    _id,
    title,
    "slug": slug.current,
    subtitle
  },
  publishedAt,
  modifiedAt,
  seo,
  author-> {
    name,
    "slug": slug.current
  }
}`

export async function getClusterPage(slug: string) {
  return sanityClient.fetch(clusterPageBySlugQuery, { slug })
}

const allClusterSlugsQuery = groq`*[_type == "clusterPage" && defined(slug.current) && !(_id in path("drafts.**"))] {
  "slug": slug.current,
  title
}`

export async function getAllClusterSlugs() {
  return sanityClient.fetch(allClusterSlugsQuery)
}

// === BLOG POSTS (Notities) ===

const blogPostBySlugQuery = groq`*[_type == "blogPost" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
  title,
  "slug": slug.current,
  category,
  excerpt,
  body,
  "featuredImageUrl": featuredImage.asset->url,
  publishedAt,
  modifiedAt,
  readTime,
  author-> {
    name,
    "slug": slug.current,
    "photoUrl": photo.asset->url + "?w=860&fm=webp&q=80&fit=max"
  },
  relatedPosts[]-> {
    _id,
    title,
    "slug": slug.current,
    category,
    excerpt,
    publishedAt,
    readTime
  },
  seo
}`

export async function getBlogPost(slug: string) {
  return sanityClient.fetch(blogPostBySlugQuery, { slug })
}

const allBlogPostsQuery = groq`*[_type == "blogPost" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  category,
  excerpt,
  publishedAt,
  readTime,
  author-> {
    name
  }
}`

export async function getAllBlogPosts() {
  return sanityClient.fetch(allBlogPostsQuery)
}

const allBlogSlugsQuery = groq`*[_type == "blogPost" && defined(slug.current) && !(_id in path("drafts.**"))] {
  "slug": slug.current
}`

export async function getAllBlogSlugs() {
  return sanityClient.fetch(allBlogSlugsQuery)
}

const homepageBlogPostsQuery = groq`*[_type == "blogPost" && showOnHomepage == true && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...3] {
  _id,
  title,
  "slug": slug.current,
  category,
  excerpt,
  publishedAt,
  readTime
}`

export async function getHomepageBlogPosts() {
  return sanityClient.fetch(homepageBlogPostsQuery)
}

// === CASES ===

const homepageCasesQuery = groq`*[_type == "case" && showOnHomepage == true && !(_id in path("drafts.**"))] | order(sortOrder desc) [0...8] {
  _id,
  title,
  "slug": slug.current,
  ecli,
  isConfidential,
  summary,
  tags,
  caseYear,
  court,
  externalLink
}`

export async function getHomepageCases() {
  return sanityClient.fetch(homepageCasesQuery)
}

// === SITE NAVIGATION DATA ===
// Voor menu's: alle pillar-pages

const allPillarsForNavQuery = groq`*[_type == "pillarPage" && !(_id in path("drafts.**"))] | order(shortTitle asc) {
  shortTitle,
  "slug": slug.current
}`

export async function getAllPillarsForNav() {
  return sanityClient.fetch(allPillarsForNavQuery)
}

// === SECTORS ===
// Sectorpaginas voor industrieën (healthcare, horeca, tech, bouw, retail)

const sectorBySlugQuery = groq`*[_type == "sectorPage" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
  _id,
  _updatedAt,
  title,
  shortTitle,
  subtitle,
  "slug": slug.current,
  iconKey,
  volumeStat,
  "heroImageUrl": heroImage.asset->url + "?w=1600&fm=webp&q=80&fit=max",
  leadParagraph,
  tldr,
  painPoints[] {
    title,
    description,
    "relevantCluster": relevantCluster->{ "slug": slug.current, shortTitle, subtitle }
  },
  "relevantPillars": relevantPillars[]->{ shortTitle, "slug": slug.current, subtitle },
  "relevantClusters": relevantClusters[]->{ shortTitle, "slug": slug.current, subtitle },
  "relevantCases": relevantCases[]->{
    title,
    "slug": slug.current,
    ecli,
    court,
    caseYear,
    summary,
    tags,
    isConfidential,
    externalLink
  },
  "faqs": faqs[]->{ question, answer },
  ctaHeading,
  ctaBody,
  ctaButtonText,
  publishedAt,
  modifiedAt,
  seo
}`

export async function getSector(slug: string) {
  return sanityClient.fetch(sectorBySlugQuery, { slug })
}

const allSectorsQuery = groq`*[_type == "sectorPage" && !(_id in path("drafts.**"))] | order(order asc) {
  _id,
  shortTitle,
  "slug": slug.current,
  subtitle,
  iconKey,
  volumeStat,
  order,
  leadParagraph
}`

export async function getAllSectors() {
  return sanityClient.fetch(allSectorsQuery)
}

const allSectorSlugsQuery = groq`*[_type == "sectorPage" && defined(slug.current) && !(_id in path("drafts.**"))] {
  "slug": slug.current
}`

export async function getAllSectorSlugs() {
  const result = await sanityClient.fetch(allSectorSlugsQuery)
  console.log('[DEBUG getAllSectorSlugs]', JSON.stringify(result))
  return result
}

