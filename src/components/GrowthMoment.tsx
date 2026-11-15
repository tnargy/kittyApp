import {
  GROWTH_COPY,
  type KittyColor,
  type KittyStage,
} from '../kitty'
import KittyBody from './KittyBody'

const CONFETTI_COLORS = ['#ff9f43', '#ff6b9d', '#4ecdc4', '#ffd93d']

interface GrowthMomentProps {
  kittyName: string
  kittyColor: KittyColor
  /** The stage she just reached. The previous stage is implied — the
   * growth check advances at most one stage, so "then and now" needs
   * no extra prop. */
  toStage: Exclude<KittyStage, 'kitten'>
  onDone: () => void
}

/**
 * The growth celebration (v2): the new body beside the old one,
 * confetti, per-stage copy, and a single button. A separate small
 * component — the games' GameWin stays untouched.
 */
export default function GrowthMoment({
  kittyName,
  kittyColor,
  toStage,
  onDone,
}: GrowthMomentProps) {
  const fromStage: KittyStage = toStage === 'wise' ? 'cat' : 'kitten'
  const copy = GROWTH_COPY[toStage]
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
      <div className="growth-bodies" aria-hidden>
        <div className="growth-old">
          <KittyBody
            color={kittyColor}
            mood="idle"
            stage={fromStage}
            name={kittyName}
          />
        </div>
        <span className="growth-arrow">→</span>
        <div className={`kitty-wrap stage-${toStage}`}>
          <KittyBody
            color={kittyColor}
            mood="happy"
            stage={toStage}
            name={kittyName}
          />
        </div>
      </div>
      <h1>{kittyName} grew up!</h1>
      <p>{copy.line}</p>
      <div className="actions">
        <button type="button" onClick={onDone}>
          {copy.button.replace('{name}', kittyName)}
        </button>
      </div>
    </main>
  )
}
