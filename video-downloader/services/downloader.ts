 import { Platform } from 'react-native'
import { MediaInfo, QualityOption } from '../types'

const COBALT_INSTANCES = [
  'https://cobalt.privacyredirect.com',
  'https://cobalt.api.timelessnesses.me',
  'https://cobalt.nadeko.net',
]

const ALL_QUALITIES: QualityOption[] = [
  { label: '4K',    value: '4k'   },
  { label: '1080p', value: '1080' },
  { label: '720p',  value: '720'  },
  { label: '480p',  value: '480'  },
  { label: '360p',  value: '360'  },
]

function detectPlatform(url: string): string {
  if (/tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/.test(url)) return 'TikTok'
  if (/instagram\.com/.test(url)) return 'Instagram'
  if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube'
  if (/twitter\.com|x\.com/.test(url)) return 'Twitter'
  if (/facebook\.com|fb\.watch/.test(url)) return 'Facebook'
  if (/pinterest\.com/.test(url)) return 'Pinterest'
  if (/reddit\.com|redd\.it/.test(url)) return 'Reddit'
  if (/vimeo\.com/.test(url)) return 'Vimeo'
  if (/dailymotion\.com|dai\.ly/.test(url)) return 'Dailymotion'
  return 'Unknown'
}

// Probe which qualities actually work for this URL via Cobalt
async function probeQualities(url: string, platform: string): Promise<QualityOption[]> {
  // Non-YouTube platforms: return platform-specific defaults
  if (platform === 'TikTok') return [{ label: 'Max', value: '1080' }]
  if (platform === 'Instagram') return [{ label: 'Max', value: '1080' }]
  if (platform === 'Twitter') return [{ label: 'Max', value: '1080' }]
  if (platform === 'Facebook') return [{ label: 'Max', value: '1080' }]
  if (platform === 'Reddit') return [{ label: 'Max', value: '1080' }]
  if (platform === 'Pinterest') return [{ label: 'Max', value: '1080' }]

  // YouTube & Vimeo: probe each quality level
  const toProbe = platform === 'YouTube'
    ? ALL_QUALITIES
    : [{ label: '1080p', value: '1080' }, { label: '720p', value: '720' }, { label: '480p', value: '480' }]

  const supported: QualityOption[] = []

  for (const q of toProbe) {
    for (const instance of COBALT_INSTANCES) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        const res = await fetch(instance, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ url, videoQuality: q.value, filenameStyle: 'pretty', downloadMode: 'auto' }),
          signal: controller.signal,
        })
        clearTimeout(timeout)
        const data = await res.json() as Record<string, any>
        if (['tunnel', 'redirect', 'stream'].includes(data.status)) {
          supported.push(q)
          break
        }
      } catch {}
    }
  }

  return supported.length > 0 ? supported : [{ label: '720p', value: '720' }]
}

async function ensureDownloadDir(): Promise<string> {
  const FileSystem = await import('expo-file-system/legacy')
  const dir = FileSystem.documentDirectory + 'downloads/'
  try { await FileSystem.makeDirectoryAsync(dir, { intermediates: true }) } catch {}
  return dir
}

