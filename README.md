<div align="center">

<br/>

```
 ____                  _____ _               
/ ___|  __ ___   _____|  ___| | _____      __
\___ \ / _` \ \ / / _ \ |_  | |/ _ \ \ /\ / /
 ___) | (_| |\ V /  __/  _| | | (_) \ V  V / 
|____/ \__,_| \_/ \___|_|   |_|\___/ \_/\_/  
                                               
```

### **VIDEO DOWNLOADER · TANPA WATERMARK · TANPA LOGIN**

[![Expo](https://img.shields.io/badge/Expo_SDK-56-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.79-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://android.com)
[![License](https://img.shields.io/badge/License-MIT-C8F500?style=for-the-badge)](LICENSE)

<br/>

> Download video & foto dari **8+ platform** dalam satu sentuhan —  
> tanpa watermark, tanpa akun, sepenuhnya gratis.

<br/>

</div>

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🔗 **Smart URL Detection** | Otomatis mendeteksi platform dari link yang ditempel |
| 🚫 **No Watermark** | Hapus watermark TikTok, Instagram, dan lainnya |
| 📸 **Galeri & Video** | Unduh single video, foto, atau seluruh galeri sekaligus |
| 📊 **Quality Selector** | Pilih kualitas 360p · 480p · 720p · 1080p sesuai kebutuhan |
| ⚡ **Realtime Progress** | Kecepatan download + ETA + ukuran file secara live |
| 📋 **Clipboard Auto-paste** | Paste link langsung dari clipboard dengan satu tap |
| 🕐 **Download History** | Riwayat lengkap dengan grup per tanggal & pencarian |
| 🎨 **Dark + Neon UI** | Desain premium gelap dengan aksen neon lime green |
| 📱 **Smooth Animations** | Semua animasi di UI thread — tidak pernah lag |

---

## 🌐 Platform Didukung

<table>
  <tr>
    <td align="center"><img src="https://img.shields.io/badge/YouTube-FF0000?style=flat-square&logo=youtube&logoColor=white"/></td>
    <td align="center"><img src="https://img.shields.io/badge/TikTok-69C9D0?style=flat-square&logo=tiktok&logoColor=black"/></td>
    <td align="center"><img src="https://img.shields.io/badge/Instagram-E1306C?style=flat-square&logo=instagram&logoColor=white"/></td>
    <td align="center"><img src="https://img.shields.io/badge/Facebook-1877F2?style=flat-square&logo=facebook&logoColor=white"/></td>
  </tr>
  <tr>
    <td align="center"><b>YouTube</b></td>
    <td align="center"><b>TikTok</b></td>
    <td align="center"><b>Instagram</b></td>
    <td align="center"><b>Facebook</b></td>
  </tr>
  <tr>
    <td align="center"><img src="https://img.shields.io/badge/Twitter/X-1DA1F2?style=flat-square&logo=x&logoColor=white"/></td>
    <td align="center"><img src="https://img.shields.io/badge/Pinterest-E60023?style=flat-square&logo=pinterest&logoColor=white"/></td>
    <td align="center"><img src="https://img.shields.io/badge/Reddit-FF4500?style=flat-square&logo=reddit&logoColor=white"/></td>
    <td align="center"><img src="https://img.shields.io/badge/Vimeo-1AB7EA?style=flat-square&logo=vimeo&logoColor=white"/></td>
  </tr>
  <tr>
    <td align="center"><b>Twitter / X</b></td>
    <td align="center"><b>Pinterest</b></td>
    <td align="center"><b>Reddit</b></td>
    <td align="center"><b>Vimeo</b></td>
  </tr>
</table>

---

## 🎨 Design System

```
Background   #0D0D0D  ████  Ultra dark
Accent       #C8F500  ████  Neon lime green  
Card         #141414  ████  Dark card
Border       #2A2A2A  ████  Subtle border
Text         #FFFFFF  ████  Primary text
Subtext      #888888  ████  Secondary text
Success      #00D68F  ████  Green success
Error        #FF4D4D  ████  Red error
```

**Font:** Plus Jakarta Sans — 800ExtraBold / 700Bold / 600SemiBold / 500Medium

**Animasi:** Reanimated 4.x · semua worklet di UI thread · spring damping & timing

---

## 🚀 Cara Install

### Prerequisites
- Node.js 18+
- pnpm `npm i -g pnpm`
- Expo Go app (Android)

### Setup

```bash
# Clone repo
git clone https://github.com/ihsanaminul/SaveFlow-2.0.git
cd SaveFlow-2.0

# Install dependencies
pnpm install

# Jalankan dev server
pnpm --filter @workspace/video-downloader run dev
```

Scan QR code dengan **Expo Go** di Android kamu.

---

## 📁 Struktur Proyek

```
SaveFlow-2.0/
├── video-downloader/          # Root app
│   ├── app/
│   │   ├── _layout.tsx        # Root layout + font loading
│   │   ├── index.tsx          # Entry point (routing)
│   │   ├── welcome.tsx        # Welcome/onboarding screen
│   │   └── (tabs)/
│   │       ├── _layout.tsx    # Floating pill navbar
│   │       ├── index.tsx      # Home — download hub
│   │       ├── history.tsx    # Riwayat download
│   │       └── settings.tsx   # Pengaturan & about
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   └── ErrorFallback.tsx
│   ├── hooks/
│   │   ├── useDownloader.ts   # Core download logic
│   │   ├── useSettings.ts
│   │   ├── useHistory.ts
│   │   └── useClipboardCheck.ts
│   ├── services/
│   │   ├── downloader.ts      # Cobalt API integration
│   │   ├── history.ts         # AsyncStorage persistence
│   │   └── settings.ts
│   ├── store/
│   │   └── useStore.ts        # Zustand global state
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── fileUtils.ts
│   │   └── urlValidator.ts
│   └── constants/
│       └── colors.ts          # Design tokens
└── package.json
```

---

## 🛠️ Tech Stack

| Layer | Library | Version |
|---|---|---|
| Framework | Expo SDK | 56 |
| Runtime | React Native | 0.85.3 |
| Language | TypeScript | 5.x |
| Navigation | Expo Router | 4.x |
| Animation | Reanimated | 4.3.1 |
| State | Zustand | 5.x |
| Storage | AsyncStorage | — |
| Icons | Expo Vector Icons | — |
| Image | Expo Image | — |
| Font | Plus Jakarta Sans | — |
| Haptics | Expo Haptics | — |
| Download API | Cobalt | — |

---

## 📱 Screens

### 🏠 Home
URL input dengan auto-detect platform, shimmer skeleton saat analisis, media info card dengan thumbnail, quality picker, progress bar realtime, statistik download.

### 🕐 History
SectionList dikelompokkan per tanggal, active downloads dengan pulse animation, search + filter (Semua / Video / Foto / Gagal), swipe-to-delete.

### ⚙️ Settings
Quality selector, toggle no-watermark & auto-save, platform grid, about section.

---

## 🔧 Commands

```bash
# Dev server
pnpm --filter @workspace/video-downloader run dev

# TypeScript check
pnpm --filter @workspace/video-downloader run typecheck

# Build APK (production)
eas build --platform android --profile production
```

---

## 📄 License

```
MIT License — free to use, modify, and distribute.
See LICENSE for full text.
```

---

<div align="center">

<br/>

**Dibuat dengan ❤️ dan ☕**

```
© 2025 SaveFlow
by Cleo 桜闇
```

[![GitHub](https://img.shields.io/badge/GitHub-ihsanaminul-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ihsanaminul/SaveFlow-2.0)

<br/>

*"Download apa saja, kapan saja, di mana saja."*

</div>
