# Nexus Firebase Security Rules Guide

To enable your **Super Owner Dashboard** powers and stop the "Missing or insufficient permissions" errors, you need to update your Firebase Security Rules. By default, Firebase blocks users from reading *everyone's* data. We need to add a special rule that gives your specific account "God Mode" access.

## 1. Firestore Database Rules

These rules control access to users, posts, and general app data.

1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Select your Nexus project.
3. In the left menu, click **Firestore Database**.
4. Click the **Rules** tab at the top.
5. Replace everything in the editor with the code below.
6. **IMPORTANT:** Change `YOUR_EMAIL@gmail.com` to the exact email address you used to register your owner account (`STELLEN10`).
7. Click **Publish**.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── OWNER: full access ──────────────────
    match /{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.email == "YOUR_EMAIL@gmail.com";
    }

    // ── Users: read public, write own ───────
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }

    // ── Posts: read all, write own ──────────
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.authorId;
    }

    // ── DMs: members only ───────────────────
    match /dms/{dmId} {
      allow read, write: if request.auth.uid in resource.data.members
        || request.auth.token.email == "YOUR_EMAIL@gmail.com";
    }
    
    match /dmRequests/{reqId} {
      allow read, write: if request.auth != null;
    }

    // ── Notifications: own only ─────────────
    match /notifications/{id} {
      allow read, write: if request.auth.uid == resource.data.toUid
        || request.auth.token.email == "YOUR_EMAIL@gmail.com";
    }

    // ── Follows, Usernames ──────────────────
    match /follows/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /usernames/{name} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 2. Realtime Database Rules (For Chat Monitoring)

These rules control access to the live DM messages, typing indicators, and online status.

1. In the left menu of the Firebase Console, click **Realtime Database**.
2. Click the **Rules** tab at the top.
3. Replace everything with the code below.
4. **IMPORTANT:** Change `YOUR_EMAIL@gmail.com` to your email address.
5. Click **Publish**.

```json
{
  "rules": {
    "presence": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "dms": {
      ".read": "auth != null && auth.token.email === 'YOUR_EMAIL@gmail.com'",
      "$dmId": {
        "messages": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    }
  }
}
```

Once you publish these rules, refresh your Nexus app. The Super Owner Dashboard will instantly gain full access to all users and chats without any permission errors!
