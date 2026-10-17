# Catfe (mobile)

Expo / React Native app — the **primary** Catfe product.

## Run on a phone (recommended)

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android).

## Simulators

```bash
npx expo start --ios      # macOS + Xcode
npx expo start --android  # Android Studio emulator
```

## Web preview (dev only)

Metro can serve a browser shell for quick UI checks. Native map uses `react-native-maps`; the web bundle uses an OSM/Leaflet embed.

```bash
npx expo start --web --port 8081
```

## Features

- Map of UW-area study spots + filters
- AI Cat recommender (on-device rules; no key required)
- Favorites + star ratings (AsyncStorage)
- Friend check-in feed (seed data + Spotify stubs)
- Session logging with optional photo (`expo-image-picker`)
