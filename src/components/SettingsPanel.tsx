import React, { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useThemeStore } from '../store/themeStore'
import { formatVersionDisplay, getShortGitCommit, getBuildEnv } from '../utils/version'
import { useContributors } from '../hooks/useContributors'
import ContributorCard from './ContributorCard'
import WbSunnyOutlined from '@mui/icons-material/WbSunnyOutlined'
import NightlightOutlined from '@mui/icons-material/NightlightOutlined'
import SettingsBrightnessOutlined from '@mui/icons-material/SettingsBrightnessOutlined'
import RefreshOutlined from '@mui/icons-material/RefreshOutlined'
import GroupOutlined from '@mui/icons-material/GroupOutlined'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  // 从store获取设置状态
  const {
    autoRefresh,
    showUnavailableStations,
    refreshInterval,
    setAutoRefresh,
    setShowUnavailableStations,
    setRefreshInterval,
    resetSettings
  } = useSettingsStore()
  
  // 主题相关状态
  const { theme, isDark, toggleTheme } = useThemeStore()
  
  // 贡献者信息
  const { contributors, repoStats, stats, isLoading: contributorsLoading, error: contributorsError, lastUpdated, refresh } = useContributors()
  
  // 动画状态
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      // 焦点陷阱：防止背景滚动
      document.body.style.overflow = 'hidden'
      
      // ESC键关闭
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 z-[2000]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '16px'
      }}
    >
      <div 
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full overflow-hidden flex flex-col transform transition-all duration-300 ease-out ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          maxWidth: '480px',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="settings-title" className="text-xl font-semibold text-gray-800 dark:text-gray-200">设置</h2>
          <button
            onClick={onClose}
            className="p-3 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="关闭设置"
            type="button"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content - 可滚动区域 */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* 基础设置示例 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">基础设置</h3>
            
            {/* 示例设置项 - 自动刷新 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  自动刷新
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  定期自动更新充电桩状态
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                <label
                  htmlFor="auto-refresh"
                  className={`block w-10 h-6 rounded-full cursor-pointer transition-colors ${
                    autoRefresh 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span 
                    className={`block w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      autoRefresh 
                        ? 'transform translate-x-5 translate-y-1' 
                        : 'transform translate-x-1 translate-y-1'
                    }`}
                  ></span>
                </label>
              </div>
            </div>

            {/* 显示无可用插座的充电桩 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  显示无可用插座的充电桩
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  在地图上显示没有可用插座的充电桩
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  id="show-unavailable-stations"
                  checked={showUnavailableStations}
                  onChange={(e) => setShowUnavailableStations(e.target.checked)}
                />
                <label
                  htmlFor="show-unavailable-stations"
                  className={`block w-10 h-6 rounded-full cursor-pointer transition-colors ${
                    showUnavailableStations 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span 
                    className={`block w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      showUnavailableStations 
                        ? 'transform translate-x-5 translate-y-1' 
                        : 'transform translate-x-1 translate-y-1'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
          </div>

          {/* 外观设置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">外观设置</h3>
            
            {/* 主题切换 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  暗色主题
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {theme === 'auto' ? '跟随系统' : (isDark ? '已启用' : '已禁用')}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={theme === 'auto' ? '当前跟随系统' : (isDark ? '切换到亮色模式' : '切换到暗色模式')}
              >
                {theme === 'auto' ? (
                  <SettingsBrightnessOutlined className="w-6 h-6" />
                ) : isDark ? (
                  <WbSunnyOutlined className="w-6 h-6" />
                ) : (
                  <NightlightOutlined className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* 数据设置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">数据设置</h3>
            
            {/* 刷新间隔 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                刷新间隔
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                更短的间隔可减少数据不一致，但会增加流量消耗
              </p>
              <select 
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="3">3 秒（最快）</option>
                <option value="5">5 秒（推荐）</option>
                <option value="10">10 秒</option>
                <option value="15">15 秒</option>
                <option value="30">30 秒</option>
                <option value="60">1 分钟</option>
                <option value="300">5 分钟</option>
              </select>
            </div>
          </div>

          {/* 关于信息 */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">关于</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>
                <span className="font-medium">版本:</span> {formatVersionDisplay()}
                {getBuildEnv() === 'development' && (
                  <span className="ml-1 text-xs text-orange-500">({getShortGitCommit()})</span>
                )}
              </p>
              <p>
                <span className="font-medium">数据来源:</span> 闪开来电充电桩API
              </p>
              <p>
                <span className="font-medium">地图服务:</span> 高德地图
              </p>
            </div>
            
            {/* 外部链接 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">相关链接</h4>
              <div className="flex flex-col space-y-2">
                <a
                  href="https://github.com/jasonmumiao/EndlessPower"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span>GitHub 仓库</span>
                </a>
                <a
                  href="http://endlesspower.icu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>官方网站</span>
                </a>
              </div>
            </div>

            {/* 贡献者区域 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GroupOutlined className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">项目贡献者</h4>
                </div>
                <button
                  onClick={refresh}
                  disabled={contributorsLoading}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="刷新贡献者信息"
                  type="button"
                >
                  <RefreshOutlined className={`w-5 h-5 ${contributorsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {contributorsError && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">
                  {contributorsError}
                </div>
              )}

              {repoStats && (
                <div className="grid grid-cols-3 gap-3 text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{repoStats.stars}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Stars</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.totalContributors}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">贡献者</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{repoStats.forks}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Forks</div>
                  </div>
                </div>
              )}

              {contributorsLoading ? (
                <div className="flex justify-center items-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 贡献者头像网格 */}
                  <div className="grid grid-cols-6 gap-2 justify-items-center">
                    {contributors.slice(0, 12).map((contributor) => (
                      <ContributorCard 
                        key={contributor.id} 
                        contributor={contributor}
                      />
                    ))}
                  </div>
                  
                  {contributors.length > 12 && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        还有 {contributors.length - 12} 位贡献者
                      </div>
                    </div>
                  )}
                  
                  {lastUpdated && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      最后更新: {lastUpdated.toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 重置按钮 */}
            <button 
              onClick={() => {
                resetSettings()
                // 给用户视觉反馈
                const btn = document.activeElement as HTMLButtonElement
                if (btn) {
                  const originalText = btn.textContent
                  btn.textContent = '已重置'
                  btn.disabled = true
                  setTimeout(() => {
                    btn.textContent = originalText
                    btn.disabled = false
                  }, 1500)
                }
              }}
              className="w-full mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
            >
              重置所有设置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
