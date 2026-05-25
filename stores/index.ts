import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 笔记类型
export interface Note {
  id: string
  content: string
  tags: string[]
  createTime: number
  updateTime: number
}

// 标签类型
export interface Tag {
  name: string
  noteCount: number
  status: 'learning' | 'mastered'
  createTime: number
  lastReviewedAt: number
}

export type SortMode = 'noteCount' | 'alphabet' | 'time'

export const useAppStore = defineStore('app', () => {
  // 状态
  const notes = ref<Note[]>([])
  
  const tags = ref<Tag[]>([])
  
  const currentTag = ref<string>('')
  const editContent = ref('')
  const sortMode = ref<SortMode>('noteCount')
  const hasShownGuide = ref(false)
  
  const setHasShownGuide = (value: boolean) => {
    hasShownGuide.value = value
  }
  
  // 计算属性
  const sortedTags = computed(() => {
    const learning = tags.value.filter(t => t.status === 'learning')
    const mastered = tags.value.filter(t => t.status === 'mastered')

    const sortFn = (a: Tag, b: Tag) => {
      switch (sortMode.value) {
        case 'alphabet':
          return a.name.localeCompare(b.name)
        case 'time':
          return b.lastReviewedAt - a.lastReviewedAt
        case 'noteCount':
        default:
          if (b.noteCount !== a.noteCount) return b.noteCount - a.noteCount
          return a.name.localeCompare(b.name)
      }
    }

    return [...learning.sort(sortFn), ...mastered]
  })
  
  const currentTagNotes = computed(() => {
    return notes.value
      .filter(note => note.tags.includes(currentTag.value))
      .sort((a, b) => b.createTime - a.createTime)
  })
  
  // 获取指定标签的笔记列表
  const notesForTag = (tagName: string) => {
    if (!tagName) return []
    return notes.value
      .filter(note => note.tags.includes(tagName))
      .sort((a, b) => b.createTime - a.createTime)
  }
  
  const latestNote = computed(() => {
    return currentTagNotes.value[0] || null
  })
  
  // 方法
  const setCurrentTag = (tagName: string) => {
    currentTag.value = tagName
  }
  
  const addNote = (content: string, tagNames: string[]) => {
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      tags: tagNames,
      createTime: Date.now(),
      updateTime: Date.now()
    }
    notes.value.unshift(newNote)
    
    // 更新标签计数，已掌握标签新增笔记 → 自动恢复为学习中
    tagNames.forEach(tagName => {
      const existingTag = tags.value.find(t => t.name === tagName)
      if (existingTag) {
        existingTag.noteCount++
        if (existingTag.status === 'mastered') {
          existingTag.status = 'learning'
        }
      } else {
        tags.value.push({
          name: tagName,
          noteCount: 1,
          status: 'learning',
          createTime: Date.now(),
          lastReviewedAt: Date.now()
        })
      }
    })
  }
  
  const markTagAsMastered = (tagName: string) => {
    const tag = tags.value.find(t => t.name === tagName)
    if (tag) {
      tag.status = 'mastered'
    }
  }

  const toggleTagStatus = (tagName: string) => {
    const tag = tags.value.find(t => t.name === tagName)
    if (tag) {
      tag.status = tag.status === 'learning' ? 'mastered' : 'learning'
    }
  }

  const deleteTag = (tagName: string) => {
    const idx = tags.value.findIndex(t => t.name === tagName)
    if (idx !== -1) {
      tags.value.splice(idx, 1)
    }
    // 同时移除该标签在所有笔记中的关联
    notes.value.forEach(note => {
      note.tags = note.tags.filter(t => t !== tagName)
    })
  }

  const updateLastReviewed = (tagName: string) => {
    const tag = tags.value.find(t => t.name === tagName)
    if (tag) {
      tag.lastReviewedAt = Date.now()
    }
  }

  const setSortMode = (mode: SortMode) => {
    sortMode.value = mode
  }
  
  const extractTags = (content: string): string[] => {
    const tagRegex = /#(\w+)/g
    const matches = content.match(tagRegex)
    return matches ? matches.map(m => m.slice(1)) : []
  }
  
  const getLastTag = (content: string): string | null => {
    const tags = extractTags(content)
    return tags.length > 0 ? tags[tags.length - 1] : null
  }
  
  return {
    notes,
    tags,
    currentTag,
    editContent,
    sortMode,
    hasShownGuide,
    sortedTags,
    currentTagNotes,
    latestNote,
    notesForTag,
    setCurrentTag,
    setHasShownGuide,
    addNote,
    markTagAsMastered,
    toggleTagStatus,
    deleteTag,
    updateLastReviewed,
    setSortMode,
    extractTags,
    getLastTag
  }
})
