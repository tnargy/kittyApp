import { useRef, useState } from 'react'
import GameWin from './GameWin'
import {
  basketsChecked,
  bestHint,
  createYarnHunt,
  peek,
  warmthEmoji,
  type YarnHuntState,
} from '../yarnhunt'
import type { GameProps } from '../games'
import { playSound } from '../sound'

export default function YarnHuntGame({
  kittyName,
  kittyColor,
  onWin,
  onBack,
}: GameProps) {
  const [game, setGame] = useState<YarnHuntState>(() => createYarnHunt())
  const winFired = useRef(false)

  function handlePeek(id: string) {
    if (game.won) return
    const next = peek(game, id)
    if (next === game) return
    playSound('pop')
    setGame(next)

    if (next.won) {
      // Exactly once: guarded here, and peek refuses further peeks
      // once won is true.
      if (!winFired.current) {
        winFired.current = true
        onWin()
      }
    }
  }

  function handlePlayAgain() {
    winFired.current = false
    setGame(createYarnHunt())
  }

  if (game.won) {
    return (
      <GameWin
        kittyName={kittyName}
        kittyColor={kittyColor}
        prize="🧶"
        onPlayAgain={handlePlayAgain}
        onBack={onBack}
      />
    )
  }

  return (
    <main className="puzzle-view">
      <button type="button" className="back" onClick={onBack}>
        🐱 Back to kitty
      </button>
      <h1>Find the yarn ball!</h1>
      <p>{bestHint(game)}</p>
      <div className="board four">
        {game.baskets.map((basket, index) => (
          <button
            key={basket.id}
            type="button"
            className={`basket${basket.peeked ? ' peeked' : ''}`}
            onClick={() => handlePeek(basket.id)}
            aria-label={
              basket.peeked
                ? `basket ${index + 1}, checked`
                : `basket ${index + 1}`
            }
          >
            {basket.peeked ? warmthEmoji(game, basket.id) : '🧺'}
          </button>
        ))}
      </div>
      <p>🧺 {basketsChecked(game)} of 16 baskets checked</p>
    </main>
  )
}
