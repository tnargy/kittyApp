// Tiny synthesized sound effects (Web Audio, no audio files).
// Sounds only ever play after a tap, never on their own, and the player
// can mute them with the toggle. Everything is guarded so a missing or
// blocked AudioContext just means silence.

export type SoundName =
  | 'pop'
  | 'ding'
  | 'oops'
  | 'mrrp'
  | 'munch'
  | 'chime'
  | 'lullaby'
  | 'wake'
  | 'sweep'

const STORAGE_KEY = 'kitty-sound'

let enabled =
  typeof localStorage === 'undefined' ||
  localStorage.getItem(STORAGE_KEY) !== 'off'

let ctx: AudioContext | null = null

export function isSoundOn(): boolean {
  return enabled
}

export function setSoundOn(on: boolean): void {
  enabled = on
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // Private mode or unavailable storage: keep the in-memory choice.
  }
}

function audio(): AudioContext | null {
  if (!enabled) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(
  ac: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  delay = 0,
  slideTo?: number,
) {
  const start = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

/**
 * Pitch for the mrrp (v2): the kitten's mrrp is higher, the Wise Cat's
 * slower and deeper — Web Audio pitch is one parameter away.
 */
export function stageMrrpPitch(stage: 'kitten' | 'cat' | 'wise'): number {
  return stage === 'kitten' ? 1.3 : stage === 'wise' ? 0.75 : 1
}

export function playSound(name: SoundName, opts?: { pitch?: number }): void {
  const ac = audio()
  if (!ac) return
  try {
    const pitch = opts?.pitch ?? 1
    switch (name) {
      case 'pop':
        tone(ac, 600, 0.07, 'triangle')
        break
      case 'ding':
        tone(ac, 880, 0.15, 'sine')
        break
      case 'oops':
        tone(ac, 400, 0.2, 'sine', 0, 200)
        break
      case 'mrrp':
        tone(ac, 300 * pitch, 0.18, 'sine', 0, 520 * pitch)
        break
      case 'munch':
        tone(ac, 200, 0.06, 'triangle')
        tone(ac, 170, 0.06, 'triangle', 0.09)
        break
      case 'chime':
        tone(ac, 523, 0.25, 'sine', 0)
        tone(ac, 659, 0.25, 'sine', 0.09)
        tone(ac, 784, 0.3, 'sine', 0.18)
        break
      case 'lullaby':
        tone(ac, 392, 0.4, 'sine', 0)
        tone(ac, 330, 0.45, 'sine', 0.2)
        break
      case 'wake':
        tone(ac, 330, 0.25, 'sine', 0, 660)
        break
      case 'sweep':
        tone(ac, 800, 0.12, 'triangle', 0, 300)
        break
    }
  } catch {
    // Silence on any audio failure.
  }
}
