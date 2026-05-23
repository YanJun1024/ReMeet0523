<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="toggleDrawer">
        <view class="menu-icon">
          <view class="menu-line"></view>
          <view class="menu-line short"></view>
          <view class="menu-line medium"></view>
        </view>
      </view>
      <text class="nav-title">TagWord</text>
      <view class="nav-placeholder"></view>
    </view>
    
    <!-- 可滑动卡片区域 -->
    <view class="card-section">
      <view class="swipe-container">
        <!-- 主卡片 -->
        <view 
          class="swipe-card"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          @touchcancel="onTouchEnd"
        >
        <!-- 标签标题 -->
        <view class="tag-header">
          <text class="tag-icon">🏷️</text>
          <text class="tag-name">#{{ store.currentTag }}</text>
        </view>
        
        <view class="divider"></view>
        
        <!-- 笔记内容区域 -->
        <view class="note-content-wrapper">
          <!-- 左侧滑动提示 -->
          <view class="swipe-hint left">
            <text class="hint-arrow">◀</text>
            <text class="hint-text">笔记</text>
          </view>
          
          <!-- 笔记内容 -->
          <view class="note-content" v-if="store.latestNote">
            <view class="note-date">
              <text class="date-icon">📅</text>
              <text class="date-text">{{ formatDate(store.latestNote.createTime) }}</text>
            </view>
            <text class="note-text">{{ store.latestNote.content }}</text>
          </view>
          
          <view class="note-content empty" v-else>
            <text class="empty-text">暂无相关笔记</text>
            <text class="empty-hint">输入 #{{ store.currentTag }} 创建第一条笔记</text>
          </view>
          
          <!-- 右侧滑动提示 -->
          <view class="swipe-hint right">
            <text class="hint-text">词典</text>
            <text class="hint-arrow">▶</text>
          </view>
        </view>
        </view>
      </view>
    </view>
    
    <!-- 编辑区域（底部卡片） -->
    <view class="edit-section">
      <view class="edit-card">
        <view class="edit-grabber"></view>
        <textarea
          class="edit-input"
          :value="store.editContent"
          placeholder="现在的想法是..."
          :maxlength="2000"
          @input="onInput"
          :fixed="true"
        />
        <view class="edit-toolbar">
          <text class="toolbar-btn">#</text>
          <text class="toolbar-btn">🖼️</text>
          <text class="toolbar-btn">B</text>
          <text class="toolbar-btn">☰</text>
          <view class="toolbar-spacer"></view>
          <button class="save-btn" @click="saveNote">发送</button>
        </view>
      </view>
    </view>
    
    <!-- 抽屉遮罩 -->
    <view 
      class="drawer-mask" 
      :class="{ active: drawerOpen }" 
      @click="closeDrawer"
    ></view>
    
    <!-- 抽屉面板 -->
    <view class="drawer-panel" :class="{ open: drawerOpen }">
      <!-- 抽屉状态栏占位 -->
      <view class="drawer-status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      
      <view class="drawer-header">
        <view class="nav-back" @click="closeDrawer">
          <text class="back-icon">←</text>
          <text class="back-text">返回</text>
        </view>
        <text class="drawer-title">标签管理</text>
        <view class="nav-placeholder"></view>
      </view>
      
      <!-- 用户信息（点击进入用户中心） -->
      <view class="drawer-user-wrapper">
        <view class="drawer-user" @click="goToUser">
          <view class="user-avatar">
            <text class="avatar-text">👤</text>
          </view>
          <view class="user-detail">
            <text class="user-name">学习者</text>
            <text class="user-id">@username</text>
          </view>
          <text class="user-arrow">›</text>
        </view>
      </view>
      
      <!-- 搜索 -->
      <view class="drawer-search-wrapper">
        <view class="drawer-search">
          <text class="search-icon">🔍</text>
          <input class="search-input" type="text" placeholder="搜索标签..." v-model="searchKeyword" />
        </view>
      </view>
      
      <!-- 标签列表 -->
      <scroll-view class="drawer-tags" scroll-y>
        <view 
          class="drawer-tag-item" 
          v-for="(tag, index) in filteredTags" 
          :key="tag.name"
          @click="selectTag(tag)"
        >
          <view class="tag-rank" v-if="index < 3">
            <text class="rank-icon">{{ ['🥇', '🥈', '🥉'][index] }}</text>
          </view>
          <view class="tag-rank" v-else>
            <text class="rank-dot">•</text>
          </view>
          <view class="tag-info">
            <text class="tag-name">#{{ tag.name }}</text>
            <text class="tag-count">{{ tag.noteCount }}条笔记</text>
          </view>
          <view class="tag-status">
            <text class="status-badge" :class="tag.status">{{ tag.status === 'learning' ? '学习中' : '已学会' }}</text>
          </view>
        </view>
        
        <view class="drawer-empty" v-if="filteredTags.length === 0">
          <text class="empty-text">没有找到相关标签</text>
        </view>
      </scroll-view>
      
      <view class="drawer-footer">
        <text class="footer-text">排序：笔记数降序 → 字母升序</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores'