// ── TikTok via tikwm.com ──────────────────────────────────────
async function fetchTikTok(url: string): Promise<MediaInfo> {
  const res = await fetch(
    `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
    { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.tikwm.com/' } }
  )
  if (!res.ok) throw new Error(`tikwm HTTP ${res.status}`)

  const json = await res.json() as Record<string, any>
  if (json.code !== 0) throw new Error(json.msg || 'tikwm error')

  const d = json.data
  if (!d) throw new Error('tikwm: no data')

  if (d.images && Array.isArray(d.images) && d.images.length > 0) {
    const urls = d.images.map((img: any) =>
      typeof img === 'string' ? img : (img.url || img.download_url || img)
    ).filter(Boolean)
    return {
      type: 'gallery', urls,
      thumbnail: d.cover || d.origin_cover || '',
      title: d.title || 'TikTok Slideshow',
      platform: 'TikTok',
      supportedQualities: [{ label: 'Max', value: '1080' }],
    }
  }

  const videoUrl = d.hdplay || d.play || d.wmplay
  if (!videoUrl) throw new Error('tikwm: no video URL')

  return {
    type: 'video', urls: [videoUrl],
    thumbnail: d.cover || d.origin_cover || '',
    title: d.title || 'TikTok Video',
    platform: 'TikTok',
    supportedQualities: [{ label: 'Max', value: '1080' }],
  }
}

// ── Cobalt community instances ────────────────────────────────
async function fetchViaCobalt(url: string, quality: string): Promise<MediaInfo> {
  const platform = detectPlatform(url)
  const qualityMap: Record<string, string> = {
    '360': '360', '480': '480', '720': '720', '1080': '1080', '4k': '4320',
  }
  const videoQuality = qualityMap[quality] ?? '720'
  let lastError = 'Semua server tidak dapat dijangkau'

  for (const instance of COBALT_INSTANCES) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 14000)

      const res = await fetch(instance, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ url, videoQuality, filenameStyle: 'pretty', downloadMode: 'auto' }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      const data = await res.json() as Record<string, any>

      if (data.status === 'error') {
        lastError = data.error?.code || data.text || 'Error dari server'
        continue
      }

      if (data.status === 'tunnel' || data.status === 'redirect') {
        return {
          type: 'video', urls: [data.url],
          thumbnail: data.thumbnail || '',
          title: data.filename || `${platform} video`,
          platform,
        }
      }
      if (data.status === 'stream') {
        return {
          type: 'video', urls: [data.url],
          thumbnail: data.thumb || '',
          title: data.filename || `${platform} video`,
          platform,
        }
      }
      if (data.status === 'picker') {
        const items = (data.picker as any[]) || []
        return {
          type: 'gallery',
          urls: items.map((item: any) => item.url),
          thumbnail: items[0]?.thumb || '',
          title: `${platform} gallery`,
          platform,
        }
      }
    } catch (e: any) {
      lastError = e.name === 'AbortError'
        ? 'Server timeout, mencoba server lain...'
        : (e.message || 'Koneksi gagal')
    }
  }

  throw new Error(lastError)
}

// ── Main entry point ──────────────────────────────────────────
async function fetchMediaInfo(url: string, quality = '720'): Promise<MediaInfo> {
  const platform = detectPlatform(url)

  try {
    let info: MediaInfo

    if (platform === 'TikTok') {
      try { info = await fetchTikTok(url) }
      catch { info = await fetchViaCobalt(url, quality) }
    } else {
      info = await fetchViaCobalt(url, quality)
    }

    // Probe supported qualities in background (non-blocking for TikTok/IG)
    if (!info.supportedQualities) {
      try {
        info.supportedQualities = await probeQualities(url, platform)
      } catch {
        info.supportedQualities = [{ label: '720p', value: '720' }]
      }
    }

    return info
  } catch (error: any) {
    const msg: string = error.message || ''
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('Network')) {
      throw new Error('Tidak ada koneksi internet atau server tidak dapat dijangkau')
    }
    if (msg.startsWith('Tidak') || msg.startsWith('Gagal') || msg.startsWith('Semua')) {
      throw error
    }
    throw new Error(`Gagal mengunduh: ${msg}`)
  }
}

export type ProgressCallback = (
  progress: number, speed: number, eta: number,
  bytesDownloaded: number, totalBytes: number,
) => void

async function downloadFile(
  mediaUrl: string, filename: string, onProgress?: ProgressCallback
): Promise<string> {
  if (Platform.OS === 'web') throw new Error('Download tidak tersedia di web')

  const FileSystem = await import('expo-file-system/legacy')
  const dir = await ensureDownloadDir()
  const filePath = dir + filename

  let lastBytesWritten = 0
  let lastTimestamp = Date.now()
  let speedSamples: number[] = []

  const downloadResumable = FileSystem.createDownloadResumable(
    mediaUrl, filePath, {},
    (downloadProgress) => {
      const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress
      const now = Date.now()
      const elapsed = (now - lastTimestamp) / 1000

      let speed = 0, eta = 0

      if (elapsed >= 0.4) {
        const bytesDiff = totalBytesWritten - lastBytesWritten
        const instantSpeed = bytesDiff / elapsed
        speedSamples.push(instantSpeed)
        if (speedSamples.length > 5) speedSamples.shift()
        speed = speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length

        if (speed > 0 && totalBytesExpectedToWrite > 0) {
          eta = (totalBytesExpectedToWrite - totalBytesWritten) / speed
        }
        lastBytesWritten = totalBytesWritten
        lastTimestamp = now
      }

      const progress = totalBytesExpectedToWrite > 0
        ? (totalBytesWritten / totalBytesExpectedToWrite) * 100 : 0

      onProgress?.(Math.round(progress), speed, Math.round(eta), totalBytesWritten, totalBytesExpectedToWrite)
    }
  )

  const result = await downloadResumable.downloadAsync()
  if (!result?.uri) throw new Error('Download gagal')
  return result.uri
}

async function saveToGallery(filePath: string, _type: 'video' | 'photo'): Promise<boolean> {
  if (Platform.OS === 'web') return false
  const MediaLibrary = await import('expo-media-library/legacy')
  const { status } = await MediaLibrary.requestPermissionsAsync()
  if (status !== 'granted') throw new Error('Izin galeri ditolak')
  const asset = await MediaLibrary.createAssetAsync(filePath)
  try { await MediaLibrary.createAlbumAsync('SaveFlow', asset, false) } catch {}
  return true
}

export const downloadService = {
  detectPlatform, fetchMediaInfo, downloadFile, saveToGallery,
}