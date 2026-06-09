# Implementation Plan - Devices Tycoon Customization & Google Firestore Sync

This plan details how we will enhance the game's designer to match Devices Tycoon's customization depth, and how we will store player accounts, game saves, leaderboards, and friends lists in Google Cloud Firestore.

## User Review Required

> [!IMPORTANT]
> **Firestore Service Credentials**: To store data in Google Cloud, the backend will require three environment variables:
> 1. `FIREBASE_PROJECT_ID`
> 2. `FIREBASE_CLIENT_EMAIL`
> 3. `FIREBASE_PRIVATE_KEY`
> 
> We will configure the project to automatically fall back to the local `players.json` file in development if these variables are missing. This ensures the app is always fully functional out-of-the-box, but upgrades to Google Firestore when deployed.

> [!TIP]
> **Real Multiplayer social features**: By using Firestore on the backend, the Friends and Leaderboard systems will no longer be mock-only! Players will be able to see other real players on the leaderboard, search for their usernames to add them as friends, and gift them virtual money in real-time.

## Proposed Changes

### 1. Visual Customization Enhancements (Designer)

To match Devices Tycoon, we will add advanced visual design controls in the editor:
- **Body & Chassis Color**: Pick from premium color presets (Titanium Gray, Alpine Green, Deep Purple, Gold, Matte Black, Silver).
- **Frame & Back Shell Finish**: Choose between Matte Glass, Brush Titanium, or Glossy Ceramic.
- **Logo Symbol**: Select a brand logo to show on the back (e.g., Apple, Star, Leaf, Delta, Circle).
- **Camera Module Layout**: Choose back camera configurations: Single Lens, Vertical Dual, Square Triple, Ring Array, or Circular.
- **Packaging Box Customization**: Choose box base color, logo color, text color, and style (Minimalist, Premium, Bold).
- **Front/Back Mockup View**: Add a toggle button in the preview mockup to switch between Front View (Screen/Notch) and Back View (Camera array + Logo + Chassis color) to see designs in real-time.

---

### 2. Google Firestore Integration (Backend)

#### [MODIFY] [playerStore.ts](file:///Users/Apple/Documents/game/server/src/store/playerStore.ts)
- Initialize the Google Cloud `Firestore` client if environment credentials are present.
- Migrate database operations (`insert`, `delete`, `getByUuid`, `getByUsername`, `usernameExists`, `getAllPlayers`, `atomicUpdate`) to be asynchronous, running Firestore queries.
- Add transaction support for `atomicUpdate` to handle multi-client updates safely.
- Keep the local filesystem storage (`data/players.json`) as a fallback when credentials are not supplied.

#### [MODIFY] [server.ts](file:///Users/Apple/Documents/game/server/src/server.ts)
- Update API endpoints to be `async` and `await` all `playerStore` calls.
- Add save game sync endpoints:
  - `POST /api/players/:uuid/save`: Uploads and saves the player's full JSON game state to a separate `saves` collection (or `saves/{uuid}.json` locally).
  - `GET /api/players/:uuid/save`: Loads and returns the player's JSON save state.

#### [MODIFY] [market.ts](file:///Users/Apple/Documents/game/server/src/modules/market.ts), [social.ts](file:///Users/Apple/Documents/game/server/src/modules/social.ts), [workforce.ts](file:///Users/Apple/Documents/game/server/src/modules/workforce.ts)
- Add `await` keyword to all `playerStore` queries to support the async migration.

---

### 3. Frontend Cloud Sync Integration (Client)

#### [NEW] [api.ts](file:///Users/Apple/Documents/game/src/lib/api.ts)
- Implement a client-side API helper using native `fetch` to connect the React game store to the Express backend.

#### [MODIFY] [useGameStore.ts](file:///Users/Apple/Documents/game/src/store/useGameStore.ts)
- Maintain `playerUuid` in the persistent store.
- On company creation (`startGame`), register the player on the server to obtain a `uuid`.
- Periodically (every monthly tick) sync the full game save state to the cloud.
- Modify the `SocialTab` to load other real players from the server leaderboard and link friend interactions (adding/donating) to the live API instead of local random mocks.

---

### 4. Configuration and Environment Variables

#### [MODIFY] [render.yaml](file:///Users/Apple/Documents/game/render.yaml)
- Add placeholder variables under the environment configuration for:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  so Render prompts you to input them during deployment setup.

---

## Verification Plan

### Automated Tests
- Run backend compilation: `npm run build --prefix server`
- Launch the Express server and check for successful startup logs:
  - Without credentials: "Firestore credentials not found. Falling back to local file persistence."
  - With credentials: "Initialized Google Cloud Firestore."

### Manual Verification
- **Visual Design**: Customize a phone with Deep Purple color, a triple camera array, and a leaf logo. Verify the mockup changes appropriately. Toggle Front/Back and verify.
- **Cloud Sync**: Start a game, advance a month, restart the browser tab, and verify that the save state syncs and restores correctly from the server database.
- **Leaderboard**: Verify that registering multiple players lists them in the social rankings in real-time.
