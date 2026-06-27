import * as FileSystem from 'expo-file-system/legacy'
import { Platform } from 'react-native'

export function generateFilename(platform: string, type: string, timestamp: number | string): string {
  const ext = type === 'video' ? 'mp4' : 'jpg'
  return `${platform}_${type}_${timestamp}.${ext}`
}

export async function getFileSize(filePath: string): Promise<number> {
  if (Platform.OS === 'web') return 0
  try {
    const info = await FileSystem.getInfoAsync(filePath)
    return (info as any).size || 0
  } catch {
    return 0
  }
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '—'
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`
}

export function formatEta(seconds: number): string {
  if (!seconds || seconds <= 0) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

export async function cleanupTempFiles(): Promise<void> {
  if (Platform.OS === 'web') return
  const dir = FileSystem.documentDirectory + 'downloads/'
  try {
    await FileSystem.deleteAsync(dir, { idempotent: true })
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
  } catch {}
}
