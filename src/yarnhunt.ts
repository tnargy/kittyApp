// Pure yarn-ball hunt logic for the Play game.
// A 4x4 grid of baskets; one hides the yarn ball. Tapping a basket
// peeks inside it; peeked baskets stay revealed and positions never
// change. The hint line is best-so-far: it shows the band of the
// closest peeked basket to the hidden ball, so it never gets colder,
// and each peeked basket carries its own warmth marker, so the board
// itself keeps the search history. No last-peeked tracking is needed
// — the hint line is derivable from the peeked set alone.
// The board lives in React state only (never persisted); only the win
// bonus and the found event are saved, via the existing paths.

import { manhattanDistance } from './grid'

export interface Basket {
  id: string
  peeked: boolean
}

export interface YarnHuntState {
  baskets: Basket[]
  hiddenId: string
  won: boolean
}

export const GRID_SIZE = 4
export const BASKET_COUNT = GRID_SIZE * GRID_SIZE

export function createYarnHunt(): YarnHuntState {
  const hiddenIndex = Math.floor(Math.random() * BASKET_COUNT)
  return {
    baskets: Array.from({ length: BASKET_COUNT }, (_, index) => ({
      id: `basket-${index}`,
      peeked: false,
    })),
    hiddenId: `basket-${hiddenIndex}`,
    won: false,
  }
}

function basketIndex(state: YarnHuntState, id: string): number {
  return state.baskets.findIndex((basket) => basket.id === id)
}

function hiddenIndex(state: YarnHuntState): number {
  return basketIndex(state, state.hiddenId)
}

function distanceToHidden(state: YarnHuntState, index: number): number {
  return manhattanDistance(index, hiddenIndex(state), GRID_SIZE)
}

/** The hint text for a peeked basket, from its Manhattan distance to
 * the hidden ball. Only called for a peeked, non-hidden basket
 * (distance ≥ 1); distance 0 never reaches it. Bands: 1 → "So
 * close!", 2–3 → "Getting warm!", 4+ → "Brrr, cold!". */
export function hintFor(state: YarnHuntState, id: string): string {
  const index = basketIndex(state, id)
  if (index === -1) return 'Where is the yarn ball? 👀'
  const distance = distanceToHidden(state, index)
  if (distance <= 1) return 'So close! 🔥'
  if (distance <= 3) return 'Getting warm! 🌡️'
  return 'Brrr, cold! ❄️'
}

/** The warmth marker for a peeked empty basket: the emoji from its
 * hint band. Same contract as hintFor. */
export function warmthEmoji(state: YarnHuntState, id: string): string {
  const index = basketIndex(state, id)
  if (index === -1) return ''
  const distance = distanceToHidden(state, index)
  if (distance <= 1) return '🔥'
  if (distance <= 3) return '🌡️'
  return '❄️'
}

/** The hint line: the hint text of the closest peeked basket to the
 * hidden ball (minimum Manhattan distance over the peeked set).
 * "Where is the yarn ball? 👀" before any peek. Because it is the
 * minimum over all peeked baskets, it never gets colder. */
export function bestHint(state: YarnHuntState): string {
  const peeked = state.baskets.filter((basket) => basket.peeked)
  if (peeked.length === 0) return 'Where is the yarn ball? 👀'
  let best = peeked[0]
  let bestDistance = distanceToHidden(state, basketIndex(state, best.id))
  for (const basket of peeked.slice(1)) {
    const distance = distanceToHidden(state, basketIndex(state, basket.id))
    if (distance < bestDistance) {
      best = basket
      bestDistance = distance
    }
  }
  return hintFor(state, best.id)
}

export function basketsChecked(state: YarnHuntState): number {
  return state.baskets.filter((basket) => basket.peeked).length
}

/**
 * Peek inside one basket. Guards (all no-ops): the game is already
 * won, the basket is already peeked, or the id is unknown. Sets
 * `won` when the peeked basket is the hidden one.
 */
export function peek(state: YarnHuntState, id: string): YarnHuntState {
  if (state.won) return state
  const index = basketIndex(state, id)
  if (index === -1 || state.baskets[index].peeked) return state
  const baskets = state.baskets.map((basket, i) =>
    i === index ? { ...basket, peeked: true } : basket,
  )
  return { ...state, baskets, won: id === state.hiddenId }
}
