import React, { useState, useEffect } from 'react'
import { Station, Outlet, OutletStatus } from '../types/station'
import { fetchStationOutlets, fetchOutletStatus } from '../utils/api'
import { useFavoritesStore } from '../store/favoritesStore'
import { useErrorStore } from '../store/errorStore'
import LoadingSpinner from './LoadingSpinner'

interface FavoriteStationCardProps {
  station: Station
  refreshTrigger?: number
}

const FavoriteStationCard: React.FC<FavoriteStationCardProps> = ({ 
  station, 
  refreshTrigger 
}) => {
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [outletStatuses, setOutletStatuses] = useState<(OutletStatus | null)[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [summary, setSummary] = useState({
    total: 0,
    available: 0,
    occupied: 0
  })

  const { removeFavorite, pinFavorite, unpinFavorite, isPinned } = useFavoritesStore()
  const { showError } = useErrorStore()

  useEffect(() => {
    const loadStationData = async () => {
      setIsLoading(true)
      
      try {
        const stationOutlets = await fetchStationOutlets(station.stationId)
        setOutlets(stationOutlets)

        if (stationOutlets.length > 0) {
          const statuses = await Promise.all(
            stationOutlets.map(outlet => fetchOutletStatus(outlet.outletNo))
          )
          setOutletStatuses(statuses)

          // 计算摘要信息
          const availableCount = statuses.filter(
            s => s?.outlet?.iCurrentChargingRecordId === 0
          ).length
          
          setSummary({
            total: stationOutlets.length,
            available: availableCount,
            occupied: stationOutlets.length - availableCount
          })
        } else {
          setSummary({ total: 0, available: 0, occupied: 0 })
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to load station data:', error)
        showError('加载充电站数据失败')
      }
      
      setIsLoading(false)
    }

    loadStationData()
  }, [station.stationId, refreshTrigger, showError])


  const handleRemoveFavorite = () => {
    removeFavorite(station.stationId)
  }

  const handleTogglePin = () => {
    if (isPinned(station.stationId)) {
      unpinFavorite(station.stationId)
    } else {
      pinFavorite(station.stationId)
    }
  }

  const renderOutletCard = (outlet: Outlet, status: OutletStatus | null) => {
    const isAvailable = status?.outlet?.iCurrentChargingRecordId === 0
    
    // 优先使用状态API中的插座名称，这是最准确的名称
    let outletName = status?.outlet?.vOutletName?.replace('插座', '').trim()
      || outlet.vOutletName?.replace('插座', '').trim()
      || outlet.outletNo 
      || 'N/A'
    
    // 如果名称为空，使用序号
    if (!outletName || outletName === '') {
      outletName = outlet.outletSerialNo?.toString() || outlet.outletNo || 'N/A'
    }
    
    // 智能处理显示文本 - 完整显示短名称，适度截断长名称
    const getDisplayName = (name: string) => {
      if (name.length <= 8) {
        // 短名称直接显示
        return name
      } else if (name.length <= 15) {
        // 中等长度名称，尝试智能截断
        const match = name.match(/^(\d+)/)
        if (match) {
          // 如果是数字开头，保留数字+简短描述
          return match[1] + (name.length > match[1].length ? '号' : '')
        }
        return name
      } else {
        // 长名称截断，但保证不会出现"2.."这种情况
        const match = name.match(/^(\d+)/)
        if (match && match[1].length < 10) {
          // 数字开头且数字部分不太长，保留数字+号
          return match[1] + '号'
        }
        return name.substring(0, 6) + '...'
      }
    }
    
    const displayName = getDisplayName(outletName)
    const serial = `插座 ${displayName}`
    
    if (!status || !status.outlet) {
      return (
        <div key={outlet.outletId} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3 border border-gray-200/50 dark:border-gray-600/50 h-24 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 truncate" title={`插座 ${outletName}`}>{serial}</h4>
          </div>
          <p className="text-xs text-red-500 dark:text-red-400">数据加载失败</p>
        </div>
      )
    }

    const cardClasses = isAvailable 
      ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-900/20 dark:via-emerald-900/10 dark:to-green-800/20 border-green-200/60 dark:border-green-700/50 shadow-green-100/50 dark:shadow-green-900/20' 
      : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-blue-800/20 border-blue-200/60 dark:border-blue-700/50 shadow-blue-100/50 dark:shadow-blue-900/20'
    
    const statusBadge = isAvailable ? (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold shadow-md">
        <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <span>可用</span>
      </div>
    ) : (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold shadow-md">
        <div className="w-1 h-1 bg-white rounded-full"></div>
        <span>占用中</span>
      </div>
    )

    return (
      <div key={outlet.outletId} className={`rounded-xl p-3 border transition-all duration-300 h-24 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${cardClasses}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-blue-500'} shadow-lg`}></div>
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate" title={`插座 ${outletName}`}>{serial}</h4>
          </div>
          {statusBadge}
        </div>
        
        {isAvailable ? (
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100/80 dark:bg-green-800/30">
              <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <p className="text-xs text-green-700 dark:text-green-400 font-semibold">空闲中</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-between bg-white/60 dark:bg-gray-800/30 rounded-lg px-2 py-1">
            <div className="flex items-center gap-1">
              <svg className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-xs text-gray-700 dark:text-gray-300">已充: <span className="font-semibold text-blue-600 dark:text-blue-400">{status.usedmin || 0}分钟</span></span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-2.5 h-2.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
              <span className="text-xs text-gray-700 dark:text-gray-300">消费: <span className="font-semibold text-green-600 dark:text-green-400">{status.usedfee?.toFixed(2) || '0.00'}元</span></span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex flex-col h-full">
      <div className="p-4 md:p-5 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2 mb-1">
              <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate leading-tight">
                {station.stationName}
              </h2>
              {isPinned(station.stationId) && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 flex-shrink-0">
                  <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  置顶
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 truncate leading-relaxed">
              {station.address}
            </p>
          </div>
          
          <div className="flex items-start gap-1 ml-2 flex-shrink-0">
            <button
              onClick={handleTogglePin}
              className={`p-1.5 md:p-2 rounded-full transition-colors min-w-[36px] min-h-[36px] md:min-w-[44px] md:min-h-[44px] flex items-center justify-center ${
                isPinned(station.stationId)
                  ? 'text-yellow-500 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                  : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
              }`}
              aria-label={isPinned(station.stationId) ? '取消置顶' : '置顶'}
              type="button"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 md:h-5 md:w-5" 
                fill={isPinned(station.stationId) ? 'currentColor' : 'none'}
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                />
              </svg>
            </button>
            
            <button
              onClick={handleRemoveFavorite}
              className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1.5 md:p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors min-w-[36px] min-h-[36px] md:min-w-[44px] md:min-h-[44px] flex items-center justify-center"
              aria-label="移除收藏"
              type="button"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 md:h-5 md:w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Summary - 紧凑版 */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-3 p-2.5 md:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p className="font-semibold text-base md:text-lg text-gray-800 dark:text-gray-200">{summary.total}</p>
            <p className="text-xs">总插座</p>
          </div>
          <div>
            <p className="font-semibold text-base md:text-lg text-green-600 dark:text-green-400">{summary.available}</p>
            <p className="text-xs">可用</p>
          </div>
          <div>
            <p className="font-semibold text-base md:text-lg text-blue-600 dark:text-blue-400">{summary.occupied}</p>
            <p className="text-xs">占用</p>
          </div>
        </div>

        {/* 展开/收起按钮 - 紧凑版 */}
        {outlets.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors min-h-[36px] md:min-h-[44px]"
              aria-label={isExpanded ? '收起详情' : '展开详情'}
              aria-expanded={isExpanded}
              type="button"
            >
              {isExpanded ? (
                <>
                  <span>收起详情</span>
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span>展开详情</span>
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {/* Outlets Grid */}
        {isExpanded && (
          <div className="mt-3 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6 md:py-8">
                <LoadingSpinner text="加载中..." />
              </div>
            ) : outlets.length === 0 ? (
              <p className="text-center text-xs md:text-sm text-gray-500 dark:text-gray-400 py-3 md:py-4">
                该充电站暂无插座信息。
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3">
                {outlets
                  .sort((a, b) => a.outletSerialNo - b.outletSerialNo)
                  .map((outlet, index) => renderOutletCard(outlet, outletStatuses[index]))
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FavoriteStationCard
