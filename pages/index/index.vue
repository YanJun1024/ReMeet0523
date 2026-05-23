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
      <text class="nav-title">ReMeet</text>
      <view class="nav-placeholder"></view>
    </view>
    
    <!-- 可滑动卡片区域（Swipe to Reveal） -->
    <view class="card-section">
      <view class="swipe-container">
        <!-- 左滑 Reveal：笔记 action 背景 -->
        <view class="swipe-action-left" :style="{ opacity: swipeOffsetX < 0 ? Math.min(Math.abs(swipeOffsetX) / 100, 1) : 0 }">
          <text class="action-label">笔记</text>
        </view>
        <!-- 右滑 Reveal：词典 action 背景 -->
        <view class="swipe-action-right" :style="{ opacity: swipeOffsetX > 0 ? Math.min(swipeOffsetX / 100, 1) : 0 }">
          <text class="action-label">词典</text>
        </view>
        <!-- 滑动提示箭头（闲置时隐约可见，滑动时渐隐） -->
        <view class="swipe-edge-hint left" :style="{ opacity: 0.35 - Math.max(0, Math.min(Math.abs(swipeOffsetX) / 60, 0.35)) }">
          <text class="edge-hint-label">词典</text>
          <text class="edge-hint-arrow">⟨</text>
        </view>
        <view class="swipe-edge-hint right" :style="{ opacity: 0.35 - Math.max(0, Math.min(Math.abs(swipeOffsetX) / 60, 0.35)) }">
          <text class="edge-hint-arrow">⟩</text>
          <text class="edge-hint-label">笔记</text>
        </view>
        <!-- 主卡片（跟随手指移动） -->
        <view 
          class="swipe-card"
          :style="{ transform: 'translateX(' + swipeOffsetX + 'px)' }"
          :class="{ 'swipe-animate': isSwipeAnimating }"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          @touchcancel="onTouchEnd"
        >
        <!-- 笔记内容区域 -->
        <view class="note-content-wrapper">
          <!-- 笔记内容 -->
          <view class="note-content" v-if="store.latestNote">
            <view class="note-date">
              <text class="date-icon">📅</text>
              <text class="date-text">{{ formatDate(store.latestNote.createTime) }}</text>
            </view>
            <text class="note-text">{{ store.latestNote.content }}</text>
          </view>
          
          <view class="note-content empty" v-else-if="!store.currentTag">
            <text class="empty-icon">🏷️</text>
            <text class="empty-text">输入一个 #英文单词</text>
            <text class="empty-hint">写下你的想法，开始学习吧 ~</text>
          </view>
          <view class="note-content empty" v-else>
            <text class="empty-icon">📝</text>
            <text class="empty-text">#{{ store.currentTag }} 还没有笔记</text>
            <text class="empty-hint">左滑查看笔记记录 · 右滑查看词典释义</text>
          </view>
        </view>
        </view>
      </view>
    </view>
    
    <!-- 编辑区域（底部卡片） -->
    <view class="edit-section">
      <view class="edit-card">
        <textarea
          class="edit-input"
          :value="store.editContent"
          placeholder="试试输入 #hello 然后写点什么..."
          :maxlength="2000"
          @input="onInput"
          :fixed="true"
          :show-confirm-bar="false"
        />
        <!-- 工具栏（键盘弹出时显示） -->
        <view class="edit-toolbar" v-if="keyboardHeight > 0">
          <text class="toolbar-btn" @click="insertHashtag">#</text>
          <text class="toolbar-btn" @click="onImagePlaceholder">🖼️</text>
          <text class="toolbar-btn recording" v-if="isRecording" @click="stopRecording">⏹</text>
          <text class="toolbar-btn" v-else @click="startRecording">🎤</text>
          <text class="toolbar-btn" @click="onInsertLink">🔗</text>
          <view class="toolbar-spacer"></view>
          <button 
            class="save-btn" 
            :class="{ disabled: !hasValidTag }" 
            :disabled="!hasValidTag"
            @click="saveNote"
          >保存</button>
        </view>
      </view>
    </view>
    
    <!-- 抽屉遮罩（任意抽屉打开时显示） -->
    <view 
      class="drawer-mask" 
      :class="{ active: drawerOpen || dictDrawerOpen || notesDrawerOpen || userDrawerOpen }" 
      @click="closeAllDrawers"
    ></view>
    
    <!-- 标签管理抽屉 -->
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
        >
          <!-- Swipe to Reveal 背景层：右滑露出（左侧 橘色 词典） -->
          <view class="tag-swipe-bg tag-swipe-bg-left" :style="{ opacity: tagActionOpacity(tag, 'left') }">
            <text class="tag-swipe-label">词典</text>
          </view>
          <!-- Swipe to Reveal 背景层：左滑露出（右侧 蓝色 笔记） -->
          <view class="tag-swipe-bg tag-swipe-bg-right" :style="{ opacity: tagActionOpacity(tag, 'right') }">
            <text class="tag-swipe-label">笔记</text>
          </view>
          <!-- 闲置提示箭头（与主卡片效果一致） -->
          <view class="tag-edge-hint left" :style="{ opacity: 0.3 - Math.max(0, Math.min(Math.abs(tagOffsetFor(tag)) / 50, 0.3)) }">
            <text class="tag-hint-label">词典</text>
            <text class="tag-hint-arrow">⟨</text>
          </view>
          <view class="tag-edge-hint right" :style="{ opacity: 0.3 - Math.max(0, Math.min(Math.abs(tagOffsetFor(tag)) / 50, 0.3)) }">
            <text class="tag-hint-arrow">⟩</text>
            <text class="tag-hint-label">笔记</text>
          </view>
          <!-- 主内容行（跟随手指移动） -->
          <view class="tag-main"
            :style="{ transform: 'translateX(' + tagOffsetFor(tag) + 'px)' }"
            :class="{ 'tag-main-animating': isTagAnimating && tagSwipeTarget === tag.name }" 
            @touchstart="onTagTouchStart($event, tag)"
            @touchmove="onTagTouchMove($event, tag)"
            @touchend="onTagTouchEnd(tag)"
            @longpress="onTagLongPress(tag)"
          >
          <view class="tag-rank" v-if="index < 3">
            <text class="rank-icon">{{ ['🥇', '🥈', '🥉'][index] }}</text>
          </view>
          <view class="tag-rank" v-else>
            <text class="rank-dot">•</text>
          </view>
          <view class="tag-info">
            <view class="tag-name-row">
              <text class="tag-name">#{{ tag.name }}</text>
              <text class="tag-review-time" v-if="getRelativeTime(tag.lastReviewedAt)"> {{ getRelativeTime(tag.lastReviewedAt) }}</text>
            </view>
            <text class="tag-count">{{ tag.noteCount }}条笔记</text>
          </view>
          <view class="tag-status">
            <text class="status-badge" :class="tag.status">{{ tag.status === 'learning' ? '学习中' : '已学会' }}</text>
          </view>
          </view>
        </view>
        
        <view class="drawer-empty" v-if="filteredTags.length === 0">
          <text class="empty-text">没有找到相关标签</text>
        </view>
      </scroll-view>
      
      <!-- 排序切换栏 -->
      <view class="drawer-sort-bar">
        <view class="sort-tab" :class="{ active: store.sortMode === 'noteCount' }" @click="store.setSortMode('noteCount')">
          <text class="sort-tab-text">📊 笔记数</text>
        </view>
        <view class="sort-tab" :class="{ active: store.sortMode === 'alphabet' }" @click="store.setSortMode('alphabet')">
          <text class="sort-tab-text">🔤 字母</text>
        </view>
        <view class="sort-tab" :class="{ active: store.sortMode === 'time' }" @click="store.setSortMode('time')">
          <text class="sort-tab-text">⏰ 最近</text>
        </view>
      </view>
    </view>
    
    <!-- 词典抽屉（右滑打开，从左侧滑入） -->
    <view class="dict-drawer" :class="{ open: dictDrawerOpen }">
      <view class="drawer-status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      
      <view class="drawer-header">
        <view class="nav-back" @click="closeDictDrawer">
          <text class="back-icon">←</text>
          <text class="back-text">返回</text>
        </view>
        <text class="drawer-title">词典</text>
        <view class="nav-action" @click="playAudio">
          <text class="action-icon">🔊</text>
        </view>
      </view>
      
      <scroll-view class="dict-content" scroll-y :style="{ height: drawerContentHeight + 'px' }">
        <view class="word-header">
          <text class="word-text">{{ dictData.word }}</text>
          <view class="phonetics-row">
            <!-- 英音 -->
            <view class="phonetic-item" v-if="dictData.ukPhonetic" @click="playDictAudio(dictData.ukAudio)">
              <text class="phonetic-label">英</text>
              <text class="phonetic-text">/{{ dictData.ukPhonetic }}/</text>
              <text class="speaker-icon" v-if="dictData.ukAudio">🔊</text>
            </view>
            <!-- 美音 -->
            <view class="phonetic-item" v-if="dictData.usPhonetic" @click="playDictAudio(dictData.usAudio)">
              <text class="phonetic-label">美</text>
              <text class="phonetic-text">/{{ dictData.usPhonetic }}/</text>
              <text class="speaker-icon" v-if="dictData.usAudio">🔊</text>
            </view>
            <!-- 兜底：单个音标 -->
            <view class="phonetic-item" v-if="dictData.phonetic && !dictData.ukPhonetic && !dictData.usPhonetic">
              <text class="phonetic-text">/{{ dictData.phonetic }}/</text>
            </view>
          </view>
        </view>
        
        <!-- Loading 状态 -->
        <view class="section-card dict-loading" v-if="dictData.loading">
          <text class="loading-text">🔍 正在查询词典…</text>
        </view>
        
        <!-- Error 状态 -->
        <view class="section-card dict-error" v-else-if="dictData.error">
          <text class="error-icon">⚠️</text>
          <text class="error-text">查询失败</text>
          <text class="error-hint">请检查网络连接后重试</text>
          <view class="retry-btn" @click="retryDict">
            <text class="retry-text">重新查询</text>
          </view>
        </view>
        
        <!-- 词典内容 -->
        <template v-else>
        
        <view class="section-card" v-if="dictData.meanings.length > 0">
          <text class="section-title">释义</text>
          <view class="meaning-item" v-for="(meaning, index) in dictData.meanings" :key="index">
            <text class="part-of-speech">
              {{ meaning.partOfSpeechCN }}
              <text class="pos-en">{{ meaning.partOfSpeech }}</text>
            </text>
            <view class="definitions">
              <view class="definition-item" v-for="(def, idx) in meaning.definitions" :key="idx">
                <text class="definition-en">{{ idx + 1 }}. {{ def.definition }}</text>
                <text class="definition-zh" v-if="def.definitionCN">{{ def.definitionCN }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="section-card" v-if="dictData.examples.length > 0">
          <text class="section-title">例句</text>
          <view class="example-item" v-for="(example, index) in dictData.examples.slice(0, 4)" :key="index">
            <text class="example-en">{{ index + 1 }}. {{ example.en }}</text>
            <text class="example-zh" v-if="example.zh">{{ example.zh }}</text>
          </view>
        </view>
        
        <view class="section-card dict-note-card" v-if="dictData.myNotes.length > 0">
          <text class="section-title">我的笔记</text>
          <view class="my-note-item" v-for="(note, index) in dictData.myNotes.slice(0, 2)" :key="index">
            <text class="my-note-text">{{ note.content }}</text>
          </view>
        </view>
        </template>
      </scroll-view>
    </view>
    
    <!-- 笔记抽屉（左滑打开，从右侧滑入） -->
    <view class="notes-drawer" :class="{ open: notesDrawerOpen }">
      <view class="drawer-status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      
      <view class="drawer-header">
        <view class="nav-back" @click="closeNotesDrawer">
          <text class="back-icon">←</text>
          <text class="back-text">返回</text>
        </view>
        <text class="drawer-title">#{{ store.currentTag }} 的笔记</text>
        <view class="nav-placeholder"></view>
      </view>
      
      <scroll-view class="notes-list" scroll-y :style="{ height: drawerContentHeight + 'px' }">
        <view class="note-item" v-for="note in filteredNotes" :key="note.id" @click="viewNoteDetail(note)">
          <view class="note-item-header">
            <text class="note-item-date">📅 {{ formatDate(note.createTime) }}</text>
          </view>
          <view class="note-item-body">
            <text class="note-item-title">{{ getNoteTitle(note.content) }}</text>
            <text class="note-item-summary">{{ getNoteSummary(note.content) }}</text>
          </view>
          <view class="note-item-footer">
            <text class="view-detail">查看详情</text>
          </view>
        </view>
        
        <view class="load-more" v-if="filteredNotes.length > 0">
          <text class="load-text">没有更多笔记了</text>
        </view>
        
        <view class="empty-state" v-if="filteredNotes.length === 0">
          <text class="empty-icon">📝</text>
          <text class="empty-text">暂无笔记</text>
          <text class="empty-hint">快去创建第一条笔记吧</text>
        </view>
      </scroll-view>
    </view>
    
    <!-- 用户中心抽屉（从右侧滑入） -->
    <view class="user-drawer" :class="{ open: userDrawerOpen }">
      <view class="drawer-status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      
      <view class="drawer-header">
        <view class="nav-back" @click="closeUserDrawer">
          <text class="back-icon">←</text>
          <text class="back-text">返回</text>
        </view>
        <text class="drawer-title">用户中心</text>
        <view class="nav-placeholder"></view>
      </view>
      
      <scroll-view class="user-scroll" scroll-y :style="{ height: drawerContentHeight + 'px' }">
        <view class="user-section">
          <view class="avatar-large">
            <text class="avatar-text">👤</text>
          </view>
          <text class="user-name">学习者</text>
          <text class="user-id">@username</text>
          <view class="study-days">
            <text class="days-icon">🔥</text>
            <text class="days-text">已坚持学习 12 天</text>
          </view>
        </view>

        <view class="stats-section">
          <view class="stats-grid">
            <view class="stat-item">
              <text class="stat-number">{{ store.notes.length }}</text>
              <text class="stat-label">笔记数</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-number">{{ store.tags.length }}</text>
              <text class="stat-label">标签数</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-number">12</text>
              <text class="stat-label">连续天数</text>
            </view>
          </view>
        </view>

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
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores'
import type { Tag, Note } from '@/stores'
import type { SortMode } from '@/stores'
import { fetchWordDict } from '@/utils/dictApi'
import type { DictData } from '@/utils/dictApi'

const store = useAppStore()
const drawerOpen = ref(false)
const dictDrawerOpen = ref(false)
const notesDrawerOpen = ref(false)
const userDrawerOpen = ref(false)
const searchKeyword = ref('')
const statusBarHeight = ref(44)
const keyboardHeight = ref(0)
const drawerContentHeight = ref(600)
const darkMode = ref(false)
const isRecording = ref(false)

// 工具栏：是否有有效标签
const hasValidTag = computed(() => {
  return store.extractTags(store.editContent).length > 0
})

// 词典 API 状态
const dictLoading = ref(false)
const dictError = ref(false)
const dictResult = ref<DictData | null>(null)

const filteredTags = computed(() => {
  let tags = store.sortedTags
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    tags = tags.filter(tag => tag.name.toLowerCase().includes(keyword))
  }
  return tags
})

