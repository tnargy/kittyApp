// The Play games, as a registry: each game is one entry here, with its
// screen component and its win event. Adding a game means adding one
// entry — nothing in App.tsx needs a new branch.
//
// Play picks a fresh game at random every time it is tapped. Play again
// after a win replays the same game (a fresh board of it). For testing, a
// deep link instead of tapping Play until it comes up:
//   /kittyApp/?game=matching
//   /kittyApp/?game=numbers
//   /kittyApp/?game=lightsout
//   /kittyApp/?game=yarnhunt
//   /kittyApp/?game=boxmaze
// The link opens that game on load (once a kitty exists). It is only for
// testing — normal play is always random.

import type { ComponentType } from 'react'
import BoxMazeGame from './components/BoxMazeGame'
import LightsOutGame from './components/LightsOutGame'
import MatchingGame from './components/MatchingGame'
import NumberGame from './components/NumberGame'
import YarnHuntGame from './components/YarnHuntGame'
import type { KittyColor } from './kitty'

export interface GameProps {
  kittyName: string
  kittyColor: KittyColor
  onWin: () => void
  onBack: () => void
}

export type GameId =
  | 'matching'
  | 'numbers'
  | 'lightsout'
  | 'yarnhunt'
  | 'boxmaze'

export const GAME_IDS: GameId[] = [
  'matching',
  'numbers',
  'lightsout',
  'yarnhunt',
  'boxmaze',
]

export const GAMES: Record<GameId, ComponentType<GameProps>> = {
  matching: MatchingGame,
  numbers: NumberGame,
  lightsout: LightsOutGame,
  yarnhunt: YarnHuntGame,
  boxmaze: BoxMazeGame,
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
  lightsout: {
    eventType: 'lights-out-solved',
    solvedNote: (name) => `${name} turned out all the lights`,
  },
  yarnhunt: {
    eventType: 'yarn-ball-found',
    solvedNote: (name) => `${name} found the yarn ball`,
  },
  boxmaze: {
    eventType: 'box-maze-solved',
    solvedNote: (name) => `${name} helped the kitty through the box maze`,
  },
}

export function pickGame(): GameId {
  return GAME_IDS[Math.floor(Math.random() * GAME_IDS.length)]
}

/** Read a `?game=` deep link. Returns null for anything unrecognized.
 * Derived from the registry, so a new game comes free here. */
export function gameFromParams(search: string): GameId | null {
  const game = new URLSearchParams(search).get('game')
  return (GAME_IDS as string[]).includes(game ?? '')
    ? (game as GameId)
    : null
}
