// Pure kitty state logic for the v1 Tamagotchi.
// Rule (changed 2026-11-14, Grant's call): needs deplete over real time,
// whether the app is open or not. Coming back after a gap may still leave
// a little surprise, but the bars themselves now drain — there is no other
// penalty, and a bar at 0 is just empty, never a punishment.

export type KittyColor = 'orange' | 'grey' | 'midnight' | 'calico'

export interface KittyState {
  id: string
  name: string
  createdAt: number
  color: KittyColor
  /** 0..100, 100 = full */
  hunger: number
  /** 0..100, 100 = very loved */
  affection: number
  /** 0..100, 100 = spotless */
  litter: number
  /** 0..100, 100 = wide awake */
  energy: number
  sleeping: boolean
  lastVisitAt: number
  /** Last time decay was applied (load or tick). */
  lastDecayAt: number
}

export type KittyAction =
  | 'feed'
  | 'pet'
  | 'groom'
  | 'cleanLitter'
  | 'bedtime'
  | 'wake'

const clamp = (n: number) => Math.max(0, Math.min(100, n))

export function initialKitty(name: string, now = Date.now()): KittyState {
  return {
    id: 'kitty',
    name,
    createdAt: now,
    color: 'orange',
    hunger: 70,
    affection: 70,
    litter: 80,
    energy: 90,
    sleeping: false,
    lastVisitAt: now,
    lastDecayAt: now,
  }
}

/** Points lost per minute of real time. Roughly: hunger empty in ~12h,
 * affection in ~17h, litter in ~24h, energy in ~14h while awake. */
const DECAY_PER_MINUTE = {
  hunger: 0.14,
  affection: 0.1,
  litter: 0.07,
  energyAwake: 0.12,
  /** Energy recovered per minute while asleep. */
  energyAsleep: 0.5,
} as const

/**
 * Apply real-time decay for the minutes since lastDecayAt. Pure: callers
 * pass `now` and save the result. No-op when no time has passed. Bars
 * clamp at 0 — an empty bar is just empty, never a punishment.
 */
export function decayKitty(kitty: KittyState, now = Date.now()): KittyState {
  const minutes = (now - kitty.lastDecayAt) / 60_000
  if (minutes <= 0) return kitty
  const energyDelta = kitty.sleeping
    ? DECAY_PER_MINUTE.energyAsleep * minutes
    : -DECAY_PER_MINUTE.energyAwake * minutes
  return {
    ...kitty,
    hunger: clamp(kitty.hunger - DECAY_PER_MINUTE.hunger * minutes),
    affection: clamp(kitty.affection - DECAY_PER_MINUTE.affection * minutes),
    litter: clamp(kitty.litter - DECAY_PER_MINUTE.litter * minutes),
    energy: clamp(kitty.energy + energyDelta),
    lastDecayAt: now,
  }
}

export function applyAction(kitty: KittyState, action: KittyAction): KittyState {
  switch (action) {
    case 'feed':
      return { ...kitty, hunger: clamp(kitty.hunger + 30) }
    case 'pet':
      return { ...kitty, affection: clamp(kitty.affection + 25) }
    case 'groom':
      return { ...kitty, affection: clamp(kitty.affection + 15) }
    case 'cleanLitter':
      return { ...kitty, litter: 100 }
    case 'bedtime':
      return { ...kitty, sleeping: true }
    case 'wake':
      return { ...kitty, sleeping: false, energy: 100 }
  }
}

/** Win bonus, kept out of KittyAction on purpose: KittyAction is the set
 * of tap-able care buttons, and a puzzle win is a game outcome, not a
 * button. (Adding it to the union would break the exhaustive
 * Record<KittyAction, string> label/message maps in App.tsx.) */
export function applyPuzzleWin(kitty: KittyState): KittyState {
  return { ...kitty, affection: clamp(kitty.affection + 10) }
}

/** Surprises left behind when the player returns after a gap. Never a penalty. */
const RETURN_SURPRISES = [
  'left you a little drawing!',
  'found a shiny button and saved it for you!',
  'practised purring and wants to show you!',
  'saved you the sunny spot on the rug!',
]

/** A surprise message if the gap since the last visit was 6+ hours, else null. */
export function returnSurprise(lastVisitAt: number, now = Date.now()): string | null {
  const gapHours = (now - lastVisitAt) / 3_600_000
  if (gapHours < 6) return null
  const pick = Math.floor(gapHours / 6) % RETURN_SURPRISES.length
  return RETURN_SURPRISES[pick]
}
