import { describe, expect, it } from 'vitest'
import { applyAction, initialKitty, returnSurprise } from './kitty'

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
