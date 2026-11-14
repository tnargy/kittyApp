import KittyFace from './KittyFace'
import type { KittyColor } from '../kitty'

const CONFETTI_COLORS = ['#ff9f43', '#ff6b9d', '#4ecdc4', '#ffd93d']

interface GameWinProps {
  kittyName: string
  kittyColor: KittyColor
  onPlayAgain: () => void
  onBack: () => void
}

/** The shared win screen for every Play game: confetti, the kitty
 * wiggling happily, and Play again / Back to kitty. */
export default function GameWin({
  kittyName,
  kittyColor,
  onPlayAgain,
  onBack,
}: GameWinProps) {
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
        <button type="button" onClick={onPlayAgain}>
          🔁 Play again
        </button>
        <button type="button" onClick={onBack}>
          🐱 Back to kitty
        </button>
      </div>
    </main>
  )
}