// 词典抽屉数据（带 API 返回的真实数据）
const dictData = computed(() => {
  const word = store.currentTag
  const myNotes = store.notes.filter((note: Note) => 
    note.tags.includes(word)
  ).sort((a: Note, b: Note) => b.createTime - a.createTime)
  
  const api = dictResult.value
  return {
    word,
    phonetic: api?.phonetic || '',
    ukPhonetic: api?.ukPhonetic || '',
    usPhonetic: api?.usPhonetic || '',
    ukAudio: api?.ukAudio || '',
    usAudio: api?.usAudio || '',
    meanings: api?.meanings || [],
    examples: api?.examples || [],
    myNotes,
    loading: dictLoading.value,
    error: dictError.value
  }
})

// 监听词典抽屉打开 → 触发 API 查询
watch(dictDrawerOpen, async (open) => {
  if (open) {
    store.updateLastReviewed(store.currentTag)
    dictLoading.value = true
    dictError.value = false
    dictResult.value = null
    const result = await fetchWordDict(store.currentTag)
    if (result) {
      dictResult.value = result
    } else {
      dictError.value = true
    }
    dictLoading.value = false
  }
})

// 笔记抽屉数据
const filteredNotes = computed(() => {
  return store.notes.filter((note: Note) => 
    note.tags.includes(store.currentTag)
  ).sort((a: Note, b: Note) => b.createTime - a.createTime)
})

