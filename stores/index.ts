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
  const notes = ref<Note[]>([
    {
      id: '1',
      content: '今天学习了 Ball 的用法，它可以表示球类运动，也可以表示舞会。常见搭配有 play ball、have a ball 等。',
      tags: ['Ball'],
      createTime: Date.now() - 86400000,
      updateTime: Date.now() - 86400000
    },
    {
      id: '2',
      content: 'Apple 既可以表示水果，也可以表示科技公司。Apple 公司发布了新款 iPhone。',
      tags: ['Apple', 'iPhone'],
      createTime: Date.now() - 172800000,
      updateTime: Date.now() - 172800000
    },
    {
      id: '3',
      content: 'Book 表示书籍，也可以表示预订。I booked a room at the hotel.',
      tags: ['Book'],
      createTime: Date.now() - 259200000,
      updateTime: Date.now() - 259200000
    }
  ])
  
  const tags = ref<Tag[]>([
    { name: 'Apple', noteCount: 12, status: 'learning', createTime: Date.now() - 3000000, lastReviewedAt: Date.now() - 86400000 },
    { name: 'Ball', noteCount: 8, status: 'learning', createTime: Date.now() - 2000000, lastReviewedAt: Date.now() - 172800000 },
    { name: 'Book', noteCount: 8, status: 'learning', createTime: Date.now() - 4000000, lastReviewedAt: Date.now() - 259200000 },
    { name: 'Fruit', noteCount: 5, status: 'learning', createTime: Date.now() - 1000000, lastReviewedAt: Date.now() - 518400000 },
    { name: 'Learn', noteCount: 3, status: 'learning', createTime: Date.now() - 500000, lastReviewedAt: Date.now() - 864000000 }
  ])
  
  const currentTag = ref<string>('Ball')
  const editContent = ref('今天学习了 #Apple 的用法，\n然后学习了 #Ball，\n它可以表示球类运动。')
  const sortMode = ref<SortMode>('noteCount')
  
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
    sortedTags,
    currentTagNotes,
    latestNote,
    setCurrentTag,
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
