/**
 * Free Dictionary API — 获取英文单词释义 + 中文翻译
 * 词典: https://dictionaryapi.dev/
 * 翻译: MyMemory API (https://mymemory.translated.net)
 */

import { batchTranslate } from './translateApi'

// 词性英文 → 中文映射
const POS_MAP: Record<string, string> = {
  noun: '名词',
  pronoun: '代词',
  verb: '动词',
  'transitive verb': '及物动词',
  'intransitive verb': '不及物动词',
  adjective: '形容词',
  adverb: '副词',
  preposition: '介词',
  conjunction: '连词',
  interjection: '感叹词',
  article: '冠词',
  determiner: '限定词',
  numeral: '数词',
  auxiliary: '助动词',
  modal: '情态动词',
  exclamation: '感叹词',
  abbreviation: '缩写',
  prefix: '前缀',
  suffix: '后缀',
  phrase: '短语',
  idiom: '习语',
}

export interface DictDefinition {
  definition: string
  example?: string
  synonyms?: string[]
}

export interface DictMeaning {
  partOfSpeech: string
  definitions: DictDefinition[]
}

export interface DictResult {
  word: string
  phonetic?: string
  phonetics: { text?: string; audio?: string }[]
  meanings: DictMeaning[]
}

export interface DictData {
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
}

const BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en'

/**
 * 获取单词词典数据
 */
export async function fetchWordDict(word: string): Promise<DictData | null> {
  try {
    const res = await new Promise<{
      statusCode: number
      data: DictResult[]
    }>((resolve, reject) => {
      uni.request({
        url: `${BASE_URL}/${encodeURIComponent(word)}`,
        method: 'GET',
        timeout: 10000,
        success: (res) => {
          // 小程序中 404 可能走 success 也可能走 fail，统一处理
          if (res.statusCode === 404) {
            resolve(res as any)
            return
          }
          resolve(res as any)
        },
        fail: (err) => {
          // 小程序中将 404 视为请求失败的情况
          console.warn('[dictApi] uni.request fail:', JSON.stringify(err))
          reject(err)
        },
      })
    })

    if (res.statusCode === 404) return null
    if (res.statusCode !== 200 || !Array.isArray(res.data) || res.data.length === 0) return null

    const entry = res.data[0]

    // 提取美音和英音的音标与音频
    const phonetics = entry.phonetics || []
    const phonetic = entry.phonetic || phonetics.find((p) => p.text)?.text || ''

    // 找有 text 的音标项（API 通常按英→美排列）
    const textPhonetics = phonetics.filter((p) => p.text)
    let ukPhonetic = ''
    let usPhonetic = ''
    let ukAudio = ''
    let usAudio = ''

    if (textPhonetics.length >= 2) {
      ukPhonetic = textPhonetics[0].text || ''
      usPhonetic = textPhonetics[1].text || ''
    } else if (textPhonetics.length === 1) {
      ukPhonetic = textPhonetics[0].text || ''
    }

    // 找有 audio 的项（优先匹配音标位置）
    const audioPhonetics = phonetics.filter((p) => p.audio)
    if (audioPhonetics.length >= 2) {
      ukAudio = ukAudio || audioPhonetics[0].audio || ''
      usAudio = usAudio || audioPhonetics[1].audio || ''
    } else if (audioPhonetics.length === 1) {
      ukAudio = audioPhonetics[0].audio || ''
    }

    // 提取释义（每个词性取前 3 条）
    const rawMeanings = entry.meanings.map((m) => ({
      partOfSpeech: m.partOfSpeech,
      partOfSpeechCN: POS_MAP[m.partOfSpeech.toLowerCase()] || m.partOfSpeech,
      definitions: m.definitions.slice(0, 3).map((d) => ({
        definition: d.definition,
        definitionCN: '',
        example: d.example,
        exampleCN: '',
      })),
    }))

    // 提取所有例句
    const rawExamples: string[] = []
    for (const meaning of entry.meanings) {
      for (const def of meaning.definitions) {
        if (def.example && rawExamples.length < 5) {
          rawExamples.push(def.example)
        }
      }
    }

    // --- 批量翻译释义和例句 ---
    // 收集所有需要翻译的文本
    const textsToTranslate: string[] = []
    for (const m of rawMeanings) {
      for (const d of m.definitions) {
        textsToTranslate.push(d.definition)
        if (d.example) textsToTranslate.push(d.example)
      }
    }
    for (const ex of rawExamples) {
      if (!textsToTranslate.includes(ex)) textsToTranslate.push(ex)
    }

    const translations = await batchTranslate(textsToTranslate)

    // 回填翻译结果
    let tIdx = 0
    for (const m of rawMeanings) {
      for (const d of m.definitions) {
        d.definitionCN = translations[tIdx++] || ''
        if (d.example) d.exampleCN = translations[tIdx++] || ''
      }
    }

    const examples = rawExamples.map((ex) => {
      const idx = textsToTranslate.indexOf(ex)
      return { en: ex, zh: idx >= 0 ? translations[idx] || '' : '' }
    })

    return {
      word: entry.word,
      phonetic,
      ukPhonetic,
      usPhonetic,
      ukAudio,
      usAudio,
      meanings: rawMeanings,
      examples,
    }
  } catch (err: any) {
    console.error('[dictApi] 请求失败:', JSON.stringify(err))
    
    // 检查是否是域名未配置问题
    const errMsg = err.errMsg || err.message || ''
    if (errMsg.includes('request:fail') || errMsg.includes('url not in domain list')) {
      uni.showModal({
        title: '词典服务不可用',
        content: '小程序需要配置词典 API 域名。\n\n解决方案：\n1. 登录微信公众平台\n2. 开发管理 → 开发设置 → 服务器域名\n3. 添加 request 合法域名：\n   https://api.dictionaryapi.dev\n   https://api.mymemory.translated.net',
        showCancel: false,
        confirmText: '知道了'
      })
    } else {
      uni.showToast({
        title: '查询失败，请检查网络',
        icon: 'none',
        duration: 2000,
      })
    }
    return null
  }
}
