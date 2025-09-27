import { useEffect } from 'react'
import { updatePageSEO, SEOConfig, pageSEOConfigs } from '../utils/seo'

/**
 * 用于动态更新页面SEO信息的Hook
 */
export const useSEO = (pageKey?: keyof typeof pageSEOConfigs, customConfig?: SEOConfig) => {
  useEffect(() => {
    let config: SEOConfig = {}
    
    // 使用预定义的页面配置
    if (pageKey && pageSEOConfigs[pageKey]) {
      config = pageSEOConfigs[pageKey]
    }
    
    // 合并自定义配置
    if (customConfig) {
      config = { ...config, ...customConfig }
    }
    
    // 更新页面SEO
    updatePageSEO(config)
    
    // 清理函数：恢复默认SEO（可选）
    return () => {
      // 不需要清理，因为每次路由变化都会更新
    }
  }, [pageKey, customConfig])
}

/**
 * 设置页面标题的Hook
 */
export const useTitle = (title: string) => {
  useEffect(() => {
    const originalTitle = document.title
    document.title = title
    
    return () => {
      document.title = originalTitle
    }
  }, [title])
}

/**
 * 设置meta描述的Hook
 */
export const useDescription = (description: string) => {
  useEffect(() => {
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement
    
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    
    const originalContent = meta.getAttribute('content')
    meta.setAttribute('content', description)
    
    return () => {
      if (originalContent) {
        meta.setAttribute('content', originalContent)
      }
    }
  }, [description])
}
