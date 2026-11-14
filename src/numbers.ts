// Pure number-game logic for the Play game.
// 9 tiles hide the numbers 1-9 in shuffled positions. Flip them in order
// 1, 2, 3, ... 9. A wrong flip leaves every face-up tile showing for the
// caller to flip back after the fixed delay — positions never change
// mid-game; only Play again deals a fresh board.
// The board lives in React state only (never persisted); only the win
// bonus and the solved event are saved, via the existing paths.

export interface NumberTile {
  id: string
  value: number
  faceUp: boolean
}

export interface NumberGameState {
  tiles: NumberTile[]
  /** The next number to find (1..9, or 10 once won). */
  next: number
  won: boolean
}

export const TILE_COUNT = 9

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function createNumberGame(): NumberGameState {
  const values = shuffle(Array.from({ length: TILE_COUNT }, (_, i) => i + 1))
  return {
    tiles: values.map((value, index) => ({
      id: `tile-${index}`,
      value,
      faceUp: false,
    })),
    next: 1,
    won: false,
  }
}

/**
 * Flip one tile. Guards (all no-ops): the game is already won, or the
 * tile is already face-up. A correct flip advances `next`; a wrong flip
 * leaves the tile showing and `next` unchanged, so the caller can flip
 * everything back after the fixed delay.
 */
export function flipTile(
  state: NumberGameState,
  id: string,
): NumberGameState {
  if (state.won) return state
  const tile = state.tiles.find((t) => t.id === id)
  if (!tile || tile.faceUp) return state

  const tiles = state.tiles.map((t) =>
    t.id === id ? { ...t, faceUp: true } : t,
  )
  if (tile.value !== state.next) {
    return { ...state, tiles }
  }
  const next = state.next + 1
  return { tiles, next, won: next > TILE_COUNT }
}

/** Flip every tile back face-down and restart the count at 1. Positions
 * stay exactly where they were. */
export function flipBackAll(state: NumberGameState): NumberGameState {
  return {
    tiles: state.tiles.map((t) => ({ ...t, faceUp: false })),
    next: 1,
    won: false,
  }
}
