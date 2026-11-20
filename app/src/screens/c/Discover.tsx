import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { Globe, Navigation, RefreshCw, SlidersHorizontal, X } from 'lucide-react'
import { TradePhoto } from '../../components/TradePhoto'
import { AppBar } from '../../components/AppBar'
import { BottomSheet } from '../../components/BottomSheet'
import { Button } from '../../components/Button'
import { Zustand } from '../../components/Zustand'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import type { Trade } from '../../lib/types'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import './Discover.css'
import { formatWanted } from '../../lib/format'

// Leaflet looks for its pin images next to its CSS, which breaks in the production build
// (pins showed as broken «Marker» images on Vercel). Point it at the bundled files instead.
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow })

const zurich: [number, number] = [47.3769, 8.5417]
type Coordinates = { lat: number; lng: number }
function distanceKm(a: Coordinates, b: Coordinates) { const r = Math.PI / 180; const dLat = (b.lat - a.lat) * r; const dLng = (b.lng - a.lng) * r; const lat1 = a.lat * r; const lat2 = b.lat * r; const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) }

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 12)
  }, [center, map])
  return null
}

function formatDate(value: string | null) {
  if (!value) return 'Termin offen'
  return new Intl.DateTimeFormat('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(value))
}

function formatTradeDate(trade: Trade) {
  // open: when the client wants it (B/01) · later: the agreed appointment
  if (trade.status === 'offen' && trade.wanted_from) return formatWanted(trade.wanted_from, trade.wanted_until)
  return formatDate(trade.scheduled_at)
}

function formatLocation(trade: Trade) {
  if (trade.is_remote) return 'Remote'
  return trade.location ?? 'Ort offen'
}

function TradeCard({ trade }: { trade: Trade }) {
  return (
    <Link className="discover-card" to={`/auftraege/${trade.id}`}>
      <div className="discover-card__image"><TradePhoto src={trade.photo_urls[0]} loading="lazy" /></div>
      <div className="discover-card__content">
        <h2 className="text-h3">{trade.title}</h2>
        <p className="text-caption text-secondary">{formatLocation(trade)} · {formatTradeDate(trade)}</p>
        <p className="text-body-strong">CHF {trade.budget_chf.toFixed(0)}</p>
      </div>
    </Link>
  )
}

function EmptyState({ filtered, onReset }: { filtered: boolean; onReset: () => void }) {
  return (
    <Zustand
      mascot="loopi"
      title={filtered ? 'Nichts mit diesen Filtern' : 'Gerade keine Aufträge'}
      text={filtered ? 'Versuch einen grösseren Umkreis oder einen anderen Preis.' : 'Sobald jemand in deiner Umgebung Hilfe sucht, erscheint der Auftrag hier.'}
    >
      {filtered && <Button onClick={onReset}>Filter zurücksetzen</Button>}
    </Zustand>
  )
}

export function Discover() {
  const { session } = useAuth()
  const me = session?.user.id
  const [trades, setTrades] = useState<Trade[]>([])
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [draftMin, setDraftMin] = useState('')
  const [draftMax, setDraftMax] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [radius, setRadius] = useState(5)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadTrades() {
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from('trades')
      .select('*')
      .eq('status', 'offen')
      .order('created_at', { ascending: false })

    if (queryError) setError('Aufträge konnten nicht geladen werden.')
    setTrades((data as Trade[] | null) ?? [])
    setLoading(false)
  }

  useEffect(() => { void loadTrades() }, [])

  const visibleTrades = useMemo(() => trades.filter((trade) => {
    if (trade.client_id === me) return false
    if (trade.wanted_until && Date.parse(trade.wanted_until) < Date.now()) return false
    if (remoteOnly && !trade.is_remote) return false
    if (priceMin && trade.budget_chf < Number(priceMin)) return false
    if (priceMax && trade.budget_chf > Number(priceMax)) return false
    if (!trade.is_remote && userLocation && (trade.lat === null || trade.lng === null || distanceKm(userLocation, { lat: trade.lat, lng: trade.lng }) > radius)) return false
    return true
  }), [me, priceMax, priceMin, radius, remoteOnly, trades, userLocation])
  const mapTrades = visibleTrades.filter((trade) => trade.lat !== null && trade.lng !== null)
  const remoteTrades = visibleTrades.filter((trade) => trade.is_remote)
  const localTrades = [...visibleTrades.filter((trade) => !trade.is_remote)].sort((a, b) => {
    if (!userLocation) return 0
    if (a.lat === null || a.lng === null) return 1
    if (b.lat === null || b.lng === null) return -1
    return distanceKm(userLocation, { lat: a.lat, lng: a.lng }) - distanceKm(userLocation, { lat: b.lat, lng: b.lng })
  })
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : zurich
  const filtered = remoteOnly || Boolean(priceMin || priceMax) || Boolean(userLocation)
  const resetFilters = () => { setRemoteOnly(false); setPriceMin(''); setPriceMax(''); setUserLocation(null) }

  function requestLocation() {
    if (!navigator.geolocation) { setLocationError('Dein Browser unterstützt keinen Standort.'); return }
    navigator.geolocation.getCurrentPosition(({ coords }) => { setLocationError(null); setUserLocation({ lat: coords.latitude, lng: coords.longitude }) }, () => setLocationError('Standort konnte nicht abgerufen werden.'))
  }

  return (
    <>
      <AppBar title="Entdecken" />
      <main className="discover-screen">
        <div className="discover-filters" aria-label="Filter">
          <button className={`discover-chip ${userLocation && !remoteOnly ? 'discover-chip--active' : ''}`} onClick={() => { setRemoteOnly(false); if (!userLocation) requestLocation() }}>
            <Navigation size={16} aria-hidden /> {userLocation ? `Mein Standort · ${radius} km` : 'In der Nähe'}
          </button>
          {userLocation && !remoteOnly && [2, 5, 10].filter((value) => value !== radius).map((value) => <button key={value} className="discover-chip" onClick={() => setRadius(value)}>{value} km</button>)}
          <button className={`discover-chip ${remoteOnly ? 'discover-chip--active' : ''}`} onClick={() => setRemoteOnly(!remoteOnly)}>
            <Globe size={16} aria-hidden /> Remote
          </button>
          <button className={`discover-chip ${priceMin || priceMax ? 'discover-chip--active' : ''}`} onClick={() => { setDraftMin(priceMin); setDraftMax(priceMax); setFilterOpen(true) }}>
            <SlidersHorizontal size={16} aria-hidden /> {priceMin || priceMax ? `CHF ${priceMin || 0}–${priceMax || '…'}` : 'Preis'}
          </button>
          {filtered && <button className="discover-chip" onClick={resetFilters} aria-label="Alle Filter zurücksetzen"><X size={16} aria-hidden /> Zurücksetzen</button>}
        </div>
        {locationError && <p className="discover-error text-caption" role="alert">{locationError}</p>}

        {loading && <p className="text-body text-secondary discover-status">Aufträge werden geladen …</p>}
        {error && <div className="discover-error text-body" role="alert">{error}<button onClick={() => void loadTrades()}><RefreshCw size={16} /> Erneut versuchen</button></div>}

        {!loading && !error && visibleTrades.length === 0 && <EmptyState filtered={filtered} onReset={resetFilters} />}

        {!loading && !error && visibleTrades.length > 0 && (
          <>
            <section className="discover-map-wrap" aria-label="Karte mit offenen Aufträgen">
              <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="discover-map">
                <RecenterMap center={center} />
                <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {userLocation && <Marker position={[userLocation.lat, userLocation.lng]}><Popup>Dein Standort</Popup></Marker>}
                {mapTrades.map((trade) => (
                  <Marker key={trade.id} position={[trade.lat!, trade.lng!]}>
                    <Popup><Link to={`/auftraege/${trade.id}`}><strong>{trade.title}</strong><br />CHF {trade.budget_chf.toFixed(0)}</Link></Popup>
                  </Marker>
                ))}
              </MapContainer>
              {mapTrades.length === 0 && <p className="discover-map-note text-caption">Aufträge ohne Standort findest du unten in der Liste.</p>}
            </section>
            <section className="discover-list" aria-labelledby="discover-list-title">
              <div className="discover-list__heading"><h2 id="discover-list-title" className="text-label">{visibleTrades.length} {visibleTrades.length === 1 ? 'Auftrag' : 'Aufträge'}</h2>{userLocation && <span className="text-caption text-secondary">Nach Distanz</span>}</div>
              {localTrades.map((trade) => <TradeCard key={trade.id} trade={trade} />)}
              {remoteTrades.length > 0 && <><h2 className="text-label discover-list__section-title">Remote</h2>{remoteTrades.map((trade) => <TradeCard key={trade.id} trade={trade} />)}</>}
            </section>
          </>
        )}
      </main>
      <BottomSheet open={filterOpen} title="Preis" onClose={() => setFilterOpen(false)}>
        <div className="discover-filter-fields">
          <label className="field"><span className="text-label">Min. CHF</span><input className="input" type="number" min="0" inputMode="numeric" value={draftMin} onChange={(event) => setDraftMin(event.target.value)} placeholder="0" /></label>
          <label className="field"><span className="text-label">Max. CHF</span><input className="input" type="number" min="0" inputMode="numeric" value={draftMax} onChange={(event) => setDraftMax(event.target.value)} placeholder="offen" /></label>
        </div>
        <Button onClick={() => { setPriceMin(draftMin); setPriceMax(draftMax); setFilterOpen(false) }}>Anwenden</Button>
      </BottomSheet>
    </>
  )
}
