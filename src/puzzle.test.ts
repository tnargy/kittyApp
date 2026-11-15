import { describe, expect, it } from 'vitest'
import {
  checkWin,
  createDeck,
  createPuzzle,
  flipBackMismatched,
  flipCard,
  PAIR_COUNT,
} from './puzzle'

function findPair(state: ReturnType<typeof createPuzzle>) {
  const first = state.cards.find((c) => !c.matched)!
  const second = state.cards.find(
    (c) => !c.matched && c.symbol === first.symbol && c.id !== first.id,
  )!
  return [first, second] as const
}

function findMismatch(state: ReturnType<typeof createPuzzle>) {
  const first = state.cards.find((c) => !c.matched)!
  const second = state.cards.find(
    (c) => !c.matched && c.symbol !== first.symbol,
  )!
  return [first, second] as const
}

describe('createDeck', () => {
  it('has 12 cards: 6 pairs, each symbol exactly twice, unique ids', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(PAIR_COUNT * 2)
    expect(new Set(deck.map((c) => c.id)).size).toBe(deck.length)
    for (const symbol of ['🐟', '🍤', '🦀', '🐚', '🐙', '🐢']) {
      expect(deck.filter((c) => c.symbol === symbol)).toHaveLength(2)
    }
    expect(deck.every((c) => !c.matched && !c.faceUp)).toBe(true)
  })
})

describe('flipCard', () => {
  it('flipping one card turns it face-up', () => {
    const state = createPuzzle()
    const next = flipCard(state, state.cards[0].id)
    expect(next.cards[0].faceUp).toBe(true)
    expect(next.flipped).toEqual([state.cards[0].id])
  })

  it('flipping the same card twice is a no-op', () => {
    const state = createPuzzle()
    const once = flipCard(state, state.cards[0].id)
    expect(flipCard(once, state.cards[0].id)).toBe(once)
  })

  it('matching a pair marks both matched and counts it', () => {
    const state = createPuzzle()
    const [first, second] = findPair(state)
    const next = flipCard(flipCard(state, first.id), second.id)
    expect(next.pairsFound).toBe(1)
    expect(next.flipped).toEqual([])
    expect(next.cards.find((c) => c.id === first.id)?.matched).toBe(true)
    expect(next.cards.find((c) => c.id === second.id)?.matched).toBe(true)
  })

  it('a mismatch leaves both cards showing for the flip-back', () => {
    const state = createPuzzle()
    const [first, second] = findMismatch(state)
    const next = flipCard(flipCard(state, first.id), second.id)
    expect(next.pairsFound).toBe(0)
    expect(next.flipped).toEqual([first.id, second.id])
    expect(next.cards.find((c) => c.id === first.id)?.faceUp).toBe(true)
    expect(next.cards.find((c) => c.id === second.id)?.faceUp).toBe(true)
  })

  it('a third flip while two cards show is a no-op', () => {
    const state = createPuzzle()
    const [first, second] = findMismatch(state)
    const showing = flipCard(flipCard(state, first.id), second.id)
    const third = state.cards.find(
      (c) => !showing.flipped.includes(c.id),
    )!
    expect(flipCard(showing, third.id)).toBe(showing)
  })

  it('re-tapping a pending face-up card is a no-op', () => {
    const state = createPuzzle()
    const once = flipCard(state, state.cards[0].id)
    expect(flipCard(once, state.cards[0].id)).toBe(once)
  })

  it('flipping an already-matched card is a no-op', () => {
    const state = createPuzzle()
    const [first, second] = findPair(state)
    const matched = flipCard(flipCard(state, first.id), second.id)
    expect(flipCard(matched, first.id)).toBe(matched)
  })

  it('flipBackMismatched turns the showing cards back down', () => {
    const state = createPuzzle()
    const [first, second] = findMismatch(state)
    const showing = flipCard(flipCard(state, first.id), second.id)
    const back = flipBackMismatched(showing)
    expect(back.flipped).toEqual([])
    expect(back.cards.find((c) => c.id === first.id)?.faceUp).toBe(false)
    expect(back.cards.find((c) => c.id === second.id)?.faceUp).toBe(false)
  })

  it('matching all pairs wins, and further flips are no-ops', () => {
    let state = createPuzzle()
    while (!state.won) {
      const [first, second] = findPair(state)
      state = flipCard(flipCard(state, first.id), second.id)
    }
    expect(state.pairsFound).toBe(PAIR_COUNT)
    expect(checkWin(state.cards)).toBe(true)
    expect(flipCard(state, state.cards[0].id)).toBe(state)
  })
})

describe('checkWin', () => {
  it('is false until every card is matched', () => {
    const deck = createDeck()
    expect(checkWin(deck)).toBe(false)
    expect(
      checkWin(deck.map((c) => ({ ...c, matched: true }))),
    ).toBe(true)
  })
})
