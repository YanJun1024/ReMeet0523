<template>
  <view class="notes-card">
    <!-- 无笔记 -->
    <view class="notes-empty" v-if="!notes || notes.length === 0">
      <text class="empty-icon">📝</text>
      <text class="empty-text">#{{ tag }} 还没有笔记</text>
      <text class="empty-hint">快去添加第一条笔记吧 ~</text>
    </view>
    
    <!-- 笔记列表 -->
    <scroll-view class="notes-list" scroll-y v-else>
      <view class="notes-header">
        <text class="notes-count">{{ notes.length }} 条笔记</text>
      </view>
      
      <view class="note-card" v-for="(note, index) in notes" :key="note.createTime">
        <view class="note-header">
          <text class="note-index">#{{ index + 1 }}</text>
          <text class="note-date">{{ formatDate(note.createTime) }}</text>
        </view>
        <text class="note-content">{{ note.content }}</text>
        <view class="note-tags" v-if="note.tags && note.tags.length > 0">
          <text class="note-tag" v-for="t in note.tags" :key="t">#{{ t }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
interface Note {
  content: string
  tags: string[]
  createTime: number
}

const props = defineProps<{
  tag: string
  notes: Note[]
}>()

const emit = defineEmits<{
  close: []
}>()

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 1 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else if (days < 30) {
    return `${Math.floor(days / 7)}周前`
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}
</script>

<style scoped>
.notes-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notes-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #333;
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: #999;
}

.notes-list {
  flex: 1;
  padding: 20px;
}

.notes-header {
  margin-bottom: 16px;
}

.notes-count {
  font-size: 14px;
  color: #666;
}

.note-card {
  background: #F8F9FA;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.note-index {
  font-size: 13px;
  color: #4A90E2;
  font-weight: 600;
}

.note-date {
  font-size: 12px;
  color: #999;
}

.note-content {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.note-tag {
  font-size: 12px;
  color: #4A90E2;
  background: rgba(74, 144, 226, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}
</style>
