<template>
  <view class="dict-card">
    <!-- 加载中 -->
    <view class="dict-loading" v-if="data.loading">
      <text class="loading-text">查询中...</text>
    </view>
    
    <!-- 错误 -->
    <view class="dict-error" v-else-if="data.error">
      <text class="error-text">查询失败，请稍后重试</text>
    </view>
    
    <!-- 无单词 -->
    <view class="dict-empty" v-else-if="!data.word">
      <text class="empty-text">请输入一个单词</text>
    </view>
    
    <!-- 词典内容 -->
    <scroll-view class="dict-content" scroll-y v-else>
      <!-- 单词标题 -->
      <view class="dict-header">
        <text class="dict-word">{{ data.word }}</text>
        <view class="dict-phonetic" v-if="data.phonetic">
          <text class="phonetic-text">/{{ data.phonetic }}/</text>
        </view>
      </view>
      
      <!-- 释义列表 -->
      <view class="dict-meanings" v-if="data.meanings && data.meanings.length > 0">
        <view class="meaning-item" v-for="(meaning, index) in data.meanings" :key="index">
          <text class="meaning-pos">{{ meaning.pos }}</text>
          <text class="meaning-def">{{ meaning.def }}</text>
        </view>
      </view>
      
      <!-- 例句 -->
      <view class="dict-examples" v-if="data.examples && data.examples.length > 0">
        <text class="examples-title">例句</text>
        <view class="example-item" v-for="(example, index) in data.examples" :key="index">
          <text class="example-en">{{ example.en }}</text>
          <text class="example-cn">{{ example.cn }}</text>
        </view>
      </view>
      
      <!-- 我的笔记 -->
      <view class="dict-notes" v-if="data.myNotes && data.myNotes.length > 0">
        <text class="notes-title">我的笔记</text>
        <view class="note-item" v-for="(note, index) in data.myNotes" :key="index">
          <text class="note-content">{{ note.content }}</text>
          <text class="note-date">{{ formatDate(note.createTime) }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
interface DictData {
  word: string
  phonetic: string
  ukPhonetic: string
  usPhonetic: string
  ukAudio: string
  usAudio: string
  meanings: Array<{ pos: string; def: string }>
  examples: Array<{ en: string; cn: string }>
  myNotes: Array<{ content: string; createTime: number }>
  loading: boolean
  error: boolean
}

const props = defineProps<{
  data: DictData
}>()

const emit = defineEmits<{
  close: []
}>()

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style scoped>
.dict-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dict-loading,
.dict-error,
.dict-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-text,
.error-text,
.empty-text {
  font-size: 14px;
  color: #999;
}

.dict-content {
  flex: 1;
  padding: 20px;
}

.dict-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #F0F0F0;
}

.dict-word {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.dict-phonetic {
  display: flex;
  gap: 16px;
}

.phonetic-text {
  font-size: 14px;
  color: #666;
}

.dict-meanings {
  margin-bottom: 24px;
}

.meaning-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.meaning-pos {
  font-size: 13px;
  color: #4A90E2;
  font-weight: 500;
  min-width: 40px;
}

.meaning-def {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  flex: 1;
}

.dict-examples,
.dict-notes {
  margin-bottom: 24px;
}

.examples-title,
.notes-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.example-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #F8F9FA;
  border-radius: 8px;
}

.example-en {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 4px;
}

.example-cn {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.note-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #F0F7FF;
  border-radius: 8px;
}

.note-content {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 4px;
}

.note-date {
  font-size: 12px;
  color: #999;
}
</style>
