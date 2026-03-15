# Nexus Social — Chat · Share · Connect

A full-featured social + chat platform built entirely on Firebase. No backend server required.

## Features
- **Firebase Auth** — register/login with username uniqueness check
- **Direct Messages** — search by username, send DM request, accept/decline
- **Real-time chat** — public/private channels with typing indicators, reactions, replies, stickers
- **GIFs & Stickers** — Giphy search + custom uploads via Firebase Storage
- **Social wall** — post text/images on your profile, likes, comments, share link
- **Profile pages** — `/u/username` shareable URL, avatar upload, bio
- **Online presence** — live status in DM list and profiles
- **Read receipts** — seen/sent indicators in DMs
- **Unread badges** — per-conversation unread counts
- **Browser notifications** — when someone DMs you (requires permission)

## Setup

### 1. Install
```bash
npm install
```

### 2. Enable Firebase services
In [console.firebase.google.com](https://console.firebase.google.com):

**Authentication** → Sign-in method → enable **Email/Password**

**Firestore Database** → Create → Start in test mode

**Realtime Database** → Create → Start in test mode
→ Copy the URL (e.g. `https://nexus-chat-10-default-rtdb.firebaseio.com`)

**Storage** → Get started → Start in test mode

### 3. Check `src/firebase.js`
Make sure `databaseURL` matches your Realtime DB URL.

### 4. Run
```bash
npm start
```

---

## Firestore rules (production)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /usernames/{username} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    match /rooms/{roomId} {
      allow read, write: if request.auth != null;
    }
    match /dms/{dmId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
    }
    match /dmRequests/{id} {
      allow read, write: if request.auth != null;
    }
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.authorId;
      match /comments/{commentId} {
        allow read, create: if request.auth != null;
        allow delete: if request.auth.uid == resource.data.authorId;
      }
    }
  }
}
```

## Realtime Database rules (production)
```json
{
  "rules": {
    "messages": {
      "$roomId": { ".read": "auth != null", ".write": "auth != null" }
    },
    "dms": {
      "$dmId": { ".read": "auth != null", ".write": "auth != null" }
    },
    "typing": {
      "$roomId": { ".read": "auth != null", ".write": "auth != null" }
    },
    "presence": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth.uid == $uid"
      }
    }
  }
}
```

## Storage rules (production)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /posts/{uid}/{file} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /stickers/{uid}/{file} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
  }
}
```

## Folder structure
```
src/
├── firebase.js
├── App.js
├── index.js / index.css
├── context/
│   ├── AuthContext.js       # Auth + username check + presence
│   └── NotifContext.js      # Browser push notifications
├── hooks/
│   ├── useChat.js           # Rooms, messages, typing, presence
│   ├── useDMs.js            # DM requests, DM list, DM messages, read receipts
│   ├── useFeed.js           # Wall posts, likes, comments
│   └── useUsers.js          # Username search, profiles, online status
├── pages/
│   ├── AuthPage.js
│   ├── MainLayout.js        # App shell with nav rail + sidebar
│   ├── ChatPage.js          # Channel chat
│   ├── DMPage.js            # Direct message conversation
│   └── ProfilePage.js       # User profile + wall
└── components/
    ├── shared/
    │   └── Avatar.js
    ├── chat/
    │   ├── MessageBubble.js
    │   └── TypingIndicator.js
    ├── dm/
    │   ├── DMBubble.js         # DM message with read receipts + sticker support
    │   ├── DMRequestsBadge.js  # Accept / decline incoming DM requests
    │   ├── StickerPicker.js    # Giphy search + Firebase Storage upload
    │   └── UserSearch.js       # Find users by username
    └── social/
        ├── PostCard.js          # Post with likes, comments, share
        └── CreatePost.js        # Post composer with image upload
```
