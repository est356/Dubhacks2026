# Catfe — Find Your Perfect Study Spot

## The Problem
Finding a good place to study is a constant struggle for college students and remote workers. It's hard to know if a cafe has reliable Wi-Fi, enough outlets, or the right noise level before you get there. Studying can feel isolating, and coordinating with friends is disjointed.

## The Solution
**Catfe** is a **mobile app** (Expo / React Native) that takes the guesswork out of studying. It combines cafe discovery, study-ability ratings (Wi-Fi, outlets, noise), a social layer to see where friends are checked in, and a cute AI Cat that recommends spots from a short description of your needs.

## Track
* **Main Track:** Community Kitchen (Social Good / Community Support) OR Chef's Choice (UI/UX)

## Team
* **Frontend & UI/UX:** Yina, Natalie
* **Backend & API:** All of us!
* **Full Stack:** Alexis
* **AI Recommendation Chatbot:** Esther
* **Slide Deck & Pitching:** All

## Quick start (mobile + Expo Go)

```bash
cd mobile
npm install
npm start                 # laptop + same Wi‑Fi
# if the project never appears in Expo Go's list / QR fails:
npm run start:tunnel      # works across networks; paste exp:// URL in Expo Go
```

**Important:** Expo Go’s “servers on your network” list often stays empty — that is normal. Use **Scan QR** in Expo Go or paste the terminal `exp://…` URL. Full phone steps: [`mobile/README.md`](mobile/README.md).

> Project targets **Expo SDK 54** so App Store / Play Store Expo Go works. `web/` is an archived Next.js prototype.

## The 3-Minute Demo Plan
1. Open the app to the interactive map.
2. Ask the AI Cat for a spot: "quiet, lots of outlets, close to campus."
3. Show the friend activity feed (checked-in + Spotify stub).
4. Log a study session with an optional photo.
5. (Stretch) Night Mode / safety — not shipped yet.
