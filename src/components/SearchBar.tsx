import React, { useState, useRef, useEffect } from 'react'
import { useStationStore } from '../store/stationStore'
import { Station } from '../types/station'
import CancelOutlined from '@mui/icons-material/CancelOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'

interface SearchBarProps {
  onStationSelect?: (station: Station) => void
}

const SearchBar: React.FC<SearchBarProps> = ({ onStationSelect }) => {
  const { searchKeyword, setSearchKeyword, isUsingSimulatedData, getFilteredStations } = useStationStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const searchBarRef = useRef<HTMLDivElement>(null)
  
  // 获取所有站点并按可用插头数降序排列
  const stations = getFilteredStations()
  const availableStations = stations
    .filter(station => station.freeNum && station.freeNum > 0)
    .sort((a, b) => (b.freeNum || 0) - (a.freeNum || 0))
    .slice(0, 10) // 限制显示前10个

  const handleSearch = () => {
    // 搜索逻辑已在store中通过getFilteredStations实现
    setShowDropdown(false)
  }

  const clearSearch = () => {
    setSearchKeyword('')
    setShowDropdown(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  const handleInputClick = () => {
    setShowDropdown(true)
  }

  const handleStationSelect = (station: Station) => {
    setSearchKeyword(station.stationName)
    setShowDropdown(false)
    // 调用父组件的回调函数，用于定位地图
    onStationSelect?.(station)
  }

  // 处理点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm px-4">
      <div className="relative" ref={searchBarRef}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400 dark:text-gray-500" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={handleInputFocus}
          onClick={handleInputClick}
          placeholder={isUsingSimulatedData ? "搜索充电站（模拟数据）..." : "搜索充电站..."}
          className="w-full h-12 pl-12 pr-24 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 shadow-xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 dark:focus:ring-blue-500/50 dark:focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
          aria-label="搜索充电站"
          role="searchbox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {searchKeyword && (
            <button
              onClick={clearSearch}
              className="h-full px-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-w-[44px] flex items-center justify-center"
              aria-label="清除搜索"
              type="button"
            >
              <CancelOutlined className="h-5 w-5" />
            </button>
          )}
          
          <button
            onClick={handleSearch}
            className="h-full px-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-w-[44px] flex items-center justify-center"
            aria-label="搜索"
            type="button"
          >
            <SearchOutlined className="h-5 w-5" />
          </button>
        </div>

        {/* 下拉列表 */}
        {showDropdown && availableStations.length > 0 && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-xl max-h-80 overflow-y-auto"
            role="listbox"
            aria-label="可用充电桩列表"
          >
            <div className="p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 font-medium">
                可用充电桩 ({availableStations.length})
              </div>
              {availableStations.map((station, index) => (
                <button
                  key={station.stationId}
                  onClick={() => handleStationSelect(station)}
                  className="w-full text-left px-3 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group min-h-[44px] flex items-center"
                  role="option"
                  aria-selected={false}
                  tabIndex={index === 0 ? 0 : -1}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {station.stationName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {station.address}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {station.freeNum}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          /{station.switchType}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* 无可用充电桩时的提示 */}
        {showDropdown && availableStations.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-xl">
            <div className="p-6 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.44-1.006-5.904-2.611m11.808 0A7.962 7.962 0 0012 15m-8.904-2.611A7.962 7.962 0 004 12C4 7.589 7.589 4 12 4s8 3.589 8 8-3.589 8-8 8-8-3.589-8-8z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                当前没有可用的充电桩
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                请尝试刷新或检查筛选设置
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchBar