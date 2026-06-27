---
name: SaveFlow EAS OTA Update
description: EAS account/project details and OTA push command for SaveFlow video-downloader app
---

## Rule
Always use the OTA command pattern below for pushing updates. Never use plain `eas update` without the VCS bypass flags. Always include `--environment production` in non-interactive mode.

**Why:** Replit environment has no git VCS configured; EAS requires VCS bypass flags or it fails. `--environment` flag is required in `--non-interactive` mode (EAS CLI ≥ 18).

## Details
- Account: `cleooo`
- Project: `saveflow`
- Project ID: `f929f7fd-4d04-4466-8abf-112233bacea3`
- Runtime version: `1.1.0` (last published)
- Channel: `production`

## OTA push command
```bash
cd artifacts/video-downloader && EAS_NO_VCS=1 EAS_SKIP_AUTO_FINGERPRINT=1 EXPO_TOKEN=$EXPO_TOKEN eas update --branch production --environment production --message "..." --non-interactive
```

## How to apply
Run from workspace root, always include all flags, always `--non-interactive`. Requires `EXPO_TOKEN` secret set in Replit Secrets.

## eas-cli version
Must be ≥ 18.0.0. If outdated, run: `npm install -g eas-cli`
