import { describe, expect, it } from 'vitest'
import { manhattanDistance, neighborsOf } from './grid'

describe('neighborsOf', () => {
  it('a corner cell has 2 neighbors', () => {
    expect(neighborsOf(0, 5).sort((a, b) => a - b)).toEqual([1, 5])
    expect(neighborsOf(24, 5).sort((a, b) => a - b)).toEqual([19, 23])
  })

  it('an edge cell has 3 neighbors', () => {
    expect(neighborsOf(2, 5).sort((a, b) => a - b)).toEqual([1, 3, 7])
  })

  it('a center cell has 4 neighbors', () => {
    const center = 2 * 5 + 2
    expect(neighborsOf(center, 5).sort((a, b) => a - b)).toEqual([
      center - 5,
      center - 1,
      center + 1,
      center + 5,
    ])
  })

  it('works on a 3x3 grid too', () => {
    expect(neighborsOf(0, 3).sort((a, b) => a - b)).toEqual([1, 3])
    expect(neighborsOf(4, 3).sort((a, b) => a - b)).toEqual([1, 3, 5, 7])
  })
})

describe('manhattanDistance', () => {
  it('is 0 for the same cell', () => {
    expect(manhattanDistance(4, 4, 3)).toBe(0)
  })

  it('counts orthogonal steps only', () => {
    // 3x3: cell 0 (row 0, col 0) to cell 8 (row 2, col 2) is 4.
    expect(manhattanDistance(0, 8, 3)).toBe(4)
    // Adjacent cells are 1 apart, diagonally adjacent cells are 2.
    expect(manhattanDistance(0, 1, 3)).toBe(1)
    expect(manhattanDistance(0, 4, 3)).toBe(2)
  })

  it('is symmetric', () => {
    expect(manhattanDistance(2, 6, 3)).toBe(manhattanDistance(6, 2, 3))
  })
})
