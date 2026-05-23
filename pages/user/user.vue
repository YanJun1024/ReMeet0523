<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">←</text>
        <text class="back-text">返回</text>
      </view>
      <text class="nav-title">用户中心</text>
      <view class="nav-placeholder"></view>
    </view>
    
    <!-- 用户信息 -->
    <scroll-view 
      class="user-scroll" 
      scroll-y 
      :style="{ height: contentHeight + 'px' }"
    >
      <view class="user-section">
        <view class="user-avatar">
          <text class="avatar-text">👤</text>
        </view>
        <text class="user-name">学习者</text>
        <text class="user-id">@username</text>
        <view class="study-days">
          <text class="days-icon">🔥</text>
          <text class="days-text">已坚持学习 12 天</text>
        </view>
      </view>

      <!-- 学习统计 -->
      <view class="stats-section">
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-number">{{ totalNotes }}</text>
            <text class="stat-label">笔记数</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-number">{{ totalTags }}</text>
            <text class="stat-label">标签数</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-number">12</text>
            <text class="stat-label">连续天数</text>
          </view>
        </view>
      </view>

      <!-- 功能设置 -->
      <view class="settings-section">
        <view class="setting-item" @click="configDict">
          <text class="setting-icon">📖</text>
          <text class="setting-title">词典API配置</text>
          <text class="setting-arrow">›</text>
        </view>
        <view class="setting-item" @click="backupData">
          <text class="setting-icon">💾</text>
          <text class="setting-title">数据备份与恢复</text>
          <text class="setting-arrow">›</text>
        </view>
        <view class="setting-item" @click="exportData">
          <text class="setting-icon">📤</text>
          <text class="setting-title">导出学习记录</text>
          <text class="setting-arrow">›</text>
        </view>
        <view class="setting-item" @click="toggleDarkMode">
          <text class="setting-icon">🌙</text>
          <text class="setting-title">夜间模式</text>
          <switch class="setting-switch" :checked="darkMode" @change="toggleDarkMode" />
        </view>
        <view class="setting-item" @click="aboutUs">
          <text class="setting-icon">ℹ️</text>
          <text class="setting-title">关于我们</text>
          <text class="setting-arrow">›</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores'

const store = useAppStore()
const darkMode = ref(false)
const statusBarHeight = ref(44)
const contentHeight = ref(600)

const totalNotes = computed(() => store.notes.length)
const totalTags = computed(() => store.tags.length)

onLoad(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  contentHeight.value = sysInfo.windowHeight - statusBarHeight.value - 44
})

const goBack = () => {
  uni.navigateBack()
}

const configDict = () => {
  uni.showToast({ title: '词典API配置', icon: 'none' })
}

const backupData = () => {
  uni.showActionSheet({
    title: '数据管理',
    itemList: ['备份数据', '恢复数据'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.showToast({ title: '数据已备份', icon: 'success' })
      } else {
        uni.showToast({ title: '数据已恢复', icon: 'success' })
      }
    }
  })
}

const exportData = () => {
  uni.showActionSheet({
    title: '导出格式',
    itemList: ['导出为 Markdown', '导出为 JSON', '导出为 PDF'],
    success: (res) => {
      const formats = ['Markdown', 'JSON', 'PDF']
      uni.showToast({ title: `已导出为 ${formats[res.tapIndex]}`, icon: 'success' })
    }
  })
}

const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
  uni.showToast({ title: darkMode.value ? '夜间模式已开启' : '夜间模式已关闭', icon: 'none' })
}

const aboutUs = () => {
  uni.showModal({
    title: '关于 TagWord',
    content: 'TagWord 是一款标签式语言学习工具，帮助你通过 #标签 快速关联单词、笔记和词典释义。\n\n版本: 1.0.0',
    showCancel: false
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #F8F9FA;
}

.status-bar {
  background-color: #FFFFFF;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  background-color: #FFFFFF;
  border-bottom: 1px solid #F0F0F0;
}

.nav-back {
  display: flex;
  align-items: center;
  width: 60px;
}

.back-icon {
  font-size: 20px;
  color: #333333;
  margin-right: 2px;
}

.back-text {
  font-size: 15px;
  color: #333333;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #333333;
  flex: 1;
  text-align: center;
}

.nav-placeholder {
  width: 60px;
}

.user-scroll {
  padding: 0 16px 16px;
}

.user-section {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12px;
}

.user-avatar {
  width: 72px;
  height: 72px;
  border-radius: 36px;
  background-color: #E3F2FD;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.avatar-text {
  font-size: 36px;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.user-id {
  font-size: 13px;
  color: #999999;
  margin-bottom: 12px;
}

.study-days {
  display: flex;
  align-items: center;
  background-color: #FFF8E1;
  padding: 6px 14px;
  border-radius: 14px;
}

.days-icon {
  font-size: 13px;
  margin-right: 4px;
}

.days-text {
  font-size: 12px;
  color: #FF8F00;
}

.stats-section {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.stats-grid {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-number {
  font-size: 26px;
  font-weight: 600;
  color: #4A90E2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999999;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background-color: #F0F0F0;
}

.settings-section {
  background-color: #FFFFFF;
  border-radius: 12px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #F5F5F5;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-icon {
  font-size: 20px;
  margin-right: 12px;
}

.setting-title {
  flex: 1;
  font-size: 15px;
  color: #333333;
}

.setting-arrow {
  font-size: 18px;
  color: #CCCCCC;
}

.setting-switch {
  transform: scale(0.8);
}
</style>
