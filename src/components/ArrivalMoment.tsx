import { useState } from 'react'
import KittyBody from './KittyBody'
import KittyFace from './KittyFace'
import type { KittyState } from '../kitty'

interface ArrivalMomentProps {
  /** The elder introducing the new kitten (still active until naming
   * completes; already retired only in the crash-recovery case). */
  elder: KittyState
  /** All family names, for the duplicate-name warning. */
  familyNames: string[]
  onName: (name: string) => void
  /** Skip the introduction and go straight to naming (the app closed
   * after the elder was already retired). */
  startAtNaming?: boolean
}

/**
 * The arrival moment (v2): the elder introduces the new kitten, then
 * the naming form — a Welcome variant with the elder's portrait and a
 * duplicate-name warning that never reads as a refusal.
 */
export default function ArrivalMoment({
  elder,
  familyNames,
  onName,
  startAtNaming = false,
}: ArrivalMomentProps) {
  const [phase, setPhase] = useState<'intro' | 'naming'>(
    startAtNaming ? 'naming' : 'intro',
  )
  const [name, setName] = useState('')
  const [warnDuplicate, setWarnDuplicate] = useState(false)
  const trimmed = name.trim()
  const isDuplicate =
    trimmed.length > 0 &&
    familyNames.some((n) => n.trim().toLowerCase() === trimmed.toLowerCase())

  if (phase === 'intro') {
    return (
      <main className="arrival">
        <div className={`kitty-wrap stage-${elder.stage}`} aria-hidden>
          <KittyBody
            color={elder.color}
            mood="happy"
            stage={elder.stage}
            name={elder.name}
          />
        </div>
        <h1>A new kitten has joined the family!</h1>
        <p>
          {elder.name} is so happy to introduce you to a new little kitten!
        </p>
        <div className="actions">
          <button type="button" onClick={() => setPhase('naming')}>
            Name the new kitten
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="welcome arrival-naming">
      <span className="kitty-face" aria-hidden>
        <KittyFace
          color={elder.color}
          mood="happy"
          muzzle={elder.stage === 'wise'}
        />
      </span>
      <h1>A new kitten has joined the family!</h1>
      <p>What will you call her?</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!trimmed) return
          if (isDuplicate && !warnDuplicate) {
            setWarnDuplicate(true)
            return
          }
          onName(trimmed)
        }}
      >
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setWarnDuplicate(false)
          }}
          placeholder="Kitty's name"
          maxLength={30}
          autoFocus
          aria-label="Kitty's name"
        />
        {warnDuplicate && (
          <p className="duplicate-warning" role="alert">
            There&rsquo;s already a {trimmed} in the family.
          </p>
        )}
        {warnDuplicate ? (
          <div className="actions">
            <button type="submit">Keep this name anyway</button>
            <button type="button" onClick={() => setWarnDuplicate(false)}>
              Pick another name
            </button>
          </div>
        ) : (
          <button type="submit" disabled={!trimmed}>
            Meet my kitty
          </button>
        )}
      </form>
    </main>
  )
}
