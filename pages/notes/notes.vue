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
      <text class="nav-title">#{{ currentTag }} 的笔记</text>
      <view class="nav-placeholder"></view>
    </view>
    
    <!-- 笔记列表 -->
    <scroll-view 
      class="notes-list" 
      scroll-y 
      :style="{ height: contentHeight + 'px' }"
    >
      <view 
        class="note-card" 
        v-for="note in notes" 
        :key="note.id"
        @click="viewNoteDetail(note)"
      >
        <view class="card-header">
          <text class="card-date">📅 {{ formatDate(note.createTime) }}</text>
        </view>
        <view class="card-body">
          <text class="card-title">{{ getNoteTitle(note.content) }}</text>
          <text class="card-summary">{{ getNoteSummary(note.content) }}</text>
        </view>
        <view class="card-footer">
          <text class="view-detail">查看详情</text>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="load-more" v-if="notes.length > 0">
        <text class="load-text">没有更多笔记了</text>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="notes.length === 0">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无笔记</text>
        <text class="empty-hint">快去创建第一条笔记吧</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores'
import type { Note } from '@/stores'

const store = useAppStore()
const currentTag = ref('')
const notes = ref<Note[]>([])
const statusBarHeight = ref(44)
const contentHeight = ref(600)

onLoad((options) => {
  // 获取状态栏高度
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  contentHeight.value = sysInfo.windowHeight - statusBarHeight.value - 44
  
  if (options?.tag) {
    currentTag.value = options.tag
    notes.value = store.notes.filter(note => 
      note.tags.includes(options.tag)
    ).sort((a, b) => b.createTime - a.createTime)
  }
})

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

const viewNoteDetail = (note: Note) => {
  uni.showModal({
    title: '笔记详情',
    content: note.content,
    showCancel: false
  })
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getNoteTitle = (content: string) => {
  const firstLine = content.split('\n')[0]
  return firstLine.length > 20 ? firstLine.slice(0, 20) + '...' : firstLine
}

const getNoteSummary = (content: string) => {
  const summary = content.replace(/#\w+/g, '').trim()
  return summary.length > 60 ? summary.slice(0, 60) + '...' : summary
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

.notes-list {
  padding: 16px;
}

.note-card {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
  height: 320px;
}

.card-header {
  margin-bottom: 10px;
}

.card-date {
  font-size: 13px;
  color: #999999;
}

.card-body {
  margin-bottom: 12px;
}

.card-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 6px;
  line-height: 1.4;
}

.card-summary {
  display: block;
  font-size: 14px;
  color: #333333;
  line-height: 1.8;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.view-detail {
  font-size: 12px;
  color: #4A90E2;
  padding: 4px 12px;
  border: 1px solid #4A90E2;
  border-radius: 12px;
}

.load-more {
  text-align: center;
  padding: 20px;
}

.load-text {
  font-size: 13px;
  color: #999999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
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
</style>
