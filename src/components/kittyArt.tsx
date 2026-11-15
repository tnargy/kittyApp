import { PALETTES, type KittyColor } from '../kitty'

/** The kitty's drawn face, shared by the face view (KittyFace) and the
 * full body (KittyBody). The face lives in its own 120×110 space; the
 * body places it with a wrapping <g transform> and scales the eyes
 * per stage — the coordinates are never copied into the body viewBox. */

export type KittyMood = 'idle' | 'happy' | 'sleepy' | 'hungry'

/**
 * The eyes, in face space. `scale` grows them (the kitten's big eyes)
 * about the midpoint between them. The outer group carries the `eyes`
 * class so the Wise Cat's slow blink can animate it.
 */
function Eyes({ mood, scale = 1 }: { mood: KittyMood; scale?: number }) {
  const dark = '#3a3340'
  const transform =
    scale === 1
      ? undefined
      : `translate(60 58) scale(${scale}) translate(-60 -58)`
  const content = (() => {
    if (mood === 'happy') {
      return (
        <g stroke={dark} strokeWidth={3} strokeLinecap="round" fill="none">
          <path d="M36 58 Q43 49 50 58" />
          <path d="M70 58 Q77 49 84 58" />
        </g>
      )
    }
    if (mood === 'sleepy') {
      return (
        <g stroke={dark} strokeWidth={3} strokeLinecap="round" fill="none">
          <path d="M36 58 Q43 62 50 58" />
          <path d="M70 58 Q77 62 84 58" />
        </g>
      )
    }
    const r = mood === 'hungry' ? 7 : 5
    return (
      <g>
        <circle cx={43} cy={58} r={r} fill={dark} />
        <circle cx={77} cy={58} r={r} fill={dark} />
        <circle cx={45} cy={56} r={1.8} fill="#fff" />
        <circle cx={79} cy={56} r={1.8} fill="#fff" />
      </g>
    )
  })()
  return (
    <g className="eyes" transform={transform}>
      {content}
    </g>
  )
}

/**
 * The whole head (ears, head, muzzle, whiskers, blush, eyes, nose and
 * mouth) as one group in face space. `muzzle` adds the Wise Cat's grey
 * muzzle patch; `eyeScale` grows the eyes for the kitten.
 */
export function Head({
  color,
  mood,
  muzzle = false,
  eyeScale = 1,
}: {
  color: KittyColor
  mood: KittyMood
  muzzle?: boolean
  eyeScale?: number
}) {
  const { fur, innerEar, patch } = PALETTES[color]
  return (
    <g>
      {/* Ears */}
      <polygon points="24,40 30,8 54,30" fill={fur} />
      <polygon points="96,40 90,8 66,30" fill={fur} />
      <polygon points="30,34 33,16 48,29" fill={innerEar} />
      <polygon points="90,34 87,16 72,29" fill={innerEar} />
      {patch && <ellipse cx={36} cy={30} rx={15} ry={11} fill={patch} />}
      {/* Head */}
      <ellipse cx={60} cy={62} rx={42} ry={38} fill={fur} />
      {patch && <ellipse cx={82} cy={86} rx={10} ry={7} fill={patch} />}
      {/* Grey muzzle patch for a Wise Cat, under the nose and mouth. */}
      {muzzle && (
        <ellipse cx={60} cy={80} rx={14} ry={9} fill="#cfd3d8" opacity={0.95} />
      )}
      {/* Whiskers */}
      <g stroke="#3a3340" strokeWidth={1.5} strokeLinecap="round" opacity={0.5}>
        <line x1="24" y1="66" x2="8" y2="62" />
        <line x1="24" y1="74" x2="10" y2="76" />
        <line x1="96" y1="66" x2="112" y2="62" />
        <line x1="96" y1="74" x2="110" y2="76" />
      </g>
      {/* Blush */}
      <ellipse cx={34} cy={70} rx={6} ry={4} fill="#f7a8b8" opacity={0.55} />
      <ellipse cx={86} cy={70} rx={6} ry={4} fill="#f7a8b8" opacity={0.55} />
      <Eyes mood={mood} scale={eyeScale} />
      {/* Nose + mouth */}
      <polygon points="55,70 65,70 60,76" fill="#e56b8c" />
      {mood === 'hungry' ? (
        <ellipse cx={60} cy={82} rx={4} ry={5} fill="#3a3340" />
      ) : (
        <path
          d="M60 76 Q60 82 54 82 M60 76 Q60 82 66 82"
          stroke="#3a3340"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      )}
      {mood === 'sleepy' && (
        <g fill="#9a8ba8" fontSize={12} fontWeight="bold">
          <text x={96} y={18}>
            z
          </text>
          <text x={104} y={10}>
            z
          </text>
        </g>
      )}
    </g>
  )
}