const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value
}

const closeDrawer = () => {
  drawerOpen.value = false
}

const closeAllDrawers = () => {
  drawerOpen.value = false
  dictDrawerOpen.value = false
  notesDrawerOpen.value = false
  userDrawerOpen.value = false
}

const closeDictDrawer = () => {
  dictDrawerOpen.value = false
}

const closeNotesDrawer = () => {
  notesDrawerOpen.value = false
}

const closeUserDrawer = () => {
  userDrawerOpen.value = false
}

const selectTag = (tag: Tag) => {
  store.setCurrentTag(tag.name)
  store.updateLastReviewed(tag.name)
  // 不关闭标签抽屉，直接打开笔记抽屉盖在上面
  notesDrawerOpen.value = true
}

// 从标签列表直接打开词典抽屉
const openDictForTag = (tag: Tag) => {
  store.setCurrentTag(tag.name)
  store.updateLastReviewed(tag.name)
  // 不关闭标签抽屉，直接打开词典抽屉盖在上面
  dictDrawerOpen.value = true
}

// 标签触摸事件（Swipe to Reveal）
let tagTouchStartX = 0
let tagTouchCurrentX = 0
const tagSwipeTarget = ref<string | null>(null)
const tagSwipeOffset = ref(0)
const isTagAnimating = ref(false)
const tagSwipeMax = 120

