# SaveFlow

## Overview

SaveFlow — Expo mobile app (Android) untuk download video & foto dari berbagai platform tanpa watermark.

## Stack

- **Framework**: Expo SDK 56 + React Native 0.85.3
- **Package manager**: pnpm (workspace)
- **TypeScript version**: 6.0
- **Animations**: react-native-reanimated 4.3.1 (UI thread worklets)
- **State**: Zustand
- **UI**: Plus Jakarta Sans, expo-blur, expo-linear-gradient

## App Location

Semua kode app ada di folder `video-downloader/`.

## Key Commands

- `pnpm --filter @workspace/video-downloader run dev` — jalankan Expo dev server
- `pnpm --filter @workspace/video-downloader run typecheck` — full typecheck
- `pnpm run typecheck` — shortcut typecheck

## Features

- Download video/foto dari TikTok, Instagram, YouTube, Twitter/X, Facebook, Pinterest, Reddit, Vimeo
- No-watermark download via Cobalt API
- Clipboard URL detection otomatis
- Download history (AsyncStorage)
- Download progress tracking realtime
- Quality selector (360p–1080p)
- Dark theme — Deep violet glassmorphism

## Screens

- **Home** — Stats, platform grid, recent downloads
- **Download (Paste)** — Paste URL, shimmer skeleton, progress bar
- **History** — Grouped by date, BlurView context menu, search
- **Settings** — Quality, preferences, storage

## User preferences

- Bahasa Indonesia di UI
- Dark theme (#07091C background, #4F80FF blue, #00CCAB teal primary)
- Font: Plus Jakarta Sans (800ExtraBold headers, 700Bold labels, 600SemiBold body)
- Semua animasi di UI thread (Reanimated worklets)
