import type { Trade } from './types'

const image = (photoId: string) => `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=640&q=80`

const keywordPhotos: Array<{ keywords: string[]; url: string }> = [
  { keywords: ['waschmaschine'], url: image('photo-1722153149003-1e2293beb8d9') },
  { keywords: ['fenster', 'endreinigung', 'putzen', 'abwasch'], url: image('photo-1527515637462-cff94eecc1ac') },
  { keywords: ['arzt', 'begleitung'], url: image('photo-1576091160550-2173dba999ef') },
  { keywords: ['umzug', 'kisten', 'sofa', 'kühlschrank', 'brocki'], url: image('photo-1600518464441-9154a4dea21b') },
  { keywords: ['mathe', 'nachhilfe'], url: image('photo-1434030216411-0b793f4b4173') },
  { keywords: ['hecke', 'laub', 'rasen', 'garten'], url: image('photo-1558904541-efa843a96f01') },
  { keywords: ['bilderwand', 'rahmen'], url: image('photo-1513519245088-0e12902e5a38') },
  { keywords: ['velo', 'fahrrad'], url: image('photo-1485965120184-e220f721d03e') },
  { keywords: ['katze', 'hund', 'tier'], url: image('photo-1514888286974-6c03e2ca1dba') },
  { keywords: ['website', 'flyer', 'logo', 'grafik'], url: image('photo-1498050108023-c5249f4df085') },
  { keywords: ['bett', 'kleiderschrank', 'möbel', 'regal'], url: image('photo-1586023492125-27b2c045efd7') },
  { keywords: ['lampe', 'beleuchtung', 'elektro'], url: image('photo-1524484485831-a92ffc0de03f') },
  { keywords: ['einkauf'], url: image('photo-1542838132-92c53300491e') },
]

const categoryPhotos: Record<string, string> = {
  'Hilfe im Haushalt': image('photo-1581578731548-c64695cc6952'),
  'Gartenarbeit': image('photo-1558904541-efa843a96f01'),
  'Möbelaufbau': image('photo-1586023492125-27b2c045efd7'),
  'Technikhilfe': image('photo-1524484485831-a92ffc0de03f'),
  Umzug: image('photo-1600518464441-9154a4dea21b'),
  Sonstiges: image('photo-1556761175-b413da4baf72'),
}

/** Demo imagery for Discover. A real user upload always takes precedence. */
export function getDiscoverPhoto(trade: Pick<Trade, 'photo_urls' | 'title' | 'description' | 'category'>) {
  if (trade.photo_urls[0]) return trade.photo_urls[0]

  const text = `${trade.title} ${trade.description ?? ''}`.toLocaleLowerCase('de-CH')
  return keywordPhotos.find(({ keywords }) => keywords.some((keyword) => text.includes(keyword)))?.url
    ?? (trade.category ? categoryPhotos[trade.category] : undefined)
}
