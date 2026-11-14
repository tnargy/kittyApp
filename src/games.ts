// The Play games, as a registry: each game is one entry here, with its
// screen component and its win event. Adding a game means adding one
// entry — nothing in App.tsx needs a new branch.
//
// Play picks a game at random the first time per visit and sticks with it
// for the session. For testing, a game can be opened directly with a
// deep link instead of tapping Play until it comes up:
//   /kittyApp/?game=matching
//   /kittyApp/?game=numbers
// The link opens that game on load (once a kitty exists). It is only for
// testing — normal play is always random.

import type { ComponentType } from 'react'
import MatchingGame from './components/MatchingGame'
import NumberGame from './components/NumberGame'
import type { KittyColor } from './kitty'

export interface GameProps {
  kittyName: string
  kittyColor: KittyColor
  onWin: () => void
  onBack: () => void
}

export type GameId = 'matching' | 'numbers'

export const GAME_IDS: GameId[] = ['matching', 'numbers']

export const GAMES: Record<GameId, ComponentType<GameProps>> = {
  matching: MatchingGame,
  numbers: NumberGame,
}

export const GAME_META: Record<
  GameId,
  { eventType: string; solvedNote: (name: string) => string }
> = {
  matching: {
    eventType: 'puzzle-solved',
    solvedNote: (name) => `${name} solved the matching puzzle`,
  },
  numbers: {
    eventType: 'number-game-solved',
    solvedNote: (name) => `${name} solved the number game`,
  },
}

export function pickGame(): GameId {
  return GAME_IDS[Math.floor(Math.random() * GAME_IDS.length)]
}

/** Read a `?game=` deep link. Returns null for anything unrecognized. */
export function gameFromParams(search: string): GameId | null {
  const game = new URLSearchParams(search).get('game')
  return game === 'matching' || game === 'numbers' ? game : null
}
