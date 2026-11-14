import { describe, expect, it } from 'vitest'
import { GAME_IDS, GAMES, gameFromParams, pickGame } from './games'

describe('gameFromParams', () => {
  it('reads a valid game from the query string', () => {
    expect(gameFromParams('?game=matching')).toBe('matching')
    expect(gameFromParams('?game=numbers')).toBe('numbers')
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

  it('pickGame only ever returns a registered game', () => {
    for (let i = 0; i < 20; i++) {
      expect(GAME_IDS).toContain(pickGame())
    }
  })
})
