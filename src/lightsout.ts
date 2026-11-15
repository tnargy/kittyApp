// Pure lights out logic for the Play game.
// A 5x5 grid of lights. Tapping a light toggles it and its orthogonal
// neighbors; the goal is to turn all 25 lights out. Every board is
// scrambled from the all-off state with legal moves, so it is always
// solvable — just undo the scramble. Positions never change mid-game;
// only Play again deals a fresh board.
// The board lives in React state only (never persisted); only the win
// bonus and the solved event are saved, via the existing paths.

import { neighborsOf as gridNeighborsOf } from './grid'

export interface Light {
  id: string
  on: boolean
}

export interface LightsOutState {
  lights: Light[]
  won: boolean
}

export const GRID_SIZE = 5
export const LIGHT_COUNT = GRID_SIZE * GRID_SIZE

/** Scramble uses 10–15 distinct toggles, and at least 8 lights on. */
export const SCRAMBLE_MIN = 10
export const SCRAMBLE_MAX = 15
export const MIN_LIT = 8

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/** Orthogonal neighbors on this game's 5x5 board. Shared grid math
 * lives in src/grid.ts; this is the lights-out-sized wrapper. */
export function neighborsOf(index: number): number[] {
  return gridNeighborsOf(index, GRID_SIZE)
}

/**
 * Apply a sequence of toggles to a board, one at a time. Each toggle
 * flips its light and its orthogonal neighbors; overlapping toggles
 * cancel (a light flipped twice is back where it started), so this
 * must fold the toggles in order, not union them into one set.
 */
function togglePositions(lights: Light[], positions: number[]): Light[] {
  let current = lights
  for (const position of positions) {
    const toFlip = new Set([position, ...neighborsOf(position)])
    current = current.map((light, index) =>
      toFlip.has(index) ? { ...light, on: !light.on } : light,
    )
  }
  return current
}

export function lightsOn(state: LightsOutState): number {
  return state.lights.filter((light) => light.on).length
}

export function checkWin(lights: Light[]): boolean {
  return lights.every((light) => !light.on)
}

function dealOnce(): { state: LightsOutState; scramble: number[] } {
  const order = shuffle(Array.from({ length: LIGHT_COUNT }, (_, i) => i))
  const count =
    SCRAMBLE_MIN +
    Math.floor(Math.random() * (SCRAMBLE_MAX - SCRAMBLE_MIN + 1))
  const scramble = order.slice(0, count)
  const lights = togglePositions(
    Array.from({ length: LIGHT_COUNT }, (_, index) => ({
      id: `light-${index}`,
      on: false,
    })),
    scramble,
  )
  return { state: { lights, won: false }, scramble }
}

/**
 * Deal a fresh board: all lights out, then 10–15 distinct toggles from a
 * Fisher-Yates shuffle of the 25 positions. Retries from scratch (up to
 * 20 attempts) until at least 8 lights are on, so the game never starts
 * nearly won. Returns the state plus the scramble positions, so a test
 * can verify solvability by replaying them. Always returns won: false.
 */
export function createLightsOut(): {
  state: LightsOutState
  scramble: number[]
} {
  let dealt = dealOnce()
  for (let attempt = 1; attempt < 20; attempt++) {
    if (lightsOn(dealt.state) >= MIN_LIT) return dealt
    dealt = dealOnce()
  }
  // Extremely unlikely fallback: accept the last deal as dealt.
  return dealt
}

/**
 * Toggle one light and its orthogonal neighbors. Guards (all no-ops):
 * the game is already won, or the id is unknown. Recomputes `won` on
 * the new board.
 */
export function toggleLight(
  state: LightsOutState,
  id: string,
): LightsOutState {
  if (state.won) return state
  const index = state.lights.findIndex((light) => light.id === id)
  if (index === -1) return state
  const lights = togglePositions(state.lights, [index])
  return { lights, won: checkWin(lights) }
}
