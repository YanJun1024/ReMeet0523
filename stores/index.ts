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
}

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
    { name: 'Apple', noteCount: 12, status: 'learning', createTime: Date.now() },
    { name: 'Ball', noteCount: 8, status: 'learning', createTime: Date.now() },
    { name: 'Book', noteCount: 8, status: 'learning', createTime: Date.now() },
    { name: 'Fruit', noteCount: 5, status: 'learning', createTime: Date.now() },
    { name: 'Learn', noteCount: 3, status: 'learning', createTime: Date.now() }
  ])
  
  const currentTag = ref<string>('Ball')
  const editContent = ref('今天学习了 #Apple 的用法，\n然后学习了 #Ball，\n它可以表示球类运动。')
  
  // 计算属性
  const sortedTags = computed(() => {
    return [...tags.value].sort((a, b) => {
      // 状态排序：学习中 > 已学会
      if (a.status !== b.status) {
        return a.status === 'learning' ? -1 : 1
      }
      // 笔记数量降序
      if (b.noteCount !== a.noteCount) {
        return b.noteCount - a.noteCount
      }
      // 字母升序
      return a.name.localeCompare(b.name)
    })
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
    
    // 更新标签计数
    tagNames.forEach(tagName => {
      const existingTag = tags.value.find(t => t.name === tagName)
      if (existingTag) {
        existingTag.noteCount++
      } else {
        tags.value.push({
          name: tagName,
          noteCount: 1,
          status: 'learning',
          createTime: Date.now()
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
    sortedTags,
    currentTagNotes,
    latestNote,
    setCurrentTag,
    addNote,
    markTagAsMastered,
    extractTags,
    getLastTag
  }
})