const tagOffsetFor = (tag: Tag) => {
  if (tagSwipeTarget.value !== tag.name) return 0
  return tagSwipeOffset.value
}

const tagActionOpacity = (tag: Tag, side: 'left' | 'right') => {
  if (tagSwipeTarget.value !== tag.name) return 0
  const offset = tagSwipeOffset.value
  if (side === 'left') return Math.max(0, Math.min(offset / 100, 1))
  return Math.max(0, Math.min(Math.abs(offset) / 100, 1))
}

const onTagTouchStart = (e: TouchEvent, tag: Tag) => {
  tagTouchStartX = e.touches[0].clientX
  tagTouchCurrentX = tagTouchStartX
  tagSwipeTarget.value = tag.name
  tagSwipeOffset.value = 0
  isTagAnimating.value = false
}

const onTagTouchMove = (e: TouchEvent, _tag: Tag) => {
  tagTouchCurrentX = e.touches[0].clientX
  const diff = tagTouchCurrentX - tagTouchStartX
  // 弹性阻尼
  const damped = Math.abs(diff) > tagSwipeMax
    ? (tagSwipeMax + (Math.abs(diff) - tagSwipeMax) * 0.3) * Math.sign(diff)
    : diff
  tagSwipeOffset.value = damped
}

const onTagTouchEnd = (tag: Tag) => {
  const diff = tagTouchCurrentX - tagTouchStartX
  const threshold = 60

  // 重置滑动状态（tag 行立即回弹）
  tagSwipeOffset.value = 0
  isTagAnimating.value = true
  tagSwipeTarget.value = null

  // 回弹动画完成后再清 animating 标记
  setTimeout(() => {
    isTagAnimating.value = false
  }, 300)

  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      openDictForTag(tag)
    } else {
      selectTag(tag)
    }
  }
}

