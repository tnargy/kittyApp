import { useRef, useState } from 'react'
import GameWin from './GameWin'
import {
  createLightsOut,
  lightsOn,
  toggleLight,
  type LightsOutState,
} from '../lightsout'
import type { GameProps } from '../games'
import { playSound } from '../sound'

export default function LightsOutGame({
  kittyName,
  kittyColor,
  onWin,
  onBack,
}: GameProps) {
  const [game, setGame] = useState<LightsOutState>(
    () => createLightsOut().state,
  )
  const winFired = useRef(false)

  function handleToggle(id: string) {
    if (game.won) return
    const next = toggleLight(game, id)
    if (next === game) return
    playSound('pop')
    setGame(next)

    if (next.won) {
      // Exactly once: guarded here, and toggleLight refuses further
      // toggles once won is true.
      if (!winFired.current) {
        winFired.current = true
        onWin()
      }
    }
  }

  function handlePlayAgain() {
    winFired.current = false
    setGame(createLightsOut().state)
  }

  if (game.won) {
    return (
      <GameWin
        kittyName={kittyName}
        kittyColor={kittyColor}
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
      <h1>Turn out the lights!</h1>
      <p>💡 {lightsOn(game)} lights left</p>
      <div className="board lights">
        {game.lights.map((light, index) => (
          <button
            key={light.id}
            type="button"
            className={`light${light.on ? ' on' : ''}`}
            onClick={() => handleToggle(light.id)}
            aria-label={`light ${index + 1}, ${light.on ? 'on' : 'off'}`}
          >
            {light.on ? '💡' : null}
          </button>
        ))}
      </div>
    </main>
  )
}
