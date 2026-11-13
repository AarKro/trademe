type Coordinates = { lat: number; lng: number }

const cache = new Map<string, Coordinates | null>()
let lastLookup = 0

export async function geocodeLocality(locality: string): Promise<Coordinates | null> {
  const key = locality.trim().toLocaleLowerCase('de-CH')
  if (cache.has(key)) return cache.get(key) ?? null

  const wait = 1000 - (Date.now() - lastLookup)
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  lastLookup = Date.now()

  const url = new URL(import.meta.env.VITE_GEOCODER_URL || 'https://nominatim.openstreetmap.org/search')
  url.search = new URLSearchParams({ q: locality, format: 'jsonv2', limit: '1', 'accept-language': 'de' }).toString()
  const response = await fetch(url, {
    referrerPolicy: 'origin',
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error('Geocoding failed')

  const results: { lat: string; lon: string }[] = await response.json()
  const [match] = results
  const coords = match ? { lat: Number(match.lat), lng: Number(match.lon) } : null
  if (coords && (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng))) {
    throw new Error('Invalid coordinates')
  }
  cache.set(key, coords)
  return coords
}
