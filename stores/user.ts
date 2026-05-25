import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 用户信息类型
export interface UserInfo {
  openid: string
  nickName: string
  avatarUrl: string
}

// VIP 状态
export type VipStatus = 'none' | 'active' | 'expired'

// 用户配置（存储配额等）
export interface UserQuota {
  /** 已用存储空间（字节） */
  usedStorage: number
  /** 最大存储空间（字节） */
  maxStorage: number
  /** 是否支持自动同步 */
  autoSync: boolean
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const isLoggedIn = ref(false)
  const userInfo = ref<UserInfo | null>(null)
  const vipStatus = ref<VipStatus>('none')
  const vipExpireTime = ref(0)
  const quota = ref<UserQuota>({
    usedStorage: 0,
    maxStorage: 100 * 1024 * 1024,  // 免费用户 100MB
    autoSync: false
  })

  // 计算属性
  const isVip = computed(() => vipStatus.value === 'active')

  /** 剩余可用空间（字节） */
  const remainStorage = computed(() => {
    return Math.max(0, quota.value.maxStorage - quota.value.usedStorage)
  })

  /** 存储使用百分比 */
  const storagePercent = computed(() => {
    if (quota.value.maxStorage === 0) return 0
    return Math.round((quota.value.usedStorage / quota.value.maxStorage) * 100)
  })

  /** 是否已到达存储上限 */
  const isStorageFull = computed(() => {
    return quota.value.usedStorage >= quota.value.maxStorage
  })

  // 方法

  /**
   * 微信一键登录
   * 调用云函数 login 获取 openid 和用户信息
   */
  const login = async () => {
    try {
      // 检查云开发是否可用
      if (typeof wx === 'undefined') {
        uni.showToast({ title: '仅支持微信小程序', icon: 'none' })
        return false
      }

      const { result }: any = await wx.cloud.callFunction({ name: 'login' })

      if (result && result.openid) {
        userInfo.value = {
          openid: result.openid,
          nickName: result.nickName || '学习者',
          avatarUrl: result.avatarUrl || ''
        }
        vipStatus.value = result.vipStatus || 'none'
        vipExpireTime.value = result.vipExpireTime || 0
        quota.value.usedStorage = result.usedStorage || 0
        quota.value.maxStorage = result.maxStorage || 100 * 1024 * 1024
        quota.value.autoSync = result.vipStatus === 'active'
        isLoggedIn.value = true

        // 持久化登录状态
        uni.setStorageSync('user_info', userInfo.value)
        uni.setStorageSync('vip_status', vipStatus.value)
        uni.setStorageSync('vip_expire_time', vipExpireTime.value)

        return true
      }

      return false
    } catch (e) {
      console.error('[UserStore] 登录失败:', e)
      uni.showToast({ title: '登录失败，请重试', icon: 'none' })
      return false
    }
  }

  /**
   * 恢复本地缓存的登录状态
   */
  const restoreSession = () => {
    const cached = uni.getStorageSync('user_info')
    if (cached) {
      userInfo.value = cached
      vipStatus.value = uni.getStorageSync('vip_status') || 'none'
      vipExpireTime.value = uni.getStorageSync('vip_expire_time') || 0
      isLoggedIn.value = true

      // 检查 VIP 是否过期
      if (vipStatus.value === 'active' && vipExpireTime.value > 0) {
        if (Date.now() > vipExpireTime.value) {
          vipStatus.value = 'expired'
          quota.value.autoSync = false
          quota.value.maxStorage = 100 * 1024 * 1024
        }
      }
    }
  }

  /**
   * 退出登录
   */
  const logout = () => {
    isLoggedIn.value = false
    userInfo.value = null
    vipStatus.value = 'none'
    vipExpireTime.value = 0
    quota.value = {
      usedStorage: 0,
      maxStorage: 100 * 1024 * 1024,
      autoSync: false
    }
    uni.removeStorageSync('user_info')
    uni.removeStorageSync('vip_status')
    uni.removeStorageSync('vip_expire_time')
  }

  /**
   * 更新存储使用量
   */
  const updateStorageUsage = (used: number) => {
    quota.value.usedStorage = used
  }

  /**
   * 激活 VIP
   */
  const activateVip = (expireTime: number) => {
    vipStatus.value = 'active'
    vipExpireTime.value = expireTime
    quota.value.maxStorage = 10 * 1024 * 1024 * 1024  // VIP 10GB
    quota.value.autoSync = true

    uni.setStorageSync('vip_status', 'active')
    uni.setStorageSync('vip_expire_time', expireTime)
  }

  return {
    isLoggedIn,
    userInfo,
    vipStatus,
    vipExpireTime,
    quota,
    isVip,
    remainStorage,
    storagePercent,
    isStorageFull,
    login,
    restoreSession,
    logout,
    updateStorageUsage,
    activateVip
  }
})
