import { Camera, Check, ChevronRight, CircleAlert, Plus, ShieldQuestion, X } from 'lucide-react'
import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActionBar } from '../../components/ActionBar'
import { AppBar } from '../../components/AppBar'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { HinweisTag } from '../../components/HinweisTag'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import type { PaymentMethod, Profile } from '../../lib/types'
import { VerifySheet } from './MyProfile'
import { paymentLabels, useProfile } from './profileData'
import './Profile.css'

const photoTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])
const MAX_PHOTO_MB = 5
const allMethods = Object.keys(paymentLabels) as PaymentMethod[]

// A/16 Eigenes Profil bearbeiten (447:5509).
// Not in the Figma frame but requested: photo, «Über mich», accepted payment methods – built from the same patterns.
export function EditProfile() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { profile, error } = useProfile(session?.user.id)
  const cancel = () => navigate('/profil')

  return (
    <>
      <AppBar
        title="Profil bearbeiten"
        compact
        action={
          <button className="app-bar__action text-label" onClick={cancel}>
            Abbrechen
          </button>
        }
      />
      {error && <p className="screen text-body">{error}</p>}
      {/* key: start the form fresh with the loaded values */}
      {profile && <EditForm key={profile.id} profile={profile} />}
    </>
  )
}

function EditForm({ profile }: { profile: Profile }) {
  const navigate = useNavigate()
  const [name, setName] = useState(profile.display_name)
  const [location, setLocation] = useState(profile.location ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [skills, setSkills] = useState(profile.skills)
  const [newSkill, setNewSkill] = useState<string | null>(null) // null = input hidden
  const [methods, setMethods] = useState(profile.accepted_payment_methods)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; methods?: string; photo?: string; save?: string }>({})
  const [busy, setBusy] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  // free the local preview URL when it's replaced or the screen closes
  useEffect(() => () => void (photoPreview && URL.revokeObjectURL(photoPreview)), [photoPreview])

  function pickPhoto(file: File | undefined) {
    if (!file) return
    if (!photoTypes.has(file.type))
      return setErrors((e) => ({ ...e, photo: 'Bitte ein JPG-, PNG- oder WebP-Bild wählen.' }))
    if (file.size > MAX_PHOTO_MB * 1024 * 1024)
      return setErrors((e) => ({ ...e, photo: `Das Bild ist grösser als ${MAX_PHOTO_MB} MB.` }))
    setErrors((e) => ({ ...e, photo: undefined }))
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function addSkill() {
    const skill = (newSkill ?? '').trim()
    if (skill && !skills.some((s) => s.toLowerCase() === skill.toLowerCase())) setSkills([...skills, skill])
    setNewSkill(null)
  }

  function toggleMethod(method: PaymentMethod) {
    setMethods(
      methods.includes(method)
        ? methods.filter((m) => m !== method)
        : allMethods.filter((m) => m === method || methods.includes(m)),
    )
  }

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = {
      name: name.trim() ? undefined : 'Bitte gib einen Namen ein.',
      methods: methods.length ? undefined : 'Wähle mindestens eine Zahlungsart.',
    }
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.methods || busy) return

    setBusy(true)
    let avatarUrl = profile.avatar_url
    if (photo) {
      const path = `${profile.id}/avatar-${Date.now()}.${photoTypes.get(photo.type)}`
      const storage = supabase.storage.from('photos')
      const { error } = await storage.upload(path, photo, { contentType: photo.type })
      if (error) {
        setBusy(false)
        return setErrors({ save: 'Das Foto konnte nicht hochgeladen werden. Bitte versuche es nochmals.' })
      }
      avatarUrl = storage.getPublicUrl(path).data.publicUrl
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: name.trim(),
        location: location.trim() || null,
        bio: bio.trim() || null,
        skills,
        accepted_payment_methods: methods,
        avatar_url: avatarUrl,
      })
      .eq('id', profile.id)
    setBusy(false)
    if (error) return setErrors({ save: 'Speichern hat nicht geklappt. Bitte versuche es nochmals.' })
    navigate('/profil', { replace: true, state: { toast: 'Profil gespeichert' } })
  }

  return (
    <>
      <form id="profile-edit" className="screen profile screen--with-action-bar" onSubmit={save} noValidate>
        <div className="profile-edit__photo">
          <Avatar name={name || profile.display_name} src={photoPreview ?? profile.avatar_url} size="lg" />
          <button
            type="button"
            className="profile-edit__photo-button text-label"
            onClick={() => fileInput.current?.click()}
          >
            <Camera aria-hidden />
            {profile.avatar_url || photo ? 'Foto ändern' : 'Foto hinzufügen'}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={[...photoTypes.keys()].join(',')}
            hidden
            onChange={(e) => pickPhoto(e.target.files?.[0])}
          />
        </div>
        {errors.photo && <FieldError text={errors.photo} />}

        <div className="field">
          <label className="text-label" htmlFor="name">
            Anzeigename *
          </label>
          <input
            id="name"
            className="input text-body"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            aria-invalid={Boolean(errors.name)}
            autoComplete="name"
          />
          {errors.name ? (
            <FieldError text={errors.name} />
          ) : (
            <p className="text-caption text-secondary">Vorname + Initial des Nachnamens</p>
          )}
        </div>

        <div className="field">
          <label className="text-label" htmlFor="location">
            Wohnort
          </label>
          <input
            id="location"
            className="input text-body"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="z. B. Zürich, Kreis 4"
            maxLength={60}
          />
        </div>

        <div className="field">
          <div className="profile-edit__label-row">
            <label className="text-label" htmlFor="bio">
              Über mich
            </label>
            <HinweisTag typ="optional" />
          </div>
          <textarea
            id="bio"
            className="input text-body profile-edit__textarea"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            placeholder="Was kannst du gut? Was machst du gerne?"
          />
        </div>

        <div className="field">
          <p className="text-label">Fähigkeiten</p>
          <ul className="chips">
            {skills.map((skill) => (
              <li key={skill}>
                <button
                  type="button"
                  className="chip chip--selected text-label"
                  onClick={() => setSkills(skills.filter((s) => s !== skill))}
                  aria-label={`${skill} entfernen`}
                >
                  <X aria-hidden />
                  {skill}
                </button>
              </li>
            ))}
            {newSkill === null && (
              <li>
                <button type="button" className="chip text-label" onClick={() => setNewSkill('')}>
                  <Plus aria-hidden />
                  Fähigkeit
                </button>
              </li>
            )}
          </ul>
          {newSkill !== null && (
            <div className="profile-edit__add-row">
              <input
                className="input text-body chip-input"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                  if (e.key === 'Escape') setNewSkill(null)
                }}
                placeholder="z. B. Möbelaufbau"
                aria-label="Neue Fähigkeit"
                maxLength={40}
                autoFocus
              />
              <Button type="button" variant="secondary" onClick={addSkill}>
                Hinzufügen
              </Button>
            </div>
          )}
        </div>

        <div className="field">
          <p className="text-label">Akzeptierte Zahlungsarten *</p>
          <ul className="chips">
            {allMethods.map((method) => {
              const on = methods.includes(method)
              return (
                <li key={method}>
                  <button
                    type="button"
                    className={`chip text-label ${on ? 'chip--selected' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggleMethod(method)}
                  >
                    {on ? <Check aria-hidden /> : <Plus aria-hidden />}
                    {paymentLabels[method]}
                  </button>
                </li>
              )
            })}
          </ul>
          {errors.methods ? (
            <FieldError text={errors.methods} />
          ) : (
            <p className="text-caption text-secondary">Bei Bar gibt es keinen Zahlungsschutz.</p>
          )}
        </div>

        {profile.is_verified ? (
          <HinweisTag typ="geprueft" />
        ) : (
          <button type="button" className="profile-edit__verify" onClick={() => setVerifyOpen(true)}>
            <ShieldQuestion aria-hidden />
            <span className="profile-progress__text">
              <span className="text-body-strong">Jetzt verifizieren</span>
              <span className="text-caption text-secondary">ID-Scan + Selfie · danach «Geprüft»</span>
            </span>
            <ChevronRight className="profile-progress__chevron" aria-hidden />
          </button>
        )}

        {errors.save && <FieldError text={errors.save} />}

        <ActionBar>
          <Button type="submit" form="profile-edit" disabled={busy}>
            {busy ? 'Speichert …' : 'Speichern'}
          </Button>
        </ActionBar>
      </form>
      <VerifySheet open={verifyOpen} onClose={() => setVerifyOpen(false)} />
    </>
  )
}

function FieldError({ text }: { text: string }) {
  return (
    <p className="profile-edit__error profile-edit__label-row text-caption" role="alert">
      <CircleAlert aria-hidden />
      {text}
    </p>
  )
}
