/**
 * StarKids 数据库种子数据
 *
 * 运行: npx prisma db seed
 * 包含: 全局任务模板、内置成就、宠物装扮、主题皮肤
 *
 * 幂等: 可重复执行，先清除旧种子数据再插入
 */

import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 开始播种 StarKids 种子数据...')

  // ========================================================================
  //  1. 全局任务模板
  // ========================================================================
  console.log('   🧹 清理旧种子数据...')
  await prisma.taskTemplate.deleteMany({ where: { isGlobal: true } })
  await prisma.achievement.deleteMany({ where: { isGlobal: true } })
  await prisma.petOutfit.deleteMany({ where: {} })

  const taskTemplates = [
    { name: '刷牙', description: '把牙齿刷得白白的，笑起来更自信！', icon: '🪥', category: 'HABIT', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 5, autoApprove: true, weekDays: [1,2,3,4,5,6,0] },
    { name: '洗脸', description: '用温水把小脸蛋洗得干干净净', icon: '🧼', category: 'HABIT', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 3, autoApprove: true, weekDays: [1,2,3,4,5,6,0] },
    { name: '收拾玩具', description: '把玩具宝宝们送回它们的家', icon: '🧸', category: 'HOUSEWORK', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 10, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '整理书包', description: '把课本和文具整整齐齐装进书包', icon: '🎒', category: 'HABIT', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 5, autoApprove: false, weekDays: [1,2,3,4,5] },
    { name: '叠被子', description: '把被子叠得整整齐齐，像小豆腐块', icon: '🛏️', category: 'HOUSEWORK', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 8, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '倒垃圾', description: '做个环保小卫士，把垃圾送进垃圾桶', icon: '🗑️', category: 'HOUSEWORK', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 8, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '帮妈妈洗碗', description: '洗刷刷洗刷刷，碗碗变亮亮', icon: '🍽️', category: 'HOUSEWORK', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 15, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '整理书桌', description: '让书桌变得干干净净，学习更高效', icon: '📚', category: 'HOUSEWORK', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 10, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '收拾自己的房间', description: '把房间变得整整齐齐，住起来更舒服', icon: '🏠', category: 'HOUSEWORK', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 15, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '摆碗筷', description: '帮妈妈准备吃饭，摆好碗筷真棒', icon: '🥢', category: 'HOUSEWORK', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 5, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '扫地', description: '拿起小扫把，把地板扫干净', icon: '🧹', category: 'HOUSEWORK', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 12, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '擦桌子', description: '用抹布把桌子擦得亮亮的', icon: '✨', category: 'HOUSEWORK', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 8, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '浇花', description: '给小花小草喝喝水，它们会感谢你哦', icon: '🌱', category: 'HOUSEWORK', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 5, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },

    { name: '完成作业', description: '认真把今天的作业写完，字迹工整', icon: '✏️', category: 'STUDY', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 15, autoApprove: false, weekDays: [1,2,3,4,5] },
    { name: '阅读20分钟', description: '挑一本喜欢的书，安静地读20分钟', icon: '📖', category: 'STUDY', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 10, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '练字15分钟', description: '一笔一画，写出漂亮的字', icon: '🖊️', category: 'STUDY', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 8, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '背一首古诗', description: '今天背一首新古诗，明天就是小诗人', icon: '📜', category: 'STUDY', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 10, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '学英语15分钟', description: '学几个新单词，成为英语小达人', icon: '🔤', category: 'STUDY', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 10, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '预习明天的功课', description: '提前看看明天要学什么，上课更专心', icon: '📝', category: 'STUDY', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 10, autoApprove: false, weekDays: [1,2,3,4,5] },
    { name: '复习本周内容', description: '把本周学过的知识复习一遍', icon: '🔄', category: 'STUDY', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 12, autoApprove: false, weekDays: [6,0] },
    { name: '写一篇日记', description: '把今天有趣的事情记下来', icon: '📔', category: 'STUDY', type: 'DAILY', frequency: 'DAILY', difficulty: 'HARD', points: 15, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },

    { name: '跳绳100个', description: '跳起来跳起来，跳够100个', icon: '🏃', category: 'EXERCISE', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 10, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '跑步15分钟', description: '跑起来吧，像风一样自由', icon: '🏃‍♂️', category: 'EXERCISE', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 10, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '做操/拉伸', description: '伸伸胳膊踢踢腿，身体棒棒的', icon: '🤸', category: 'EXERCISE', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 5, autoApprove: true, weekDays: [1,2,3,4,5,6,0] },
    { name: '打球', description: '拍皮球/打羽毛球/踢足球，运动真开心', icon: '⚽', category: 'EXERCISE', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 12, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '骑车15分钟', description: '骑上小车车，出发去探险', icon: '🚲', category: 'EXERCISE', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 12, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '做眼保健操', description: '保护小眼睛，做眼保健操', icon: '👀', category: 'HABIT', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 5, autoApprove: true, weekDays: [1,2,3,4,5] },

    { name: '早睡早起', description: '晚上9点前睡觉，早上7点前起床', icon: '🌙', category: 'HABIT', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 8, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '自己穿衣', description: '自己的事情自己做，穿好衣服真棒', icon: '👕', category: 'HABIT', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 5, autoApprove: true, weekDays: [1,2,3,4,5,6,0] },
    { name: '不挑食', description: '蔬菜、肉肉都要吃，才能长高高', icon: '🥦', category: 'HABIT', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 8, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '饭前洗手', description: '细菌拜拜，饭前要洗手', icon: '🧼', category: 'HABIT', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 3, autoApprove: true, weekDays: [1,2,3,4,5,6,0] },
    { name: '多喝温水', description: '咕噜咕噜喝水水，身体健康棒', icon: '💧', category: 'HABIT', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 3, autoApprove: true, weekDays: [1,2,3,4,5,6,0] },

    { name: '说谢谢', description: '接受帮助要说谢谢，做个有礼貌的好孩子', icon: '🙏', category: 'SOCIAL', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 3, autoApprove: true, weekDays: [1,2,3,4,5,6,0] },
    { name: '主动打招呼', description: '见到长辈主动说早上好/下午好', icon: '👋', category: 'SOCIAL', type: 'DAILY', frequency: 'DAILY', difficulty: 'EASY', points: 3, autoApprove: true, weekDays: [1,2,3,4,5,6,0] },
    { name: '分享玩具', description: '和小伙伴一起分享玩具，快乐翻倍', icon: '🤝', category: 'SOCIAL', type: 'DAILY', frequency: 'DAILY', difficulty: 'MEDIUM', points: 8, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },

    { name: '独立完成手工作品', description: '自己动手做一个手工作品，超酷！', icon: '✂️', category: 'STUDY', type: 'CHALLENGE', frequency: 'MANUAL', difficulty: 'HARD', points: 50, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '帮爸爸修东西', description: '给爸爸当小助手，完成一项修理任务', icon: '🔧', category: 'HOUSEWORK', type: 'CHALLENGE', frequency: 'MANUAL', difficulty: 'HARD', points: 40, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '给家人做早餐', description: '当一次小厨师，给家人做一顿早餐', icon: '🍳', category: 'HOUSEWORK', type: 'CHALLENGE', frequency: 'MANUAL', difficulty: 'HARD', points: 50, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '大扫除', description: '和家人一起完成一次大扫除', icon: '🧹', category: 'HOUSEWORK', type: 'CHALLENGE', frequency: 'MANUAL', difficulty: 'HARD', points: 40, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '种一棵植物', description: '亲手种下一颗种子，照顾它长大', icon: '🌻', category: 'HOUSEWORK', type: 'ONETIME', frequency: 'MANUAL', difficulty: 'HARD', points: 60, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },

    { name: '连续7天阅读', description: '坚持一周每天阅读，成为阅读小达人', icon: '📚', category: 'STUDY', type: 'HABIT', frequency: 'MANUAL', difficulty: 'HARD', points: 80, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '连续14天早睡早起', description: '连续两周早睡早起，做时间的小主人', icon: '⏰', category: 'HABIT', type: 'HABIT', frequency: 'MANUAL', difficulty: 'HARD', points: 100, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
    { name: '连续30天运动', description: '坚持一个月运动，变成运动小健将', icon: '💪', category: 'EXERCISE', type: 'HABIT', frequency: 'MANUAL', difficulty: 'HARD', points: 200, autoApprove: false, weekDays: [1,2,3,4,5,6,0] },
  ]

  await prisma.taskTemplate.createMany({
    data: taskTemplates.map((t) => ({
      ...t,
      isGlobal: true,
      weekDays: JSON.stringify(t.weekDays),
      tags: JSON.stringify([t.category.toLowerCase()]),
    })) as any,
  })
  console.log(`✅ 全局任务模板: ${taskTemplates.length} 个`)

  // ========================================================================
  //  2. 内置成就
  // ========================================================================
  const achievements = [
    { name: '初次劳动', description: '完成了第一个任务！迈出第一步 🌱', icon: '🌱', category: 'LABOR', condition: { type: 'TASK_COUNT', count: 1 }, bonusPoints: 10 },
    { name: '勤劳小蜜蜂', description: '累计完成50个任务！你是勤劳的小蜜蜂 🐝', icon: '🐝', category: 'LABOR', condition: { type: 'TASK_COUNT', count: 50 }, bonusPoints: 50 },
    { name: '劳动达人', description: '累计完成100个任务！太厉害了！', icon: '🏅', category: 'LABOR', condition: { type: 'TASK_COUNT', count: 100 }, bonusPoints: 100 },
    { name: '坚持不懈', description: '连续14天完成任务！不放弃的精神最可贵', icon: '💪', category: 'HABIT', condition: { type: 'CONSECUTIVE_DAYS', days: 14 }, bonusPoints: 100 },
    { name: '超级毅力', description: '连续30天完成任务！你是最棒的！', icon: '🌟', category: 'HABIT', condition: { type: 'CONSECUTIVE_DAYS', days: 30 }, bonusPoints: 200 },
    { name: '超级学霸', description: '连续7天完成学习类任务！', icon: '📚', category: 'STUDY', condition: { type: 'STREAK', days: 7, category: 'STUDY' }, bonusPoints: 30 },
    { name: '小管家', description: '累计完成20个家务任务！', icon: '🏠', category: 'LABOR', condition: { type: 'TASK_COUNT', count: 20, category: 'HOUSEWORK' }, bonusPoints: 60 },
    { name: '交换达人', description: '成功兑换5次奖励！', icon: '🎁', category: 'REDEMPTION', condition: { type: 'REDEMPTION_COUNT', count: 5 }, bonusPoints: 40 },
    { name: '满分一周', description: '一周内每日任务全部完成！', icon: '⭐', category: 'HABIT', condition: { type: 'SPECIAL_DATE', days: 7, completionRate: 100 }, bonusPoints: 80 },
    { name: '积分富翁', description: '累计积分超过1000！', icon: '💎', category: 'SPECIAL', condition: { type: 'TOTAL_POINTS', points: 1000 }, bonusPoints: 100 },
    { name: '环保小卫士', description: '完成10个环保类任务！', icon: '🌍', category: 'LABOR', condition: { type: 'TASK_COUNT', count: 10, category: 'HOUSEWORK', tags: ['环保'] }, bonusPoints: 50 },
    { name: '运动健将', description: '完成20个运动类任务！', icon: '⚽', category: 'EXERCISE', condition: { type: 'TASK_COUNT', count: 20, category: 'EXERCISE' }, bonusPoints: 40 },
    { name: '阅读之星', description: '累计完成30次阅读任务！', icon: '📖', category: 'STUDY', condition: { type: 'TASK_COUNT', count: 30, category: 'STUDY' }, bonusPoints: 50 },
    { name: '礼仪小天使', description: '完成10次礼仪类任务！', icon: '👼', category: 'SOCIAL', condition: { type: 'TASK_COUNT', count: 10, category: 'SOCIAL' }, bonusPoints: 30 },
    { name: '挑战成功', description: '完成第一个挑战任务！', icon: '🏆', category: 'SPECIAL', condition: { type: 'TASK_COUNT', count: 1, type_filter: 'CHALLENGE' }, bonusPoints: 20 },
    { name: '积分小能手', description: '累计积分超过500！', icon: '🪙', category: 'SPECIAL', condition: { type: 'TOTAL_POINTS', points: 500 }, bonusPoints: 50 },
    { name: '早起鸟儿', description: '连续7天早睡早起！', icon: '🐦', category: 'HABIT', condition: { type: 'STREAK', days: 7, category: 'HABIT' }, bonusPoints: 40 },
    { name: '月度之星', description: '一个月内每日任务完成率超过80%！', icon: '🌠', category: 'HABIT', condition: { type: 'SPECIAL_DATE', days: 30, completionRate: 80 }, bonusPoints: 150 },
    { name: '分享小天使', description: '完成10次分享任务！', icon: '💕', category: 'SOCIAL', condition: { type: 'TASK_COUNT', count: 10, category: 'SOCIAL', tags: ['分享'] }, bonusPoints: 35 },
    { name: '完美一周', description: '一周内每日任务全部完成且0次被拒绝！', icon: '💯', category: 'HABIT', condition: { type: 'SPECIAL_DATE', days: 7, completionRate: 100, zeroRejection: true }, bonusPoints: 120, isHidden: true },
  ]

  await prisma.achievement.createMany({
    data: achievements.map((a) => ({
      ...a,
      isGlobal: true,
      condition: JSON.stringify(a.condition),
    })) as any,
  })
  console.log(`✅ 内置成就: ${achievements.length} 个`)

  // ========================================================================
  //  3. 宠物装扮
  // ========================================================================
  const petOutfits = [
    { name: '小红帽', description: '戴小红帽的小可爱', species: 'CAT', points: 30, isDefault: false },
    { name: '超人斗篷', description: '穿上变身小超人', species: null, points: 50, isDefault: false },
    { name: '蝴蝶结', description: '戴个蝴蝶结，美美的', species: 'RABBIT', points: 20, isDefault: false },
    { name: '飞行员眼镜', description: '戴上眼镜，酷炫飞行', species: 'FOX', points: 40, isDefault: false },
    { name: '皇冠', description: '戴上皇冠，你是最棒的', species: 'DRAGON', points: 80, isDefault: false },
    { name: '彩虹围巾', description: '围上彩虹围巾，暖暖的', species: null, points: 35, isDefault: false },
    { name: '海盗眼罩', description: '呜呜~我是海盗船长', species: 'PENGUIN', points: 45, isDefault: false },
    { name: '星星发箍', description: '闪闪发光的星星发箍', species: 'UNICORN', points: 60, isDefault: false },
    { name: '默认领结', description: '天生自带的帅气领结', species: null, points: 0, isDefault: true },
  ]

  await prisma.petOutfit.createMany({
    data: petOutfits as any,
  })
  console.log(`✅ 宠物装扮: ${petOutfits.length} 个`)

  console.log('')
  console.log('🎉 StarKids 种子数据播种完成！')
  console.log(`   任务模板: ${taskTemplates.length} 个`)
  console.log(`   内置成就: ${achievements.length} 个`)
  console.log(`   宠物装扮: ${petOutfits.length} 个`)
}

main()
  .catch((e) => {
    console.error('❌ 播种失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
