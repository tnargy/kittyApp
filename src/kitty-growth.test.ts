import { describe, expect, it } from 'vitest'
import {
  applyAction,
  applyPuzzleWin,
  checkGrowth,
  dayString,
  growthHint,
  initialKitty,
  memoryLine,
  normalizeKitty,
  recordCareDay,
  stageFor,
  type KittyState,
} from './kitty'

const DAY = 24 * 3_600_000

function kittyWith(overrides: Partial<KittyState>): KittyState {
  return { ...initialKitty('Milo'), ...overrides }
}

describe('recordCareDay', () => {
  it('counts the first care moment of a day', () => {
    const kitty = initialKitty('Milo')
    const after = recordCareDay(kitty)
    expect(after.careDays).toBe(1)
    expect(after.lastCareDay).toBe(dayString())
  })

  it('care twice on the same day counts once', () => {
    const kitty = initialKitty('Milo')
    const once = recordCareDay(kitty)
    const twice = recordCareDay(once)
    expect(twice.careDays).toBe(1)
    expect(twice).toBe(once)
  })

  it('care on the next day counts again', () => {
    const kitty = initialKitty('Milo')
    const day1 = recordCareDay(kitty, kitty.createdAt)
    const day2 = recordCareDay(day1, kitty.createdAt + DAY + 3_600_000)
    expect(day2.careDays).toBe(2)
  })
})

describe('stageFor', () => {
  it('Kitten at 0-2 care-days, Young Cat at 3, Wise Cat at 10', () => {
    expect(stageFor(kittyWith({ careDays: 0 }))).toBe('kitten')
    expect(stageFor(kittyWith({ careDays: 2 }))).toBe('kitten')
    expect(stageFor(kittyWith({ careDays: 3 }))).toBe('cat')
    expect(stageFor(kittyWith({ careDays: 9 }))).toBe('cat')
    expect(stageFor(kittyWith({ careDays: 10 }))).toBe('wise')
  })
})

describe('checkGrowth', () => {
  it('no crossing when the stored stage matches the earned stage', () => {
    const kitty = kittyWith({ careDays: 3, stage: 'cat' })
    const { kitty: same, crossed } = checkGrowth(kitty)
    expect(crossed).toBeNull()
    expect(same).toBe(kitty)
  })

  it('advances at most one stage per check — no double-jump', () => {
    const kitten = kittyWith({ careDays: 10, stage: 'kitten' })
    const first = checkGrowth(kitten)
    expect(first.crossed).toBe('cat')
    expect(first.kitty.stage).toBe('cat')
    const second = checkGrowth(first.kitty)
    expect(second.crossed).toBe('wise')
    expect(second.kitty.stage).toBe('wise')
  })
})

describe('growthHint', () => {
  it('tracks the next stage in words, never numbers', () => {
    expect(growthHint(kittyWith({ stage: 'kitten', careDays: 0 }))).toContain('little kitten')
    expect(growthHint(kittyWith({ stage: 'kitten', careDays: 2 }))).toContain('Young Cat')
    expect(growthHint(kittyWith({ stage: 'cat', careDays: 3 }))).toContain('growing up')
    expect(growthHint(kittyWith({ stage: 'cat', careDays: 9 }))).toContain('Wise Cat')
    expect(growthHint(kittyWith({ stage: 'wise', careDays: 10 }))).toBeNull()
  })
})

describe('care actions record care-days', () => {
  it('feed, pet, groom, clean litter and bedtime count as care', () => {
    for (const action of ['feed', 'pet', 'groom', 'cleanLitter', 'bedtime'] as const) {
      expect(applyAction(initialKitty('Milo'), action).careDays).toBe(1)
    }
  })

  it('waking her up is not care', () => {
    const asleep = kittyWith({ sleeping: true })
    expect(applyAction(asleep, 'wake').careDays).toBe(0)
  })

  it('a game win counts as care', () => {
    expect(applyPuzzleWin(initialKitty('Milo')).careDays).toBe(1)
  })
})

describe('normalizeKitty', () => {
  it('a v1 save defaults to a Kitten with 0 care-days, active', () => {
    const oldSave = initialKitty('Milo') as KittyState
    delete (oldSave as Partial<KittyState>).stage
    delete (oldSave as Partial<KittyState>).careDays
    delete (oldSave as Partial<KittyState>).lastCareDay
    delete (oldSave as Partial<KittyState>).status
    const kitty = normalizeKitty(oldSave)
    expect(kitty.stage).toBe('kitten')
    expect(kitty.careDays).toBe(0)
    expect(kitty.lastCareDay).toBeNull()
    expect(kitty.status).toBe('active')
    // Her real data survives the migration.
    expect(kitty.name).toBe('Milo')
    expect(kitty.color).toBe('orange')
  })
})

describe('memoryLine', () => {
  it('picks her biggest number from her life', () => {
    expect(memoryLine({ games: 12, fed: 40, petted: 25 }, 'Mittens')).toContain('fed 40 times')
    expect(memoryLine({ games: 12, fed: 3, petted: 2 }, 'Mittens')).toContain('won 12 games')
    expect(memoryLine({ games: 0, fed: 0, petted: 5 }, 'Mittens')).toContain('5 pets and grooms')
  })

  it('falls back to the retirement line when the log is empty', () => {
    expect(memoryLine({ games: 0, fed: 0, petted: 0 }, 'Mittens')).toContain('sunny spot')
  })
})
