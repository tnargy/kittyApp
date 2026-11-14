import { useEffect, useRef, useState } from 'react'
import KittyFace from './KittyFace'
import {
  createNumberGame,
  flipBackAll,
  flipTile,
  type NumberGameState,
} from '../numbers'
import type { KittyColor } from '../kitty'
import { playSound } from '../sound'

const FLIP_BACK_MS = 1500

const CONFETTI_COLORS = ['#ff9f43', '#ff6b9d', '#4ecdc4', '#ffd93d']

interface NumberGameProps {
  kittyName: string
  kittyColor: KittyColor
  onWin: () => void
  onBack: () => void
}

export default function NumberGame({
  kittyName,
  kittyColor,
  onWin,
  onBack,
}: NumberGameProps) {
  const [game, setGame] = useState<NumberGameState>(() => createNumberGame())
  const [resolving, setResolving] = useState(false)
  const winFired = useRef(false)
  const flipBackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (flipBackTimer.current) clearTimeout(flipBackTimer.current)
    }
  }, [])

  function handleFlip(id: string) {
    if (resolving || game.won) return
    const next = flipTile(game, id)
    if (next === game) return
    playSound('pop')
    setGame(next)

    if (next.won) {
      // Exactly once: guarded here, and flipTile refuses further flips
      // once won is true.
      if (!winFired.current) {
        winFired.current = true
        onWin()
      }
      return
    }

    if (next.next === game.next) {
      // Wrong number: everything showing flips back after the delay.
      // Positions never change.
      playSound('oops')
      setResolving(true)
      flipBackTimer.current = setTimeout(() => {
        setGame((current) => flipBackAll(current))
        setResolving(false)
      }, FLIP_BACK_MS)
    } else {
      playSound('ding')
    }
  }

  function handlePlayAgain() {
    if (flipBackTimer.current) clearTimeout(flipBackTimer.current)
    setResolving(false)
    winFired.current = false
    setGame(createNumberGame())
  }

  if (game.won) {
    return (
      <main className="puzzle-view">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="confetti"
            style={{
              left: `${(i * 8 + 4) % 100}%`,
              animationDelay: `${(i % 6) * 0.2}s`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            }}
            aria-hidden
          />
        ))}
        <div className="kitty-face happy celebrating" aria-hidden>
          <KittyFace color={kittyColor} mood="happy" />
        </div>
        <h1>You did it!</h1>
        <p>{kittyName} is so proud!</p>
        <div className="actions">
          <button type="button" onClick={handlePlayAgain}>
            🔁 Play again
          </button>
          <button type="button" onClick={onBack}>
            🐱 Back to kitty
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="puzzle-view">
      <button type="button" className="back" onClick={onBack}>
        🐱 Back to kitty
      </button>
      <h1>Find the numbers!</h1>
      <p>
        🔢 {game.next - 1} of 9 found — find {game.next} next
      </p>
      <div className="board numbers">
        {game.tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            className={`card${tile.faceUp ? ' flipped' : ''}`}
            onClick={() => handleFlip(tile.id)}
            aria-label={
              tile.faceUp ? `tile, ${tile.value}` : 'tile, face down'
            }
          >
            <span className="card-inner">
              <span className="card-face card-front" aria-hidden>
                🐾
              </span>
              <span className="card-face card-back" aria-hidden>
                {tile.value}
              </span>
            </span>
          </button>
        ))}
      </div>
    </main>
  )
}
