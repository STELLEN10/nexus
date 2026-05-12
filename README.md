<div align="center">

# ⚡ NEXUS

### Chat · Share · Connect

**A full-stack social platform built with React 18 & Firebase**

![Version](https://img.shields.io/badge/version-2.0.0-7c3aed?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-06b6d4?style=for-the-badge&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-10-f59e0b?style=for-the-badge&logo=firebase)
![License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)

[Live Demo](https://nexus-chat-10.vercel.app) · [Report Bug](mailto:support@nexus.app) · [Request Feature](mailto:support@nexus.app)

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Firebase Setup](#-firebase-setup)
- [Deployment](#-deployment)
- [Badge System](#-badge-system)
- [Owner Dashboard](#-owner-dashboard)
- [Security](#-security)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🌟 About

Nexus is a full-featured real-time social platform built entirely solo using React and Firebase. It combines the best parts of Discord, Instagram, and Snapchat into one cohesive experience — real-time channels, private messaging, stories, a social feed, vibes, badges, and an in-app coin economy.

> Built from scratch. No templates. No team. Just vision and code.

---

## ✨ Features

### 💬 Messaging
- **Real-time channels** — public & private chat rooms with typing indicators, reactions, edit/delete, reply threading
- **Direct messages** — 1-on-1 private chats with read receipts and soft-delete
- **Group DMs** — multi-person conversations
- **Voice messages** — record and send audio clips directly in chat
- **GIFs & Stickers** — full Giphy integration + custom image uploads
- **Chat wallpapers** — 10 custom backgrounds per DM conversation

### 📱 Social Feed
- **Posts** — text + image posts with emoji reactions and comments
- **Personalised feed** — shows posts from people you follow
- **Stories** — 24-hour photo & text stories with progress bars, pause-on-hold, and view counts
- **Likes & comments** — full interaction system with real-time counts

### 👤 Profiles
- **Custom avatars** — upload any image, stored in Firebase Storage
- **Bio & username** — editable inline on your profile
- **Followers / Following** — follow system with counts and modal lists
- **Badge showcase** — display earned badges with benefit tooltips
- **Wall posts** — others can post directly on your profile

### 🔥 Vibes
- 12 animated mood rings that appear on your avatar
- Real-time via Firebase RTDB — everyone sees your vibe instantly
- Emoji badge attached to avatar with glowing animated ring

### 🏅 Badge System
10 unique badges each with real benefits and coin rewards:

| Badge | Coins | Key Benefit |
|-------|-------|-------------|
| 🌟 Early Adopter | +200 | Gold profile border |
| 👑 Founder | +500 | Crown border + exclusive theme |
| ✓ Verified | +300 | Blue checkmark everywhere |
| 🎨 Creator | +250 | Gradient border + analytics |
| 🔥 OG | +400 | Fire border + red theme |
| 🦋 Social | +150 | Extra DM slots |
| 📖 Storyteller | +100 | 48-hour stories |
| 🐳 Whale | +350 | Top tipper recognition |
| 🦉 Night Owl | +75 | Dark exclusive themes |
| ⚡ Legend | +1000 | All themes + LEGEND title |

### 🪙 Coin Economy
- Every new user starts with 100 coins
- Earn coins by receiving badges
- Tip creators directly from their profile
- Badge shop — spend coins to unlock badges with real benefits
- Owner can gift coins to any user

### 🎨 Customisation
- **6 accent themes** — Violet, Cyan, Rose, Emerald, Amber, Pink
- **Light & Dark mode** — system-aware toggle
- **Chat wallpapers** — per-conversation background patterns
- **Custom profile borders** — unlocked via badges

### 🔔 Notifications
- Real-time notification panel with filter tabs
- Badge award notifications with benefit showcase
- Tip notifications with coin amount
- Follow, like, comment, wall post alerts
- Mobile bottom sheet on small screens

### 🎓 Onboarding
- 9-step interactive tutorial for new users
- Skip available at any time
- "What's New" popup on version updates
- Dot navigation and progress bar

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Styling | Pure CSS with CSS variables (no UI library) |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore |
| Realtime | Firebase Realtime Database |
| Storage | Firebase Storage |
| Hosting | Vercel |
| GIFs | Giphy API |
| Dates | date-fns |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project (free Spark plan works)
- Giphy API key (free)

### Installation

```bash
# Clone the repo
git clone https://github.com/STELLEN10/nexus.git
cd nexus

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Fill in your Firebase config in .env
# then start the dev server
npm start
```

The app runs at `http://localhost:3000`

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
REACT_APP_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.region.firebasedatabase.app
REACT_APP_GIPHY_KEY=your_giphy_key
```

> ⚠️ Never commit your `.env` file. It's already in `.gitignore`.

---

## 📁 Project Structure

```
nexus/
├── public/
│   └── index.html              # App shell with favicon
├── src/
│   ├── components/
│   │   ├── chat/               # MessageBubble, TypingIndicator
│   │   ├── dm/                 # DMBubble, StickerPicker, VoiceRecorder
│   │   ├── owner/              # SuperOwnerDashboard
│   │   ├── settings/           # SettingsModal
│   │   ├── shared/             # Avatar, BadgeDisplay, NotificationBell, TipModal
│   │   ├── social/             # PostCard, CreatePost
│   │   ├── stories/            # StoriesBar, StoryViewer, CreateStoryModal
│   │   └── vibe/               # VibeAvatar, VibePicker
│   ├── context/
│   │   ├── AuthContext.js      # Auth state + profile management
│   │   ├── NotifContext.js     # Browser push notifications
│   │   └── ThemeContext.js     # Theme + color scheme management
│   ├── hooks/
│   │   ├── useBadgeSystem.js   # Badges, shop, awarding
│   │   ├── useChat.js          # Channels, messages, typing
│   │   ├── useCoins.js         # Coin wallet, tipping, owner mode
│   │   ├── useDMs.js           # Direct messages, requests
│   │   ├── useFeed.js          # Posts, reactions, comments
│   │   ├── useFollow.js        # Follow/unfollow system
│   │   ├── useGroupDMs.js      # Group conversations
│   │   ├── useNotifications.js # Notification bell data
│   │   ├── useStories.js       # Stories CRUD
│   │   ├── useSuggestedPeople.js # Friend recommendations
│   │   ├── useUsers.js         # User search, profiles, online status
│   │   ├── useVibe.js          # Vibe system
│   │   └── useWallpaper.js     # Chat wallpapers
│   ├── lib/
│   │   ├── rateLimiter.js      # Client-side rate limiting
│   │   └── validation.js       # Input sanitisation & validation
│   ├── pages/
│   │   ├── AuthPage.js         # Login & register
│   │   ├── ChatPage.js         # Channel chat view
│   │   ├── DMPage.js           # Direct message view
│   │   ├── FeedPage.js         # Social feed + stories
│   │   ├── MainLayout.js       # Shell, rail nav, sidebar, mobile tabs
│   │   └── ProfilePage.js      # User profiles
│   ├── App.js
│   ├── firebase.js             # Firebase initialisation
│   └── index.css               # All styles (CSS variables, components)
├── .env.example
├── .gitignore
└── package.json
```

---

## 🔥 Firebase Setup

### 1. Firestore Indexes

Create these composite indexes in Firebase Console → Firestore → Indexes:

| Collection | Fields | Order |
|-----------|--------|-------|
| `dms` | `members` (Array) · `lastActivity` | Descending |
| `posts` | `authorId` · `createdAt` | Descending |
| `stories` | `authorId` · `createdAt` | Descending |
| `notifications` | `toUid` · `createdAt` | Descending |

> Tip: Just run the app and click the index links that appear in the browser console — they create themselves.

### 2. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.authorId == request.auth.uid;
    }
    match /dms/{dmId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.members;
    }
    match /notifications/{notifId} {
      allow read, update: if request.auth != null && resource.data.toUid == request.auth.uid;
      allow create: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Realtime Database Rules

```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "vibes": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "messages": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "dms": {
      "$dmId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "typing": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

### 4. Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024
        && (request.resource.contentType.matches('image/.*')
            || request.resource.contentType.matches('audio/.*'));
    }
  }
}
```

---

## 🌐 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Project Settings → Environment Variables
# Add all variables from your .env file
```

### After deploying
1. Add your Vercel domain to Firebase Console → Authentication → Authorized Domains
2. Update `REACT_APP_FIREBASE_AUTH_DOMAIN` if needed

---

## 🏅 Badge System

Badges are stored in the `badges` Firestore collection with the document ID being the user's UID.

### Awarding a badge programmatically

```javascript
import { awardBadge } from "./hooks/useBadgeSystem";

// Awards the badge, gives coins, and sends a notification automatically
await awardBadge(userId, "verified");
```

### Badge shop

Users can spend coins to purchase available badges from the Badge Shop, accessible via Settings. Each badge includes a coin price, reward, and list of benefits.

---

## ⚡ Owner Dashboard

Access the owner dashboard via **Profile → Settings → Owner tab**.

**Password:** Set in `SettingsModal.js` → `OwnerSection` function.

### Owner capabilities

| Feature | Description |
|---------|-------------|
| 📊 Overview | Live stats across all collections |
| 👥 User Management | Search, ban, unban, delete any user |
| 🏅 Award Badges | Give any badge + coins to any user |
| 🪙 Coin Gifts | Send any coin amount to any user |
| 📣 Broadcast | Send notification to every user |
| 🔒 Lock Registrations | Prevent new signups |
| 💾 Export CSV | Download full user database |
| ∞ Unlimited Coins | Owner wallet shows ∞ and bypasses balance checks |

---

## 🔒 Security

- All user input passes through `src/lib/validation.js` before any database write
- Client-side rate limiting via `src/lib/rateLimiter.js` (auth: 5/10min, messages: 30/min, posts: 10/hr)
- Firebase config stored in environment variables — never hardcoded
- Firestore Security Rules enforce read/write permissions server-side
- Avatar uploads restricted to Firebase Storage URLs only
- Sticker URLs validated against allowlist (Giphy domains + Firebase Storage)
- HTML injection stripped from all text inputs via `sanitizeText()`

---

## 🗺 Roadmap

### Coming soon
- [ ] Voice calls (WebRTC)
- [ ] Video calls
- [ ] Screen sharing
- [ ] Explore / Discover page
- [ ] Pinned messages in channels
- [ ] Message threads (Slack-style)
- [ ] Block & mute users
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Polls in posts and chats
- [ ] Native iOS & Android apps (React Native)

### Monetisation (planned)
- [ ] Nexus Pro subscription
- [ ] Real money tipping via Stripe
- [ ] Paid exclusive channels
- [ ] Creator fund

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with 🔥 by STELLEN**

*Nexus — Chat. Share. Connect.*

</div>
