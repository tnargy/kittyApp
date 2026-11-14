import { useEffect, useRef, useState } from 'react'
import {
  createPuzzle,
  flipBackMismatched,
  flipCard,
  type PuzzleState,
} from '../puzzle'

const FLIP_BACK_MS = 1500

interface MatchingGameProps {
  kittyName: string
  onWin: () => void
  onBack: () => void
}

export default function MatchingGame({
  kittyName,
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
        <div className="kitty-face happy celebrating" aria-hidden>
          🐱
        </div>
        <h1>You did it!</h1>
        <p>
          {kittyName} is so proud!
        </p>
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
            <button
              key={card.id}
              type="button"
              className={`card${card.faceUp ? ' flipped' : ''}${card.matched ? ' matched' : ''}${pending ? ' pending' : ''}`}
              onClick={() => handleFlip(card.id)}
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
            </button>
          )
        })}
      </div>
    </main>
  )
}
