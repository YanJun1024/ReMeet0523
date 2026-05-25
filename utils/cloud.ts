/**
 * 微信云开发初始化封装
 * 
 * 使用前需要在微信开发者工具中：
 * 1. 开通云开发
 * 2. 创建云环境，获取环境 ID
 * 3. 将环境 ID 填入下方 CLOUD_ENV_ID
 */

// ⚠️ 替换为你的云开发环境 ID
const CLOUD_ENV_ID = 'cloud1-d0gsf9jp5bac7f883'

let initialized = false

/**
 * 初始化云开发（仅执行一次）
 */
export const initCloud = () => {
  if (initialized) return
  if (typeof wx === 'undefined') {
    console.warn('[Cloud] 非微信环境，跳过云开发初始化')
    return
  }
  try {
    wx.cloud.init({
      env: CLOUD_ENV_ID,
      traceUser: true
    })
    initialized = true
    console.log('[Cloud] 云开发初始化成功')
  } catch (e) {
    console.error('[Cloud] 云开发初始化失败:', e)
  }
}

/**
 * 获取云数据库引用
 */
export const getDB = () => {
  if (!initialized) initCloud()
  return wx.cloud.database()
}

/**
 * 调用云函数
 */
export const callFunction = (name: string, data: Record<string, any> = {}) => {
  if (!initialized) initCloud()
  return wx.cloud.callFunction({ name, data })
}

/**
 * 获取云存储引用
 */
export const getStorage = () => {
  if (!initialized) initCloud()
  return wx.cloud.uploadFile
}

/**
 * 上传文件到云存储
 */
export const uploadFile = (cloudPath: string, filePath: string) => {
  if (!initialized) initCloud()
  return wx.cloud.uploadFile({ cloudPath, filePath })
}

/**
 * 下载文件从云存储
 */
export const downloadFile = (fileID: string) => {
  if (!initialized) initCloud()
  return wx.cloud.downloadFile({ fileID })
}
