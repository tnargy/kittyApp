import { useEffect, useRef, useState } from 'react'
import ArrivalMoment from './components/ArrivalMoment'
import FamilyRow from './components/FamilyRow'
import GamesIndex from './components/GamesIndex'
import GrowthMoment from './components/GrowthMoment'
import KittyBody from './components/KittyBody'
import { type KittyMood } from './components/kittyArt'
import {
  listEventKinds,
  listFamily,
  loadActiveKitty,
  logEvent,
  saveKitty,
  welcomeNewKitten,
} from './db'
import {
  GAME_META,
  GAMES,
  gameFromParams,
  isGamesIndexPath,
  pickGame,
  type GameId,
} from './games'
import {
  GROWTH_COPY,
  applyAction,
  applyPuzzleWin,
  checkGrowth,
  decayKitty,
  growthHint,
  initialKitty,
  normalizeKitty,
  returnSurprise,
  type KittyAction,
  type KittyColor,
  type KittyStage,
  type KittyState,
} from './kitty'
import {
  isSoundOn,
  playSound,
  setSoundOn,
  stageMrrpPitch,
  type SoundName,
} from './sound'
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
  if (anim === 'happy' || anim === 'purr' || anim === 'hop') return 'happy'
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

/** A fresh color for a new kitten — never the elder's, so the
 * generations look distinct. */
const PALETTE_COLORS: KittyColor[] = ['orange', 'grey', 'midnight', 'calico']

