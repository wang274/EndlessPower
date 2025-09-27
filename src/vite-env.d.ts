/// <reference types="vite/client" />

// 全局变量声明
declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string  
declare const __GIT_COMMIT__: string

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string
  readonly VITE_BUILD_TIME?: string
  readonly VITE_GIT_COMMIT?: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
