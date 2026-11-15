import { describe, expect, it } from 'vitest'
import {
  bfsDistances,
  canMove,
  CELL_COUNT,
  checkWin,
  createMaze,
  GRID_SIZE,
  MIN_JOURNEY,
  move,
  neighborsOf,
  START_INDEX,
  type MazeState,
} from './maze'

function passageCount(state: MazeState): number {
  let count = 0
  for (let index = 0; index < CELL_COUNT; index++) {
    const row = Math.floor(index / GRID_SIZE)
    const col = index % GRID_SIZE
    // Count each shared edge once: right and bottom walls.
    if (col < GRID_SIZE - 1 && !state.cells[index].walls[1]) count++
    if (row < GRID_SIZE - 1 && !state.cells[index].walls[2]) count++
  }
  return count
}

function wallLayout(state: MazeState): string {
  return state.cells
    .map((cell) => cell.walls.map((wall) => (wall ? '1' : '0')).join(''))
    .join(',')
}

describe('createMaze', () => {
  it('deals 25 cells, never already won, kitty at the start', () => {
    for (let i = 0; i < 50; i++) {
      const state = createMaze()
      expect(state.cells).toHaveLength(CELL_COUNT)
      expect(state.kitty).toBe(START_INDEX)
      expect(state.visited).toEqual([START_INDEX])
      expect(state.won).toBe(false)
    }
  })

  it('every cell is reachable from the start', () => {
    for (let i = 0; i < 20; i++) {
      const state = createMaze()
      const distances = bfsDistances(state.cells, START_INDEX)
      expect(distances.size).toBe(CELL_COUNT)
    }
  })

  it('walls are symmetric, and every cell can return to the start', () => {
    for (let i = 0; i < 20; i++) {
      const state = createMaze()
      for (let index = 0; index < CELL_COUNT; index++) {
        for (const neighbor of neighborsOf(index)) {
          expect(canMove(state, index, neighbor)).toBe(
            canMove(state, neighbor, index),
          )
        }
        // Two-way reachability: BFS from any cell reaches the start.
        expect(bfsDistances(state.cells, index).has(START_INDEX)).toBe(true)
      }
    }
  })

  it('is a perfect maze: exactly 24 passages for 25 cells', () => {
    for (let i = 0; i < 20; i++) {
      expect(passageCount(createMaze())).toBe(CELL_COUNT - 1)
    }
  })

  it('the fish is a farthest cell, at least 8 steps away', () => {
    for (let i = 0; i < 20; i++) {
      const state = createMaze()
      const distances = bfsDistances(state.cells, START_INDEX)
      const fishDistance = distances.get(state.fish)!
      expect(fishDistance).toBeGreaterThanOrEqual(MIN_JOURNEY)
      for (const distance of distances.values()) {
        expect(distance).toBeLessThanOrEqual(fishDistance)
      }
    }
  })

  it('mazes vary across deals', () => {
    const layouts = new Set<string>()
    for (let i = 0; i < 20; i++) {
      layouts.add(wallLayout(createMaze()))
    }
    expect(layouts.size).toBeGreaterThanOrEqual(15)
  })
})

describe('canMove / move', () => {
  it('a walled move is a no-op', () => {
    const state = createMaze()
    // Find a walled adjacent pair anywhere on the board.
    let walled: [number, number] | null = null
    for (let index = 0; index < CELL_COUNT && !walled; index++) {
      for (const neighbor of neighborsOf(index)) {
        if (!canMove(state, index, neighbor)) {
          walled = [index, neighbor]
          break
        }
      }
    }
    expect(walled).not.toBeNull()
    const [from, to] = walled!
    const atFrom = { ...state, kitty: from }
    expect(move(atFrom, to)).toBe(atFrom)
  })

  it('a non-adjacent move is a no-op', () => {
    const state = createMaze()
    const far = (START_INDEX + 2) % CELL_COUNT
    expect(canMove(state, START_INDEX, far)).toBe(false)
    expect(move(state, far)).toBe(state)
  })

  it('a legal move moves the kitty and leaves the walls untouched', () => {
    const state = createMaze()
    const legal = neighborsOf(START_INDEX).find((index) =>
      canMove(state, START_INDEX, index),
    )!
    const next = move(state, legal)
    expect(next.kitty).toBe(legal)
    expect(next.cells).toEqual(state.cells)
    expect(next.won).toBe(false)
  })

  it('visited starts at the start, grows on moves, never duplicates', () => {
    const state = createMaze()
    const first = neighborsOf(START_INDEX).find((index) =>
      canMove(state, START_INDEX, index),
    )!
    const afterFirst = move(state, first)
    expect(afterFirst.visited).toEqual([START_INDEX, first])
    // Walk back: the start is already visited, so it is not added twice.
    const back = move(afterFirst, START_INDEX)
    expect(back.visited).toEqual([START_INDEX, first])
    expect(back.kitty).toBe(START_INDEX)
  })

  it('is a no-op once won, and for an out-of-range index', () => {
    const state = createMaze()
    const distances = bfsDistances(state.cells, START_INDEX)
    // Walk the BFS path to the fish to win.
    let current = state
    let index = state.fish
    const path: number[] = [index]
    while (index !== START_INDEX) {
      const prev = neighborsOf(index).find(
        (neighbor) =>
          distances.get(neighbor) === distances.get(index)! - 1 &&
          canMove(current, neighbor, index),
      )!
      path.unshift(prev)
      index = prev
    }
    for (const step of path.slice(1)) {
      current = move(current, step)
    }
    expect(current.won).toBe(true)
    expect(checkWin(current)).toBe(true)
    expect(move(current, START_INDEX)).toBe(current)
    expect(move(state, -1)).toBe(state)
    expect(move(state, CELL_COUNT)).toBe(state)
  })

  it('stepping onto the fish wins', () => {
    const state = createMaze()
    const distances = bfsDistances(state.cells, START_INDEX)
    let current = state
    let index = state.fish
    const path: number[] = [index]
    while (index !== START_INDEX) {
      const prev = neighborsOf(index).find(
        (neighbor) =>
          distances.get(neighbor) === distances.get(index)! - 1 &&
          canMove(current, neighbor, index),
      )!
      path.unshift(prev)
      index = prev
    }
    for (const step of path.slice(1)) {
      current = move(current, step)
    }
    expect(current.won).toBe(true)
  })
})

describe('checkWin', () => {
  it('is true only when the kitty is on the fish', () => {
    const state = createMaze()
    expect(checkWin(state)).toBe(false)
    expect(checkWin({ ...state, kitty: state.fish })).toBe(true)
  })
})
