// Pure kitty state logic for the v1 Tamagotchi.
// Rule (changed 2026-11-14, Grant's call): needs deplete over real time,
// whether the app is open or not. Coming back after a gap may still leave
// a little surprise, but the bars themselves now drain — there is no other
// penalty, and a bar at 0 is just empty, never a punishment.

export type KittyColor = 'orange' | 'grey' | 'midnight' | 'calico'

/** Fur colors for the drawn kitty (shared by the face and the body).
 * Lives here, not in a component file, so the Fast Refresh rule stays
 * happy. */
export const PALETTES: Record<
  KittyColor,
  { fur: string; innerEar: string; patch?: string }
> = {
  orange: { fur: '#f6a55c', innerEar: '#ffd9b0' },
  grey: { fur: '#a8adb5', innerEar: '#d4d8dd' },
  midnight: { fur: '#55555e', innerEar: '#8a8a95' },
  calico: { fur: '#f7ead7', innerEar: '#ffd9b0', patch: '#f6a55c' },
}

/** Life stage. Display names live in STAGE_NAMES — stage 2 is "Young
 * Cat", not "Cat", because the animal is a cat at every stage. */
export type KittyStage = 'kitten' | 'cat' | 'wise'

export const STAGE_NAMES: Record<KittyStage, string> = {
  kitten: 'Kitten',
  cat: 'Young Cat',
  wise: 'Wise Cat',
}

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
  /** Life stage (v2). */
  stage: KittyStage
  /** Distinct days of care so far (v2). Only ever goes up. */
  careDays: number
  /** Local calendar date (YYYY-MM-DD) care was last recorded (v2). */
  lastCareDay: string | null
  /** 'active' is the one live kitty; 'retired' kitties live in the
   * Family row and need no care (v2). */
  status: 'active' | 'retired'
  /** When she retired (v2). */
  retiredAt?: number
  /** The child tapped "Say hello" on the arrival prompt but has not
   * named the new kitten yet (v2). */
  arrivalPending?: boolean
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
    // A new kitty gets her own id: the elder's record must survive
    // retirement, so ids are never reused (v2 — the old 'kitty' id
    // would have overwritten her).
    id: `kitty-${now}`,
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
    stage: 'kitten',
    careDays: 0,
    lastCareDay: null,
    status: 'active',
  }
}

/** Load-path normalization for v1 saves, which lack the v2 fields.
 * Follows the codebase's pattern (color / lastDecayAt defaulted on
 * load in App.tsx) instead of a Dexie upgrade callback. */
export function normalizeKitty(saved: KittyState): KittyState {
  return {
    ...saved,
    stage: saved.stage ?? 'kitten',
    careDays: saved.careDays ?? 0,
    lastCareDay: saved.lastCareDay ?? null,
    status: saved.status ?? 'active',
  }
}

/** Care-days (v2): a kitty grows after a few separate days of care,
 * not after a pile of taps. One pet and twenty pets on the same day
 * are both one care-day, so care-days cannot be ground out. */

