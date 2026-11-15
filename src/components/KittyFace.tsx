import { Head, type KittyMood } from './kittyArt'
import type { KittyColor } from '../kitty'

/** The drawn face on its own — used on game win screens and in the
 * Family row. The kitty view uses the full body (KittyBody) instead. */
export default function KittyFace({
  color,
  mood,
  muzzle = false,
}: {
  color: KittyColor
  mood: KittyMood
  /** Show the Wise Cat's grey muzzle patch (Family row portraits). */
  muzzle?: boolean
}) {
  return (
    <svg
      viewBox="0 0 120 110"
      role="img"
      aria-label="kitty face"
      className="kitty-svg"
    >
      <Head color={color} mood={mood} muzzle={muzzle} />
    </svg>
  )
}
