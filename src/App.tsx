import { useEffect, useRef, useState } from 'react'
import KittyFace, { type KittyMood } from './components/KittyFace'
import { loadKitty, logEvent, saveKitty } from './db'
import {
  GAME_META,
  GAMES,
  gameFromParams,
  pickGame,
  type GameId,
} from './games'
import {
  applyAction,
  applyPuzzleWin,
  decayKitty,
  initialKitty,
  returnSurprise,
  type KittyAction,
  type KittyColor,
  type KittyState,
} from './kitty'
import { isSoundOn, playSound, setSoundOn, type SoundName } from './sound'
import './index.css'

const ACTION_SOUNDS: Record<KittyAction, SoundName> = {
  feed: 'munch',
  pet: 'mrrp',
  groom: 'mrrp',
  cleanLitter: 'sweep',
  bedtime: 'lullaby',
  wake: 'wake',
}

function moodFor(kitty: KittyState, anim: string): KittyMood {
  if (kitty.sleeping) return 'sleepy'
  if (anim === 'happy' || anim === 'purr') return 'happy'
  if (kitty.hunger < 40) return 'hungry'
  return 'idle'
}

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

function NeedBar({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'hunger' | 'affection' | 'litter' | 'energy'
}) {
  return (
    <div className={`need ${tone}`}>
      <span>{label}</span>
      <div className="bar">
        <div className="fill" style={{ width: `${value}%` }} />
      </div>
      <span>{Math.round(value)}</span>
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
  const [view, setView] = useState<'kitty' | 'play'>('kitty')
  const [game, setGame] = useState<GameId | null>(null)
  const [anim, setAnim] = useState<'idle' | 'happy' | 'purr'>('idle')
  const [soundOn, setSoundOnState] = useState(isSoundOn())
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([])
  const [snack, setSnack] = useState(false)
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const kittyRef = useRef<KittyState | null>(null)

  // Keep the ref current for the decay tick (assigned in an effect, not
  // during render, so the React Compiler can still optimize this file).
  useEffect(() => {
    kittyRef.current = kitty ?? null
  })

  useEffect(() => {
    return () => {
      if (animTimer.current) clearTimeout(animTimer.current)
    }
  }, [])

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
      const visited = decayKitty(
        {
          ...saved,
          lastVisitAt: now,
          color: saved.color ?? 'orange',
          lastDecayAt: saved.lastDecayAt ?? saved.lastVisitAt,
        },
        now,
      )
      await saveKitty(visited)
      setKitty(visited)
      // Test deep link (?game=matching / ?game=numbers / ?game=lightsout):
      // open that game directly instead of picking at random. Normal
      // play ignores it.
      const linked = gameFromParams(window.location.search)
      if (linked) {
        setGame(linked)
        setView('play')
      }
    })()
  }, [])

  // Gentle real-time decay while the app is open, every 30 seconds. The
  // load path above catches up on any time that passed while it was
  // closed, so the bars drain over real time either way.
  useEffect(() => {
    const timer = setInterval(() => {
      const current = kittyRef.current
      if (!current) return
      const next = decayKitty(current, Date.now())
      if (next === current) return
      setKitty(next)
      void saveKitty(next)
    }, 30_000)
    return () => clearInterval(timer)
  }, [])

  async function handleName(name: string) {
    const created = initialKitty(name)
    await saveKitty(created)
    await logEvent('named', `Named the kitty ${name}`)
    setKitty(created)
    setMessage(`${name} is so happy to meet you!`)
    // A fresh kitty named from a test deep link goes straight to the game.
    const linked = gameFromParams(window.location.search)
    if (linked) {
      setGame(linked)
      setView('play')
    }
  }

  async function handleAction(action: KittyAction) {
    if (!kitty) return
    const next = applyAction(kitty, action)
    await saveKitty(next)
    await logEvent(action, `${kitty.name} — ${ACTION_MESSAGES[action]}`)
    setKitty(next)
    setMessage(`${kitty.name} ${ACTION_MESSAGES[action]}`)
    playSound(ACTION_SOUNDS[action])
    if (action === 'feed') {
      setSnack(true)
      setTimeout(() => setSnack(false), 1000)
    }
    if (action === 'pet' || action === 'groom') {
      const burst = [0, 1, 2].map((i) => ({
        id: Date.now() + i,
        x: 20 + i * 25,
      }))
      setHearts(burst)
      setTimeout(() => setHearts([]), 1200)
    }
    // Brief reaction animation, then back to the idle bob.
    if (animTimer.current) clearTimeout(animTimer.current)
    setAnim(action === 'pet' ? 'purr' : 'happy')
    animTimer.current = setTimeout(() => setAnim('idle'), 1200)
  }

  async function handleColor(color: KittyColor) {
    if (!kitty) return
    const next = { ...kitty, color }
    await saveKitty(next)
    setKitty(next)
  }

  function handleSoundToggle() {
    const next = !soundOn
    setSoundOn(next)
    setSoundOnState(next)
    if (next) playSound('pop')
  }

  /** Shared win reward for all games: +10 affection, once per win. */
  async function handleGameWin(eventType: string, note: string) {
    if (!kitty) return
    const next = applyPuzzleWin(kitty)
    await saveKitty(next)
    await logEvent(eventType, note)
    setKitty(next)
    playSound('chime')
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
  if (view === 'play' && game) {
    const Game = GAMES[game]
    const meta = GAME_META[game]
    return (
      <Game
        kittyName={kitty.name}
        kittyColor={kitty.color}
        onWin={() =>
          void handleGameWin(meta.eventType, meta.solvedNote(kitty.name))
        }
        onBack={() => setView('kitty')}
      />
    )
  }

  return (
    <main className="kitty-view">
      <button
        type="button"
        className="sound-toggle"
        onClick={handleSoundToggle}
        aria-label={soundOn ? 'Mute sounds' : 'Unmute sounds'}
      >
        {soundOn ? '🔊' : '🔇'}
      </button>
      {surprise && (
        <p className="surprise">
          Welcome back! {kitty.name} missed you and {surprise}
        </p>
      )}
      <div className="face-wrap">
        <div
          className={`kitty-face ${kitty.sleeping ? 'sleeping' : anim}`}
          aria-hidden
        >
          <KittyFace color={kitty.color} mood={moodFor(kitty, anim)} />
        </div>
        {snack && (
          <span className="snack" aria-hidden>
            🐟
          </span>
        )}
        {hearts.map((heart) => (
          <span
            key={heart.id}
            className="heart"
            style={{ left: `${heart.x}%` }}
            aria-hidden
          >
            💕
          </span>
        ))}
      </div>
      <h1>{kitty.name}</h1>
      {message && <p className="message">{message}</p>}

      <div className="needs">
        <NeedBar label="🍽️ Full" value={kitty.hunger} tone="hunger" />
        <NeedBar label="💕 Loved" value={kitty.affection} tone="affection" />
        <NeedBar label="🧹 Litter" value={kitty.litter} tone="litter" />
        <NeedBar label="⚡ Energy" value={kitty.energy} tone="energy" />
      </div>

      <div
        className="colors"
        role="group"
        aria-label="Choose the kitty's color"
      >
        {(['orange', 'grey', 'midnight', 'calico'] as KittyColor[]).map(
          (color) => (
            <button
              key={color}
              type="button"
              className={`swatch ${color}${kitty.color === color ? ' selected' : ''}`}
              onClick={() => void handleColor(color)}
              aria-label={`${color} kitty`}
            />
          ),
        )}
      </div>

      <div className="actions">
        {kitty.sleeping ? (
          <button type="button" onClick={() => void handleAction('wake')}>
            {ACTION_LABELS.wake}
          </button>
        ) : (
          <>
            {(['feed', 'pet', 'groom', 'cleanLitter', 'bedtime'] as KittyAction[]).map(
              (action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => void handleAction(action)}
                >
                  {ACTION_LABELS[action]}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => {
                // Pick a fresh game at random every time Play is tapped.
                // Play again after a win replays the same game instead:
                // each game's own handlePlayAgain deals a fresh board.
                setGame(pickGame())
                setView('play')
              }}
            >
              🧩 Play
            </button>
          </>
        )}
      </div>
    </main>
  )
}
