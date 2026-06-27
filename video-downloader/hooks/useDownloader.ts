import { useState, useCallback, useRef } from 'react'
import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import { downloadService } from '../services/downloader'
import { historyService } from '../services/history'
import { useStore } from '../store/useStore'
import { MediaInfo } from '../types'
import { generateFilename } from '../utils/fileUtils'
import uuid from '../utils/uuid'

export function useDownloader() {
  const {
    startDownload, updateProgress, updateProgressWithStats,
    updateStatus, completeDownload, failDownload, addHistory,
  } = useStore()

  const [mediaInfo, setMediaInfo]         = useState<MediaInfo | null>(null)
  const [isAnalyzing, setIsAnalyzing]     = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [analyzeError, setAnalyzeError]   = useState<string | null>(null)
  const [currentId, setCurrentId]         = useState<string | null>(null)

  const retryCount = useRef(0)

  // ── Analyze only ──────────────────────────────────────────────
  const fetchInfo = useCallback(async (url: string): Promise<MediaInfo | null> => {
    setIsAnalyzing(true)
    setAnalyzeError(null)
    setMediaInfo(null)
    try {
      const info = await downloadService.fetchMediaInfo(url, '720')
      setMediaInfo(info)
      return info
    } catch (e: any) {
      setAnalyzeError(e.message || 'Gagal menganalisis URL')
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  // ── Analyze + Download ─────────────────────────────────────────
  const analyzeAndDownload = useCallback(
    async (url: string, quality: string): Promise<{ count: number; type: string }> => {
      if (Platform.OS === 'web') throw new Error('Download tidak tersedia di web')

      setIsAnalyzing(true)
      setIsDownloading(false)
      setAnalyzeError(null)
      retryCount.current = 0

      try {
        const info = await downloadService.fetchMediaInfo(url, quality)
        setMediaInfo(info)
        setIsAnalyzing(false)
        setIsDownloading(true)

        if (info.type === 'gallery') {
          let ok = 0
          for (let i = 0; i < info.urls.length; i++) {
            const id = uuid()
            if (i === 0) setCurrentId(id)
            const filename = generateFilename(info.platform.toLowerCase(), 'photo', Date.now() + i)
            startDownload({
              id, url, progress: 0, status: 'downloading',
              platform: info.platform, title: info.title, thumbnail: info.thumbnail,
            })
            try {
              const filePath = await downloadService.downloadFile(
                info.urls[i],
                filename,
                (progress, speed, eta, bytesDownloaded, totalBytes) => {
                  updateProgressWithStats(id, progress, speed, eta, bytesDownloaded, totalBytes)
                }
              )
              updateStatus(id, 'saving')
              await downloadService.saveToGallery(filePath, 'photo')
              const fi = await FileSystem.getInfoAsync(filePath)
              const record = await historyService.addRecord({
                url, platform: info.platform, type: 'photo', filename, filePath,
                thumbnail: info.thumbnail, title: info.title,
                fileSize: (fi as any).size || 0, status: 'completed',
              })
              addHistory(record)
              completeDownload(id)
              ok++
            } catch (e: any) {
              failDownload(id, e.message)
            }
          }
          return { count: ok, type: 'gallery' }
        } else {
          const id       = uuid()
          setCurrentId(id)
          const filename = generateFilename(info.platform.toLowerCase(), info.type, Date.now())
          startDownload({
            id, url, progress: 0, status: 'downloading',
            platform: info.platform, title: info.title, thumbnail: info.thumbnail, quality,
          })
          try {
            const filePath = await downloadService.downloadFile(
              info.urls[0],
              filename,
              (progress, speed, eta, bytesDownloaded, totalBytes) => {
                updateProgressWithStats(id, progress, speed, eta, bytesDownloaded, totalBytes)
              }
            )
            updateStatus(id, 'saving')
            await downloadService.saveToGallery(filePath, info.type === 'video' ? 'video' : 'photo')
            const fi = await FileSystem.getInfoAsync(filePath)
            const record = await historyService.addRecord({
              url, platform: info.platform, type: info.type, filename, filePath,
              thumbnail: info.thumbnail, title: info.title,
              fileSize: (fi as any).size || 0, status: 'completed',
            })
            addHistory(record)
            completeDownload(id)
            return { count: 1, type: info.type }
          } catch (e: any) {
            failDownload(id, e.message)
            await historyService.addRecord({
              url, platform: info.platform, type: info.type, filename, filePath: '',
              thumbnail: info.thumbnail, title: info.title, fileSize: 0, status: 'failed',
            })
            throw e
          }
        }
      } catch (e: any) {
        setAnalyzeError(e.message || 'Gagal mengunduh')
        throw e
      } finally {
        setIsAnalyzing(false)
        setIsDownloading(false)
        setTimeout(() => setCurrentId(null), 2000)
      }
    },
    [startDownload, updateProgress, updateProgressWithStats, updateStatus, completeDownload, failDownload, addHistory]
  )

  return {
    fetchInfo,
    analyzeAndDownload,
    mediaInfo,
    isAnalyzing,
    isDownloading,
    analyzeError,
    currentId,
    clearError: () => { setAnalyzeError(null) },
    clearInfo:  () => { setMediaInfo(null); setAnalyzeError(null); setCurrentId(null) },
  }
}
