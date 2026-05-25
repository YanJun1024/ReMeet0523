/**
 * 数据同步模块
 * 
 * 负责本地数据与云端的同步逻辑：
 * - 免费用户：手动同步
 * - VIP 用户：自动同步
 * 
 * 云数据库集合设计：
 * - users: { openid, nickName, avatarUrl, vipStatus, vipExpireTime, usedStorage, maxStorage }
 * - notes: { _id, openid, content, tags, createTime, updateTime }
 * - tags:  { _id, openid, name, noteCount, status, createTime, lastReviewedAt }
 */

import { getDB } from './cloud'

/**
 * 上传本地笔记到云端
 */
export const syncNotesToCloud = async (notes: any[], openid: string) => {
  try {
    const db = getDB()
    const collection = db.collection('notes')

    for (const note of notes) {
      // 查询是否已存在
      const { data } = await collection.where({
        openid,
        content: note.content,
        createTime: note.createTime
      }).get()

      if (data.length === 0) {
        await collection.add({
          data: {
            openid,
            content: note.content,
            tags: note.tags,
            createTime: note.createTime,
            updateTime: note.updateTime
          }
        })
      }
    }

    return { success: true, count: notes.length }
  } catch (e) {
    console.error('[Sync] 同步笔记失败:', e)
    return { success: false, error: e }
  }
}

/**
 * 从云端拉取笔记到本地
 */
export const pullNotesFromCloud = async (openid: string) => {
  try {
    const db = getDB()
    const { data } = await db.collection('notes')
      .where({ openid })
      .orderBy('createTime', 'desc')
      .limit(100)
      .get()

    return { success: true, notes: data }
  } catch (e) {
    console.error('[Sync] 拉取笔记失败:', e)
    return { success: false, notes: [], error: e }
  }
}

/**
 * 上传标签到云端
 */
export const syncTagsToCloud = async (tags: any[], openid: string) => {
  try {
    const db = getDB()
    const collection = db.collection('tags')

    for (const tag of tags) {
      const { data } = await collection.where({
        openid,
        name: tag.name
      }).get()

      if (data.length > 0) {
        // 更新已有标签
        await collection.doc(data[0]._id).update({
          data: {
            noteCount: tag.noteCount,
            status: tag.status,
            lastReviewedAt: tag.lastReviewedAt
          }
        })
      } else {
        // 新增标签
        await collection.add({
          data: {
            openid,
            name: tag.name,
            noteCount: tag.noteCount,
            status: tag.status,
            createTime: tag.createTime,
            lastReviewedAt: tag.lastReviewedAt
          }
        })
      }
    }

    return { success: true, count: tags.length }
  } catch (e) {
    console.error('[Sync] 同步标签失败:', e)
    return { success: false, error: e }
  }
}

/**
 * 从云端拉取标签
 */
export const pullTagsFromCloud = async (openid: string) => {
  try {
    const db = getDB()
    const { data } = await db.collection('tags')
      .where({ openid })
      .orderBy('createTime', 'desc')
      .limit(200)
      .get()

    return { success: true, tags: data }
  } catch (e) {
    console.error('[Sync] 拉取标签失败:', e)
    return { success: false, tags: [], error: e }
  }
}

/**
 * 计算数据存储大小（估算）
 */
export const estimateStorageSize = (notes: any[], tags: any[]): number => {
  let size = 0
  for (const note of notes) {
    // 每个字符约 2 字节（UTF-8 中文）
    size += (note.content?.length || 0) * 2
    size += (note.tags?.join(',').length || 0) * 2
    size += 100 // 元数据开销
  }
  for (const tag of tags) {
    size += (tag.name?.length || 0) * 2
    size += 80
  }
  return size
}
