import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Station } from '../types/station'
import { fetchNearStations, applyJitter } from '../utils/api'
import { useErrorStore } from './errorStore'

const MAP_CENTER: [number, number] = [30.754365, 103.936107]
const REFRESH_COOLDOWN = 15000

interface StationState {
  stations: Station[]
  isLoading: boolean
  lastRefresh: number
  userLocation: [number, number] | null
  searchKeyword: string
  isUsingSimulatedData: boolean
  
  // Actions
  setStations: (stations: Station[]) => void
  setLoading: (loading: boolean) => void
  setUserLocation: (location: [number, number] | null) => void
  setSearchKeyword: (keyword: string) => void
  setSimulatedData: (isSimulated: boolean) => void
  initializeStations: () => Promise<void>
  refreshStations: (lat?: number, lng?: number) => Promise<void>
  canRefresh: () => boolean
  getFilteredStations: () => Station[]
}

export const useStationStore = create<StationState>()(
  persist(
    (set, get) => ({
      stations: [],
      isLoading: false,
      lastRefresh: 0,
      userLocation: null,
      searchKeyword: '',
      isUsingSimulatedData: false,
      
      setStations: (stations: Station[]) => set({ stations }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setUserLocation: (location: [number, number] | null) => set({ userLocation: location }),
      setSearchKeyword: (keyword: string) => set({ searchKeyword: keyword }),
      setSimulatedData: (isSimulated: boolean) => set({ isUsingSimulatedData: isSimulated }),
      
      initializeStations: async () => {
        const { stations } = get()
        
        // 如果已有数据，不重复加载
        if (stations.length > 0) return
        
        set({ isLoading: true })
        
        try {
          // 尝试获取用户位置
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude, longitude } = position.coords
                const userLocation: [number, number] = [latitude, longitude]
                
                set({ userLocation })
                
                try {
                  const nearStations = await fetchNearStations(latitude, longitude)
                  if (nearStations?.length > 0) {
                    set({ 
                      stations: applyJitter(nearStations),
                      lastRefresh: Date.now()
                    })
                  }
                } catch (error) {
                  console.error('Failed to fetch stations:', error)
                }
                
                set({ isLoading: false })
              },
              async () => {
                // 位置获取失败，使用默认位置
                try {
                  const [lat, lng] = MAP_CENTER
                  const nearStations = await fetchNearStations(lat, lng)
                  if (nearStations?.length > 0) {
                    set({ 
                      stations: applyJitter(nearStations),
                      lastRefresh: Date.now()
                    })
                  }
            } catch (error) {
              if (import.meta.env.DEV) console.error('Failed to fetch stations with default location:', error)
              useErrorStore.getState().showError('无法加载充电站数据')
            }
                
                set({ isLoading: false })
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
              }
            )
          } else {
            // 浏览器不支持地理位置
            try {
              const [lat, lng] = MAP_CENTER
              const nearStations = await fetchNearStations(lat, lng)
              if (nearStations?.length > 0) {
                set({ 
                  stations: applyJitter(nearStations),
                  lastRefresh: Date.now()
                })
              }
            } catch (error) {
              if (import.meta.env.DEV) console.error('Failed to fetch stations:', error)
              useErrorStore.getState().showError('无法加载充电站数据')
            }
            
            set({ isLoading: false })
          }
        } catch (error) {
          if (import.meta.env.DEV) console.error('Initialization error:', error)
          useErrorStore.getState().showError('初始化失败')
          set({ isLoading: false })
        }
      },
      
      refreshStations: async (lat?: number, lng?: number) => {
        const { userLocation, canRefresh } = get()
        
        if (!canRefresh()) return
        
        set({ isLoading: true })
        
        try {
          // 使用传入的坐标，或用户位置，或默认位置
          const [targetLat, targetLng] = lat && lng 
            ? [lat, lng] 
            : userLocation || MAP_CENTER
          
          const nearStations = await fetchNearStations(targetLat, targetLng)
          
          if (nearStations?.length > 0) {
            set({ 
              stations: applyJitter(nearStations),
              lastRefresh: Date.now()
            })
          }
        } catch (error) {
          if (import.meta.env.DEV) console.error('Failed to refresh stations:', error)
          useErrorStore.getState().showError('刷新失败，请稍后重试')
        }
        
        set({ isLoading: false })
      },
      
      canRefresh: () => {
        const { lastRefresh } = get()
        return Date.now() - lastRefresh >= REFRESH_COOLDOWN
      },
      
      getFilteredStations: () => {
        const { stations, searchKeyword } = get()
        
        if (!searchKeyword.trim()) {
          return stations
        }
        
        const keyword = searchKeyword.toLowerCase().trim()
        return stations.filter(station => 
          station.stationName.toLowerCase().includes(keyword) ||
          station.address.toLowerCase().includes(keyword)
        )
      }
    }),
    {
      name: 'station-data',
      partialize: (state) => ({ 
        stations: state.stations,
        lastRefresh: state.lastRefresh 
      }),
    }
  )
)
