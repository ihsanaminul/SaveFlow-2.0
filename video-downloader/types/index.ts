export interface MediaInfo {
  type: 'video' | 'photo' | 'audio' | 'gallery'
  urls: string[]
  thumbnail: string
  title: string
  platform: string
  duration?: number
  quality?: string
  supportedQualities?: QualityOption[]
}

export interface QualityOption {
  label: string
  value: string
}

export interface DownloadRecord {
  id: string
  url: string
  platform: string
  type: string
  filename: string
  filePath: string
  thumbnail: string
  title: string
  downloadedAt: string
  fileSize: number
  status: 'completed' | 'failed'
}

export interface DownloadProgress {
  id: string
  url: string
  progress: number
  status: 'pending' | 'analyzing' | 'downloading' | 'saving' | 'completed' | 'failed' | 'cancelled'
  error?: string
  platform?: string
  title?: string
  thumbnail?: string
  quality?: string
  speed?: number
  eta?: number
  bytesDownloaded?: number
  totalBytes?: number
  fileSize?: number
}

export interface AppSettings {
  defaultQuality: '360' | '480' | '720' | '1080'
  autoSaveToGallery: boolean
  preferNoWatermark: boolean
  maxConcurrentDownloads: number
}