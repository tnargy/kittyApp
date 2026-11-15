import Dexie, { type Table } from 'dexie'
import type { KittyState } from './kitty'

export interface KittyEvent {
  id?: number
  kind: string
  at: number
  note: string
}

class KittyDb extends Dexie {
  kitty!: Table<KittyState, string>
  events!: Table<KittyEvent, number>

  constructor() {
    super('kittyDb')
    this.version(1).stores({
      kitty: 'id',
      events: '++id, at, kind',
    })
    // v2: `status` indexed so loadActiveKitty's where() query works.
    // No upgrade callback — new fields default on the load path
    // (normalizeKitty), the codebase's established pattern.
    this.version(2).stores({
      kitty: 'id, status',
      events: '++id, at, kind',
    })
  }
}

export const db = new KittyDb()

/** The one live kitty. (v1's loadKitty read the hardcoded 'kitty' id;
 * v2 kitties have per-kitten ids, so the active one is found by status.) */
export async function loadActiveKitty(): Promise<KittyState | undefined> {
  return db.kitty.where('status').equals('active').first()
}

/** Every kitty, active first, then retired oldest first. */
export async function listFamily(): Promise<KittyState[]> {
  const all = await db.kitty.toArray()
  return all.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1
    return (a.retiredAt ?? 0) - (b.retiredAt ?? 0)
  })
}

/** All event kinds, for the Family row's memory lines. */
export async function listEventKinds(): Promise<string[]> {
  const events = await db.events.toArray()
  return events.map((e) => e.kind)
}

export async function saveKitty(kitty: KittyState): Promise<void> {
  await db.kitty.put(kitty)
}

export async function logEvent(kind: string, note: string): Promise<void> {
  await db.events.add({ kind, at: Date.now(), note })
}

/**
 * Welcome a new kitten (v2): retire the elder and activate the new
 * kitten in one transaction, so the two can never be half done. If the
 * elder is already retired (a crash mid-arrival on an earlier version),
 * only the new kitten is written.
 */
export async function welcomeNewKitten(
  elder: KittyState,
  kitten: KittyState,
): Promise<void> {
  await db.transaction('rw', db.kitty, async () => {
    if (elder.status === 'active') {
      await db.kitty.put({
        ...elder,
        status: 'retired',
        retiredAt: elder.retiredAt ?? Date.now(),
        arrivalPending: false,
      })
    }
    await db.kitty.put(kitten)
  })
}
