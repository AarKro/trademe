import { useState, type ReactNode } from 'react'
import { AppBar } from '../components/AppBar'
import { Avatar } from '../components/Avatar'
import { BottomSheet, SheetAmount, SheetInfo } from '../components/BottomSheet'
import { Button } from '../components/Button'
import { HinweisTag } from '../components/HinweisTag'
import { Rating, RatingSummary } from '../components/Rating'
import { StatusTimeline } from '../components/StatusTimeline'
import { SummaryCard } from '../components/SummaryCard'
import { Toast } from '../components/Toast'
import { Zustand } from '../components/Zustand'
import './DevComponents.css'

// /dev/components – every shared component with example data (Figma: Design System › A/08 Patterns).
const lea = { name: 'Lea M.', avatarUrl: '/dev/lea-m.jpg', ratingAvg: 4.8, ratingCount: 12, isVerified: true }

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dev-section">
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  )
}

export function DevComponents() {
  const [stars, setStars] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <AppBar title="Komponenten" back />
      <main className="screen">
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}

        <Section title="Avatar">
          <div className="dev-row">
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <Avatar key={size} name="Lea M." src={lea.avatarUrl} size={size} />
            ))}
          </div>
          <div className="dev-row">
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <Avatar key={size} name="Sandra Keller" size={size} />
            ))}
          </div>
        </Section>

        <Section title="Rating">
          <Rating value={4} />
          <RatingSummary avg={4.8} count={12} />
          <RatingSummary avg={5} count={1} />
          <RatingSummary avg={0} count={0} />
          <p className="text-caption text-secondary">Als Eingabe (antippen):</p>
          <Rating value={stars} onChange={setStars} />
        </Section>

        <Section title="Hinweis-Tag">
          <div className="dev-row">
            <HinweisTag typ="geprueft" />
            <HinweisTag typ="nicht-geprueft" />
            <HinweisTag typ="bald-verfuegbar" />
            <HinweisTag typ="optional" />
          </div>
        </Section>

        <Section title="Toast">
          <Button variant="secondary" onClick={() => setToast('Trade ist online')}>
            Toast zeigen
          </Button>
        </Section>

        <Section title="Bottom-Sheet">
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Sheet öffnen
          </Button>
          <BottomSheet open={sheetOpen} title="Zahlung freigeben?" onClose={() => setSheetOpen(false)}>
            <SheetAmount label="Geht an Lea M." amount="CHF 120" />
            <p className="text-body text-secondary">
              Mit der Freigabe wird die Zahlung ausgelöst. Danach ist kein Einspruch mehr möglich.
            </p>
            <SheetInfo>Bis dahin hält TradeMe das Geld zurück.</SheetInfo>
            <Button onClick={() => setSheetOpen(false)}>Jetzt freigeben</Button>
            <Button variant="text" onClick={() => setSheetOpen(false)}>
              Noch nicht
            </Button>
          </BottomSheet>
        </Section>

        <Section title="Status-Timeline">
          {([1, 2, 3, 4, 5] as const).map((step) => (
            <StatusTimeline key={step} step={step} deadline={step === 4 ? 'Freigabe bis 24.11. · sonst automatisch' : undefined} />
          ))}
        </Section>

        <Section title="Zustand (Erfolg · Leer · Fehler)">
          <Zustand mascot="plaudi" title="Danke für deine Bewertung!" text="Kurzer Satz, was jetzt passiert." />
          <Zustand mascot="pip" title="Noch keine Trades" text="Kurzer Satz, was jetzt passiert." />
          <Zustand mascot="loopi" title="Auftrag abgeschlossen" text="Kurzer Satz, was jetzt passiert." />
        </Section>

        <Section title="Summary-Card">
          <SummaryCard
            person={lea}
            date="Sa, 14.11. · 10:00–12:00"
            place="Zürich, Kreis 4"
            payment="TWINT · bis zur Freigabe gehalten"
            amount="CHF 120"
          />
          <SummaryCard
            person={{ name: 'Sandra K.', ratingAvg: 4.8, ratingCount: 12, isVerified: false }}
            date="Sa, 14.11. · 10:00–12:00"
            place="Zürich, Kreis 4"
            amount="CHF 115.20"
            amountLabel="Auszahlung"
          />
        </Section>
      </main>
    </>
  )
}
