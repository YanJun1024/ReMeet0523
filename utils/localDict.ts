/**
 * 本地词典 API
 * 使用本地 JSON 文件存储核心词汇
 */

export interface LocalDictEntry {
  word: string
  phonetic: string
  translation: string
  level: 'basic' | 'intermediate' | 'advanced'
  examples: string[]
}

export interface LocalDictData {
  word: string
  phonetic: string
  ukPhonetic: string
  usPhonetic: string
  ukAudio: string
  usAudio: string
  meanings: {
    partOfSpeech: string
    partOfSpeechCN: string
    definitions: {
      definition: string
      definitionCN: string
      example?: string
      exampleCN?: string
    }[]
  }[]
  examples: { en: string; zh: string }[]
  myNotes: any[]
  loading: boolean
  error: boolean
}

// 本地词典数据缓存
let localDictCache: Record<string, LocalDictEntry> | null = null

/**
 * 加载本地词典数据
 */
async function loadLocalDict(): Promise<Record<string, LocalDictEntry>> {
  if (localDictCache) {
    return localDictCache
  }

  try {
    // 在小程序环境中使用 uni.request 加载本地文件
    const result = await new Promise<any>((resolve, reject) => {
      // 尝试从本地存储加载
      const cached = uni.getStorageSync('localDictData')
      if (cached) {
        resolve(cached)
        return
      }

      // 从 static 目录加载 JSON 文件
      uni.request({
        url: '/static/dict/core-vocabulary.json',
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            // 缓存到本地存储
            uni.setStorageSync('localDictData', res.data)
            resolve(res.data)
          } else {
            reject(new Error('Failed to load dictionary'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })

    localDictCache = result.words || {}
    return localDictCache
  } catch (err) {
    console.error('[localDict] 加载词典失败:', err)
    // 返回空对象，避免崩溃
    return {}
  }
}

/**
 * 查询本地词典
 * 返回 null 表示本地未找到，需要使用在线词典
 */
export async function fetchLocalDict(word: string): Promise<LocalDictData | null> {
  if (!word || word.trim().length === 0) {
    return null
  }

  const dict = await loadLocalDict()
  const entry = dict[word.toLowerCase()]

  if (!entry) {
    // 本地词典未找到，返回 null 让页面使用在线词典
    return null
  }

  // 解析例句
  const parsedExamples = entry.examples.map(ex => {
    const parts = ex.split('|')
    return {
      en: parts[0] || ex,
      zh: parts[1] || ''
    }
  })

  // 构建词典数据（兼容原有格式）
  return {
    word: entry.word,
    phonetic: entry.phonetic,
    ukPhonetic: entry.phonetic,
    usPhonetic: entry.phonetic,
    ukAudio: '',
    usAudio: '',
    meanings: [{
      partOfSpeech: '释义',
      partOfSpeechCN: '释义',
      definitions: [{
        definition: entry.translation,
        definitionCN: entry.translation,
        example: parsedExamples[0]?.en,
        exampleCN: parsedExamples[0]?.zh
      }]
    }],
    examples: parsedExamples,
    myNotes: [],
    loading: false,
    error: false
  }
}

/**
 * 获取本地词典所有单词列表
 */
export async function getAllLocalWords(): Promise<string[]> {
  const dict = await loadLocalDict()
  return Object.keys(dict).sort()
}

/**
 * 获取本地词典数据（用于显示）
 */
export async function getLocalDictEntries(): Promise<LocalDictEntry[]> {
  const dict = await loadLocalDict()
  return Object.values(dict).sort((a, b) => a.word.localeCompare(b.word))
}

/**
 * 检查单词是否在本地词典中
 */
export async function hasLocalWord(word: string): Promise<boolean> {
  const dict = await loadLocalDict()
  return !!dict[word.toLowerCase()]
}

/**
 * 获取本地词典统计信息
 */
export async function getLocalDictStats(): Promise<{ total: number; version: string }> {
  try {
    const result = await new Promise<any>((resolve) => {
      const cached = uni.getStorageSync('localDictData')
      if (cached) {
        resolve(cached)
        return
      }
      resolve({ version: '1.0.0', total: 200 })
    })
    
    return {
      total: result.total || 200,
      version: result.version || '1.0.0'
    }
  } catch {
    return { total: 200, version: '1.0.0' }
  }
}
