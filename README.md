# Kitty — a tiny Tamagotchi

A local-first Tamagotchi-style web app to share with my daughter. She names
a kitty on a welcome screen, then cares for it in short moments through the
day: feeding, petting and grooming, cleaning the litter box, play, and
bedtime.

## The rules

- Needs deplete over real time, whether the app is open or not (changed
  2026-11-14): hunger empties in ~12h, affection ~17h, litter ~24h,
  energy ~14h while awake; sleeping recovers energy. A bar at 0 is just
  empty, never a punishment.
- Missing a visit can never make things worse beyond the bars draining.
  Coming back after a gap, the kitty is just extra happy to see you —
  sometimes with a little surprise.
- All data lives in the browser (Dexie.js / IndexedDB). No accounts, no
  server, no sync.

## Tech

React 19 / TypeScript / Vite, Dexie.js, GitHub Pages (default Pages URL,
no custom domain). Same pattern as the coffee roasting tracker.

## v1 scope

Name once, feed, pet and groom, litter, Play (matching puzzle, number
game, and lights out, a fresh one picked at random each time Play is
tapped), bedtime. The
kitty has a drawn face with moods, four colors, and little sounds.
Growth and collectibles are deferred.

## Test deep links

Play is random in normal use, but each game opens directly for testing:

- Matching puzzle: https://tnargy.github.io/kittyApp/?game=matching
- Number game: https://tnargy.github.io/kittyApp/?game=numbers
- Lights out: https://tnargy.github.io/kittyApp/?game=lightsout

The link opens that game on load (once a kitty exists). Play again
after a win replays the same game.

## Develop

```sh
npm install
npm run dev
npm test
npm run build
```
