import { useState } from 'react'
import KittyFace from './KittyFace'
import { GAME_META } from '../games'
import {
  memoryLine,
  type KittyState,
  type MemoryStats,
} from '../kitty'

/** Counts from the whole event log (the log carries no kitty id — see
 * the spec's known limit; correct for a first generation). */
function statsFromKinds(kinds: string[]): MemoryStats {
  const winKinds = new Set(Object.values(GAME_META).map((m) => m.eventType))
  return {
    games: kinds.filter((k) => winKinds.has(k)).length,
    fed: kinds.filter((k) => k === 'feed').length,
    petted: kinds.filter((k) => k === 'pet' || k === 'groom').length,
  }
}

/**
 * The Family row (v2): small portraits of every retired kitty, each in
 * her own saved color, with her name. Tapping a portrait shows a memory
 * line from her life; untapped, she gets the retirement line. Retired
 * kitties need no care and never nudge — this is a memory book, not
 * multiple live pets.
 */
export default function FamilyRow({
  family,
  eventKinds,
}: {
  family: KittyState[]
  eventKinds: string[]
}) {
  const retired = family.filter((k) => k.status === 'retired')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  if (retired.length === 0) return null
  const stats = statsFromKinds(eventKinds)
  return (
    <section className="family-row" aria-label="Family">
      <h2>Family</h2>
      <div className="family-members">
        {retired.map((elder) => {
          const selected = selectedId === elder.id
          return (
            <div key={elder.id} className="family-member">
              <button
                type="button"
                className="family-portrait"
                onClick={() => setSelectedId(selected ? null : elder.id)}
                aria-label={`${elder.name}, retired kitty — tap for a memory`}
              >
                <span className="kitty-face" aria-hidden>
                  <KittyFace
                    color={elder.color}
                    mood="idle"
                    muzzle={elder.stage === 'wise'}
                  />
                </span>
                <span className="family-name">{elder.name}</span>
              </button>
              <p className="family-line">
                {selected
                  ? memoryLine(stats, elder.name)
                  : `${elder.name} is enjoying retirement in the sunny spot.`}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
