import React, { useState } from 'react'
import clsx from 'clsx'
import SettingsPanel from './SettingsPanel'
import MapOutlined from '@mui/icons-material/MapOutlined'
import FavoriteBorderOutlined from '@mui/icons-material/FavoriteBorderOutlined'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'

interface HeaderProps {
  currentView: 'map' | 'favorites'
  onViewChange: (view: 'map' | 'favorites') => void
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg z-[1100] border-b border-gray-200/50 dark:border-gray-700/50">
      <nav className="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
            <span className="hidden sm:inline">EndlessPower 闪开来电充电桩查询</span>
            <span className="sm:hidden">EndlessPower</span>
          </h1>
        </div>

        {/* 简化的导航按钮组 */}
        <div className="flex items-center space-x-0.5 bg-gray-100/80 dark:bg-gray-800/80 p-0.5 rounded-lg shadow-sm">
          {/* 地图按钮 */}
          <button
            onClick={() => onViewChange('map')}
            className={clsx(
              'flex items-center justify-center p-3 rounded-lg transition-all duration-200 min-w-[44px] min-h-[44px]',
              currentView === 'map'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/50'
            )}
            aria-label="查看地图"
            aria-pressed={currentView === 'map'}
            type="button"
          >
            <MapOutlined className="w-5 h-5" />
          </button>

          {/* 收藏按钮 */}
          <button
            onClick={() => onViewChange('favorites')}
            className={clsx(
              'flex items-center justify-center p-3 rounded-lg transition-all duration-200 min-w-[44px] min-h-[44px]',
              currentView === 'favorites'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/50'
            )}
            aria-label="查看收藏"
            aria-pressed={currentView === 'favorites'}
            type="button"
          >
            <FavoriteBorderOutlined className="w-5 h-5" />
          </button>

          {/* 设置按钮 */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center p-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/50 transition-all duration-200 min-w-[44px] min-h-[44px]"
            aria-label="打开设置"
            type="button"
          >
            <SettingsOutlined className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* 设置面板 */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </header>
  )
}

export default Header