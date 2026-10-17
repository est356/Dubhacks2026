# Catfe (mobile)

Expo / React Native app — the **primary** Catfe product.

**SDK:** Expo **54** (matches App Store / Play Store Expo Go).

## Open on your phone (Expo Go)

Do this on the **same laptop** that runs Metro (not a cloud VM URL unless you use tunnel).

### 1. Start Metro in this folder

```bash
cd mobile
npm install
npm start
# same as: npx expo start
```

You should see a **QR code** and an `exp://…` URL in the terminal.

### 2. Open with Expo Go (do not wait for the “servers on your network” list)

Metro often **does not appear** in Expo Go’s project / LAN discovery list (mDNS/LAN discovery fails on many networks). That does **not** mean Metro isn’t running.

**Use one of these instead:**

1. In **Expo Go**, tap **Scan QR code** (built-in scanner — more reliable than the system camera on some phones).
2. Or in Expo Go: **Enter URL manually** and paste the `exp://…` line from the terminal.

Same Wi‑Fi helps for LAN. Turn **VPN off**. On iOS, allow **Local Network** for Expo Go (Settings → Expo Go).

### 3. If QR / LAN still fails → use a tunnel (no discovery needed)

```bash
cd mobile
npm run start:tunnel
# same as: npx expo start --tunnel
```

Scan the new QR / paste the new `exp://` or `https://…` URL shown in the terminal.  
Tunnel works across different networks (and is required if Metro runs on a **cloud VM** or a machine your phone can’t reach on LAN).

| Where Metro runs | Use |
| --- | --- |
| Your laptop, phone on **same Wi‑Fi** | `npm start` → Scan QR / paste `exp://` |
| Different Wi‑Fi, VPN, dorm AP isolation, **or cloud VM** | `npm run start:tunnel` |

## Scripts

```bash
npm start            # LAN (default)
npm run start:lan    # explicit LAN
npm run start:tunnel # ngrok tunnel — skip LAN discovery
npm run web          # browser preview only (not the phone path)
```

## Simulators (optional)

```bash
npx expo start --ios      # macOS + Xcode
npx expo start --android  # Android Studio emulator
```

## Features

- Map of UW-area study spots + filters
- AI Cat recommender (on-device rules; no key required)
- Favorites + star ratings (AsyncStorage)
- Friend check-in feed (seed data + Spotify stubs)
- Session logging with optional photo (`expo-image-picker`)