// 长按标签：弹出操作菜单
const onTagLongPress = (tag: Tag) => {
  const isMastered = tag.status === 'mastered'
  uni.showActionSheet({
    itemList: [isMastered ? '恢复为学习中' : '标记为已掌握', '删除标签'],
    itemColor: '#333333',
    success: (res: any) => {
      if (res.tapIndex === 0) {
        onToggleTagStatus(tag)
      } else if (res.tapIndex === 1) {
        onDeleteTag(tag)
      }
    }
  })
}

const onToggleTagStatus = (tag: Tag) => {
  store.toggleTagStatus(tag.name)
  uni.showToast({
    title: tag.status === 'learning' ? '已标记为掌握' : '已恢复为学习中',
    icon: 'success'
  })
}

const onDeleteTag = (tag: Tag) => {
  uni.showModal({
    title: '确认删除',
    content: `删除标签 #${tag.name} 将从所有笔记中移除该标签关联，但不会删除笔记本身。`,
    success: (res: any) => {
      if (res.confirm) {
        store.deleteTag(tag.name)
        uni.showToast({ title: '标签已删除', icon: 'success' })
      }
    }
  })
}

// 进入用户中心（抽屉式）
const goToUser = () => {
  closeDrawer()
  setTimeout(() => {
    userDrawerOpen.value = true
  }, 300)
}

// 触摸事件处理（Swipe to Reveal）
let touchStartX = 0
let touchCurrentX = 0
const swipeOffsetX = ref(0)
const isSwipeAnimating = ref(false)
const maxSwipeOffset = 120

