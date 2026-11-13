import { figmaUrl, type ScreenDef } from '../screens/registry'
import { AppBar } from './AppBar'

/**
 * Placeholder for a screen that isn't built yet. Shows which Figma frames
 * the route covers and who owns it. Replace with the real screen.
 */
export function ScreenStub({ screen }: { screen: ScreenDef }) {
  return (
    <>
      <AppBar title={screen.title} back={!screen.tabRoot} />
      <main className="screen">
        <div className="card">
          <p className="text-label text-accent">Noch nicht gebaut · Owner {screen.owner}</p>
          <p className="text-caption text-secondary">
            Route <code>{screen.path}</code>
          </p>
          <p className="text-h3">Figma-Frames</p>
          {screen.frames.map((f) => (
            <a key={f.id} href={figmaUrl(f.id)} target="_blank" rel="noreferrer" className="text-body text-accent">
              {f.name} ↗
            </a>
          ))}
          {screen.note && <p className="text-caption text-secondary">{screen.note}</p>}
        </div>
      </main>
    </>
  )
}
