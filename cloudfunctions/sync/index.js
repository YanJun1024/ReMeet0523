const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const action = event.action

  switch (action) {
    // 上传笔记
    case 'pushNotes': {
      const notes = event.notes || []
      let added = 0
      for (const note of notes) {
        const { data } = await db.collection('notes').where({
          openid,
          content: note.content,
          createTime: note.createTime
        }).get()
        if (data.length === 0) {
          await db.collection('notes').add({
            data: { openid, ...note }
          })
          added++
        }
      }
      return { success: true, added }
    }

    // 拉取笔记
    case 'pullNotes': {
      const { data } = await db.collection('notes')
        .where({ openid })
        .orderBy('createTime', 'desc')
        .limit(100)
        .get()
      return { success: true, notes: data }
    }

    // 上传标签
    case 'pushTags': {
      const tags = event.tags || []
      let updated = 0
      for (const tag of tags) {
        const { data } = await db.collection('tags').where({ openid, name: tag.name }).get()
        if (data.length > 0) {
          await db.collection('tags').doc(data[0]._id).update({
            data: { noteCount: tag.noteCount, status: tag.status, lastReviewedAt: tag.lastReviewedAt }
          })
        } else {
          await db.collection('tags').add({ data: { openid, ...tag } })
        }
        updated++
      }
      return { success: true, updated }
    }

    // 拉取标签
    case 'pullTags': {
      const { data } = await db.collection('tags')
        .where({ openid })
        .orderBy('createTime', 'desc')
        .limit(200)
        .get()
      return { success: true, tags: data }
    }

    default:
      return { success: false, error: '未知操作: ' + action }
  }
}
