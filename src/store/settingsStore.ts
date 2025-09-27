import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  // 基础设置
  autoRefresh: boolean
  showUnavailableStations: boolean
  
  // 数据设置
  refreshInterval: number // 秒

  // Actions
  setAutoRefresh: (enabled: boolean) => void
  setShowUnavailableStations: (enabled: boolean) => void
  setRefreshInterval: (interval: number) => void
  resetSettings: () => void
}

const defaultSettings = {
  autoRefresh: true,
  showUnavailableStations: false,
  refreshInterval: 5  // 默认5秒刷新一次，提高数据同步性
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setAutoRefresh: (enabled: boolean) => set({ autoRefresh: enabled }),
      setShowUnavailableStations: (enabled: boolean) => set({ showUnavailableStations: enabled }),
      setRefreshInterval: (interval: number) => {
        // 确保刷新间隔不少于3秒，防止过于频繁的请求
        const validInterval = Math.max(3, interval)
        set({ refreshInterval: validInterval })
      },
      
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'app-settings',
      // 迁移逻辑：为现有用户优化刷新间隔
      migrate: (persistedState: any, version: number) => {
        if (persistedState && persistedState.refreshInterval >= 30) {
          // 如果现有用户的刷新间隔 >= 30秒，建议改为5秒以提高数据准确性
          persistedState.refreshInterval = 5
        }
        return persistedState
      },
      version: 1
    }
  )
)
