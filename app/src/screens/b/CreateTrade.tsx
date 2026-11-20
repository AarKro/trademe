import { Camera, CircleAlert, Plus, Clock, CalendarDays } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Segmented } from '../../components/Segmented'
import { Zustand } from '../../components/Zustand'
import { ActionBar } from '../../components/ActionBar'
import { AppBar } from '../../components/AppBar'
import { BottomSheet } from '../../components/BottomSheet'
import { Button } from '../../components/Button'
import { useAuth } from '../../lib/auth'
import type { PaymentMethod, Trade, TradeAddress } from '../../lib/types'
import { supabase } from '../../lib/supabase'
import { geocodeLocality } from './geocode'
import './CreateTrade.css'

const categories = ['Möbelaufbau', 'Umzug', 'Garten', 'Haushalt', 'Technik', 'Sonstiges']
const categoryLabels: Record<string, string> = { Garten: 'Gartenarbeit', Haushalt: 'Hilfe im Haushalt', Technik: 'Technikhilfe' }
const photoTypes = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']])

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'twint', label: 'TWINT' },
  { value: 'karte', label: 'Karte' },
  { value: 'bar', label: 'Bar' },
]
const suggestedTags = ['Werkzeug', 'Montage', 'Transport']

type FieldName = 'title' | 'when' | 'until' | 'start-time' | 'street' | 'zip' | 'city' | 'payment' | 'budget' | 'photos'
type Errors = Partial<Record<FieldName, string>>

function Field({ id, label, error, children }: {
  id: FieldName
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label className="text-label" htmlFor={id}>{label}</label>
      {children}
      {error && <p className="create-trade__error text-body" id={id + '-error'}><CircleAlert aria-hidden />{error}</p>}
    </div>
  )
}

function fieldProps(id: FieldName, errors: Errors) {
  return {
    id,
    name: id,
    className: 'input text-body',
    'aria-invalid': Boolean(errors[id]),
    'aria-describedby': errors[id] ? id + '-error' : undefined,
  }
}

