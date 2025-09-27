import React, { useState } from 'react'
import { useFavoritesStore } from '../store/favoritesStore'
import { useSEO } from '../hooks/useSEO'
import { useStationStore } from '../store/stationStore'
import FavoriteStationCard from './FavoriteStationCard'

const REFRESH_COOLDOWN = 15000

const FavoritesView: React.FC = () => {
  // SEO优化
  useSEO('favorites')
  
  const [lastRefresh, setLastRefresh] = useState(0)
  const { favoriteIds, isPinned } = useFavoritesStore()
  const { stations } = useStationStore()

  const favoriteStations = favoriteIds
    .map(id => stations.find(station => station.stationId === id))
    .filter(Boolean)
    .sort((a, b) => {
      const aIsPinned = isPinned(a!.stationId)
      const bIsPinned = isPinned(b!.stationId)
      
      // 置顶的排在前面
      if (aIsPinned && !bIsPinned) return -1
      if (!aIsPinned && bIsPinned) return 1
      
      // 如果都置顶或都不置顶，保持原顺序（按收藏时间）
      return 0
    })

  const canRefresh = () => {
    return Date.now() - lastRefresh >= REFRESH_COOLDOWN
  }

  const handleRefresh = () => {
    if (!canRefresh()) return
    
    setLastRefresh(Date.now())
    // 触发所有收藏卡片的刷新
    // 这将通过重新渲染组件来实现
    setTimeout(() => {
      // 刷新完成后重新启用按钮
    }, REFRESH_COOLDOWN)
  }

  return (
    <div className="w-full h-full overflow-y-auto p-3 md:p-4 lg:p-6 bg-gradient-to-b from-transparent to-gray-50/30 dark:to-gray-800/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 lg:mb-8">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            我的收藏 {favoriteStations.length > 0 && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                ({favoriteStations.length}个充电站)
              </span>
            )}
          </h2>
          
          <button
            onClick={handleRefresh}
            disabled={!canRefresh()}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-200 p-2.5 md:p-3 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="刷新所有收藏的充电站数据"
            type="button"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 md:h-5 md:w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        {favoriteStations.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <div className="max-w-md mx-auto">
              <svg 
                className="mx-auto h-12 w-12 md:h-16 md:w-16 text-gray-400 dark:text-gray-500 mb-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="1" 
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                还没有收藏的充电桩
              </h3>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                在地图页面点击充电桩标记，然后点击星星图标来收藏充电桩。
              </p>
            </div>
          </div>
        ) : (
          /* 响应式网格布局 */
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
            {favoriteStations.map((station) => (
              <FavoriteStationCard
                key={station!.stationId}
                station={station!}
                refreshTrigger={lastRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FavoritesView
