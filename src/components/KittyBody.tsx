import { Head, type KittyMood } from './kittyArt'
import { PALETTES, STAGE_NAMES, type KittyColor, type KittyStage } from '../kitty'

/**
 * The full-body kitty (v2): head + body + tail + paws, in a 160×190
 * viewBox. Stage changes proportions, not identity — the kitten is an
 * oversized head, tiny body, short tail and big eyes; the young cat is
 * a balanced body with a long tail; the wise cat is the same body with
 * a grey muzzle patch. Same fur, same face, same name at every age.
 */
const STAGE_BODY: Record<
  KittyStage,
  {
    /** Head placement (face space is 120×110). */
    headScale: number
    headX: number
    headY: number
    eyeScale: number
    /** Body ellipse. */
    bodyRx: number
    bodyRy: number
    bodyCy: number
    /** Tail path (stroked, drawn behind the body). */
    tail: string
    /** Front paws: offset from the centre, height, radius. */
    pawDx: number
    pawY: number
    pawRx: number
  }
> = {
  kitten: {
    headScale: 1,
    headX: 20,
    headY: 24,
    eyeScale: 1.25,
    bodyRx: 26,
    bodyRy: 20,
    bodyCy: 148,
    tail: 'M 100 146 Q 124 138 122 112',
    pawDx: 12,
    pawY: 166,
    pawRx: 8,
  },
  cat: {
    headScale: 0.85,
    headX: 29,
    headY: 28,
    eyeScale: 1,
    bodyRx: 36,
    bodyRy: 30,
    bodyCy: 150,
    tail: 'M 112 148 Q 146 138 142 100',
    pawDx: 16,
    pawY: 176,
    pawRx: 10,
  },
  wise: {
    headScale: 0.85,
    headX: 29,
    headY: 28,
    eyeScale: 1,
    bodyRx: 36,
    bodyRy: 30,
    bodyCy: 150,
    tail: 'M 112 148 Q 146 138 142 100',
    pawDx: 16,
    pawY: 176,
    pawRx: 10,
  },
}

export default function KittyBody({
  color,
  mood,
  stage,
  name,
}: {
  color: KittyColor
  mood: KittyMood
  stage: KittyStage
  name: string
}) {
  const { fur, innerEar, patch } = PALETTES[color]
  const body = STAGE_BODY[stage]
  return (
    <svg
      viewBox="0 0 160 190"
      role="img"
      aria-label={`${name} the kitty, a ${STAGE_NAMES[stage].toLowerCase()}`}
      className="kitty-svg"
    >
      {/* Tail, behind the body — its own group so the stage animation
       * can swish it (transform-origin pinned at the tail base in CSS). */}
      <g
        className="tail"
        stroke={fur}
        strokeWidth={10}
        strokeLinecap="round"
        fill="none"
      >
        <path d={body.tail} />
      </g>
      {/* Body */}
      <ellipse cx={80} cy={body.bodyCy} rx={body.bodyRx} ry={body.bodyRy} fill={fur} />
      {patch && (
        <ellipse
          cx={80 - body.bodyRx * 0.55}
          cy={body.bodyCy - body.bodyRy * 0.3}
          rx={10}
          ry={7}
          fill={patch}
        />
      )}
      <ellipse
        cx={80}
        cy={body.bodyCy + 6}
        rx={body.bodyRx * 0.55}
        ry={body.bodyRy * 0.55}
        fill={innerEar}
        opacity={0.7}
      />
      {/* Front paws */}
      <ellipse cx={80 - body.pawDx} cy={body.pawY} rx={body.pawRx} ry={6} fill={fur} />
      <ellipse cx={80 + body.pawDx} cy={body.pawY} rx={body.pawRx} ry={6} fill={fur} />
      {/* Head, placed per stage — same drawing as the face view. */}
      <g
        transform={`translate(${body.headX} ${body.headY}) scale(${body.headScale})`}
      >
        <Head
          color={color}
          mood={mood}
          muzzle={stage === 'wise'}
          eyeScale={body.eyeScale}
        />
      </g>
    </svg>
  )
}