function freshColor(except: KittyColor): KittyColor {
  const others = PALETTE_COLORS.filter((c) => c !== except)
  return others[Math.floor(Math.random() * others.length)]
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
  const [family, setFamily] = useState<KittyState[]>([])
  const [eventKinds, setEventKinds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [surprise, setSurprise] = useState<string | null>(null)
  const [view, setView] = useState<
    'kitty' | 'play' | 'games' | 'growth' | 'arrival'
  >('kitty')
  const [game, setGame] = useState<GameId | null>(null)
  const [anim, setAnim] = useState<'idle' | 'happy' | 'purr' | 'hop'>('idle')
  const [soundOn, setSoundOnState] = useState(isSoundOn())
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([])
  const [snack, setSnack] = useState(false)
  /** The stage a growth celebration is showing (or will show, once a
   * game win screen is dismissed). */
  const [growthStage, setGrowthStage] = useState<
    Exclude<KittyStage, 'kitten'> | null
  >(null)
  const [pendingGrowth, setPendingGrowth] = useState<
    Exclude<KittyStage, 'kitten'> | null
  >(null)
  /** "Not yet" on the arrival prompt — session only, never persisted. */
  const [arrivalDismissed, setArrivalDismissed] = useState(false)
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
      // Load order (pinned by the growth spec): family + events →
      // active kitty → decay → growth check (one stage,
      // persist-first) → arrival check → return surprise (suppressed
      // on a growth/arrival load) → ?game= / games-index (suppressed
      // while a growth celebration or arrival moment is pending).
      const family = await listFamily()
      setFamily(family)
      setEventKinds(await listEventKinds())
      const saved = await loadActiveKitty()
      if (!saved) {
        // No active kitty: first run, or the crash-recovery case (a
        // retired elder exists) — the render picks the Welcome variant.
        setKitty(null)
        return
      }
      const now = Date.now()
      const visited = decayKitty(
        {
          ...normalizeKitty(saved),
          lastVisitAt: now,
          color: saved.color ?? 'orange',
          lastDecayAt: saved.lastDecayAt ?? saved.lastVisitAt,
        },
        now,
      )
      await saveKitty(visited)
      const { kitty: grown, crossed } = checkGrowth(visited)
      if (crossed) {
        // Persist the new stage before celebrating, so a reload
        // mid-celebration never re-fires it.
        await saveKitty(grown)
        await logEvent('grew-up', GROWTH_COPY[crossed].eventNote(grown.name))
        setKitty(grown)
        setGrowthStage(crossed)
        setView('growth')
        return
      }
      setKitty(grown)
      if (grown.arrivalPending) {
        setView('arrival')
        return
      }
      const surprise = returnSurprise(saved.lastVisitAt, now)
      if (surprise) setSurprise(surprise)
      // Test deep link (?game=matching / ?game=numbers / ?game=lightsout /
      // ?game=yarnhunt / ?game=boxmaze): open that game directly instead
      // of picking at random. Normal play ignores it. The hidden games
      // index (/kittyApp/games) shows the list of test links instead;
      // a ?game= param on that path wins over the index.
      const linked = gameFromParams(window.location.search)
      if (linked) {
        setGame(linked)
        setView('play')
      } else if (isGamesIndexPath(window.location.pathname)) {
        setView('games')
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
    // A fresh kitty named from a test deep link goes straight to the game;
    // one named from the games index goes straight to the index.
    const linked = gameFromParams(window.location.search)
    if (linked) {
      setGame(linked)
      setView('play')
    } else if (isGamesIndexPath(window.location.pathname)) {
      setView('games')
    }
  }

  /** Name the new kitten after the arrival moment: retire the elder
   * and activate the kitten atomically, then show the kitty view. */
  async function handleArrivalName(elder: KittyState, name: string) {
    const created = { ...initialKitty(name), color: freshColor(elder.color) }
    await welcomeNewKitten(elder, created)
    await logEvent('kitten-arrived', 'A new kitten joined the family!')
    await logEvent('retired', `${elder.name} retired to the sunny spot.`)
    setFamily(await listFamily())
    setEventKinds(await listEventKinds())
    setKitty(created)
    setMessage(`${created.name} is so happy to meet you!`)
    setView('kitty')
  }

  /** "Say hello" on the arrival prompt: remember the choice (so a
   * closed tab re-opens the arrival moment) and show it. */
  async function handleSayHello() {
    if (!kitty) return
    const next = { ...kitty, arrivalPending: true }
    await saveKitty(next)
    setKitty(next)
    setView('arrival')
  }

  async function handleAction(action: KittyAction) {
    if (!kitty) return
    const next = applyAction(kitty, action)
    await saveKitty(next)
    await logEvent(action, `${kitty.name} — ${ACTION_MESSAGES[action]}`)
    setKitty(next)
    setMessage(`${kitty.name} ${ACTION_MESSAGES[action]}`)
    playSound(
      ACTION_SOUNDS[action],
      action === 'pet' || action === 'groom'
        ? { pitch: stageMrrpPitch(next.stage) }
        : undefined,
    )
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
    // Brief reaction animation, then back to the idle animation. The
    // kitten hops when fed; every other stage wiggles happily.
    if (animTimer.current) clearTimeout(animTimer.current)
    setAnim(
      action === 'pet'
        ? 'purr'
        : action === 'feed' && next.stage === 'kitten'
          ? 'hop'
          : 'happy',
    )
    animTimer.current = setTimeout(() => setAnim('idle'), 1200)
    // A care moment can cross a growth threshold: persist the new stage
    // first, then show the growth moment.
    const { kitty: grown, crossed } = checkGrowth(next)
    if (crossed) {
      await saveKitty(grown)
      await logEvent('grew-up', GROWTH_COPY[crossed].eventNote(grown.name))
      setKitty(grown)
      setGrowthStage(crossed)
      setView('growth')
    }
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
    // A win can cross a growth threshold, but the game's win screen is
    // showing — the growth moment waits until it is dismissed.
    const { kitty: grown, crossed } = checkGrowth(next)
    if (crossed) {
      await saveKitty(grown)
      await logEvent('grew-up', GROWTH_COPY[crossed].eventNote(grown.name))
      setKitty(grown)
      setPendingGrowth(crossed)
    }
  }

  function handleGameBack() {
    if (pendingGrowth) {
      setGrowthStage(pendingGrowth)
      setPendingGrowth(null)
      setView('growth')
    } else {
      setView('kitty')
    }
  }

  if (kitty === undefined) {
    return (
      <main className="loading">
        <p>Waking the kitty…</p>
      </main>
    )
  }
  if (kitty === null) {
    // No active kitty: first run, or the crash-recovery case — a retired
    // elder exists, so the arrival naming form shows instead of the
    // plain first-run Welcome.
    const retired = family.filter((k) => k.status === 'retired')
    if (retired.length > 0) {
      const elder = retired[retired.length - 1]
      return (
        <ArrivalMoment
          elder={elder}
          familyNames={family.map((k) => k.name)}
          onName={(name) => void handleArrivalName(elder, name)}
          startAtNaming
        />
      )
    }
    return <Welcome onName={(name) => void handleName(name)} />
  }
  if (view === 'games') {
    return <GamesIndex onBack={() => setView('kitty')} />
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
        onBack={handleGameBack}
      />
    )
  }
  if (view === 'growth' && growthStage) {
    return (
      <GrowthMoment
        kittyName={kitty.name}
        kittyColor={kitty.color}
        toStage={growthStage}
        onDone={() => setView('kitty')}
      />
    )
  }
  if (view === 'arrival') {
    return (
      <ArrivalMoment
        elder={kitty}
        familyNames={family.map((k) => k.name)}
        onName={(name) => void handleArrivalName(kitty, name)}
      />
    )
  }

  const hint = growthHint(kitty)
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
          className={`kitty-wrap stage-${kitty.stage} ${kitty.sleeping ? 'sleeping' : anim}`}
          aria-hidden
        >
          <KittyBody
            color={kitty.color}
            mood={moodFor(kitty, anim)}
            stage={kitty.stage}
            name={kitty.name}
          />
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
      {hint && <p className="growth-hint">{hint}</p>}
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

      {kitty.stage === 'wise' && !kitty.arrivalPending && !arrivalDismissed && (
        <div className="arrival-prompt">
          <p>🐱 A new kitten is ready to join the family!</p>
          <div className="actions">
            <button type="button" onClick={() => void handleSayHello()}>
              Say hello
            </button>
            <button type="button" onClick={() => setArrivalDismissed(true)}>
              Not yet
            </button>
          </div>
        </div>
      )}

      <FamilyRow family={family} eventKinds={eventKinds} />
    </main>
  )
}
