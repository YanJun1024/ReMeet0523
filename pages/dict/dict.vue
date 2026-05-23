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
      <text class="nav-title">词典</text>
      <view class="nav-action" @click="playAudio">
        <text class="action-icon">🔊</text>
      </view>
    </view>
    
    <!-- 词典内容 -->
    <scroll-view 
      class="dict-content" 
      scroll-y 
      :style="{ height: contentHeight + 'px' }"
    >
      <!-- 单词标题 -->
      <view class="word-header">
        <text class="word-text">{{ word }}</text>
        <text class="phonetic">/{{ phonetic }}/</text>
      </view>
      
      <!-- 词性和释义 -->
      <view class="section-card" v-if="meanings.length > 0">
        <text class="section-title">释义</text>
        <view class="meaning-item" v-for="(meaning, index) in meanings" :key="index">
          <text class="part-of-speech">{{ meaning.partOfSpeech }}</text>
          <view class="definitions">
            <text 
              class="definition" 
              v-for="(def, idx) in meaning.definitions.slice(0, 3)" 
              :key="idx"
            >
              {{ idx + 1 }}. {{ def.definition }}
            </text>
          </view>
        </view>
      </view>
      
      <!-- 例句 -->
      <view class="section-card" v-if="examples.length > 0">
        <text class="section-title">例句</text>
        <text class="example-item" v-for="(example, index) in examples.slice(0, 3)" :key="index">
          {{ index + 1 }}. {{ example }}
        </text>
      </view>
      
      <!-- 我的笔记 -->
      <view class="section-card note-card" v-if="myNotes.length > 0">
        <text class="section-title">我的笔记</text>
        <view class="my-note-item" v-for="(note, index) in myNotes.slice(0, 2)" :key="index">
          <text class="my-note-text">{{ note.content }}</text>
        </view>
      </view>
      
      <!-- 常见搭配 -->
      <view class="section-card" v-if="webMeanings.length > 0">
        <text class="section-title">常见搭配</text>
        <text class="collocation-item" v-for="(item, index) in webMeanings" :key="index">
          {{ item }}
        </text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores'

const store = useAppStore()
const word = ref('')
const phonetic = ref('bɔːl')
const statusBarHeight = ref(44)
const contentHeight = ref(600)

const meanings = ref<any[]>([
  {
    partOfSpeech: 'n.',
    definitions: [
      { definition: '球；球形物体' },
      { definition: '舞会（正式社交聚会）' },
      { definition: '子弹；炮弹' }
    ]
  }
])

const examples = ref([
  'The ball is round.',
  'We danced at the ball.',
  'He threw the ball to me.'
])

const myNotes = ref<any[]>([])

const webMeanings = ref([
  'play ball 合作',
  'have a ball 玩得开心',
  'on the ball 机警的',
  'ball game 球类运动'
])

onLoad((options) => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  contentHeight.value = sysInfo.windowHeight - statusBarHeight.value - 44
  
  if (options?.word) {
    word.value = options.word
    myNotes.value = store.notes.filter(note => 
      note.tags.includes(options.word)
    ).sort((a, b) => b.createTime - a.createTime)
  }
})

const goBack = () => {
  uni.navigateBack({
    animationType: 'slide-out-left',
    animationDuration: 300
  })
}

const playAudio = () => {
  uni.showToast({ title: '播放发音', icon: 'none' })
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

.nav-action {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon {
  font-size: 20px;
}

.dict-content {
  padding: 16px;
}

.word-header {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  margin-bottom: 12px;
}

.word-text {
  display: block;
  font-size: 32px;
  font-weight: 300;
  letter-spacing: 4px;
  color: #333333;
  margin-bottom: 8px;
}

.phonetic {
  font-size: 15px;
  color: #999999;
  font-style: italic;
}

.section-card {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.meaning-item {
  margin-bottom: 12px;
}

.meaning-item:last-child {
  margin-bottom: 0;
}

.part-of-speech {
  font-size: 15px;
  font-weight: 600;
  color: #4A90E2;
  margin-bottom: 6px;
  display: block;
}

.definitions {
  padding-left: 8px;
}

.definition {
  display: block;
  font-size: 15px;
  color: #333333;
  line-height: 1.8;
  margin-bottom: 2px;
}

.example-item {
  display: block;
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  margin-bottom: 4px;
}

.note-card {
  background-color: #FFFBF0;
}

.my-note-item {
  background-color: #FFF8E1;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 8px;
  border-left: 3px solid #FFB300;
}

.my-note-item:last-child {
  margin-bottom: 0;
}

.my-note-text {
  font-size: 14px;
  color: #333333;
  line-height: 1.6;
}

.collocation-item {
  display: block;
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  margin-bottom: 2px;
}
</style>
