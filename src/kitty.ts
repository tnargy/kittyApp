// Pure kitty state logic for the v1 Tamagotchi.
// Rule from the plan: needs only change while the app is open. Nothing
// decays, drains, or gets worse while the app is closed, and missing a
// visit can never make things worse — coming back after a gap may instead
// leave a little surprise.

export interface KittyState {
  id: string
  name: string
  createdAt: number
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
    hunger: 70,
    affection: 70,
    litter: 80,
    energy: 90,
    sleeping: false,
    lastVisitAt: now,
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