/** Local calendar date as YYYY-MM-DD (device-local; one shared device). */
export function dayString(now = Date.now()): string {
  const d = new Date(now)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/** Record a care moment: +1 care-day the first time care happens on
 * a new day, a no-op for further care on the same day. Pure. */
export function recordCareDay(kitty: KittyState, now = Date.now()): KittyState {
  const today = dayString(now)
  if (kitty.lastCareDay === today) return kitty
  return { ...kitty, careDays: kitty.careDays + 1, lastCareDay: today }
}

/** Care-days needed (total, not per stage) to reach each stage. */
export const STAGE_THRESHOLDS = {
  cat: 3,
  wise: 10,
} as const

/** The stage her care-days earn, regardless of her stored stage. */
export function stageFor(kitty: KittyState): KittyStage {
  if (kitty.careDays >= STAGE_THRESHOLDS.wise) return 'wise'
  if (kitty.careDays >= STAGE_THRESHOLDS.cat) return 'cat'
  return 'kitten'
}

function nextStage(stage: KittyStage): Exclude<KittyStage, 'kitten'> | null {
  return stage === 'kitten' ? 'cat' : stage === 'cat' ? 'wise' : null
}

/**
 * Compare the stored stage with the earned stage. Advances at most one
 * stage per check, so a kitty left alone for a week steps up one stage
 * at a time and each crossing fires its own celebration — a double-jump
 * never skips a stage. Callers persist the returned kitty *before*
 * showing the celebration, so a reload mid-celebration never re-fires
 * it (and React StrictMode double-running the load effect in dev never
 * double-logs it).
 */
export function checkGrowth(kitty: KittyState): {
  kitty: KittyState
  crossed: Exclude<KittyStage, 'kitten'> | null
} {
  const target = stageFor(kitty)
  if (target === kitty.stage) return { kitty, crossed: null }
  const crossed = nextStage(kitty.stage)
  if (!crossed) return { kitty, crossed: null }
  return { kitty: { ...kitty, stage: crossed }, crossed }
}

/** Gentle growth hint for the kitty view — words, never a number or a
 * meter (the games show no score, and neither does growing up). Null
 * once she is Wise; the arrival prompt takes the hint's place. */
export function growthHint(kitty: KittyState): string | null {
  if (kitty.stage === 'wise') return null
  if (kitty.stage === 'kitten') {
    if (kitty.careDays >= 2) return 'almost a Young Cat — one more day of cuddles!'
    return 'still a little kitten'
  }
  if (kitty.careDays >= 9) return 'almost a Wise Cat — one more day of cuddles!'
  return 'growing up — a few more days of cuddles!'
}

/** Per-stage growth celebration copy (heading line + button label). */
export const GROWTH_COPY: Record<
  Exclude<KittyStage, 'kitten'>,
  { line: string; button: string; eventNote: (name: string) => string }
> = {
  cat: {
    line: "Now she's a Young Cat!",
    button: 'Say hi to {name} the Young Cat!',
    eventNote: (name) => `${name} grew up into a Young Cat!`,
  },
  wise: {
    line: "Now she's a Wise Cat!",
    button: 'Say hi to {name} the Wise Cat!',
    eventNote: (name) => `${name} grew up into a Wise Cat!`,
  },
}

/** Counts from the event log used for a retired kitty's memory line.
 * The log carries no kitty id, so these count the whole log — correct
 * for a first generation (see the spec's known limit). */
export interface MemoryStats {
  /** Games won (any of the five game win kinds). */
  games: number
  /** Times fed. */
  fed: number
  /** Pets + grooms. */
  petted: number
}

/** A memory line for a retired kitty's portrait: her biggest number
 * from her life, in words. Ties keep the list order (games, then fed,
 * then petted). Falls back to the retirement line when the log is
 * empty. */
export function memoryLine(stats: MemoryStats, name: string): string {
  const plural = (n: number) => (n === 1 ? '' : 's')
  const candidates: [number, string][] = [
    [stats.games, `${name} won ${stats.games} game${plural(stats.games)}!`],
    [stats.fed, `${name} was fed ${stats.fed} time${plural(stats.fed)}!`],
    [stats.petted, `${name} got ${stats.petted} pet${plural(stats.petted)} and groom${plural(stats.petted)}!`],
  ]
  const best = candidates.reduce((a, b) => (b[0] > a[0] ? b : a))
  return best[0] > 0
    ? best[1]
    : `${name} is enjoying retirement in the sunny spot.`
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

/** Actions that count as care for care-days (v2). Waking her up is
 * not care — it is just waking. */
const CARE_ACTIONS: KittyAction[] = ['feed', 'pet', 'groom', 'cleanLitter', 'bedtime']

/**
 * Apply a care action. Care actions also record a care-day (at most
 * one per day — see recordCareDay), so every caller gets exactly one
 * recording and the growth check after the save can fire.
 */
export function applyAction(
  kitty: KittyState,
  action: KittyAction,
  now = Date.now(),
): KittyState {
  let next: KittyState
  switch (action) {
    case 'feed':
      next = { ...kitty, hunger: clamp(kitty.hunger + 30) }
      break
    case 'pet':
      next = { ...kitty, affection: clamp(kitty.affection + 25) }
      break
    case 'groom':
      next = { ...kitty, affection: clamp(kitty.affection + 15) }
      break
    case 'cleanLitter':
      next = { ...kitty, litter: 100 }
      break
    case 'bedtime':
      next = { ...kitty, sleeping: true }
      break
    case 'wake':
      next = { ...kitty, sleeping: false, energy: 100 }
      break
  }
  return CARE_ACTIONS.includes(action) ? recordCareDay(next, now) : next
}

/** Win bonus, kept out of KittyAction on purpose: KittyAction is the set
 * of tap-able care buttons, and a puzzle win is a game outcome, not a
 * button. (Adding it to the union would break the exhaustive
 * Record<KittyAction, string> label/message maps in App.tsx.) A win is
 * also care — it records a care-day, same as a care action. */
export function applyPuzzleWin(kitty: KittyState, now = Date.now()): KittyState {
  return recordCareDay(
    { ...kitty, affection: clamp(kitty.affection + 10) },
    now,
  )
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
