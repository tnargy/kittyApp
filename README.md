# Kitty — a tiny Tamagotchi

A local-first Tamagotchi-style web app to share with my daughter. She names
a kitty on a welcome screen, then cares for it in short moments through the
day: feeding, petting and grooming, cleaning the litter box, play, and
bedtime.

## The rules

- Needs only change while the app is open. Nothing decays or gets worse
  while the app is closed.
- Missing a visit can never make things worse. Coming back after a gap, the
  kitty is just extra happy to see you — sometimes with a little surprise.
- All data lives in the browser (Dexie.js / IndexedDB). No accounts, no
  server, no sync.

## Tech

React 19 / TypeScript / Vite, Dexie.js, GitHub Pages (default Pages URL,
no custom domain). Same pattern as the coffee roasting tracker.

## v1 scope

Name once, feed, pet and groom, litter, one matching puzzle from Play,
bedtime. Growth, extra puzzles, and collectibles are deferred.

## Develop

```sh
npm install
npm run dev
npm test
npm run build
```
