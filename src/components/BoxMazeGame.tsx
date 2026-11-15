import { useRef, useState } from 'react'
import GameWin from './GameWin'
import {
  createMaze,
  move,
  type MazeCell,
  type MazeState,
} from '../maze'
import type { GameProps } from '../games'
import { playSound } from '../sound'

const WALL_NAMES = ['top', 'right', 'bottom', 'left']

/** "walls top and left" — the wall info for one cell's accessible name. */
function wallLabel(cell: MazeCell): string {
  const names = WALL_NAMES.filter((_, i) => cell.walls[i])
  if (names.length === 0) return ''
  if (names.length === 1) return `, wall ${names[0]}`
  const last = names[names.length - 1]
  return `, walls ${names.slice(0, -1).join(', ')} and ${last}`
}

function cellLabel(state: MazeState, index: number): string {
  const cell = state.cells[index]
  let label = `cell ${index + 1}`
  if (state.kitty === index) label += ', kitty here'
  if (state.fish === index) label += ', fish'
  label += wallLabel(cell)
  return label
}

export default function BoxMazeGame({
  kittyName,
  kittyColor,
  onWin,
  onBack,
}: GameProps) {
  const [game, setGame] = useState<MazeState>(() => createMaze())
  const winFired = useRef(false)

  function handleTap(index: number) {
    if (game.won) return
    const next = move(game, index)
    if (next === game) {
      // Blocked tap: no state change, but never silent — the soft
      // oops says the tap registered and the wall is in the way.
      playSound('oops')
      return
    }
    playSound('pop')
    setGame(next)

    if (next.won) {
      // Exactly once: guarded here, and move refuses further moves
      // once won is true.
      if (!winFired.current) {
        winFired.current = true
        onWin()
      }
    }
  }

  function handlePlayAgain() {
    winFired.current = false
    setGame(createMaze())
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
      <h1>Find the fish!</h1>
      <p>Tap a next-door square to move the kitty! 🐱→🐟</p>
      <div className="board five maze">
        {game.cells.map((cell, index) => (
          <button
            key={cell.id}
            type="button"
            className={`maze-cell${game.kitty === index ? ' kitty' : ''}${
              game.fish === index ? ' fish' : ''
            }${game.visited.includes(index) ? ' visited' : ''}`}
            onClick={() => handleTap(index)}
            aria-label={cellLabel(game, index)}
            style={{
              borderTop: cell.walls[0] ? '3px solid #4a3f55' : 'none',
              borderLeft: cell.walls[3] ? '3px solid #4a3f55' : 'none',
            }}
          >
            {game.kitty === index
              ? '🐱'
              : game.fish === index
                ? '🐟'
                : game.visited.includes(index) ? (
                    <span className="paw" aria-hidden>
                      🐾
                    </span>
                  ) : null}
          </button>
        ))}
      </div>
    </main>
  )
}
