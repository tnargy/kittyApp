import { useEffect, useRef, useState } from 'react'
import KittyFace from './KittyFace'
import {
  createPuzzle,
  flipBackMismatched,
  flipCard,
  type PuzzleState,
} from '../puzzle'
import type { KittyColor } from '../kitty'
import { playSound } from '../sound'

const FLIP_BACK_MS = 1500

const CONFETTI_COLORS = ['#ff9f43', '#ff6b9d', '#4ecdc4', '#ffd93d']

interface MatchingGameProps {
  kittyName: string
  kittyColor: KittyColor
  onWin: () => void
  onBack: () => void
}

export default function MatchingGame({
  kittyName,
  kittyColor,
  onWin,
  onBack,
}: MatchingGameProps) {
  const [puzzle, setPuzzle] = useState<PuzzleState>(() => createPuzzle())
  const [resolving, setResolving] = useState(false)
  const winFired = useRef(false)
  const flipBackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (flipBackTimer.current) clearTimeout(flipBackTimer.current)
    }
  }, [])

  function handleFlip(id: string) {
    if (resolving || puzzle.won) return
    const next = flipCard(puzzle, id)
    if (next === puzzle) return
    playSound('pop')
    setPuzzle(next)

    if (next.won) {
      // Exactly once: guarded here, and flipCard refuses further flips
      // once won is true.
      if (!winFired.current) {
        winFired.current = true
        onWin()
      }
      return
    }

    if (next.pairsFound > puzzle.pairsFound) {
      playSound('ding')
    }

    if (next.flipped.length === 2) {
      const [first, second] = next.flipped.map(
        (flippedId) => next.cards.find((c) => c.id === flippedId)!,
      )
      if (first.symbol !== second.symbol) {
        setResolving(true)
        flipBackTimer.current = setTimeout(() => {
          setPuzzle((current) => flipBackMismatched(current))
          setResolving(false)
        }, FLIP_BACK_MS)
      }
    }
  }

  function handlePlayAgain() {
    if (flipBackTimer.current) clearTimeout(flipBackTimer.current)
    setResolving(false)
    winFired.current = false
    setPuzzle(createPuzzle())
  }

  if (puzzle.won) {
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
      <h1>Find the pairs!</h1>
      <p>🐟 {puzzle.pairsFound} of 4 pairs</p>
      <div className="board">
        {puzzle.cards.map((card) => {
          const pending =
            !card.matched && puzzle.flipped.includes(card.id)
          return (
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              className={`card${card.faceUp ? ' flipped' : ''}${card.matched ? ' matched' : ''}${pending ? ' pending' : ''}`}
              onClick={() => handleFlip(card.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleFlip(card.id)
                }
              }}
              aria-label={
                card.matched || card.faceUp
                  ? `card, ${card.symbol}`
                  : 'card, face down'
              }
            >
              <span className="card-inner">
                <span className="card-face card-front" aria-hidden>
                  🐾
                </span>
                <span className="card-face card-back" aria-hidden>
                  {card.symbol}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </main>
  )
}
