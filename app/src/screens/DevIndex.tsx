import { Link } from 'react-router-dom'
import { AppBar } from '../components/AppBar'
import { supabase } from '../lib/supabase'
import { screens } from './registry'

// /dev – overview of all routes and their owners, handy while building.
export function DevIndex() {
  return (
    <>
      <AppBar title="Screens" back />
      <main className="screen">
        <Link to="/dev/components" className="card text-body-strong text-accent">
          Gemeinsame Komponenten ansehen →
        </Link>
        {(['A', 'B', 'C'] as const).map((owner) => (
          <section key={owner} className="card">
            <h2 className="text-h3">Owner {owner}</h2>
            {screens
              .filter((s) => s.owner === owner)
              .map((s) => (
                <Link key={s.path} to={s.path.replace(/:\w+/g, 'demo')} className="text-body text-accent">
                  {s.title} <span className="text-caption text-tertiary">{s.path}</span>
                </Link>
              ))}
          </section>
        ))}
        <button className="text-label text-accent" style={{ background: 'none', border: 0 }} onClick={() => supabase.auth.signOut()}>
          Abmelden
        </button>
      </main>
    </>
  )
}
