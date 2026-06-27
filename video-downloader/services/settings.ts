import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppSettings } from '../types'

const SETTINGS_KEY = 'app_settings'

const defaultSettings: AppSettings = {
  defaultQuality: '720',
  autoSaveToGallery: true,
  preferNoWatermark: true,
  maxConcurrentDownloads: 3,
}

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY)
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings
    } catch {
      return defaultSettings
    }
  },

  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings()
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...updates }))
  },

  async resetSettings(): Promise<void> {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings))
  },
}
