import { describe, expect, it } from 'vitest'
import {
  GAME_IDS,
  GAME_INFO,
  GAMES,
  gameFromParams,
  isGamesIndexPath,
  pickGame,
} from './games'

describe('gameFromParams', () => {
  it('reads a valid game from the query string', () => {
    expect(gameFromParams('?game=matching')).toBe('matching')
    expect(gameFromParams('?game=numbers')).toBe('numbers')
    expect(gameFromParams('?game=lightsout')).toBe('lightsout')
    expect(gameFromParams('?game=yarnhunt')).toBe('yarnhunt')
    expect(gameFromParams('?game=boxmaze')).toBe('boxmaze')
  })

  it('returns null for anything unrecognized', () => {
    expect(gameFromParams('')).toBeNull()
    expect(gameFromParams('?game=chess')).toBeNull()
    expect(gameFromParams('?foo=matching')).toBeNull()
  })
})

describe('registry', () => {
  it('has a component for every registered game', () => {
    for (const id of GAME_IDS) {
      expect(GAMES[id]).toBeDefined()
    }
  })

  it('has index info for every registered game', () => {
    const names = new Set<string>()
    for (const id of GAME_IDS) {
      const info = GAME_INFO[id]
      expect(info.name.trim()).not.toBe('')
      expect(info.blurb.trim()).not.toBe('')
      names.add(info.name)
    }
    // One row per game — no two games share a name.
    expect(names.size).toBe(GAME_IDS.length)
  })

  it('pickGame only ever returns a registered game', () => {
    for (let i = 0; i < 20; i++) {
      expect(GAME_IDS).toContain(pickGame())
    }
  })
})

describe('isGamesIndexPath', () => {
  it('matches the games index with or without a trailing slash', () => {
    expect(isGamesIndexPath('/kittyApp/games')).toBe(true)
    expect(isGamesIndexPath('/kittyApp/games/')).toBe(true)
    expect(isGamesIndexPath('/games')).toBe(true)
  })

  it('rejects every other page', () => {
    expect(isGamesIndexPath('/kittyApp/')).toBe(false)
    expect(isGamesIndexPath('/kittyApp')).toBe(false)
    expect(isGamesIndexPath('/')).toBe(false)
    expect(isGamesIndexPath('/kittyApp/games/extra')).toBe(false)
    expect(isGamesIndexPath('/kittyApp/gameshow')).toBe(false)
  })
})
