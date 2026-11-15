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
// testing — normal play is always random. There is also a hidden games
// index at /kittyApp/games that lists every game with its test link.
// It is not linked from the kitty view.

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

/** Display info for the hidden games index: a name and a one-line
 * description per game. Lives in the registry so a new game comes
 * with its index entry — nothing else needs a new branch. */
export const GAME_INFO: Record<
  GameId,
  { name: string; blurb: string }
> = {
  matching: {
    name: '🧩 Matching puzzle',
    blurb: 'Flip the cards and find all 6 pairs',
  },
  numbers: {
    name: '🔢 Number game',
    blurb: 'Flip the tiles in order, 1 to 9',
  },
  lightsout: {
    name: '💡 Lights out',
    blurb: 'Tap the lights to turn them all out',
  },
  yarnhunt: {
    name: '🧶 Yarn-ball hunt',
    blurb: 'Peek in the baskets to find the yarn ball',
  },
  boxmaze: {
    name: '📦 Cardboard-box maze',
    blurb: 'Wander the maze and find the hidden fish',
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

/** Is this the hidden games index? True when the last path segment
 * is `games` — `/kittyApp/games` and `/kittyApp/games/` both count,
 * and so does a bare `/games`. Anything deeper (`/games/extra`) or
 * any other page does not. */
export function isGamesIndexPath(pathname: string): boolean {
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed.split('/').pop() === 'games'
}
