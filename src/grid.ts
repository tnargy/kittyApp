// Shared grid math for the Play games that live on a square grid.
// Lights out and the box maze both need orthogonal neighbors on a
// 5x5 board; the yarn hunt needs Manhattan distance on a 3x3 board.
// One module, so the grid math is written once and tested once.

/** Positions are row-major: index = row * size + col. */
export function neighborsOf(index: number, size: number): number[] {
  const row = Math.floor(index / size)
  const col = index % size
  const neighbors: number[] = []
  if (col > 0) neighbors.push(index - 1)
  if (col < size - 1) neighbors.push(index + 1)
  if (row > 0) neighbors.push(index - size)
  if (row < size - 1) neighbors.push(index + size)
  return neighbors
}

/** Manhattan distance between two row-major positions on a size x size
 * grid: |row1 − row2| + |col1 − col2|. */
export function manhattanDistance(a: number, b: number, size: number): number {
  const rowA = Math.floor(a / size)
  const colA = a % size
  const rowB = Math.floor(b / size)
  const colB = b % size
  return Math.abs(rowA - rowB) + Math.abs(colA - colB)
}
