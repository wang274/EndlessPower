// 环境配置
export const ENV_CONFIG = {
  // 开发模式检测 - 在 Cloudflare Workers 中也能使用调试功能
  isDevelopment:
    import.meta.env.DEV ||
    import.meta.env.MODE === 'development' ||
    // 检查是否为开发域名
    (typeof window !== 'undefined' &&
      (window.location.hostname.includes('-dev') ||
        window.location.hostname.includes('localhost') ||
        window.location.hostname.includes('127.0.0.1'))),

  // API 配置
  apiConfig: {
    enableDebugLogs:
      import.meta.env.DEV ||
      (typeof window !== 'undefined' && window.location.hostname.includes('-dev')),
    corsRetryAttempts: 5,
    fallbackToSimulation: true
  },

  // PWA 配置
  pwaConfig: {
    enableDebugPanel:
      import.meta.env.DEV ||
      (typeof window !== 'undefined' && window.location.hostname.includes('-dev')),
    serviceWorkerUpdateInterval: 60000 // 1分钟检查一次更新
  }
}

// 便捷的导出
export const IS_DEV = ENV_CONFIG.isDevelopment
export const ENABLE_DEBUG = ENV_CONFIG.apiConfig.enableDebugLogs