import type { Tag } from '@/stores'

const store = useAppStore()
const drawerOpen = ref(false)
const searchKeyword = ref('')
const statusBarHeight = ref(44)

const filteredTags = computed(() => {
  let tags = store.sortedTags
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    tags = tags.filter(tag => tag.name.toLowerCase().includes(keyword))
  }
  return tags
})

const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value
}

const closeDrawer = () => {
  drawerOpen.value = false
}

const selectTag = (tag: Tag) => {
  store.setCurrentTag(tag.name)
  closeDrawer()
}

// 进入用户中心
const goToUser = () => {
  closeDrawer()
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/user/user'
    })
  }, 300)
}

// 触摸事件处理
let touchStartX = 0
let touchEndX = 0

const onTouchStart = (e: TouchEvent) => {
  touchStartX = e.touches[0].clientX
}

const onTouchMove = (e: TouchEvent) => {
  touchEndX = e.touches[0].clientX
}

const onTouchEnd = () => {
  const diff = touchStartX - touchEndX
  const threshold = 80
  
  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      // 左滑 - 进入笔记列表
      uni.navigateTo({
        url: '/pages/notes/notes?tag=' + store.currentTag
      })
    } else {
      // 右滑 - 进入词典
      uni.navigateTo({
        url: '/pages/dict/dict?word=' + store.currentTag
      })
    }
  }
}

// 输入处理
const onInput = (e: any) => {
  store.editContent = e.detail.value
  const lastTag = store.getLastTag(store.editContent)
  if (lastTag) {
    store.setCurrentTag(lastTag)
  }
}

// 保存笔记
const saveNote = () => {
  if (!store.editContent.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }
  
  const tags = store.extractTags(store.editContent)
  if (tags.length === 0) {
    uni.showToast({ title: '请至少创建一个标签', icon: 'none' })
    return
  }
  
  store.addNote(store.editContent, tags)
  store.editContent = ''
  uni.showToast({ title: '保存成功', icon: 'success' })
}

// 格式化日期
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

onLoad(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  const lastTag = store.getLastTag(store.editContent)
  if (lastTag) {
    store.setCurrentTag(lastTag)
  }
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #F8F9FA;
  display: flex;
  flex-direction: column;
}

.status-bar {
  background-color: #FFFFFF;
}

/* 顶部工具栏 */
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
  width: 60px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.menu-icon {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 18px;
  width: 20px;
}

.menu-line {
  height: 2px;
  width: 100%;
  background-color: #333333;
  border-radius: 1px;
}

.menu-line.short {
  width: 60%;
}

.menu-line.medium {
  width: 80%;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #333333;
}

.nav-placeholder {
  width: 60px;
}

.card-section {
  padding: 8px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 4px;
}

.swipe-container {
  border-radius: 12px;
  overflow: hidden;
}

.swipe-card {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.tag-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.tag-icon {
  font-size: 20px;
  margin-right: 8px;
}

.tag-name {
  font-size: 20px;
  font-weight: 600;
  color: #4A90E2;
}

.divider {
  height: 1px;
  background-color: #E8E8E8;
  margin-bottom: 16px;
}

.note-content-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
}

.note-content {
  flex: 1;
  margin: 0 40px;
  display: flex;
  flex-direction: column;
}