function localDateTime(value?: string | null) {
  if (!value) return undefined
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function EditTrade() {
  const { tradeId } = useParams()
  const { session } = useAuth()
  if (!tradeId || !session) return null
  return <EditTradeLoader key={tradeId + '/' + session.user.id} tradeId={tradeId} userId={session.user.id} />
}

function EditTradeLoader({ tradeId, userId }: { tradeId: string; userId: string }) {
  const [data, setData] = useState<{ trade: Trade; address: TradeAddress | null } | null>(null)
  const [status, setStatus] = useState('Trade wird geladen …')

  useEffect(() => {
    const controller = new AbortController()
    void Promise.all([
      supabase.from('trades').select('*').eq('id', tradeId).eq('client_id', userId).eq('status', 'offen').abortSignal(controller.signal).maybeSingle<Trade>(),
      supabase.from('trade_addresses').select('*').eq('trade_id', tradeId).abortSignal(controller.signal).maybeSingle<TradeAddress>(),
    ]).then(([trade, address]) => {
      if (controller.signal.aborted) return
      if (trade.error || address.error) setStatus('Der Trade konnte nicht geladen werden.')
      else if (!trade.data) setStatus('Dieser Trade kann nicht bearbeitet werden.')
      else setData({ trade: trade.data, address: address.data })
    })
    return () => controller.abort()
  }, [tradeId, userId])

  return data ? <CreateTrade initialTrade={data.trade} address={data.address} /> : (
    <>
      <AppBar back title="Trade bearbeiten" />
      <main className="screen"><p role="status" className="text-body">{status}</p></main>
    </>
  )
}

type AddressChange = TradeAddress | { trade_id: string; remove: true }

export function CreateTrade({ initialTrade, address }: { initialTrade?: Trade; address?: TradeAddress | null }) {
  const navigate = useNavigate()
  const editing = Boolean(initialTrade)
  const { session } = useAuth()
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[] | null>(initialTrade?.payment_methods ?? null)
  const [category, setCategory] = useState(initialTrade?.category ?? categories[0])
  const [more, setMore] = useState(Boolean(initialTrade?.category && !categories.slice(0, 3).includes(initialTrade.category)))
  const [remote, setRemote] = useState(initialTrade?.is_remote ?? false)
  const [span, setSpan] = useState(Boolean(initialTrade?.wanted_until))
  const initialStart = localDateTime(initialTrade?.wanted_from)
  const initialEnd = localDateTime(initialTrade?.wanted_until)
  const [fromDate, setFromDate] = useState(initialStart?.slice(0, 10) ?? '')
  const [untilDate, setUntilDate] = useState(initialEnd?.slice(0, 10) ?? '')
  const [fromTime, setFromTime] = useState(initialEnd && initialStart?.slice(11) === '00:00' ? '' : initialStart?.slice(11) ?? '')
  const [untilTime, setUntilTime] = useState(initialEnd?.slice(11) === '23:59' ? '' : initialEnd?.slice(11) ?? '')
  const [timeField, setTimeField] = useState<'when' | 'until' | null>(null)
  const timeInput = useRef<HTMLInputElement>(null)
  const [tags, setTags] = useState<string[]>(initialTrade?.tags ?? [])
  const [tag, setTag] = useState('')
  const pendingAddress = useRef<AddressChange | null>(null)
  const [addressPending, setAddressPending] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const form = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (initialTrade || !session) return
    const controller = new AbortController()
    supabase
      .from('profiles')
      .select('accepted_payment_methods')
      .eq('id', session.user.id)
      .abortSignal(controller.signal)
      .maybeSingle<{ accepted_payment_methods: PaymentMethod[] }>()
      .then(({ data, error }) => {
        if (controller.signal.aborted) return
        setSelectedMethods(error || !data ? paymentOptions.map(({ value }) => value) : data.accepted_payment_methods)
      })
    return () => controller.abort()
  }, [initialTrade, session])

  function addTag(value: string) {
    const clean = value.trim()
    if (clean && !tags.some((existing) => existing.toLowerCase() === clean.toLowerCase())) {
      setTags([...tags, clean])
    }
    setTag('')
  }

  async function saveAddress() {
    if (pendingAddress.current) {
      const change = pendingAddress.current
      const { error } = 'remove' in change
        ? await supabase.from('trade_addresses').delete().eq('trade_id', change.trade_id)
        : await supabase.from('trade_addresses').upsert(change)
      if (error) throw error
      pendingAddress.current = null
      setAddressPending(false)
    }
    if (initialTrade) {
      navigate('/trades/' + initialTrade.id, { replace: true })
      return
    }
    navigate('/erstellen/veroeffentlicht', { replace: true, state: { published: true } })
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || !session) return

    if (pendingAddress.current) {
      submitting.current = true
      setBusy(true)
      try {
        await saveAddress()
      } catch {
        setMessage('Der Trade ist gespeichert. Die Adresse konnte nicht aktualisiert werden. Versuche es erneut.')
      } finally {
        submitting.current = false
        setBusy(false)
      }
      return
    }

    const data = new FormData(event.currentTarget)
    const title = String(data.get('title')).trim()
    const description = String(data.get('description')).trim()
    const when = String(data.get('when') ?? '')
    const until = String(data.get('until') ?? '')
    const startValue = when ? when + 'T' + (fromTime || '00:00') : ''
    const endValue = until ? until + 'T' + (untilTime || '23:59:59.999') : ''
    const sameStart = Boolean(initialTrade && startValue === initialStart)
    const wantedFrom = new Date(sameStart ? initialTrade!.wanted_from : startValue)
    const wantedUntil = span ? new Date(endValue) : null
    const earliest = new Date()
    const dateOnlyStart = span && !fromTime
    if (dateOnlyStart) earliest.setHours(0, 0, 0, 0)
    const tooEarly = dateOnlyStart ? wantedFrom < earliest : wantedFrom <= earliest
    const street = String(data.get('street') ?? '').trim()
    const zip = String(data.get('zip') ?? '').trim()
    const city = String(data.get('city') ?? '').trim()
    const location = remote ? '' : zip && city ? zip + ' ' + city : initialTrade?.location ?? ''
    const paymentMethods = data.getAll('payment')
    const tradeTags = tags.slice()
    const extraTag = tag.trim()
    if (extraTag && !tradeTags.some((existing) => existing.toLowerCase() === extraTag.toLowerCase())) {
      tradeTags.push(extraTag)
    }
    const budget = String(data.get('budget')).trim().replace(',', '.')
    const files = data.getAll('photos').filter((file): file is File => file instanceof File && file.size > 0)
    const invalid: Errors = {}

    if (!title) invalid.title = 'Kurz beschreiben, z. B. «Deckenlampe montieren»'
    if (!when) {
      invalid.when = 'Wähle, wann die Hilfe stattfinden soll.'
    } else if (!span && !fromTime) {
      invalid['start-time'] = 'Wähle eine Uhrzeit.'
    } else if (!Number.isFinite(wantedFrom.getTime()) || (!sameStart && tooEarly)) {
      invalid.when = dateOnlyStart ? 'Wähle das heutige Datum oder ein späteres Datum.' : 'Wähle einen Zeitpunkt in der Zukunft.'
    }
    if (span && !until) {
      invalid.until = 'Wähle ein Enddatum.'
    } else if (wantedUntil && (!Number.isFinite(wantedUntil.getTime()) || wantedUntil <= wantedFrom)) {
      invalid.until = 'Wähle eine Endzeit nach dem Beginn.'
    }
    const needsAddress = !remote && (!editing || Boolean(address) || Boolean(street || zip || city) || initialTrade?.is_remote || !location)
    if (needsAddress && !street) invalid.street = 'Gib Strasse und Hausnummer ein.'
    if (needsAddress && !zip) invalid.zip = 'Gib die PLZ ein.'
    if (needsAddress && !city) invalid.city = 'Gib den Ort ein.'
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(budget) || Number(budget) <= 0) {
      invalid.budget = 'Gib einen Betrag über CHF 0 ein.'
    }
    if (!paymentMethods.length) invalid.payment = 'Wähle mindestens eine Zahlungsart.'
    if (files.length + (initialTrade?.photo_urls.length ?? 0) > 5 || files.some((file) => !photoTypes.has(file.type) || file.size > 5 * 1024 * 1024)) {
      invalid.photos = 'Wähle bis zu 5 JPG-, PNG- oder WebP-Fotos mit je höchstens 5 MB.'
    }

    setErrors(invalid)
    setMessage('')
    const firstError = Object.keys(invalid)[0]
    if (firstError) {
      const field = form.current?.querySelector<HTMLElement>('#' + firstError)
      const details = field?.closest('details')
      if (details) details.open = true
      field?.focus()
      return
    }

    submitting.current = true
    setBusy(true)
    const storage = supabase.storage.from('photos')
    const paths: string[] = []
    let insertStarted = false
    try {
      let coords = null
      if (initialTrade && !remote && location === initialTrade.location) {
        coords = { lat: initialTrade.lat, lng: initialTrade.lng }
      } else if (!remote) {
        try {
          coords = await geocodeLocality(location)
        } catch {
          setErrors({ city: 'Die Ortssuche ist gerade nicht erreichbar. Versuche es erneut.' })
          return
        }
        if (!coords) {
          setErrors({ city: 'Ort nicht gefunden. Versuche es mit PLZ und Ort.' })
          return
        }
      }

      for (const file of files) {
        const fileId = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
          byte.toString(16).padStart(2, '0'),
        ).join('')
        const path = session.user.id + '/' + fileId + '.' + photoTypes.get(file.type)
        const { error } = await storage.upload(path, file, { contentType: file.type })
        if (error) throw error
        paths.push(path)
      }

      const tradeId = initialTrade?.id ?? crypto.randomUUID()
      insertStarted = true
      const values = {
        title,
        description: description || null,
        category,
        budget_chf: Number(budget),
        is_remote: remote,
        location: location || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        wanted_from: wantedFrom.toISOString(),
        wanted_until: wantedUntil?.toISOString() ?? null,
        tags: tradeTags,
        payment_methods: paymentMethods,
        photo_urls: [...(initialTrade?.photo_urls ?? []), ...paths.map((path) => storage.getPublicUrl(path).data.publicUrl)],
      }
      const { data: saved, error, status } = initialTrade
        ? await supabase.from('trades').update(values).eq('id', tradeId).eq('client_id', session.user.id).eq('status', 'offen').select('id').maybeSingle()
        : await supabase.from('trades').insert({ ...values, id: tradeId, client_id: session.user.id }).select('id').single()
      if (error) {
        insertStarted = status === 0 || status >= 500
        throw error
      }
      if (!saved) {
        insertStarted = false
        if (paths.length) await storage.remove(paths)
        setMessage('Dieser Trade ist nicht mehr offen und kann nicht bearbeitet werden.')
        return
      }
      if (needsAddress || (remote && address)) {
        pendingAddress.current = remote ? { trade_id: tradeId, remove: true } : { trade_id: tradeId, street, zip, city }
        setAddressPending(true)
      }
      await saveAddress()
    } catch {
      if (!insertStarted && paths.length) await storage.remove(paths)
      if (pendingAddress.current) {
        setMessage('Der Trade ist gespeichert. Die Adresse konnte nicht aktualisiert werden. Versuche es erneut.')
        return
      }
      if (editing) {
        setMessage('Die Änderungen konnten nicht bestätigt werden. Prüfe den Trade und versuche es bei Bedarf erneut.')
        return
      }
      setMessage(insertStarted
        ? 'Die Veröffentlichung konnte nicht bestätigt werden. Prüfe zuerst, ob dein Trade bereits sichtbar ist.'
        : 'Dein Trade konnte nicht veröffentlicht werden. Versuche es erneut.')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  function saveTime(value: string) {
    if (timeField === 'when') setFromTime(value)
    else setUntilTime(value)
    setTimeField(null)
  }

  const availableSuggestions = suggestedTags.filter((value) => !tags.some((item) => item.toLowerCase() === value.toLowerCase()))
  const errorCount = Object.keys(errors).length
  const addressRequired = !editing || Boolean(address) || initialTrade?.is_remote || !initialTrade?.location

  return (
    <main className="screen screen--with-action-bar">
      <AppBar back={editing} title={editing ? "Trade bearbeiten" : "Trade erstellen"} />
      <form ref={form} className="create-trade" onSubmit={publish} noValidate>
        <fieldset className="create-trade__fields" aria-label={editing ? "Trade bearbeiten" : "Trade erstellen"} disabled={busy || addressPending}>
          {errorCount > 0 && (
            <div className="create-trade__banner" role="alert">
              <CircleAlert aria-hidden />
              <div>
                <p className="text-body-strong">Prüfe deine Angaben</p>
                <p className="text-body">Die Hinweise bei den Feldern zeigen dir, was du ändern kannst.</p>
              </div>
            </div>
          )}
          <div className="create-trade__chips" role="group" aria-label="Kategorie">
            {categories.slice(0, more ? categories.length : 3).map((option) => (
              <button type="button" className="text-label" key={option} aria-pressed={category === option} onClick={() => setCategory(option)}>{categoryLabels[option] ?? option}</button>
            ))}
            <button type="button" className="text-label" aria-expanded={more} onClick={() => setMore(!more)}>{more ? 'Weniger' : 'Mehr …'}</button>
          </div>
          <Field id="title" label="Was brauchst du? *" error={errors.title}>
            <input {...fieldProps('title', errors)} required defaultValue={initialTrade?.title} placeholder="Z. B. Deckenlampe im Wohnzimmer montieren" />
          </Field>
          <section className="create-trade__schedule" aria-labelledby="trade-schedule-title">
            <h2 className="text-body-strong" id="trade-schedule-title">Wann soll die Hilfe stattfinden?</h2>
            <Segmented label="Terminart" value={span ? 'span' : 'from'}
              options={[{ value: 'from', label: 'Ab Zeitpunkt' }, { value: 'span', label: 'Zeitspanne' }]}
              onChange={(value) => setSpan(value === 'span')} />
            <div className="create-trade__date-card">
              <Field id="when" label={span ? 'Startdatum *' : 'Datum *'} error={errors.when}>
                <div className="create-trade__date-input">
                  <CalendarDays aria-hidden />
                  <input {...fieldProps('when', errors)} type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} required />
                </div>
              </Field>
              <button className="create-trade__time-button text-label" id="start-time" type="button" aria-haspopup="dialog"
                aria-describedby={errors['start-time'] ? 'start-time-error' : undefined} onClick={() => setTimeField('when')}>
                <Clock aria-hidden /> {fromTime ? fromTime + ' Uhr' : span ? 'Uhrzeit hinzufügen (optional)' : 'Uhrzeit wählen *'}
              </button>
              {errors['start-time'] && <p className="create-trade__error text-body" id="start-time-error">{errors['start-time']}</p>}
            </div>
            {span && <div className="create-trade__date-card">
              <Field id="until" label="Enddatum *" error={errors.until}>
                <div className="create-trade__date-input">
                  <CalendarDays aria-hidden />
                  <input {...fieldProps('until', errors)} type="date" value={untilDate} onChange={(event) => setUntilDate(event.target.value)} required />
                </div>
              </Field>
              <button className="create-trade__time-button text-label" type="button" aria-haspopup="dialog" onClick={() => setTimeField('until')}>
                <Clock aria-hidden /> {untilTime ? untilTime + ' Uhr' : 'Uhrzeit hinzufügen (optional)'}
              </button>
            </div>}
          </section>
          <div className="field">
            <div className="create-trade__location-options text-body">
              <label><input type="checkbox" checked={remote} onChange={(event) => {
                setRemote(event.target.checked)
                setErrors(({ street: _street, zip: _zip, city: _city, ...rest }) => rest)
              }} /> Remote / von überall möglich</label>
              {!remote && <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>}
            </div>
            <p className="text-body">Wähle Remote, wenn die helfende Person dafür nicht vor Ort sein muss.</p>
          </div>
          {!remote && <div className="field">
            <p className="text-body">PLZ und Ort erscheinen auf der Karte. Die Strasse sieht die helfende Person erst nach der Zahlung oder nach der Vergabe bei Barzahlung.</p>
            {!addressRequired && <p className="text-body">Bisheriger Ort auf der Karte: {initialTrade?.location}. Du kannst eine genaue Adresse ergänzen.</p>}
            <Field id="street" label={addressRequired ? "Strasse und Hausnummer *" : "Strasse und Hausnummer"} error={errors.street}>
              <input {...fieldProps('street', errors)} autoComplete="street-address" required={addressRequired} defaultValue={address?.street} />
            </Field>
            <div className="create-trade__row">
              <Field id="zip" label={addressRequired ? "PLZ *" : "PLZ"} error={errors.zip}>
                <input {...fieldProps('zip', errors)} autoComplete="postal-code" required={addressRequired} defaultValue={address?.zip} />
              </Field>
              <Field id="city" label={addressRequired ? "Ort *" : "Ort"} error={errors.city}>
                <input {...fieldProps('city', errors)} autoComplete="address-level2" required={addressRequired} defaultValue={address?.city} />
              </Field>
            </div>
          </div>}
          <Field id="budget" label="Budget *" error={errors.budget}>
            <input {...fieldProps('budget', errors)} required inputMode="decimal" defaultValue={initialTrade?.budget_chf} placeholder="CHF" />
          </Field>
          <details className="create-trade__details">
            <summary>
              <span className="text-body-strong">Weitere Angaben (optional)</span>
              <Plus aria-hidden />
            </summary>
            <fieldset className="create-trade__options" disabled={selectedMethods === null}>
              <legend className="text-label">Akzeptierte Zahlungsarten</legend>
              <p className="text-caption text-secondary">Vorauswahl aus deinem Profil. Für diesen Trade kannst du sie anpassen.</p>
              <div className="create-trade__chips">
                {paymentOptions.map(({ value, label }, index) => (
                  <label className="text-body" key={value}>
                    <input
                      id={index === 0 ? 'payment' : undefined}
                      type="checkbox"
                      name="payment"
                      value={value}
                      checked={selectedMethods?.includes(value) ?? false}
                      onChange={(event) => setSelectedMethods((current) => event.target.checked
                        ? [...(current ?? []), value]
                        : (current ?? []).filter((method) => method !== value))}
                    /> {label}
                  </label>
                ))}
              </div>
              {errors.payment && <p className="create-trade__error text-body">{errors.payment}</p>}
            </fieldset>
            <div className="field">
              <label className="text-label" htmlFor="trade-tag">Stichwörter</label>
              <div className="create-trade__row">
                <input id="trade-tag" className="input text-body" value={tag} maxLength={40} placeholder="Z. B. IKEA" onChange={(event) => setTag(event.target.value)} onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addTag(tag)
                  }
                }} />
                <Button type="button" variant="secondary" disabled={!tag.trim()} onClick={() => addTag(tag)}>Hinzufügen</Button>
              </div>
              {tags.length > 0 && <>
                <p className="text-label" id="selected-tags">Ausgewählt</p>
                <div className="create-trade__chips create-trade__chips--selected" role="group" aria-labelledby="selected-tags">
                  {tags.map((value) => <button key={value} className="text-label" type="button" aria-label={value + ' entfernen'} onClick={() => setTags(tags.filter((item) => item !== value))}>{value} ×</button>)}
                </div>
              </>}
              {availableSuggestions.length > 0 && <>
                <p className="text-label" id="suggested-tags">Vorschläge</p>
                <div className="create-trade__chips create-trade__chips--suggested" role="group" aria-labelledby="suggested-tags">
                  {availableSuggestions.map((value) => (
                    <button className="text-label" key={value} type="button" onClick={() => addTag(value)}>+ {value}</button>
                  ))}
                </div>
              </>}
            </div>
          </details>
          <details className="create-trade__details">
            <summary>
              <Camera aria-hidden />
              <span><span className="text-body-strong">Fotos und Details</span><span className="text-body text-secondary">Optional: Beschreibung und bis zu 5 Fotos</span></span>
              <Plus aria-hidden />
            </summary>
            <label className="field text-label">
              Beschreibung
              <textarea name="description" defaultValue={initialTrade?.description ?? undefined} placeholder="Z. B. Bitte bring eine Leiter mit." className="input text-body" rows={3} />
            </label>
            <Field id="photos" label="Fotos" error={errors.photos}>
              <input {...fieldProps('photos', errors)} type="file" accept="image/jpeg,image/png,image/webp" multiple />
            </Field>
          </details>
          {message && <p className="text-body" role="alert">{message}</p>}
        </fieldset>
        <ActionBar>
          <Button type="submit" disabled={busy || selectedMethods === null}>
            {busy ? 'Wird gespeichert …' : selectedMethods === null ? 'Zahlungsarten werden geladen …' : addressPending ? 'Adresse erneut speichern' : editing ? 'Änderungen speichern' : 'Trade veröffentlichen'}
          </Button>
        </ActionBar>
      </form>
      <BottomSheet open={timeField !== null} title={timeField === 'when' ? (span ? 'Startzeit (optional)' : 'Uhrzeit wählen') : 'Endzeit (optional)'} onClose={() => setTimeField(null)}>
        <label className="field text-label create-trade__time-field">
          Uhrzeit
          <input className="input text-body" type="time" ref={timeInput} defaultValue={timeField === 'when' ? fromTime : untilTime} />
        </label>
        <Button type="button" onClick={() => saveTime(timeInput.current?.value ?? '')}>Uhrzeit übernehmen</Button>
        {span && <Button type="button" variant="text" onClick={() => saveTime('')}>Ohne Uhrzeit</Button>}
      </BottomSheet>
    </main>
  )
}

export function TradePublished() {
  const { state } = useLocation()
  if (!state?.published) return <Navigate to="/erstellen" replace />

  return (
    <>
      <AppBar title="Trade veröffentlicht" />
      <main className="screen screen--with-action-bar trade-published">
        <Zustand mascot="plaudi" title="Dein Trade wurde veröffentlicht!" text="Jetzt können Helfende deinen Trade entdecken und dir Angebote schicken." />
        <ActionBar>
          <Link className="button button--primary text-body-strong" to="/erstellen" replace>Weiteren Trade veröffentlichen</Link>
        </ActionBar>
      </main>
    </>
  )
}
