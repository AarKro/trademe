import { Camera, ChevronRight, ListChecks, MapPin, ShieldQuestion, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppBar } from '../../components/AppBar'
import { Avatar } from '../../components/Avatar'
import { BottomSheet } from '../../components/BottomSheet'
import { Button } from '../../components/Button'
import { HinweisTag } from '../../components/HinweisTag'
import { RatingSummary } from '../../components/Rating'
import { Toast } from '../../components/Toast'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../lib/types'
import { memberSince, paymentLabels, useProfile } from './profileData'
import './Profile.css'

interface Task {
  done: boolean
  icon: LucideIcon
  title: string
  hint: string
  onClick: () => void
}

// A/15 Eigenes Profil (447:5473). Figma only has the empty state; filled sections reuse the A/10 look.
export function MyProfile() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, stats, error } = useProfile(session?.user.id)
  const [toast, setToast] = useState<string | null>((location.state as { toast?: string } | null)?.toast ?? null)
  const [verifyOpen, setVerifyOpen] = useState(false)

  const edit = () => navigate('/profil/bearbeiten')

  return (
    <>
      <AppBar
        title="Mein Profil"
        action={
          profile && (
            <button className="app-bar__action text-label" onClick={edit}>
              Bearbeiten
            </button>
          )
        }
      />
      <main className="screen profile">
        {toast && (
          <Toast
            message={toast}
            onDone={() => {
              setToast(null)
              navigate('.', { replace: true, state: null }) // don't show it again on reload
            }}
          />
        )}
        {error && <p className="text-body">{error}</p>}
        {profile && (
          <>
            <ProfileHead profile={profile} />
            <Progress
              tasks={[
                {
                  done: Boolean(profile.display_name && profile.location),
                  icon: MapPin,
                  title: 'Wohnort angeben',
                  hint: 'Damit dich Leute in der Nähe finden',
                  onClick: edit,
                },
                {
                  done: Boolean(profile.avatar_url),
                  icon: Camera,
                  title: 'Profilfoto hinzufügen',
                  hint: 'Mit Foto bekommst du mehr Zusagen',
                  onClick: edit,
                },
                {
                  done: profile.skills.length > 0,
                  icon: ListChecks,
                  title: 'Fähigkeiten angeben',
                  hint: 'Damit dich Auftraggebende finden',
                  onClick: edit,
                },
                {
                  done: profile.is_verified,
                  icon: ShieldQuestion,
                  title: 'Identität prüfen',
                  hint: 'ID-Scan + Selfie, 2 Min. → «Geprüft»',
                  onClick: () => setVerifyOpen(true),
                },
              ]}
            />
            <ProfileDetails profile={profile} />

            <section className="profile__section">
              <h2 className="text-h3">Bewertungen</h2>
              {stats.rating_count === 0 ? (
                <p className="text-caption text-secondary">Erscheinen nach deinem ersten abgeschlossenen Trade.</p>
              ) : (
                <>
                  <RatingSummary avg={stats.rating_avg} count={stats.rating_count} />
                  <Link to={`/profil/${profile.id}`} className="text-label text-accent">
                    Alle Bewertungen ansehen
                  </Link>
                </>
              )}
            </section>

            <Link to={`/profil/${profile.id}`} className="profile__link text-label text-accent">
              So sehen andere dein Profil
            </Link>
            <Button variant="text" onClick={() => supabase.auth.signOut()}>
              Abmelden
            </Button>
          </>
        )}
      </main>

      <VerifySheet open={verifyOpen} onClose={() => setVerifyOpen(false)} />
    </>
  )
}

/** «Identität prüfen» is a later feature – explains how «Geprüft» works for the demo. */
export function VerifySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} title="Identität prüfen" onClose={onClose}>
      <HinweisTag typ="bald-verfuegbar" />
      <p className="text-body text-secondary">
        Mit ID-Scan und Selfie bekommst du das Zeichen «Geprüft». Diese Funktion kommt in einer späteren Version. Für
        die Demo setzt das TradeMe-Team «Geprüft» von Hand.
      </p>
      <Button onClick={onClose}>Verstanden</Button>
    </BottomSheet>
  )
}

/** Avatar, name, place · member since. Also used by the public profile (A/10). */
export function ProfileHead({ profile }: { profile: Profile }) {
  return (
    <div className="profile__head">
      <Avatar name={profile.display_name} src={profile.avatar_url} size="lg" />
      <div className="profile__head-text">
        <p className="text-h2">{profile.display_name}</p>
        <p className="text-caption text-secondary">
          {[profile.location, memberSince(profile.created_at)].filter(Boolean).join(' · ')}
        </p>
        {profile.is_verified && <HinweisTag typ="geprueft" />}
      </div>
    </div>
  )
}

/** Über mich, Fähigkeiten, Zahlungsarten – each only when filled. */
export function ProfileDetails({ profile }: { profile: Profile }) {
  return (
    <>
      {profile.bio && (
        <section className="profile__section">
          <h2 className="text-h3">Über mich</h2>
          <p className="text-body">{profile.bio}</p>
        </section>
      )}
      {profile.skills.length > 0 && (
        <section className="profile__section">
          <h2 className="text-h3">Fähigkeiten</h2>
          <ul className="chips">
            {profile.skills.map((skill) => (
              <li key={skill} className="chip text-label">
                {skill}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="profile__section">
        <h2 className="text-h3">Akzeptierte Zahlungsarten</h2>
        <p className="text-body">{profile.accepted_payment_methods.map((m) => paymentLabels[m]).join(' · ') || '–'}</p>
      </section>
    </>
  )
}

function Progress({ tasks }: { tasks: Task[] }) {
  const done = tasks.filter((t) => t.done).length
  if (done === tasks.length) return null
  const percent = Math.round((done / tasks.length) * 100)

  return (
    <section className="profile-progress">
      <div className="profile-progress__head">
        <h2 className="text-body-strong">Profil zu {percent} % fertig</h2>
        <span className="text-caption text-secondary">
          {done} von {tasks.length}
        </span>
      </div>
      <div
        className="profile-progress__bar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      {tasks
        .filter((t) => !t.done)
        .map(({ icon: Icon, title, hint, onClick }) => (
          <button key={title} className="profile-progress__task" onClick={onClick}>
            <Icon className="profile-progress__icon" aria-hidden />
            <span className="profile-progress__text">
              <span className="text-body-strong">{title}</span>
              <span className="text-caption text-secondary">{hint}</span>
            </span>
            <ChevronRight className="profile-progress__chevron" aria-hidden />
          </button>
        ))}
    </section>
  )
}
