import React, { useState } from 'react'
import { getVersionInfo } from '../utils/version'

/**
 * 版本信息调试组件
 * 在开发模式下显示详细的版本信息
 */
const VersionInfo: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false)
  const versionInfo = getVersionInfo()

  // 只在开发模式下显示
  if (versionInfo.isProduction) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg hover:bg-gray-700 transition-colors"
        title="版本信息"
      >
        v{versionInfo.version}
      </button>
      
      {showDetails && (
        <div className="absolute top-8 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 min-w-64 text-xs">
          <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">版本信息</h4>
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <div><span className="font-medium">版本:</span> {versionInfo.version}</div>
            <div><span className="font-medium">环境:</span> {versionInfo.environment}</div>
            <div><span className="font-medium">Git:</span> {versionInfo.gitCommit.substring(0, 8)}</div>
            <div><span className="font-medium">构建时间:</span> {new Date(versionInfo.buildTime).toLocaleString()}</div>
            <div><span className="font-medium">生产模式:</span> {versionInfo.isProduction ? '是' : '否'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VersionInfo
