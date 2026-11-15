// The hidden games index: a list of every Play game with its test
// deep link, for testing. Not linked from the kitty view — it only
// shows at /kittyApp/games (see isGamesIndexPath in games.ts).
// Each row is a plain link to the game's deep link, so the URL in
// the address bar is the link itself and can be copied or refreshed.

import { GAME_IDS, GAME_INFO, type GameId } from '../games'

export default function GamesIndex({ onBack }: { onBack: () => void }) {
  return (
    <main className="puzzle-view">
      <button type="button" className="back" onClick={onBack}>
        🐱 Back to kitty
      </button>
      <h1>Games</h1>
      <p>
        Test links for every game — this page isn&rsquo;t linked from the
        kitty view.
      </p>
      <ul className="game-list">
        {GAME_IDS.map((id: GameId) => (
          <li key={id}>
            {/* ./ resolves against the page URL's directory, so it
                lands on the app root from /kittyApp/games (no
                trailing slash: the browser treats `games` as a file
                in /kittyApp/) and on /kittyApp/games/ with one —
                where the ?game= param still wins over the index.
                ../ would be wrong: from the slash-less URL it
                climbs past the app root to the bare host. */}
            <a href={`./?game=${id}`}>
              <strong>{GAME_INFO[id].name}</strong>
              <span>{GAME_INFO[id].blurb}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
