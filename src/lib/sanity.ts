import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-01',
  useCdn: false, // CDN voor snelheid in productie
  perspective: 'raw', // Filtering van drafts gebeurt in GROQ queries
})

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: any) {
  return builder.image(source)
}

/**
 * Helper voor optimized image URL
 * Gebruik: image(photo).width(800).format('webp').url()
 */
export function image(source: any) {
  return urlFor(source).auto('format').fit('max')
}
