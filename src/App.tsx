import { useEffect, useState } from 'react'
import { loadKitty, logEvent, saveKitty } from './db'
import {
  applyAction,
  initialKitty,
  returnSurprise,
  type KittyAction,
  type KittyState,
} from './kitty'
import './index.css'

const ACTION_LABELS: Record<KittyAction, string> = {
  feed: '🍽️ Feed',
  pet: '🖐️ Pet',
  groom: '🪮 Groom',
  cleanLitter: '🧹 Clean litter',
  bedtime: '🌙 Bedtime',
  wake: '☀️ Wake up',
}

const ACTION_MESSAGES: Record<KittyAction, string> = {
  feed: 'munches happily. Yum!',
  pet: 'leans in and purrs…',
  groom: 'looks very fancy now.',
  cleanLitter: 'has a fresh, cozy litter box.',
  bedtime: 'curls up and drifts off. Shhh…',
  wake: 'stretches and blinks awake!',
}

function NeedBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="need">
      <span>{label}</span>
      <div className="bar">
        <div className="fill" style={{ width: `${value}%` }} />
      </div>
      <span>{value}</span>
    </div>
  )
}

function Welcome({ onName }: { onName: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <main className="welcome">
      <div className="kitty-face" aria-hidden>
        🐱
      </div>
      <h1>Hello! I&rsquo;m your new kitty.</h1>
      <p>What would you like to call me?</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const trimmed = name.trim()
          if (trimmed) onName(trimmed)
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Kitty's name"
          maxLength={30}
          autoFocus
          aria-label="Kitty's name"
        />
        <button type="submit" disabled={!name.trim()}>
          Meet my kitty
        </button>
      </form>
    </main>
  )
}

export default function App() {
  const [kitty, setKitty] = useState<KittyState | null | undefined>(undefined)
  const [message, setMessage] = useState('')
  const [surprise, setSurprise] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const saved = await loadKitty()
      if (!saved) {
        setKitty(null)
        return
      }
      const now = Date.now()
      const surprise = returnSurprise(saved.lastVisitAt, now)
      if (surprise) setSurprise(surprise)
      const visited = { ...saved, lastVisitAt: now }
      await saveKitty(visited)
      setKitty(visited)
    })()
  }, [])

  async function handleName(name: string) {
    const created = initialKitty(name)
    await saveKitty(created)
    await logEvent('named', `Named the kitty ${name}`)
    setKitty(created)
    setMessage(`${name} is so happy to meet you!`)
  }

  async function handleAction(action: KittyAction) {
    if (!kitty) return
    const next = applyAction(kitty, action)
    await saveKitty(next)
    await logEvent(action, `${kitty.name} — ${ACTION_MESSAGES[action]}`)
    setKitty(next)
    setMessage(`${kitty.name} ${ACTION_MESSAGES[action]}`)
  }

  if (kitty === undefined) {
    return (
      <main className="loading">
        <p>Waking the kitty…</p>
      </main>
    )
  }
  if (kitty === null) {
    return <Welcome onName={(name) => void handleName(name)} />
  }

  return (
    <main className="kitty-view">
      {surprise && (
        <p className="surprise">
          Welcome back! {kitty.name} missed you and {surprise}
        </p>
      )}
      <div className="kitty-face" aria-hidden>
        {kitty.sleeping ? '😴' : '🐱'}
      </div>
      <h1>{kitty.name}</h1>
      {message && <p className="message">{message}</p>}

      <div className="needs">
        <NeedBar label="🍽️ Full" value={kitty.hunger} />
        <NeedBar label="💕 Loved" value={kitty.affection} />
        <NeedBar label="🧹 Litter" value={kitty.litter} />
        <NeedBar label="⚡ Energy" value={kitty.energy} />
      </div>

      <div className="actions">
        {kitty.sleeping ? (
          <button type="button" onClick={() => void handleAction('wake')}>
            {ACTION_LABELS.wake}
          </button>
        ) : (
          (['feed', 'pet', 'groom', 'cleanLitter', 'bedtime'] as KittyAction[]).map(
            (action) => (
              <button
                key={action}
                type="button"
                onClick={() => void handleAction(action)}
              >
                {ACTION_LABELS[action]}
              </button>
            ),
          )
        )}
      </div>

      <p className="next">Play time with puzzles is coming next.</p>
    </main>
  )
}
