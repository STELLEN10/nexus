# NEXUS

Nexus is a React and Firebase social app with realtime chat, profiles, stories, DMs, badges, coins, notifications, themes, and owner administration.

## Live App

[Enter Nexus](https://nexus-chat-10.vercel.app)

## What Is Included

- Realtime public chat and direct messages
- Social feed with posts, comments, reactions, and profile walls
- Stories and story viewing
- Profile pages with avatars, follows, badges, and wallet access
- Coin wallet, creator tips, owner gifts, and transaction history
- Badge shop and owner badge awards
- Notifications for follows, tips, badges, broadcasts, and messages
- Light, dark, midnight, and accent color themes
- Owner dashboard for users, coins, badges, broadcasts, reports, and exports

## Recent Fixes

- Coin gifts now update the recipient wallet and create transaction history.
- Owner accounts keep an unlimited wallet balance for tipping and gifting.
- The wallet now shows incoming owner gifts in Recent Activity.
- Owner Quick Actions now run real actions for registration lock, broadcasts, report clearing, exports, and owner wallet refill.
- Settings navigation, legal/help buttons, and toggles now respond properly.
- Settings preferences persist locally.
- Decorative emoji in the wallet, settings, notifications, badge, and owner surfaces were replaced with reusable SVG icons.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18 |
| Routing | React Router 6 |
| Backend | Firebase Auth, Firestore, Realtime Database |
| Utilities | date-fns |
| Hosting | Vercel |

## Quick Start

```bash
git clone https://github.com/STELLEN10/nexus.git
cd nexus
npm install
npm start
```

## Environment Variables

Create a `.env` file with:

```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_DATABASE_URL=
REACT_APP_GIPHY_KEY=
```

## Project Structure

```text
src/
  components/
    chat/
    dm/
    owner/
    settings/
    shared/
    social/
    stories/
    vibe/
  context/
  hooks/
  lib/
  pages/
  firebase.js
  App.js
```

## Coin System

Users start with an initial wallet balance. Tips and owner gifts update Firestore wallet documents and write records to the `transactions` collection, so balances and wallet activity stay in sync.

Owner access stores the owner UID locally after unlocking the owner dashboard. Owner wallets are treated as unlimited and can be refilled from Owner Quick Actions.

## Owner System

The Super Owner Dashboard includes:

- Platform stats
- User moderation
- Badge awards
- Coin gifts
- Global broadcasts
- Registration lock controls
- Report clearing
- CSV user export
- Owner wallet refill

Owner access is available from Settings under the Owner section.

## Firebase Rules

The repository includes:

- `firestore.rules`
- `database.rules.json`
- `FIREBASE_RULES.md`

Review those files before deploying to a production Firebase project.

## Scripts

```bash
npm start
npm run build
```

## Notes

Coins are virtual in-app points and have no real-world value. Badge and coin systems are designed for community engagement, moderation, and creator rewards inside Nexus.
