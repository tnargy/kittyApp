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
  }
}

export const db = new KittyDb()

export async function loadKitty(): Promise<KittyState | undefined> {
  return db.kitty.get('kitty')
}

export async function saveKitty(kitty: KittyState): Promise<void> {
  await db.kitty.put(kitty)
}

export async function logEvent(kind: string, note: string): Promise<void> {
  await db.events.add({ kind, at: Date.now(), note })
}
