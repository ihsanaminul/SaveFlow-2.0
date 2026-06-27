import AsyncStorage from '@react-native-async-storage/async-storage'
import { DownloadRecord } from '../types'
import uuid from '../utils/uuid'

const HISTORY_KEY = 'download_history_v2'

export const historyService = {
  async getHistory(): Promise<DownloadRecord[]> {
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  async addRecord(record: Omit<DownloadRecord, 'id' | 'downloadedAt'>): Promise<DownloadRecord> {
    const history = await this.getHistory()
    const newRecord: DownloadRecord = {
      ...record,
      id: uuid(),
      downloadedAt: new Date().toISOString(),
    }
    const trimmed = [newRecord, ...history].slice(0, 200)
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
    return newRecord
  },

  async deleteRecord(id: string): Promise<void> {
    const history = await this.getHistory()
    const updated = history.filter((r) => r.id !== id)
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(HISTORY_KEY)
  },
}
