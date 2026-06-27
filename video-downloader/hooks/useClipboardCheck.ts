import { useState, useCallback } from 'react'
import * as Clipboard from 'expo-clipboard'
import { downloadService } from '../services/downloader'
import { isValidUrl, isSupportedPlatform } from '../utils/urlValidator'

export function useClipboardCheck() {
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null)
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null)

  const checkClipboard = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync()
      if (text && isValidUrl(text) && isSupportedPlatform(text)) {
        setClipboardUrl(text)
        setDetectedPlatform(downloadService.detectPlatform(text))
      } else {
        setClipboardUrl(null)
        setDetectedPlatform(null)
      }
    } catch {
      setClipboardUrl(null)
    }
  }, [])

  const paste = useCallback(async (): Promise<string> => {
    const text = await Clipboard.getStringAsync()
    return text || ''
  }, [])

  return { clipboardUrl, detectedPlatform, checkClipboard, paste }
}
