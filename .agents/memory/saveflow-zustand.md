---
name: SaveFlow Zustand Architecture
description: Zustand store replaces old Context/Reducer pattern; no Provider needed; historyService.addRecord now returns DownloadRecord
---

## Rule
The app state lives in `store/useStore.ts` (Zustand). No Provider wrapping is needed in `_layout.tsx`. The old `store/downloadStore.tsx` is dead code — don't revive it.

**Why:** Migrated from Context+Reducer to Zustand for simpler state access across 5-tab layout without prop drilling.

## Key changes
- `historyService.addRecord()` returns `DownloadRecord` (not void) — required so `useDownloader` can call `addHistory(record)` directly
- `hooks/useDownloader.ts` uses `useStore()` selectors (startDownload, updateProgress, updateStatus, completeDownload, failDownload, addHistory)
- `hooks/useHistory.ts` uses `useStore()` — loads history on mount via `setHistory`
- Settings still use `useSettings` hook + `settingsService` (separate from Zustand store)

## Color token renames (old → new)
- `C.text` → `C.white`
- `C.text2` → `C.muted`  
- `C.text3` → `C.dim`
- `C.purple` = `#7B4DFF` (was `#7c3aed`)
- `C.purple2` = `#9A6CFF` (new lighter purple)
- Removed: `C.cyan`, `C.cyanDim`, `C.cyanGlow`, `C.pink`, `C.blue`, `C.white04/06/08/12/20`
- Added: `C.bg2`, `C.bg3`, `C.card`, `C.cardHi`, `C.faint`, `C.purpleGlow`, `C.warningDim`

## How to apply
Any new screen must use new C tokens. `useColors()` hook now just returns `C` directly.
