---
name: SaveFlow project structure
description: Lokasi folder app dan cara reinstall setelah restrukturisasi monorepo
---

App sekarang ada di `video-downloader/` langsung di root workspace (bukan `artifacts/video-downloader/`).

Workspace hanya punya satu package: `video-downloader`.

**Why:** User minta bersihkan monorepo — hapus artifacts/, lib/, scripts/, attached_assets/, app.json root, eas.json root. Semua itu tidak dipakai oleh app.

**How to apply:**
- pnpm-workspace.yaml hanya berisi `- video-downloader`
- Workflow: `pnpm --filter @workspace/video-downloader run dev`
- Typecheck: `pnpm --filter @workspace/video-downloader run typecheck`
- Jika ada error "Cannot find module" setelah folder pindah: hapus pnpm-lock.yaml + node_modules, lalu `pnpm install --prefer-offline`
- tsconfig.json di video-downloader TIDAK punya references ke lib (sudah dihapus)
