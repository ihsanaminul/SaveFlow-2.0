---
name: SaveFlow UI design system
description: Deep dark purple glassmorphism UI for SaveFlow — color tokens, components, screen structure, animation patterns.
---

## Theme (v2 — full redesign matching reference image)
- Background: `#09071A` (very dark purple-black)
- Cards: `rgba(20,12,50,0.85)` with `rgba(139,92,246,0.18)` border
- Accent: `#7C3AED` / `#8B5CF6` / `#A78BFA` (purple scale)
- Glow: `rgba(139,92,246,0.55)`
- `C` and `G` exported from `constants/colors.ts`

## Font = Plus Jakarta Sans
- 800ExtraBold → headings/numbers
- 700Bold → labels, section titles
- 600SemiBold → row titles, medium emphasis
- 500Medium → body, subtitles
- 400Regular → meta, captions

## Key Components
- `FloatingBackground` — animated orbs via RN Animated.loop (NOT Reanimated)
- `GlassCard` — dark card with purple border + shadow, optional `glow` prop
- `PlatformBadge` — colored circle with emoji/letter for each platform (replaces old PlatformIcon)
- `CircularProgress` — SVG ring via react-native-svg + Animated.createAnimatedComponent(Circle); strokeDashoffset for progress

## Routing
- `app/index.tsx` — entry, checks AsyncStorage `welcomed`, redirects to `/welcome` or `/(tabs)`
- `app/welcome.tsx` — splash with floating PlatformBadge icons + "Get Started" → sets AsyncStorage `welcomed=1`
- Stack in `_layout.tsx` includes: index, welcome, (tabs), +not-found

## Screens
- `(tabs)/index.tsx` — Home: stat row + Quick Actions grid + Recent Downloads list
- `(tabs)/paste.tsx` — URL input, platform detection badge, video preview card, radio quality picker (1080/720/480/360), download button, inline progress, success
- `(tabs)/progress.tsx` — circular SVG ring for active downloads (CircularProgress) + All/Video/Audio filter tabs
- `(tabs)/history.tsx` — search bar + grouped SectionList + slide-up ContextMenu modal (Open/Share/Re-download/Delete)
- `(tabs)/settings.tsx` — sections: Appearance, Downloads (quality pills + toggles), Storage, About

## Tab Bar (`(tabs)/_layout.tsx`)
Custom `CustomTabBar` — 5 tabs: Home, Downloads, Paste (center), History, Settings
- Active icon: `rgba(124,58,237,0.16)` bg behind icon
- Center Paste: `LinearGradient` 54×54 circle, glow shadow
- Label: 10px, active color `#A78BFA`

## Animations (RN Animated API ONLY — Reanimated MUST NOT be re-added)
- `FadeSlideIn` component: opacity + translateY, useNativeDriver: true
- Floating orbs: Animated.loop(sequence) translateY
- Press effects: Animated.spring scale 0.91→1, useNativeDriver: true
- Progress bars: Animated.timing width, useNativeDriver: false
- Circular ring: Animated.createAnimatedComponent(Circle), strokeDashoffset
- Glow pulse: Animated.loop opacity
- ContextMenu: spring scale + timing opacity (Modal)

## History persistence
`_layout.tsx` on mount calls historyService.getHistory() and settingsService.getSettings() → store.setHistory() + loadSettings(). Zustand is in-memory only; AsyncStorage is the source of truth.

**Why:** react-native-reanimated causes build/runtime crash on this project (any version). NEVER re-add.
