import type { KittyColor } from '../kitty'

export type KittyMood = 'idle' | 'happy' | 'sleepy' | 'hungry'

const PALETTES: Record<
  KittyColor,
  { fur: string; innerEar: string; patch?: string }
> = {
  orange: { fur: '#f6a55c', innerEar: '#ffd9b0' },
  grey: { fur: '#a8adb5', innerEar: '#d4d8dd' },
  midnight: { fur: '#55555e', innerEar: '#8a8a95' },
  calico: { fur: '#f7ead7', innerEar: '#ffd9b0', patch: '#f6a55c' },
}

function Eyes({ mood }: { mood: KittyMood }) {
  const dark = '#3a3340'
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
}

export default function KittyFace({
  color,
  mood,
}: {
  color: KittyColor
  mood: KittyMood
}) {
  const { fur, innerEar, patch } = PALETTES[color]
  return (
    <svg
      viewBox="0 0 120 110"
      role="img"
      aria-label="kitty face"
      className="kitty-svg"
    >
      {/* Ears */}
      <polygon points="24,40 30,8 54,30" fill={fur} />
      <polygon points="96,40 90,8 66,30" fill={fur} />
      <polygon points="30,34 33,16 48,29" fill={innerEar} />
      <polygon points="90,34 87,16 72,29" fill={innerEar} />
      {patch && <ellipse cx={36} cy={30} rx={15} ry={11} fill={patch} />}
      {/* Head */}
      <ellipse cx={60} cy={62} rx={42} ry={38} fill={fur} />
      {patch && <ellipse cx={82} cy={86} rx={10} ry={7} fill={patch} />}
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
      <Eyes mood={mood} />
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
    </svg>
  )
}
