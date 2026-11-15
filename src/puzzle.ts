// Pure matching-puzzle logic for the Play game.
// The board lives in React state only (never persisted); only the win
// bonus and the puzzle-solved event are saved, via the existing paths.

export interface Card {
  id: string
  symbol: string
  matched: boolean
  faceUp: boolean
}

export interface PuzzleState {
  cards: Card[]
  /** Ids of the face-up, not-yet-matched cards (0, 1, or 2). */
  flipped: string[]
  pairsFound: number
  won: boolean
}

export const PAIR_SYMBOLS = ['🐟', '🍤', '🦀', '🐚', '🐙', '🐢'] as const

export const PAIR_COUNT = PAIR_SYMBOLS.length

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function createDeck(): Card[] {
  const symbols = shuffle(
    PAIR_SYMBOLS.flatMap((symbol) => [symbol, symbol]),
  )
  return symbols.map((symbol, index) => ({
    id: `card-${index}`,
    symbol,
    matched: false,
    faceUp: false,
  }))
}

export function createPuzzle(): PuzzleState {
  return { cards: createDeck(), flipped: [], pairsFound: 0, won: false }
}

export function checkWin(cards: Card[]): boolean {
  return cards.length > 0 && cards.every((card) => card.matched)
}

/**
 * Flip one card. Guards (all no-ops): the game is already won, the card
 * is matched or already face-up, or two unmatched cards are already
 * showing. A second flip that matches marks both cards matched; a
 * mismatch leaves both face-up for the caller to flip back after the
 * fixed delay.
 */
export function flipCard(state: PuzzleState, id: string): PuzzleState {
  if (state.won || state.flipped.length >= 2) return state
  const card = state.cards.find((c) => c.id === id)
  if (!card || card.matched || card.faceUp) return state

  const cards = state.cards.map((c) =>
    c.id === id ? { ...c, faceUp: true } : c,
  )
  const flipped = [...state.flipped, id]

  if (flipped.length < 2) {
    return { ...state, cards, flipped }
  }

  const [first, second] = flipped.map(
    (flippedId) => cards.find((c) => c.id === flippedId)!,
  )
  if (first.symbol !== second.symbol) {
    return { ...state, cards, flipped }
  }

  const matchedCards = cards.map((c) =>
    flipped.includes(c.id) ? { ...c, matched: true } : c,
  )
  const pairsFound = state.pairsFound + 1
  return {
    cards: matchedCards,
    flipped: [],
    pairsFound,
    won: checkWin(matchedCards),
  }
}

/** Flip the two showing unmatched cards back face-down after a mismatch. */
export function flipBackMismatched(state: PuzzleState): PuzzleState {
  return {
    ...state,
    cards: state.cards.map((c) =>
      state.flipped.includes(c.id) ? { ...c, faceUp: false } : c,
    ),
    flipped: [],
  }
}
