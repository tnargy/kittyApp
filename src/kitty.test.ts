import { describe, expect, it } from 'vitest'
import {
  applyAction,
  applyPuzzleWin,
  decayKitty,
  initialKitty,
  returnSurprise,
} from './kitty'

describe('applyAction', () => {
  it('feeding fills hunger but never past 100', () => {
    const kitty = { ...initialKitty('Milo'), hunger: 90 }
    expect(applyAction(kitty, 'feed').hunger).toBe(100)
  })

  it('petting raises affection', () => {
    const kitty = { ...initialKitty('Milo'), affection: 50 }
    expect(applyAction(kitty, 'pet').affection).toBe(75)
  })

  it('cleaning the litter box makes it spotless', () => {
    const kitty = { ...initialKitty('Milo'), litter: 20 }
    expect(applyAction(kitty, 'cleanLitter').litter).toBe(100)
  })

  it('bedtime sleeps and waking restores energy', () => {
    const kitty = initialKitty('Milo')
    const asleep = applyAction(kitty, 'bedtime')
    expect(asleep.sleeping).toBe(true)
    const awake = applyAction({ ...asleep, energy: 40 }, 'wake')
    expect(awake.sleeping).toBe(false)
    expect(awake.energy).toBe(100)
  })

  it('a puzzle win adds affection, capped at 100', () => {
    expect(applyPuzzleWin({ ...initialKitty('Milo'), affection: 80 }).affection).toBe(90)
    expect(applyPuzzleWin({ ...initialKitty('Milo'), affection: 95 }).affection).toBe(100)
  })
})

describe('returnSurprise', () => {
  it('no surprise for a short gap', () => {
    expect(returnSurprise(Date.now() - 60_000)).toBeNull()
  })

  it('a surprise after a long gap, never a penalty', () => {
    const surprise = returnSurprise(Date.now() - 24 * 3_600_000)
    expect(surprise).toBeTruthy()
  })
})

describe('initialKitty', () => {
  it('starts orange', () => {
    expect(initialKitty('Milo').color).toBe('orange')
  })
})

describe('decayKitty', () => {
  const minute = 60_000

  it('does nothing when no time has passed', () => {
    const kitty = initialKitty('Milo')
    expect(decayKitty(kitty, kitty.lastDecayAt)).toBe(kitty)
  })

  it('drains the bars over hours while awake', () => {
    const kitty = initialKitty('Milo')
    const after6h = decayKitty(kitty, kitty.lastDecayAt + 6 * 60 * minute)
    expect(after6h.hunger).toBeCloseTo(70 - 0.14 * 360, 1)
    expect(after6h.affection).toBeCloseTo(70 - 0.1 * 360, 1)
    expect(after6h.litter).toBeCloseTo(80 - 0.07 * 360, 1)
    expect(after6h.energy).toBeCloseTo(90 - 0.12 * 360, 1)
    expect(after6h.lastDecayAt).toBe(kitty.lastDecayAt + 6 * 60 * minute)
  })

  it('clamps bars at 0', () => {
    const kitty = initialKitty('Milo')
    const after3Days = decayKitty(
      kitty,
      kitty.lastDecayAt + 3 * 24 * 60 * minute,
    )
    expect(after3Days.hunger).toBe(0)
    expect(after3Days.affection).toBe(0)
    expect(after3Days.litter).toBe(0)
    expect(after3Days.energy).toBe(0)
  })

  it('sleeping recovers energy instead of draining it', () => {
    const kitty = { ...initialKitty('Milo'), sleeping: true, energy: 40 }
    const after1h = decayKitty(kitty, kitty.lastDecayAt + 60 * minute)
    expect(after1h.energy).toBeCloseTo(70, 1)
    expect(after1h.hunger).toBeLessThan(kitty.hunger)
  })
})