.note-date {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.date-icon {
  font-size: 14px;
  margin-right: 6px;
}

.date-text {
  font-size: 13px;
  color: #999999;
}

.note-text {
  font-size: 15px;
  color: #333333;
  line-height: 1.8;
  display: -webkit-box;
  -webkit-line-clamp: 8;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-content.empty {
  justify-content: center;
  align-items: center;
}

.empty-text {
  font-size: 16px;
  color: #666666;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: #999999;
}

.swipe-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999999;
  font-size: 12px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 1;
}

.swipe-hint.left {
  left: 0;
}

.swipe-hint.right {
  right: 0;
}

.hint-arrow {
  font-size: 14px;
  margin-bottom: 4px;
}

.hint-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 2px;
}

.note-content {
  flex: 1;
  margin: 0 40px;
  display: flex;
  flex-direction: column;
}

.note-date {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.date-icon {
  font-size: 14px;
  margin-right: 6px;
}

.date-text {
  font-size: 13px;
  color: #999999;
}

.note-text {
  font-size: 15px;
  color: #333333;
  line-height: 1.8;
  display: -webkit-box;
  -webkit-line-clamp: 8;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-content.empty {
  justify-content: center;
  align-items: center;
}

.empty-text {
  font-size: 16px;
  color: #666666;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: #999999;
}

.edit-section {
  background-color: #F8F9FA;
  padding: 8px 16px 16px;
  flex-shrink: 0;
}

.edit-card {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 12px 16px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.edit-grabber {
  display: none;
}

.edit-input {
  width: 100%;
  min-height: 100px;
  font-size: 15px;
  color: #333333;
  line-height: 1.6;
}

.edit-toolbar {
  display: flex;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #F0F0F0;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #999999;
  margin-right: 8px;
}

.toolbar-spacer {
  flex: 1;
}

.save-btn {
  background-color: #4A90E2;
  color: #FFFFFF;
  font-size: 14px;
  padding: 8px 20px;
  border-radius: 20px;
  border: none;
  line-height: 1.5;
}

.save-btn::after {
  border: none;
}

/* ===== 抽屉样式 ===== */
.drawer-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0);
  z-index: 998;
  pointer-events: none;
  transition: background-color 0.3s ease;
}

.drawer-mask.active {
  background-color: rgba(0, 0, 0, 0.4);
  pointer-events: auto;
}

.drawer-panel {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 90%;
  background-color: #F8F9FA;
  z-index: 999;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.1);
}

.drawer-panel.open {
  transform: translateX(0);
}

.drawer-status-bar {
  background-color: #FFFFFF;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  background-color: #FFFFFF;
  border-bottom: 1px solid #F0F0F0;
}

.drawer-title {
  font-size: 17px;
  font-weight: 600;
  color: #333333;
}



.drawer-user-wrapper {
  padding: 16px;
  border-bottom: 1px solid #F0F0F0;
}

.drawer-user {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #E3F2FD;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.avatar-text {
  font-size: 24px;
}

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.user-id {
  font-size: 13px;
  color: #999999;
}

.user-arrow {
  font-size: 20px;
  color: #CCCCCC;
}

.drawer-search-wrapper {
  padding: 16px;
  border-bottom: 1px solid #F0F0F0;
}

.drawer-search {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #F8F9FA;
  border-radius: 12px;
}

.search-icon {
  font-size: 16px;
  margin-right: 8px;
  color: #999999;
}

.search-input {
  flex: 1;
  font-size: 14px;
  color: #333333;
}

.drawer-tags {
  flex: 1;
  overflow: hidden;
}

.drawer-tag-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #F5F5F5;
}

.tag-rank {
  width: 32px;
  text-align: center;
  margin-right: 12px;
}

.rank-icon {
  font-size: 20px;
}

.rank-dot {
  font-size: 12px;
  color: #CCCCCC;
}

.tag-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tag-name {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
}

.tag-count {
  font-size: 13px;
  color: #999999;
}

.tag-status {
  margin-right: 4px;
}

.status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.status-badge.learning {
  background-color: #E3F2FD;
  color: #4A90E2;
}

.status-badge.mastered {
  background-color: #E8F5E9;
  color: #4CAF50;
}

.drawer-empty {
  text-align: center;
  padding: 40px;
}

.drawer-footer {
  padding: 16px;
  text-align: center;
  border-top: 1px solid #F0F0F0;
}

.footer-text {
  font-size: 12px;
  color: #999999;
}
</style>