const onTouchStart = (e: TouchEvent) => {
  touchStartX = e.touches[0].clientX
  touchCurrentX = touchStartX
  isSwipeAnimating.value = false
}

const onTouchMove = (e: TouchEvent) => {
  touchCurrentX = e.touches[0].clientX
  const diff = touchCurrentX - touchStartX
  // 弹性阻尼：超过阈值后增加阻力
  const damped = Math.abs(diff) > maxSwipeOffset
    ? (maxSwipeOffset + (Math.abs(diff) - maxSwipeOffset) * 0.3) * Math.sign(diff)
    : diff
  swipeOffsetX.value = damped
}

const onTouchEnd = () => {
  const diff = touchCurrentX - touchStartX
  const threshold = 70
  
  isSwipeAnimating.value = true
  
  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      // 右滑 → 打开词典抽屉
      swipeOffsetX.value = 0
      closeAllDrawers()
      store.updateLastReviewed(store.currentTag)
      setTimeout(() => dictDrawerOpen.value = true, 50)
    } else {
      // 左滑 → 打开笔记抽屉
      swipeOffsetX.value = 0
      closeAllDrawers()
      store.updateLastReviewed(store.currentTag)
      setTimeout(() => notesDrawerOpen.value = true, 50)
    }
  } else {
    // 弹回原位
    swipeOffsetX.value = 0
  }
}

// 输入处理
const onInput = (e: any) => {
  store.editContent = e.detail.value
  if (!store.editContent.trim()) {
    store.setCurrentTag('')
    return
  }
  const lastTag = store.getLastTag(store.editContent)
  if (lastTag) {
    store.setCurrentTag(lastTag)
  }
}

