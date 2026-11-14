import { describe, expect, it } from 'vitest'
import {
  createNumberGame,
  flipBackAll,
  flipTile,
  TILE_COUNT,
} from './numbers'

function tileFor(state: ReturnType<typeof createNumberGame>, value: number) {
  return state.tiles.find((t) => t.value === value)!
}

describe('createNumberGame', () => {
  it('has 9 tiles: the numbers 1-9 exactly once, unique ids', () => {
    const game = createNumberGame()
    expect(game.tiles).toHaveLength(TILE_COUNT)
    expect(new Set(game.tiles.map((t) => t.id)).size).toBe(TILE_COUNT)
    expect(game.tiles.map((t) => t.value).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ])
    expect(game.tiles.every((t) => !t.faceUp)).toBe(true)
    expect(game.next).toBe(1)
    expect(game.won).toBe(false)
  })
})

describe('flipTile', () => {
  it('flipping the right next number advances the count', () => {
    const game = createNumberGame()
    const next = flipTile(game, tileFor(game, 1).id)
    expect(next.next).toBe(2)
    expect(next.tiles.find((t) => t.value === 1)?.faceUp).toBe(true)
  })

  it('flipping a wrong number leaves the count unchanged', () => {
    const game = createNumberGame()
    const next = flipTile(game, tileFor(game, 5).id)
    expect(next.next).toBe(1)
    expect(next.tiles.find((t) => t.value === 5)?.faceUp).toBe(true)
    expect(next.won).toBe(false)
  })

  it('flipping an already face-up tile is a no-op', () => {
    const game = createNumberGame()
    const once = flipTile(game, tileFor(game, 1).id)
    expect(flipTile(once, tileFor(game, 1).id)).toBe(once)
  })

  it('flipping 1 through 9 in order wins', () => {
    let game = createNumberGame()
    for (let value = 1; value <= TILE_COUNT; value++) {
      game = flipTile(game, tileFor(game, value).id)
    }
    expect(game.won).toBe(true)
    expect(game.next).toBe(TILE_COUNT + 1)
    expect(game.tiles.every((t) => t.faceUp)).toBe(true)
  })

  it('flipping after a win is a no-op', () => {
    let game = createNumberGame()
    for (let value = 1; value <= TILE_COUNT; value++) {
      game = flipTile(game, tileFor(game, value).id)
    }
    expect(flipTile(game, game.tiles[0].id)).toBe(game)
  })
})

describe('flipBackAll', () => {
  it('turns every tile back down and restarts at 1, keeping positions', () => {
    let game = createNumberGame()
    const before = game.tiles.map((t) => t.value)
    game = flipTile(game, tileFor(game, 1).id)
    game = flipTile(game, tileFor(game, 2).id)
    game = flipTile(game, tileFor(game, 9).id)
    const back = flipBackAll(game)
    expect(back.next).toBe(1)
    expect(back.won).toBe(false)
    expect(back.tiles.every((t) => !t.faceUp)).toBe(true)
    expect(back.tiles.map((t) => t.value)).toEqual(before)
  })
})
