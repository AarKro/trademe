import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { MapPin, Navigation, RefreshCw } from 'lucide-react'
import { AppBar } from '../../components/AppBar'
import { supabase } from '../../lib/supabase'
import type { Trade } from '../../lib/types'
import 'leaflet/dist/leaflet.css'
import './Discover.css'

const zurich: [number, number] = [47.3769, 8.5417]

function RecenterMap() {
  const map = useMap()
  useEffect(() => {
    map.setView(zurich, 12)
  }, [map])
  return null
}

function formatDate(value: string | null) {
  if (!value) return 'Termin offen'
  return new Intl.DateTimeFormat('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(value))
}

function formatLocation(trade: Trade) {
  if (trade.is_remote) return 'Überall · Remote'
  return trade.location ?? 'Ort offen'
}

function TradeCard({ trade }: { trade: Trade }) {
  return (
    <Link className="discover-card" to={`/auftraege/${trade.id}`}>
      <div className="discover-card__image" aria-hidden="true">
        {trade.photo_urls[0] ? <img src={trade.photo_urls[0]} alt="" /> : <MapPin size={24} />}
      </div>
      <div className="discover-card__content">
        <h2 className="text-h3">{trade.title}</h2>
        <p className="text-caption text-secondary">{formatLocation(trade)} · {formatDate(trade.scheduled_at)}</p>
        <p className="text-body-strong">CHF {trade.budget_chf.toFixed(0)}</p>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="discover-empty">
      <div className="discover-empty__icon"><MapPin size={28} /></div>
      <h2 className="text-h3">Noch keine passenden Trades</h2>
      <p className="text-body text-secondary">Sobald jemand in deiner Umgebung Hilfe sucht, erscheint der Trade hier.</p>
    </div>
  )
}

export function Discover() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [remoteOnly, setRemoteOnly] = useState(false)
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

    if (queryError) setError('Trades konnten nicht geladen werden.')
    setTrades((data as Trade[] | null) ?? [])
    setLoading(false)
  }

  useEffect(() => { void loadTrades() }, [])

  const visibleTrades = useMemo(
    () => remoteOnly ? trades.filter((trade) => trade.is_remote) : trades,
    [remoteOnly, trades],
  )
  const mapTrades = visibleTrades.filter((trade) => trade.lat !== null && trade.lng !== null)

  return (
    <>
      <AppBar title="Entdecken" />
      <main className="discover-screen">
        <div className="discover-filters" aria-label="Filter">
          <button className={`discover-chip ${!remoteOnly ? 'discover-chip--active' : ''}`} onClick={() => setRemoteOnly(false)}>
            <MapPin size={16} aria-hidden /> Kreis 4 · 5 km
          </button>
          <button className={`discover-chip ${remoteOnly ? 'discover-chip--active' : ''}`} onClick={() => setRemoteOnly(true)}>
            <Navigation size={16} aria-hidden /> Überall
          </button>
        </div>

        {loading && <p className="text-body text-secondary discover-status">Trades werden geladen …</p>}
        {error && <div className="discover-error text-body" role="alert">{error}<button onClick={() => void loadTrades()}><RefreshCw size={16} /> Erneut versuchen</button></div>}

        {!loading && !error && visibleTrades.length === 0 && <EmptyState />}

        {!loading && !error && visibleTrades.length > 0 && (
          <>
            <section className="discover-map-wrap" aria-label="Karte mit offenen Trades">
              <MapContainer center={zurich} zoom={12} scrollWheelZoom={false} className="discover-map">
                <RecenterMap />
                <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {mapTrades.map((trade) => (
                  <Marker key={trade.id} position={[trade.lat!, trade.lng!]}>
                    <Popup><Link to={`/auftraege/${trade.id}`}><strong>{trade.title}</strong><br />CHF {trade.budget_chf.toFixed(0)}</Link></Popup>
                  </Marker>
                ))}
              </MapContainer>
              {mapTrades.length === 0 && <p className="discover-map-note text-caption">Trades ohne Standort findest du unten in der Liste.</p>}
            </section>
            <section className="discover-list" aria-labelledby="discover-list-title">
              <div className="discover-list__heading"><h2 id="discover-list-title" className="text-label">{visibleTrades.length} {visibleTrades.length === 1 ? 'Trade' : 'Trades'} verfügbar</h2><span className="text-caption text-secondary">Nach Distanz</span></div>
              {visibleTrades.map((trade) => <TradeCard key={trade.id} trade={trade} />)}
            </section>
          </>
        )}
      </main>
    </>
  )
}
