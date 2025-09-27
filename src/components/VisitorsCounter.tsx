import React from 'react'
import { useVisitorsCount } from '../hooks/useVisitorsCount'
import GroupOutlined from '@mui/icons-material/GroupOutlined'

const VisitorsCounter: React.FC = () => {
  const { visitorsCount, isConnected } = useVisitorsCount()

  // 如果未连接且没有访问者数据，不显示组件
  if (!isConnected && visitorsCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-6 z-[1000]">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-2 text-sm">
        {/* 连接状态指示器 */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${isConnected
                ? 'bg-green-500 animate-pulse'
                : 'bg-gray-400'
              }`}
          ></div>
          <span className="text-gray-700 dark:text-gray-200 font-medium">
            {visitorsCount}
          </span>
        </div>

        {/* 用户图标 */}
        <GroupOutlined className="w-4 h-4 text-gray-600 dark:text-gray-300" />

        {/* 在线文本 */}
        <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
          {isConnected ? '在线' : '离线'}
        </span>
      </div>
    </div>
  )
}

export default VisitorsCounter
