/**
 * MyMemory 免费翻译 API
 * 文档: https://mymemory.translated.net/doc/spec.php
 * 无需 API Key，每日限额约 10000 字符
 */

/**
 * 批量翻译英文文本为中文
 * 用换行符拼接多条文本，减少 API 调用次数
 */
export async function batchTranslate(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return []

  const cleanedTexts = texts.filter((t) => t.trim().length > 0)
  if (cleanedTexts.length === 0) return texts.map(() => '')

  try {
    // 用双换行符拼接，方便后续按段落拆分
    const joined = cleanedTexts.join('\n\n')
    const res = await new Promise<{
      statusCode: number
      data: {
        responseStatus: number
        responseData: { translatedText: string; match: number }
      }
    }>((resolve, reject) => {
      uni.request({
        url: 'https://api.mymemory.translated.net/get',
        method: 'GET',
        data: {
          q: joined,
          langpair: 'en|zh-CN',
        },
        timeout: 15000,
        success: (res) => resolve(res as any),
        fail: (err) => reject(err),
      })
    })

    if (res.statusCode !== 200 || !res.data?.responseData?.translatedText) {
      return texts.map(() => '')
    }

    const translated = res.data.responseData.translatedText
    // 按双换行符拆回对应条数
    const parts = translated.split('\n\n')
    const result: string[] = []
    let partIdx = 0
    for (const t of texts) {
      if (t.trim().length > 0) {
        result.push(parts[partIdx]?.trim() || '')
        partIdx++
      } else {
        result.push('')
      }
    }
    return result
  } catch (err: any) {
    console.warn('[translateApi] 翻译失败:', err.errMsg || err)
    return texts.map(() => '')
  }
}

/**
 * 翻译单个文本
 */
export async function translateText(text: string): Promise<string> {
  const results = await batchTranslate([text])
  return results[0] || ''
}