// 保存笔记
const saveNote = () => {
  if (!hasValidTag.value) return
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

// ── 工具栏按钮 ──

// 插入 # 标签
const insertHashtag = () => {
  store.editContent = store.editContent + '#'
}

// 图片按钮（占位）
const onImagePlaceholder = () => {
  uni.showToast({ title: '图片功能开发中', icon: 'none' })
}

// 链接插入
const onInsertLink = () => {
  uni.showModal({
    title: '插入链接',
    editable: true,
    placeholderText: '请输入网址 https://...',
    success: (res: any) => {
      if (res.confirm && res.content.trim()) {
        const url = res.content.trim()
        store.editContent = store.editContent + ` [链接](${url})`
      }
    }
  })
}

// 语音录音
let recorderManager: any = null

const startRecording = () => {
  recorderManager = uni.getRecorderManager()
  recorderManager.onStop((res: any) => {
    isRecording.value = false
    store.editContent = store.editContent + ` [录音:${res.tempFilePath}]`
    uni.showToast({ title: '录音已添加', icon: 'success' })
  })
  recorderManager.onError(() => {
    isRecording.value = false
    uni.showToast({ title: '录音失败', icon: 'none' })
  })
  recorderManager.start({ format: 'mp3' })
  isRecording.value = true
  uni.showToast({ title: '录音中...再次点击停止', icon: 'none' })
}

const stopRecording = () => {
  if (recorderManager) {
    recorderManager.stop()
  }
}

// 格式化日期
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 相对时间
const getRelativeTime = (timestamp: number) => {
  if (!timestamp) return ''
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return `${Math.floor(days / 30)}月前`
}

// 播放词典音频
const playDictAudio = (audioUrl: string) => {
  if (!audioUrl) {
    uni.showToast({ title: '无发音数据', icon: 'none' })
    return
  }
  const innerAudio = uni.createInnerAudioContext()
  innerAudio.src = audioUrl
  innerAudio.play()
  innerAudio.onError(() => {
    uni.showToast({ title: '播放失败', icon: 'none' })
  })
}

// 重试词典查询
const retryDict = async () => {
  dictLoading.value = true
  dictError.value = false
  dictResult.value = null
  const result = await fetchWordDict(store.currentTag)
  if (result) {
    dictResult.value = result
  } else {
    dictError.value = true
  }
  dictLoading.value = false
}

// 查看笔记详情
const viewNoteDetail = (note: Note) => {
  uni.showModal({
    title: '笔记详情',
    content: note.content,
    showCancel: false
  })
}

// 获取笔记标题
const getNoteTitle = (content: string) => {
  const firstLine = content.split('\n')[0]
  return firstLine.length > 20 ? firstLine.slice(0, 20) + '...' : firstLine
}

// 获取笔记摘要
const getNoteSummary = (content: string) => {
  const summary = content.replace(/#\w+/g, '').trim()
  return summary.length > 60 ? summary.slice(0, 60) + '...' : summary
}

// 用户中心功能
const configDict = () => {
  uni.showToast({ title: '词典API配置', icon: 'none' })
}

const backupData = () => {
  uni.showActionSheet({
    title: '数据管理',
    itemList: ['备份数据', '恢复数据'],
    success: (res: any) => {
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
    success: (res: any) => {
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

onLoad(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  drawerContentHeight.value = sysInfo.windowHeight - statusBarHeight.value - 44
  const lastTag = store.getLastTag(store.editContent)
  if (lastTag) {
    store.setCurrentTag(lastTag)
  }
  
  // 监听键盘，控制工具栏显隐
  uni.onKeyboardHeightChange((res: any) => {
    keyboardHeight.value = res.height
  })
})
</script>

<style lang="scss" scoped>
.container {
  background-color: #F8F9FA;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
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
  padding: 4px 16px 8px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 4px;
}

.swipe-container {
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

/* 左滑 Reveal 背景（笔记 - 蓝色） */
 .swipe-action-left {
   position: absolute;
   top: 0;
   right: 0;
   width: 100%;
   height: 100%;
   background: linear-gradient(135deg, #4A90E2, #357ABD);
   border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 32px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

/* 右滑 Reveal 背景（词典 - 橘色） */
 .swipe-action-right {
   position: absolute;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   background: linear-gradient(135deg, #FF9500, #FF6B35);
   border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 32px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.action-label {
  font-size: 18px;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: 2px;
}

.swipe-card {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: 238px;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

/* 松手回弹动画 */
.swipe-card.swipe-animate {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 滑动边缘提示（闲置时半透明可见，滑动时渐隐） */
.swipe-edge-hint {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: opacity 0.25s ease;
}

.swipe-edge-hint.left {
  left: 12px;
}

.swipe-edge-hint.right {
  right: 12px;
}

.edge-hint-arrow {
  font-size: 18px;
  color: #B0B0B0;
}

.edge-hint-label {
  font-size: 10px;
  color: #B0B0B0;
  letter-spacing: 1px;
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

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
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

.note-content {
  flex: 1;
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

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
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
  background-color: #FFFFFF;
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.edit-card {
  background-color: #FFFFFF;
  border-radius: 0;
  margin: 0 16px;
  padding: 8px 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
}

.edit-grabber {
  display: none;
}

.edit-input {
  width: 100%;
  height: 130px;
  font-size: 15px;
  color: #333333;
  line-height: 1.6;
}

.edit-toolbar {
  background-color: #FFFFFF;
  display: flex;
  align-items: center;
  height: 50px;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #999999;
  margin-right: 6px;
  border-radius: 16px;
}

.toolbar-btn.recording {
  background-color: #FF3B30;
  color: #FFFFFF;
  font-size: 12px;
  animation: recordingPulse 1s ease-in-out infinite;
}

@keyframes recordingPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.toolbar-spacer {
  flex: 1;
}

.save-btn {
  background-color: #4A90E2;
  color: #FFFFFF;
  font-size: 14px;
  padding: 6px 18px;
  border-radius: 18px;
  border: none;
  line-height: 1.4;
}

.save-btn.disabled {
  background-color: #D0D0D0;
  color: #999999;
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
  overflow: hidden;
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
  padding: 8px 8px 0;
}

.drawer-tag-item {
  display: flex;
  align-items: stretch;
  width: 100%;
  padding: 0;
  border-bottom: none;
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  margin-bottom: 6px;
  background-color: #FFFFFF;
}

/* Swipe to Reveal 背景色块 */
.tag-swipe-bg {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 0;
}

.tag-swipe-bg-left {
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #FF9500, #FF6B35);
  justify-content: flex-start;
  padding-left: 24px;
}

.tag-swipe-bg-right {
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  justify-content: flex-end;
  padding-right: 24px;
}

.tag-swipe-label {
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: 2px;
}

/* 闲置时边缘提示箭头 */
.tag-edge-hint {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  transition: opacity 0.2s ease;
}

.tag-edge-hint.left {
  left: 10px;
}

.tag-edge-hint.right {
  right: 10px;
}

.tag-hint-arrow {
  font-size: 14px;
  color: #B0B0B0;
}

.tag-hint-label {
  font-size: 9px;
  color: #B0B0B0;
  letter-spacing: 1px;
}

.tag-main {
  flex: 1;
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  position: relative;
  z-index: 2;
  background-color: #FFFFFF;
  padding: 12px 16px;
}

/* 松手回弹动画 */
.tag-main-animating {
  transition: transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
  min-width: 0;
}

.tag-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.tag-review-time {
  font-size: 11px;
  color: #BBBBBB;
  white-space: nowrap;
}

.tag-name-row .tag-name {
  margin-bottom: 0;
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

/* 排序切换栏 */
.drawer-sort-bar {
  display: flex;
  background-color: #FFFFFF;
  border-top: 1px solid #F0F0F0;
}

.sort-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  position: relative;
}

.sort-tab.active {
  border-bottom: 2px solid #4A90E2;
}

.sort-tab-text {
  font-size: 13px;
  color: #999999;
}

.sort-tab.active .sort-tab-text {
  color: #4A90E2;
  font-weight: 500;
}

.drawer-empty {
  text-align: center;
  padding: 40px;
}

/* ===== 词典抽屉样式 ===== */
.dict-drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #FFFFFF;
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  visibility: hidden;
}

.dict-drawer.open {
  transform: translateX(0);
  visibility: visible;
}

.dict-content {
  padding: 16px;
}

.nav-action {
  width: 60px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.action-icon {
  font-size: 20px;
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
  margin-bottom: 12px;
}

.phonetics-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.phonetic-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  background-color: #F5F5F5;
}

.phonetic-label {
  font-size: 11px;
  color: #999999;
  background-color: #E0E0E0;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.phonetic-text {
  font-size: 14px;
  color: #555555;
  font-style: italic;
}

.speaker-icon {
  font-size: 15px;
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

.pos-en {
  font-size: 12px;
  font-weight: 400;
  color: #AAAAAA;
  margin-left: 6px;
}

.definitions {
  padding-left: 8px;
}

.definition-item {
  margin-bottom: 8px;
}

.definition-en {
  display: block;
  font-size: 15px;
  color: #333333;
  line-height: 1.7;
}

.definition-zh {
  display: block;
  font-size: 13px;
  color: #888888;
  line-height: 1.6;
  margin-top: 2px;
  padding-left: 14px;
}

.example-item {
  margin-bottom: 10px;
}

.example-en {
  display: block;
  font-size: 14px;
  color: #333333;
  line-height: 1.7;
}

.example-zh {
  display: block;
  font-size: 13px;
  color: #888888;
  line-height: 1.6;
  margin-top: 2px;
  padding-left: 14px;
}

.dict-note-card {
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

/* 词典 Loading / Error */
.dict-loading,
.dict-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.loading-text {
  font-size: 15px;
  color: #999999;
}

.error-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.error-text {
  font-size: 16px;
  color: #666666;
  font-weight: 500;
  margin-bottom: 6px;
}

.error-hint {
  font-size: 13px;
  color: #999999;
  margin-bottom: 16px;
}

.retry-btn {
  background-color: #4A90E2;
  padding: 8px 24px;
  border-radius: 20px;
}

.retry-text {
  font-size: 14px;
  color: #FFFFFF;
}

/* ===== 笔记抽屉样式 ===== */
.notes-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background-color: #FFFFFF;
  z-index: 1000;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  visibility: hidden;
}

.notes-drawer.open {
  transform: translateX(0);
  visibility: visible;
}

.notes-list {
  padding: 16px;
}

.note-item {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.note-item-header {
  margin-bottom: 10px;
}

.note-item-date {
  font-size: 13px;
  color: #999999;
}

.note-item-body {
  margin-bottom: 12px;
}

.note-item-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 6px;
  line-height: 1.4;
}

.note-item-summary {
  display: block;
  font-size: 14px;
  color: #333333;
  line-height: 1.8;
}

.note-item-footer {
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

/* ===== 用户中心抽屉样式 ===== */
.user-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background-color: #F8F9FA;
  z-index: 999;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.user-drawer.open {
  transform: translateX(0);
}

.user-scroll {
  padding: 16px;
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

.avatar-large {
  width: 72px;
  height: 72px;
  border-radius: 36px;
  background-color: #E3F2FD;
  display: flex;
  align-items: center;
  justify-content: center;
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
