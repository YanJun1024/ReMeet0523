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
      <text class="nav-title">标签管理</text>
      <view class="nav-placeholder"></view>
    </view>
    
    <!-- 用户信息区 -->
    <view class="user-section" @click="goToUser">
      <view class="user-info">
        <view class="user-avatar">
          <text class="avatar-text">👤</text>
        </view>
        <view class="user-detail">
          <text class="user-name">学习者</text>
          <text class="user-id">@username</text>
        </view>
      </view>
      <view class="settings-icon">
        <text>⚙️</text>
      </view>
    </view>
    
    <!-- 标签列表区 -->
    <view class="tags-section">
      <view class="section-header">
        <text class="section-title">📚 全部标签</text>
      </view>
      
      <!-- 搜索框 -->
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input" 
          type="text" 
          placeholder="搜索标签..."
          v-model="searchKeyword"
          @input="onSearch"
        />
      </view>
      
      <!-- 标签列表 -->
      <scroll-view class="tags-list" scroll-y :style="{ height: scrollHeight + 'px' }">
        <view 
          class="tag-item" 
          v-for="(tag, index) in filteredTags" 
          :key="tag.name"
          @click="showTagOptions(tag)"
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
          <text class="arrow-icon">></text>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-state" v-if="filteredTags.length === 0">
          <text class="empty-text">没有找到相关标签</text>
        </view>
      </scroll-view>
      
      <!-- 排序说明 -->
      <view class="sort-info">
        <text class="sort-text">排序：笔记数降序 → 字母升序</text>
      </view>
    </view>
    
    <!-- 标签选项弹窗 -->
    <view class="modal-mask" v-if="showModal" @click="closeModal"></view>
    <view class="modal-content" v-if="showModal">
      <view class="modal-header">
        <text class="modal-title">📌 #{{ selectedTag?.name }}</text>
      </view>
      <view class="modal-body">
        <view class="modal-option" @click="goToDict">
          <text class="option-icon">📖</text>
          <view class="option-info">
            <text class="option-title">进入词典</text>
            <text class="option-desc">查看释义和发音</text>
          </view>
        </view>
        <view class="modal-option" @click="goToNotes">
          <text class="option-icon">📝</text>
          <view class="option-info">
            <text class="option-title">进入相关笔记</text>
            <text class="option-desc">查看 {{ selectedTag?.noteCount }} 条笔记</text>
          </view>
        </view>
        <view class="modal-option" @click="markAsMastered" v-if="selectedTag?.status === 'learning'">
          <text class="option-icon">✅</text>
          <view class="option-info">
            <text class="option-title">标记为已学会</text>
            <text class="option-desc">该标签将不再排序靠前</text>
          </view>
        </view>
      </view>
      <view class="modal-footer">
        <text class="cancel-btn" @click="closeModal">取消</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores'
import type { Tag } from '@/stores'

const store = useAppStore()
const searchKeyword = ref('')
const showModal = ref(false)
const selectedTag = ref<Tag | null>(null)
const statusBarHeight = ref(44)
const scrollHeight = ref(400)

onShow(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  // 计算 scroll-view 高度：窗口高度 - 状态栏 - 导航栏(44) - 搜索区(约100) - 底部间距
  scrollHeight.value = sysInfo.windowHeight - statusBarHeight.value - 44 - 100
})

const filteredTags = computed(() => {
  let tags = store.sortedTags
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    tags = tags.filter(tag => tag.name.toLowerCase().includes(keyword))
  }
  return tags
})

const onSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

const showTagOptions = (tag: Tag) => {
  selectedTag.value = tag
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedTag.value = null
}

const goToDict = () => {
  if (selectedTag.value) {
    uni.navigateTo({
      url: '/pages/dict/dict?word=' + selectedTag.value.name
    })
    closeModal()
  }
}

const goToNotes = () => {
  if (selectedTag.value) {
    uni.navigateTo({
      url: '/pages/notes/notes?tag=' + selectedTag.value.name
    })
    closeModal()
  }
}

const markAsMastered = () => {
  if (selectedTag.value) {
    store.markTagAsMastered(selectedTag.value.name)
    uni.showToast({ title: '已标记为已学会', icon: 'success' })
    closeModal()
  }
}

const goToUser = () => {
  uni.navigateTo({
    url: '/pages/user/user'
  })
}

const goBack = () => {
  // #ifdef APP-PLUS
  uni.navigateBack({
    animationType: 'slide-out-left',
    animationDuration: 300
  })
  // #endif
  // #ifndef APP-PLUS
  uni.navigateBack()
  // #endif
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #F8F9FA;
}

/* 顶部导航栏 */
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

.user-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px;
  background-color: #FFFFFF;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
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

.settings-icon {
  font-size: 20px;
  padding: 8px;
}

.tags-section {
  background-color: #FFFFFF;
  flex: 1;
}

.section-header {
  padding: 16px;
  border-bottom: 1px solid #E8E8E8;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
}

.search-box {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #E8E8E8;
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

.tags-list {
  overflow: hidden;
}

.tag-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #F0F0F0;
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
  margin-right: 12px;
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

.arrow-icon {
  font-size: 14px;
  color: #CCCCCC;
}

.sort-info {
  padding: 12px 16px;
  background-color: #F8F9FA;
  text-align: center;
}

.sort-text {
  font-size: 12px;
  color: #999999;
}

.empty-state {
  text-align: center;
  padding: 40px;
}

.empty-text {
  font-size: 14px;
  color: #999999;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.modal-content {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 320px;
  background-color: #FFFFFF;
  border-radius: 16px;
  z-index: 101;
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #E8E8E8;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #333333;
}

.modal-body {
  padding: 8px 0;
}

.modal-option {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #F0F0F0;
}

.modal-option:last-child {
  border-bottom: none;
}

.option-icon {
  font-size: 20px;
  margin-right: 12px;
}

.option-info {
  flex: 1;
}

.option-title {
  display: block;
  font-size: 15px;
  color: #333333;
  margin-bottom: 4px;
}

.option-desc {
  display: block;
  font-size: 12px;
  color: #999999;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid #E8E8E8;
  text-align: center;
}

.cancel-btn {
  font-size: 15px;
  color: #999999;
  padding: 8px 24px;
}
</style>
