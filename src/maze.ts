// Pure cardboard-box maze logic for the Play game.
// A 7x7 maze dealt fresh every game by randomized depth-first search:
// every cell is reachable from the start, and the fish sits on a
// farthest cell, so the trip is a real journey. Tapping a cell next
// door to the kitty moves her there when no wall is in the way;
// walls are always symmetric (carving a passage clears the wall on
// both cells' shared edge), so she can always walk back out of a
// dead end. Visited cells are remembered, so the maze builds its own
// map as she explores. The board lives in React state only (never
// persisted); only the win bonus and the solved event are saved, via
// the existing paths.

import { neighborsOf as gridNeighborsOf } from './grid'

export interface MazeCell {
  id: string
  /** Walls in order [top, right, bottom, left]. */
  walls: [boolean, boolean, boolean, boolean]
}

export interface MazeState {
  cells: MazeCell[]
  /** Cell indices, not ids. */
  kitty: number
  fish: number
  /** Indices the kitty has stood on, starting with the start cell. */
  visited: number[]
  won: boolean
}

export const GRID_SIZE = 7
export const CELL_COUNT = GRID_SIZE * GRID_SIZE
export const START_INDEX = 42 // bottom-left (row 6, col 0)
/** The fish's BFS distance from the start is at least this far. */
export const MIN_JOURNEY = 14
const MAX_DEALS = 20

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/** Orthogonal neighbors on this game's 5x5 board. Shared grid math
 * lives in src/grid.ts; this is the maze-sized wrapper. */
export function neighborsOf(index: number): number[] {
  return gridNeighborsOf(index, GRID_SIZE)
}

/** The wall index on `from` toward the adjacent cell `to`:
 * 0 = top, 1 = right, 2 = bottom, 3 = left. */
function wallToward(from: number, to: number): number {
  const diff = to - from
  if (diff === 1) return 1 // right
  if (diff === -1) return 3 // left
  if (diff === GRID_SIZE) return 2 // bottom
  return 0 // top
}

/** Carve a passage between two adjacent cells: clear the wall on
 * both cells' shared edge. */
function carve(cells: MazeCell[], from: number, to: number): void {
  const fromWall = wallToward(from, to)
  const toWall = wallToward(to, from)
  cells[from].walls[fromWall] = false
  cells[to].walls[toWall] = false
}

function freshCells(): MazeCell[] {
  return Array.from({ length: CELL_COUNT }, (_, index) => ({
    id: `cell-${index}`,
    walls: [true, true, true, true] as [boolean, boolean, boolean, boolean],
  }))
}

function dealOnce(): MazeState {
  const cells = freshCells()
  const seen = new Set<number>([START_INDEX])
  const stack = [START_INDEX]
  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const unvisited = shuffle(
      neighborsOf(current).filter((index) => !seen.has(index)),
    )
    if (unvisited.length === 0) {
      stack.pop()
      continue
    }
    const next = unvisited[0]
    carve(cells, current, next)
    seen.add(next)
    stack.push(next)
  }
  const fish = farthestCell(cells, START_INDEX)
  return { cells, kitty: START_INDEX, fish, visited: [START_INDEX], won: false }
}

/** BFS distances from `start`, over canMove (through passages, not
 * grid adjacency). */
export function bfsDistances(
  cells: MazeCell[],
  start: number,
): Map<number, number> {
  const distances = new Map<number, number>([[start, 0]])
  const queue = [start]
  // canMove only reads the walls, so one shared state works here.
  const state = { cells, kitty: start, fish: -1, visited: [], won: false }
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const next of neighborsOf(current)) {
      if (!distances.has(next) && canMove(state, current, next)) {
        distances.set(next, distances.get(current)! + 1)
        queue.push(next)
      }
    }
  }
  return distances
}

function farthestCell(cells: MazeCell[], start: number): number {
  const distances = bfsDistances(cells, start)
  let max = 0
  for (const distance of distances.values()) {
    if (distance > max) max = distance
  }
  const farthest = [...distances.entries()]
    .filter(([, distance]) => distance === max)
    .map(([index]) => index)
  return farthest[Math.floor(Math.random() * farthest.length)]
}

/**
 * Deal a fresh maze: randomized DFS from the start cell until every
 * cell has been visited, then the fish on a farthest cell by BFS
 * distance over canMove. Re-deals (up to 20 attempts) until the
 * fish is at least MIN_JOURNEY steps away, then accepts the best
 * deal. Always returns won: false, with visited: [start].
 */
export function createMaze(): MazeState {
  let best = dealOnce()
  let bestDistance =
    bfsDistances(best.cells, START_INDEX).get(best.fish) ?? 0
  for (let attempt = 1; attempt < MAX_DEALS; attempt++) {
    if (bestDistance >= MIN_JOURNEY) return best
    const dealt = dealOnce()
    const distance = bfsDistances(dealt.cells, START_INDEX).get(dealt.fish) ?? 0
    if (distance > bestDistance) {
      best = dealt
      bestDistance = distance
    }
  }
  // Extremely unlikely fallback: accept the best deal as dealt.
  return best
}

/**
 * `to` is orthogonally adjacent to `from` and there is no wall
 * between them (checked on the `from` cell's wall in that
 * direction). Works only because carving always clears the wall on
 * both cells — see createMaze.
 */
export function canMove(
  state: MazeState,
  from: number,
  to: number,
): boolean {
  if (!neighborsOf(from).includes(to)) return false
  return !state.cells[from].walls[wallToward(from, to)]
}

export function checkWin(state: MazeState): boolean {
  return state.kitty === state.fish
}

/**
 * Move the kitty to the tapped cell when it is a legal move. Guards
 * (all no-ops): the game is already won, the index is out of range,
 * or the move is not legal. A legal move adds the destination to
 * `visited`. Sets `won` when the kitty steps onto the fish cell.
 */
export function move(state: MazeState, index: number): MazeState {
  if (state.won) return state
  if (index < 0 || index >= CELL_COUNT) return state
  if (!canMove(state, state.kitty, index)) return state
  const visited = state.visited.includes(index)
    ? state.visited
    : [...state.visited, index]
  const next = { ...state, kitty: index, visited }
  return { ...next, won: checkWin(next) }
}
