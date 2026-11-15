import { describe, expect, it } from 'vitest'
import {
  BASKET_COUNT,
  basketsChecked,
  bestHint,
  createYarnHunt,
  hintFor,
  peek,
  warmthEmoji,
  type YarnHuntState,
} from './yarnhunt'

function stateWithHidden(hidden: number): YarnHuntState {
  return {
    baskets: Array.from({ length: BASKET_COUNT }, (_, index) => ({
      id: `basket-${index}`,
      peeked: false,
    })),
    hiddenId: `basket-${hidden}`,
    won: false,
  }
}

describe('createYarnHunt', () => {
  it('deals 9 unpeeked baskets, never already won', () => {
    for (let i = 0; i < 50; i++) {
      const state = createYarnHunt()
      expect(state.baskets).toHaveLength(BASKET_COUNT)
      expect(state.baskets.every((basket) => !basket.peeked)).toBe(true)
      expect(state.won).toBe(false)
    }
  })

  it('hidden spot varies and stays in range', () => {
    // A smoke test on the distribution: every spot appears at least
    // 3 times in 300 deals (expected ~19 each).
    const seen = new Map<string, number>()
    for (let i = 0; i < 300; i++) {
      const { hiddenId } = createYarnHunt()
      expect(hiddenId).toMatch(/^basket-([0-9]|1[0-5])$/)
      seen.set(hiddenId, (seen.get(hiddenId) ?? 0) + 1)
    }
    for (let index = 0; index < BASKET_COUNT; index++) {
      expect(seen.get(`basket-${index}`) ?? 0).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('peek', () => {
  it('reveals the basket and never moves positions', () => {
    const state = stateWithHidden(4)
    const next = peek(state, 'basket-0')
    expect(next.baskets[0].peeked).toBe(true)
    expect(next.baskets.map((basket) => basket.id)).toEqual(
      state.baskets.map((basket) => basket.id),
    )
    expect(next.hiddenId).toBe(state.hiddenId)
    expect(next.won).toBe(false)
  })

  it('is a no-op on an already-peeked basket', () => {
    const state = peek(stateWithHidden(4), 'basket-0')
    expect(peek(state, 'basket-0')).toBe(state)
  })

  it('is a no-op once won, and for an unknown id', () => {
    const won = peek(stateWithHidden(4), 'basket-4')
    expect(won.won).toBe(true)
    expect(peek(won, 'basket-0')).toBe(won)
    const fresh = stateWithHidden(4)
    expect(peek(fresh, 'basket-99')).toBe(fresh)
  })

  it('wins when the hidden basket is peeked', () => {
    const next = peek(stateWithHidden(4), 'basket-4')
    expect(next.won).toBe(true)
  })
})

describe('hintFor / warmthEmoji', () => {
  // Hidden at 5 (row 1, col 1): distance 1 is the cross, 2–3 the
  // middle ring, 4+ the far corner.
  it('distance 1 is "So close!" with a fire marker', () => {
    const state = peek(stateWithHidden(5), 'basket-1')
    expect(hintFor(state, 'basket-1')).toBe('So close! 🔥')
    expect(warmthEmoji(state, 'basket-1')).toBe('🔥')
  })

  it('distance 2 is "Getting warm!" with a thermometer marker', () => {
    const state = peek(stateWithHidden(5), 'basket-0')
    expect(hintFor(state, 'basket-0')).toBe('Getting warm! 🌡️')
    expect(warmthEmoji(state, 'basket-0')).toBe('🌡️')
  })

  it('distance 3 is still "Getting warm!"', () => {
    const state = peek(stateWithHidden(5), 'basket-3')
    expect(hintFor(state, 'basket-3')).toBe('Getting warm! 🌡️')
    expect(warmthEmoji(state, 'basket-3')).toBe('🌡️')
  })

  it('distance 4+ is "Brrr, cold!" with a snowflake marker', () => {
    const state = peek(stateWithHidden(5), 'basket-15')
    expect(hintFor(state, 'basket-15')).toBe('Brrr, cold! ❄️')
    expect(warmthEmoji(state, 'basket-15')).toBe('❄️')
  })
})

describe('bestHint', () => {
  it('is the opening line before any peek', () => {
    expect(bestHint(stateWithHidden(5))).toBe('Where is the yarn ball? 👀')
  })

  it('is the closest peeked basket\'s hint', () => {
    // Hidden at 15: basket 0 (distance 6, cold), then basket 14
    // (distance 1, hot) — the line follows the closest peek.
    let state = peek(stateWithHidden(15), 'basket-0')
    expect(bestHint(state)).toBe('Brrr, cold! ❄️')
    state = peek(state, 'basket-14')
    expect(bestHint(state)).toBe('So close! 🔥')
  })

  it('never gets colder', () => {
    // Hidden at 15: peek the hot basket first, then a cold one.
    let state = peek(stateWithHidden(15), 'basket-14')
    expect(bestHint(state)).toBe('So close! 🔥')
    state = peek(state, 'basket-0')
    expect(bestHint(state)).toBe('So close! 🔥')
  })
})

describe('basketsChecked', () => {
  it('counts peeked baskets', () => {
    let state = stateWithHidden(5)
    expect(basketsChecked(state)).toBe(0)
    state = peek(state, 'basket-0')
    state = peek(state, 'basket-2')
    expect(basketsChecked(state)).toBe(2)
  })
})
