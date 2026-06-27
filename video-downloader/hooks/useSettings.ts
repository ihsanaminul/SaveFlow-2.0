import { useState, useEffect, useCallback } from 'react'
import { settingsService } from '../services/settings'
import { AppSettings } from '../types'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    settingsService.getSettings()
      .then((s) => {
        setSettings(s)
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    await settingsService.updateSettings({ [key]: value })
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
  }, [])

  const resetSettings = useCallback(async () => {
    await settingsService.resetSettings()
    const defaults = await settingsService.getSettings()
    setSettings(defaults)
  }, [])

  return { settings, isLoading, updateSetting, resetSettings }
}
