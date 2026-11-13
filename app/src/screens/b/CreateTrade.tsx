import { Camera, CircleAlert, Plus } from 'lucide-react'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AppBar } from '../../components/AppBar'
import { Button } from '../../components/Button'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { geocodeLocality } from './geocode'
import './CreateTrade.css'

const categories = ['Möbelaufbau', 'Umzug', 'Garten', 'Haushalt', 'Technik', 'Sonstiges']
const photoTypes = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']])

type FieldName = 'title' | 'location' | 'when' | 'budget' | 'photos'
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
      {error && <p className="create-trade__error text-caption" id={id + '-error'}><CircleAlert aria-hidden />{error}</p>}
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
  const [errors, setErrors] = useState<Errors>({})
  const [message, setMessage] = useState('')
  const [published, setPublished] = useState(false)
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const form = useRef<HTMLFormElement>(null)

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || published || !session) return

    const data = new FormData(event.currentTarget)
    const title = String(data.get('title')).trim()
    const location = remote ? '' : String(data.get('location')).trim()
    const description = String(data.get('description')).trim()
    const when = String(data.get('when'))
    const scheduled = when ? new Date(when) : null
    const budget = String(data.get('budget')).trim().replace(',', '.')
    const files = data.getAll('photos').filter((file): file is File => file instanceof File && file.size > 0)
    const invalid: Errors = {}

    if (!title) invalid.title = 'Kurz beschreiben, z. B. «Schrank aufbauen»'
    if (!remote && !location) invalid.location = 'Ort oder Quartier eingeben – oder «Überall» wählen'
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(budget) || Number(budget) <= 0) {
      invalid.budget = 'Gib einen Betrag über CHF 0 ein.'
    }
    if (scheduled && (!Number.isFinite(scheduled.getTime()) || scheduled.getTime() <= Date.now())) {
      invalid.when = 'Wähle einen Termin in der Zukunft.'
    }
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

      insertStarted = true
      const { error, status } = await supabase.from('trades').insert({
        client_id: session.user.id,
        title,
        description: description || null,
        category,
        budget_chf: Number(budget),
        is_remote: remote,
        location: location || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        scheduled_at: scheduled?.toISOString() ?? null,
        photo_urls: paths.map((path) => storage.getPublicUrl(path).data.publicUrl),
      })
      if (error) {
        insertStarted = status === 0 || status >= 500
        throw error
      }
      setPublished(true)
      setMessage('Dein Trade ist veröffentlicht.')
    } catch {
      if (!insertStarted && paths.length) await storage.remove(paths)
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
    <>
      <AppBar title="Trade erstellen" />
      <form ref={form} className="create-trade" onSubmit={publish} noValidate>
        <fieldset className="create-trade__fields" aria-label="Trade erstellen" disabled={busy || published}>
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
              <button type="button" className="text-label" key={option} aria-pressed={category === option} onClick={() => setCategory(option)}>{option}</button>
            ))}
            <button type="button" className="text-label" aria-expanded={more} onClick={() => setMore(!more)}>{more ? 'Weniger' : 'Mehr …'}</button>
          </div>
          <Field id="title" label="Was brauchst du?" error={errors.title}>
            <input {...fieldProps('title', errors)} required placeholder="Kleiderschrank aufbauen" />
          </Field>
          <Field id="location" label="Ort" error={remote ? undefined : errors.location}>
            <input {...fieldProps('location', remote ? {} : errors)} disabled={remote} required={!remote} placeholder="Zürich, Kreis 4" aria-describedby={errors.location && !remote ? 'location-error location-help' : 'location-help'} />
            <div className="create-trade__location-options text-caption" id="location-help">
              <label><input type="checkbox" checked={remote} onChange={(event) => {
                setRemote(event.target.checked)
                setErrors(({ location: _location, ...rest }) => rest)
              }} /> Überall</label>
              {!remote && <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>}
            </div>
            {!remote && <p className="text-caption text-secondary">Nur PLZ, Ort oder Quartier eingeben. Die Ortssuche fragt OpenStreetMap ab.</p>}
          </Field>
          <div className="create-trade__row">
            <Field id="when" label="Wann" error={errors.when}>
              <input {...fieldProps('when', errors)} type="datetime-local" />
            </Field>
            <Field id="budget" label="Budget" error={errors.budget}>
              <input {...fieldProps('budget', errors)} required inputMode="decimal" placeholder="CHF" />
            </Field>
          </div>
          <details className="create-trade__details">
            <summary>
              <Camera aria-hidden />
              <span><span className="text-body-strong">Fotos und Details</span><span className="text-caption text-secondary">Optional · mehr Angebote mit Foto</span></span>
              <Plus aria-hidden />
            </summary>
            <label className="field text-label">
              Beschreibung
              <textarea name="description" className="input text-body" rows={3} />
            </label>
            <Field id="photos" label="Fotos" error={errors.photos}>
              <input {...fieldProps('photos', errors)} type="file" accept="image/jpeg,image/png,image/webp" multiple />
            </Field>
          </details>
          {message && <p className="text-body" role={published ? 'status' : 'alert'}>{message}</p>}
        </fieldset>
        <div className="create-trade__actions">
          {published
            ? <Button type="button" onClick={() => {
              form.current?.reset()
              setRemote(false)
              setCategory(categories[0])
              setMore(false)
              setMessage('')
              setPublished(false)
            }}>Weiteren Trade erstellen</Button>
            : <Button type="submit" disabled={busy}>{busy ? 'Wird veröffentlicht …' : 'Trade veröffentlichen'}</Button>}
        </div>
      </form>
    </>
  )
}
