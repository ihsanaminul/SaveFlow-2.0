import { create } from 'zustand'
import { DownloadProgress, DownloadRecord, AppSettings } from '@/types'

const DEFAULT_SETTINGS: AppSettings = {
  defaultQuality: '720',
  autoSaveToGallery: true,
  preferNoWatermark: true,
  maxConcurrentDownloads: 3,
}

interface AppStore {
  activeDownloads: Record<string, DownloadProgress>
  history: DownloadRecord[]
  isLoadingHistory: boolean
  settings: AppSettings

  startDownload:           (dl: DownloadProgress) => void
  updateProgress:          (id: string, progress: number) => void
  updateProgressWithStats: (id: string, progress: number, speed: number, eta: number, bytesDownloaded: number, totalBytes: number) => void
  updateStatus:            (id: string, status: DownloadProgress['status']) => void
  completeDownload:        (id: string) => void
  failDownload:            (id: string, error: string) => void
  cancelDownload:          (id: string) => void

  setHistory:    (history: DownloadRecord[]) => void
  addHistory:    (record: DownloadRecord) => void
  removeHistory: (id: string) => void
  clearHistory:  () => void

  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  loadSettings:  (s: AppSettings) => void
}

export const useStore = create<AppStore>((set) => ({
  activeDownloads:  {},
  history:          [],
  isLoadingHistory: true,
  settings:         DEFAULT_SETTINGS,

  startDownload: (dl) => set((s) => ({
    activeDownloads: { ...s.activeDownloads, [dl.id]: dl },
  })),

  updateProgress: (id, progress) => set((s) => ({
    activeDownloads: {
      ...s.activeDownloads,
      [id]: { ...s.activeDownloads[id], progress, status: 'downloading' },
    },
  })),

  updateProgressWithStats: (id, progress, speed, eta, bytesDownloaded, totalBytes) => set((s) => ({
    activeDownloads: {
      ...s.activeDownloads,
      [id]: {
        ...s.activeDownloads[id],
        progress,
        status: 'downloading',
        speed,
        eta,
        bytesDownloaded,
        totalBytes,
      },
    },
  })),

  updateStatus: (id, status) => set((s) => ({
    activeDownloads: {
      ...s.activeDownloads,
      [id]: { ...s.activeDownloads[id], status },
    },
  })),

  completeDownload: (id) => set((s) => {
    const { [id]: _, ...rest } = s.activeDownloads
    return { activeDownloads: rest }
  }),

  failDownload: (id, error) => set((s) => ({
    activeDownloads: {
      ...s.activeDownloads,
      [id]: { ...s.activeDownloads[id], status: 'failed', error },
    },
  })),

  cancelDownload: (id) => set((s) => {
    const { [id]: _, ...rest } = s.activeDownloads
    return { activeDownloads: rest }
  }),

  setHistory:    (history) => set({ history, isLoadingHistory: false }),
  addHistory:    (record)  => set((s) => ({ history: [record, ...s.history] })),
  removeHistory: (id)      => set((s) => ({ history: s.history.filter((r) => r.id !== id) })),
  clearHistory:  ()        => set({ history: [] }),

  updateSetting: (key, value) => set((s) => ({
    settings: { ...s.settings, [key]: value },
  })),
  loadSettings: (s) => set({ settings: s }),
}))
