import { useEffect, useCallback } from 'react'
import { historyService } from '../services/history'
import { useStore } from '../store/useStore'

export function useHistory() {
  const { history, isLoadingHistory, setHistory, removeHistory, clearHistory } = useStore()

  const refresh = useCallback(async () => {
    const data = await historyService.getHistory()
    setHistory(data)
  }, [setHistory])

  useEffect(() => { refresh() }, [refresh])

  const deleteRecord = useCallback(async (id: string) => {
    await historyService.deleteRecord(id)
    removeHistory(id)
  }, [removeHistory])

  const clearAll = useCallback(async () => {
    await historyService.clearAll()
    clearHistory()
  }, [clearHistory])

  return { history, isLoading: isLoadingHistory, refresh, deleteRecord, clearAll }
}
