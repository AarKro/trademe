import { Camera, CircleAlert, Plus } from 'lucide-react'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ActionBar } from '../../components/ActionBar'
import { AppBar } from '../../components/AppBar'
import { Button } from '../../components/Button'
import { useAuth } from '../../lib/auth'
import type { PaymentMethod } from '../../lib/types'
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

type FieldName = 'title' | 'location' | 'when' | 'until' | 'street' | 'zip' | 'city' | 'payment' | 'budget' | 'photos'
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

export function CreateTrade() {
  const { session } = useAuth()
  const [category, setCategory] = useState(categories[0])
  const [more, setMore] = useState(false)
  const [remote, setRemote] = useState(false)
  const [span, setSpan] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tag, setTag] = useState('')
  const pendingAddress = useRef<{ trade_id: string; street: string; zip: string; city: string } | null>(null)
  const [addressPending, setAddressPending] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [message, setMessage] = useState('')
  const [published, setPublished] = useState(false)
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const form = useRef<HTMLFormElement>(null)

  function addTag(value: string) {
    const clean = value.trim()
    if (clean && !tags.some((existing) => existing.toLowerCase() === clean.toLowerCase())) {
      setTags([...tags, clean])
    }
    setTag('')
  }

  async function saveAddress() {
    if (pendingAddress.current) {
      const { error } = await supabase.from('trade_addresses').upsert(pendingAddress.current)
      if (error) throw error
      pendingAddress.current = null
      setAddressPending(false)
    }
    setPublished(true)
    setMessage('Dein Trade ist veröffentlicht.')
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || published || !session) return

    if (pendingAddress.current) {
      submitting.current = true
      setBusy(true)
      try {
        await saveAddress()
      } catch {
        setMessage('Der Trade ist veröffentlicht. Die Adresse konnte nicht gespeichert werden. Versuche es erneut.')
      } finally {
        submitting.current = false
        setBusy(false)
      }
      return
    }

    const data = new FormData(event.currentTarget)
    const title = String(data.get('title')).trim()
    const location = remote ? '' : String(data.get('location')).trim()
    const description = String(data.get('description')).trim()
    const when = String(data.get('when'))
    const wantedFrom = new Date(when)
    const wantedUntil = span ? new Date(String(data.get('until'))) : null
    const street = String(data.get('street') ?? '').trim()
    const zip = String(data.get('zip') ?? '').trim()
    const city = String(data.get('city') ?? '').trim()
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
    if (!remote && !location) invalid.location = 'Gib einen Ort oder ein Quartier ein oder wähle die Remote-Option.'
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(budget) || Number(budget) <= 0) {
      invalid.budget = 'Gib einen Betrag über CHF 0 ein.'
    }
    if (!Number.isFinite(wantedFrom.getTime()) || wantedFrom.getTime() <= Date.now()) {
      invalid.when = 'Wähle einen Zeitpunkt in der Zukunft.'
    }
    if (wantedUntil && (!Number.isFinite(wantedUntil.getTime()) || wantedUntil <= wantedFrom)) {
      invalid.until = 'Wähle einen Endzeitpunkt nach dem Beginn.'
    }
    if (!remote && !street) invalid.street = 'Gib Strasse und Hausnummer ein.'
    if (!remote && !zip) invalid.zip = 'Gib die PLZ ein.'
    if (!remote && !city) invalid.city = 'Gib den Ort ein.'
    if (!paymentMethods.length) invalid.payment = 'Wähle mindestens eine Zahlungsart.'
    if (files.length > 5 || files.some((file) => !photoTypes.has(file.type) || file.size > 5 * 1024 * 1024)) {
      invalid.photos = 'Wähle bis zu 5 JPG-, PNG- oder WebP-Fotos mit je höchstens 5 MB.'
    }

    setErrors(invalid)
    setMessage('')
    const firstError = Object.keys(invalid)[0]
    if (firstError) {
      form.current?.querySelector<HTMLElement>('#' + firstError)?.focus()
      return
    }

    submitting.current = true
    setBusy(true)
    const storage = supabase.storage.from('photos')
    const paths: string[] = []
    let insertStarted = false
    try {
      let coords = null
      if (!remote) {
        try {
          coords = await geocodeLocality(location)
        } catch {
          setErrors({ location: 'Die Ortssuche ist gerade nicht erreichbar. Versuche es erneut.' })
          return
        }
        if (!coords) {
          setErrors({ location: 'Ort nicht gefunden. Versuche es mit PLZ und Ort.' })
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

      const tradeId = crypto.randomUUID()
      insertStarted = true
      const { error, status } = await supabase.from('trades').insert({
        id: tradeId,
        client_id: session.user.id,
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
        photo_urls: paths.map((path) => storage.getPublicUrl(path).data.publicUrl),
      })
      if (error) {
        insertStarted = status === 0 || status >= 500
        throw error
      }
      if (!remote) {
        pendingAddress.current = { trade_id: tradeId, street, zip, city }
        setAddressPending(true)
      }
      await saveAddress()
    } catch {
      if (!insertStarted && paths.length) await storage.remove(paths)
      if (pendingAddress.current) {
        setMessage('Der Trade ist veröffentlicht. Die Adresse konnte nicht gespeichert werden. Versuche es erneut.')
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

  const errorCount = Object.keys(errors).length
  const titleAndLocation = errorCount === 2 && errors.title && errors.location

  return (
    <main className="screen screen--with-action-bar">
      <AppBar title="Trade erstellen" />
      <form ref={form} className="create-trade" onSubmit={publish} noValidate>
        <fieldset className="create-trade__fields" aria-label="Trade erstellen" disabled={busy || published || addressPending}>
          {errorCount > 0 && (
            <div className="create-trade__banner" role="alert">
              <CircleAlert aria-hidden />
              <div>
                <p className="text-body-strong">{titleAndLocation ? '2 Angaben fehlen' : 'Prüfe deine Angaben'}</p>
                <p className="text-body">{titleAndLocation
                  ? 'Ergänze Titel und Ort, dann kannst du veröffentlichen.'
                  : 'Die Hinweise bei den Feldern zeigen dir, was du ändern kannst.'}</p>
              </div>
            </div>
          )}
          <div className="create-trade__chips" role="group" aria-label="Kategorie">
            {categories.slice(0, more ? categories.length : 3).map((option) => (
              <button type="button" className="text-label" key={option} aria-pressed={category === option} onClick={() => setCategory(option)}>{categoryLabels[option] ?? option}</button>
            ))}
            <button type="button" className="text-label" aria-expanded={more} onClick={() => setMore(!more)}>{more ? 'Weniger' : 'Mehr …'}</button>
          </div>
          <Field id="title" label="Was brauchst du?" error={errors.title}>
            <input {...fieldProps('title', errors)} required placeholder="Z. B. Deckenlampe im Wohnzimmer montieren" />
          </Field>
          <div className="field">
            <label className="text-label" htmlFor="wanted-mode">Wann soll die Hilfe stattfinden?</label>
            <select className="input text-body" id="wanted-mode" value={span ? 'span' : 'from'} onChange={(event) => setSpan(event.target.value === 'span')}>
              <option value="from">Ab Zeitpunkt</option>
              <option value="span">Zeitspanne von–bis</option>
            </select>
            <Field id="when" label="Von" error={errors.when}>
              <input {...fieldProps('when', errors)} type="datetime-local" required />
            </Field>
            {span && <Field id="until" label="Bis" error={errors.until}>
              <input {...fieldProps('until', errors)} type="datetime-local" required />
            </Field>}
          </div>
          <Field id="location" label="Ort oder Quartier für die Karte" error={remote ? undefined : errors.location}>
            <input {...fieldProps('location', remote ? {} : errors)} disabled={remote} required={!remote} placeholder="Zürich, Kreis 4" aria-describedby={errors.location && !remote ? 'location-error location-help' : 'location-help'} />
            <div className="create-trade__location-options text-body" id="location-help">
              <label><input type="checkbox" checked={remote} onChange={(event) => {
                setRemote(event.target.checked)
                setErrors(({ location: _location, ...rest }) => rest)
              }} /> Remote / von überall möglich</label>
              {!remote && <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>}
            </div>
            <p className="text-body">Wähle Remote, wenn die helfende Person dafür nicht vor Ort sein muss.</p>
            {!remote && <p className="text-body">Nur PLZ, Ort oder Quartier eingeben. Die Ortssuche fragt OpenStreetMap ab.</p>}
          </Field>
          {!remote && <div className="field">
            <p className="text-body">Die helfende Person sieht die Adresse erst nach der Zahlung. Bei Barzahlung sieht sie die Adresse nach der Vergabe.</p>
            <Field id="street" label="Strasse und Hausnummer" error={errors.street}>
              <input {...fieldProps('street', errors)} autoComplete="street-address" required />
            </Field>
            <div className="create-trade__row">
              <Field id="zip" label="PLZ" error={errors.zip}>
                <input {...fieldProps('zip', errors)} autoComplete="postal-code" required />
              </Field>
              <Field id="city" label="Ort" error={errors.city}>
                <input {...fieldProps('city', errors)} autoComplete="address-level2" required />
              </Field>
            </div>
          </div>}
          <Field id="budget" label="Budget" error={errors.budget}>
            <input {...fieldProps('budget', errors)} required inputMode="decimal" placeholder="CHF" />
          </Field>
          <fieldset className="create-trade__options">
            <legend className="text-label">Akzeptierte Zahlungsarten</legend>
            <div className="create-trade__chips">
              {paymentOptions.map(({ value, label }, index) => (
                <label className="text-body" key={value}>
                  <input id={index === 0 ? 'payment' : undefined} type="checkbox" name="payment" value={value} defaultChecked /> {label}
                </label>
              ))}
            </div>
            {errors.payment && <p className="create-trade__error text-body">{errors.payment}</p>}
          </fieldset>
          <div className="field">
            <label className="text-label" htmlFor="trade-tag">Stichwörter (optional)</label>
            <div className="create-trade__row">
              <input id="trade-tag" className="input text-body" value={tag} maxLength={40} placeholder="Z. B. IKEA" onChange={(event) => setTag(event.target.value)} onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addTag(tag)
                }
              }} />
              <Button type="button" variant="secondary" disabled={!tag.trim()} onClick={() => addTag(tag)}>Hinzufügen</Button>
            </div>
            <div className="create-trade__chips">
              {tags.map((value) => <button key={value} className="text-label" type="button" aria-label={value + ' entfernen'} onClick={() => setTags(tags.filter((item) => item !== value))}>{value} ×</button>)}
              {suggestedTags.filter((value) => !tags.some((item) => item.toLowerCase() === value.toLowerCase())).map((value) => (
                <button className="text-label" key={value} type="button" onClick={() => addTag(value)}>+ {value}</button>
              ))}
            </div>
          </div>
          <details className="create-trade__details">
            <summary>
              <Camera aria-hidden />
              <span><span className="text-body-strong">Fotos und Details</span><span className="text-body text-secondary">Optional: Beschreibung und bis zu 5 Fotos</span></span>
              <Plus aria-hidden />
            </summary>
            <label className="field text-label">
              Beschreibung
              <textarea name="description" placeholder="Z. B. Bitte bring eine Leiter mit." className="input text-body" rows={3} />
            </label>
            <Field id="photos" label="Fotos" error={errors.photos}>
              <input {...fieldProps('photos', errors)} type="file" accept="image/jpeg,image/png,image/webp" multiple />
            </Field>
          </details>
          {message && <p className="text-body" role={published ? 'status' : 'alert'}>{message}</p>}
        </fieldset>
        <ActionBar>
          {published
            ? <Button type="button" onClick={() => {
              form.current?.reset()
              setRemote(false)
              setSpan(false)
              setTags([])
              setTag('')
              setCategory(categories[0])
              setMore(false)
              setMessage('')
              setPublished(false)
            }}>Weiteren Trade erstellen</Button>
            : <Button type="submit" disabled={busy}>{busy ? 'Wird veröffentlicht …' : addressPending ? 'Adresse erneut speichern' : 'Trade veröffentlichen'}</Button>}
        </ActionBar>
      </form>
    </main>
  )
}
