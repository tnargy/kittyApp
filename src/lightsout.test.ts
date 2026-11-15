import { describe, expect, it } from 'vitest'
import {
  checkWin,
  createLightsOut,
  GRID_SIZE,
  LIGHT_COUNT,
  lightsOn,
  MIN_LIT,
  SCRAMBLE_MAX,
  SCRAMBLE_MIN,
  toggleLight,
  type LightsOutState,
} from './lightsout'

function allOff(): LightsOutState {
  return {
    lights: Array.from({ length: LIGHT_COUNT }, (_, index) => ({
      id: `light-${index}`,
      on: false,
    })),
    won: true,
  }
}

describe('createLightsOut', () => {
  it('deals 25 lights, never already won', () => {
    for (let i = 0; i < 50; i++) {
      const { state } = createLightsOut()
      expect(state.lights).toHaveLength(LIGHT_COUNT)
      expect(state.won).toBe(false)
    }
  })

  it('always leaves at least 8 lights on', () => {
    for (let i = 0; i < 100; i++) {
      const { state } = createLightsOut()
      expect(lightsOn(state)).toBeGreaterThanOrEqual(MIN_LIT)
    }
  })

  it('scrambles with 10–15 distinct toggles', () => {
    for (let i = 0; i < 50; i++) {
      const { scramble } = createLightsOut()
      expect(scramble.length).toBeGreaterThanOrEqual(SCRAMBLE_MIN)
      expect(scramble.length).toBeLessThanOrEqual(SCRAMBLE_MAX)
      expect(new Set(scramble).size).toBe(scramble.length)
      for (const position of scramble) {
        expect(position).toBeGreaterThanOrEqual(0)
        expect(position).toBeLessThan(LIGHT_COUNT)
      }
    }
  })

  it('every board is solvable by replaying the scramble', () => {
    for (let i = 0; i < 20; i++) {
      const { state, scramble } = createLightsOut()
      let current = state
      for (const position of scramble) {
        current = toggleLight(current, `light-${position}`)
      }
      expect(checkWin(current.lights)).toBe(true)
      expect(current.won).toBe(true)
    }
  })
})

describe('toggleLight', () => {
  it('toggles the light and its orthogonal neighbors only', () => {
    const state = allOff()
    const center = 2 * GRID_SIZE + 2
    const next = toggleLight(
      { ...state, lights: state.lights, won: false },
      `light-${center}`,
    )
    const on = next.lights
      .map((light, index) => (light.on ? index : -1))
      .filter((index) => index >= 0)
    expect(on.sort((a, b) => a - b)).toEqual([
      center - GRID_SIZE,
      center - 1,
      center,
      center + 1,
      center + GRID_SIZE,
    ])
    // A diagonal neighbor stays off.
    expect(next.lights[center - GRID_SIZE - 1].on).toBe(false)
  })

  it('toggling twice restores the board', () => {
    const { state } = createLightsOut()
    const once = toggleLight(state, 'light-7')
    const twice = toggleLight(once, 'light-7')
    expect(twice.lights).toEqual(state.lights)
    expect(twice.won).toBe(false)
  })

  it('is a no-op once won, and for an unknown id', () => {
    const won = allOff()
    expect(toggleLight(won, 'light-0')).toBe(won)
    const { state } = createLightsOut()
    expect(toggleLight(state, 'light-99')).toBe(state)
  })

  it('wins when the last light goes out', () => {
    // One lit light, toggled on its own: a corner toggles 3 lights,
    // so start from a board with only the corner and its two
    // neighbors lit — one tap turns all three off.
    const lights = Array.from({ length: LIGHT_COUNT }, (_, index) => ({
      id: `light-${index}`,
      on: [0, 1, GRID_SIZE].includes(index),
    }))
    const next = toggleLight({ lights, won: false }, 'light-0')
    expect(next.won).toBe(true)
    expect(checkWin(next.lights)).toBe(true)
  })
})

describe('checkWin / lightsOn', () => {
  it('checkWin is true only when every light is off', () => {
    expect(checkWin(allOff().lights)).toBe(true)
    const { state } = createLightsOut()
    expect(checkWin(state.lights)).toBe(false)
  })

  it('lightsOn counts the lit lights', () => {
    const { state } = createLightsOut()
    expect(lightsOn(state)).toBe(
      state.lights.filter((light) => light.on).length,
    )
  })
})
