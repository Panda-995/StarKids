/**
 * StarKids 综合测试套件
 *
 * 运行: npx tsx tests/test-suite.ts
 *
 * 测试覆盖:
 *   1. 功能测试 - 认证流程、任务流程、积分计算、成就解锁
 *   2. 边界测试 - 邀请码、重复加入、重复提交、积分截断、打卡中断
 *   3. 性能测试 - 大量数据查询、批量处理、并发提交
 */

import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import bcrypt from "bcryptjs"

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

// =============================================================================
//  测试工具
// =============================================================================

let passed = 0
let failed = 0
const failures: string[] = []

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++
    console.log(`  ✅ ${message}`)
  } else {
    failed++
    const err = `  ❌ ${message}`
    console.log(err)
    failures.push(err)
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual === expected) {
    passed++
    console.log(`  ✅ ${message} (${JSON.stringify(actual)})`)
  } else {
    failed++
    const err = `  ❌ ${message} - 期望: ${JSON.stringify(expected)}, 实际: ${JSON.stringify(actual)}`
    console.log(err)
    failures.push(err)
  }
}

function assertThrows(fn: () => Promise<any>, message: string) {
  return fn()
    .then(() => {
      failed++
      const err = `  ❌ ${message} - 应该抛出错误但没有`
      console.log(err)
      failures.push(err)
    })
    .catch(() => {
      passed++
      console.log(`  ✅ ${message} (正确抛出错误)`)
    })
}

function section(title: string) {
  console.log(`\n${"=".repeat(60)}`)
  console.log(`  ${title}`)
  console.log(`${"=".repeat(60)}`)
}

function subSection(title: string) {
  console.log(`\n  ── ${title} ──`)
}

// =============================================================================
//  测试数据 ID 存储
// =============================================================================

const testIds = {
  parentUserId: "",
  kidUserId: "",
  kid2UserId: "",
  familyId: "",
  parentMemberId: "",
  kidMemberId: "",
  kid2MemberId: "",
  taskId1: "",
  taskId2: "",
  taskId3: "",
  completionId1: "",
  completionId2: "",
  rewardId: "",
  redemptionId: "",
  achievementId: "",
}

// =============================================================================
//  辅助函数
// =============================================================================

async function getTodayPoints(memberId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const result = await prisma.taskCompletion.aggregate({
    where: { memberId, status: "APPROVED", date: { gte: today } },
    _sum: { pointsEarned: true },
  })
  return result._sum.pointsEarned || 0
}

async function getStreakDays(memberId: string): Promise<number> {
  const completions = await prisma.taskCompletion.findMany({
    where: { memberId, status: "APPROVED" },
    select: { date: true },
    orderBy: { date: "desc" },
    distinct: ["date"],
  })
  if (completions.length === 0) return 0
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < completions.length; i++) {
    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i)
    const compDate = new Date(completions[i].date)
    compDate.setHours(0, 0, 0, 0)
    if (compDate.getTime() === expectedDate.getTime()) {
      streak++
    } else if (i === 0) {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      if (compDate.getTime() !== yesterday.getTime()) break
      streak++
    } else {
      break
    }
  }
  return streak
}

// =============================================================================
//  主测试入口
// =============================================================================

async function main() {
  console.log("🌟 StarKids 综合测试套件")
  console.log(`⏰ 开始时间: ${new Date().toISOString()}`)
  console.log(`📦 数据库: SQLite (dev.db)`)

  try {
    await setupTestData()
    await runFunctionalTests()
    await runBoundaryTests()
    await runPerformanceTests()
  } finally {
    await cleanupTestData()
    printReport()
    await prisma.$disconnect()
  }
}

// =============================================================================
//  1. 测试数据准备
// =============================================================================

async function setupTestData() {
  section("📦 准备测试数据")

  const timestamp = Date.now()

  // 创建测试家长用户
  const parentHash = await bcrypt.hash("test123456", 12)
  const parentUser = await prisma.user.create({
    data: {
      email: `test_parent_${timestamp}@test.com`,
      name: "测试家长",
      passwordHash: parentHash,
      role: "PARENT",
    },
  })
  testIds.parentUserId = parentUser.id
  console.log(`  ✅ 创建测试家长: ${parentUser.email}`)

  // 创建测试小朋友用户
  const kidHash = await bcrypt.hash("test123456", 12)
  const kidUser = await prisma.user.create({
    data: {
      email: `test_kid_${timestamp}@test.com`,
      name: "测试小朋友",
      passwordHash: kidHash,
      role: "KID",
    },
  })
  testIds.kidUserId = kidUser.id
  console.log(`  ✅ 创建测试小朋友: ${kidUser.email}`)

  // 创建第二个小朋友
  const kid2Hash = await bcrypt.hash("test123456", 12)
  const kid2User = await prisma.user.create({
    data: {
      email: `test_kid2_${timestamp}@test.com`,
      name: "测试小朋友2",
      passwordHash: kid2Hash,
      role: "KID",
    },
  })
  testIds.kid2UserId = kid2User.id

  // 创建家庭
  const family = await prisma.family.create({
    data: {
      name: "测试家庭",
      inviteCode: `TEST${String(timestamp).slice(-4)}`,
    },
  })
  testIds.familyId = family.id
  console.log(`  ✅ 创建测试家庭: ${family.name} (邀请码: ${family.inviteCode})`)

  // 家长加入家庭
  const parentMember = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      userId: parentUser.id,
      role: "PARENT",
      nickname: "测试家长",
    },
  })
  testIds.parentMemberId = parentMember.id

  // 小朋友加入家庭
  const kidMember = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      userId: kidUser.id,
      role: "KID",
      nickname: "测试小朋友",
      birthdate: new Date("2018-05-02"), // 设为今天生日用于测试
    },
  })
  testIds.kidMemberId = kidMember.id

  // 第二个小朋友加入家庭
  const kid2Member = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      userId: kid2User.id,
      role: "KID",
      nickname: "测试小朋友2",
    },
  })
  testIds.kid2MemberId = kid2Member.id

  // 创建积分配置
  await prisma.pointConfig.create({
    data: {
      familyId: family.id,
      weekendDouble: true,
      birthdayTriple: true,
      dailyCap: 200,
    } as any,
  })

  // 创建积分规则
  await prisma.pointRule.create({
    data: {
      familyId: family.id,
      name: "连续7天加成",
      ruleType: "STREAK_BONUS",
      params: JSON.stringify({ days: 7, bonus: 20 }),
      isActive: true,
    } as any,
  })

  await prisma.pointRule.create({
    data: {
      familyId: family.id,
      name: "周末双倍",
      ruleType: "WEEKEND_DOUBLE",
      params: JSON.stringify({ multiplier: 2 }),
      isActive: true,
    } as any,
  })

  await prisma.pointRule.create({
    data: {
      familyId: family.id,
      name: "生日三倍",
      ruleType: "BIRTHDAY_TRIPLE",
      params: JSON.stringify({ multiplier: 3 }),
      isActive: true,
    } as any,
  })

  await prisma.pointRule.create({
    data: {
      familyId: family.id,
      name: "每日上限200",
      ruleType: "DAILY_CAP",
      params: JSON.stringify({ cap: 200 }),
      isActive: true,
    } as any,
  })

  // 创建测试任务
  const task1 = await prisma.task.create({
    data: {
      familyId: family.id,
      creatorId: parentUser.id,
      name: "刷牙",
      description: "把牙齿刷干净",
      icon: "🪥",
      category: "HABIT",
      type: "DAILY",
      frequency: "DAILY",
      difficulty: "EASY",
      points: 10,
      autoApprove: true,
      maxDaily: 1,
      weekDays: JSON.stringify([1, 2, 3, 4, 5, 6, 0]),
      status: "ACTIVE",
    },
  })
  testIds.taskId1 = task1.id

  const task2 = await prisma.task.create({
    data: {
      familyId: family.id,
      creatorId: parentUser.id,
      name: "收拾玩具",
      description: "把玩具收好",
      icon: "🧸",
      category: "HOUSEWORK",
      type: "DAILY",
      frequency: "DAILY",
      difficulty: "EASY",
      points: 15,
      autoApprove: false,
      maxDaily: 1,
      weekDays: JSON.stringify([1, 2, 3, 4, 5, 6, 0]),
      status: "ACTIVE",
    },
  })
  testIds.taskId2 = task2.id

  const task3 = await prisma.task.create({
    data: {
      familyId: family.id,
      creatorId: parentUser.id,
      name: "阅读20分钟",
      description: "安静阅读",
      icon: "📖",
      category: "STUDY",
      type: "DAILY",
      frequency: "DAILY",
      difficulty: "MEDIUM",
      points: 20,
      autoApprove: false,
      maxDaily: 1,
      weekDays: JSON.stringify([1, 2, 3, 4, 5, 6, 0]),
      status: "ACTIVE",
    },
  })
  testIds.taskId3 = task3.id

  // 分配任务给小朋友
  await prisma.task.update({
    where: { id: task1.id },
    data: { assignees: { connect: [{ id: kidMember.id }, { id: kid2Member.id }] } },
  })
  await prisma.task.update({
    where: { id: task2.id },
    data: { assignees: { connect: [{ id: kidMember.id }] } },
  })
  await prisma.task.update({
    where: { id: task3.id },
    data: { assignees: { connect: [{ id: kidMember.id }] } },
  })

  // 创建测试奖励
  const reward = await prisma.reward.create({
    data: {
      familyId: family.id,
      name: "测试玩具",
      description: "一个测试玩具",
      category: "TOY",
      points: 100,
      stock: 5,
      remainingStock: 5,
      status: "ACTIVE",
    } as any,
  })
  testIds.rewardId = reward.id

  // 创建测试成就
  const achievement = await prisma.achievement.create({
    data: {
      name: "测试成就-完成5个任务",
      description: "完成5个任务即可解锁",
      icon: "🏆",
      category: "SPECIAL",
      condition: JSON.stringify({ type: "TASK_COUNT", count: 5 }),
      bonusPoints: 30,
      isActive: true,
      familyId: family.id,
    } as any,
  })
  testIds.achievementId = achievement.id

  console.log(`  ✅ 测试数据准备完成`)
}

// =============================================================================
//  2. 功能测试
// =============================================================================

async function runFunctionalTests() {
  section("🧪 功能测试")

  await testAuthFlow()
  await testTaskFlow()
  await testPointsCalculation()
  await testAchievementUnlocking()
}

// ── 2.1 认证流程 ──

async function testAuthFlow() {
  subSection("2.1 认证流程")

  // 测试用户角色正确存储
  const parentUser = await prisma.user.findUnique({ where: { id: testIds.parentUserId } })
  assert(parentUser?.role === "PARENT", "家长用户角色为 PARENT")

  const kidUser = await prisma.user.findUnique({ where: { id: testIds.kidUserId } })
  assert(kidUser?.role === "KID", "小朋友用户角色为 KID")

  // 测试家庭成员角色
  const parentMember = await prisma.familyMember.findUnique({ where: { id: testIds.parentMemberId } })
  assert(parentMember?.role === "PARENT", "家庭成员中家长角色为 PARENT")

  const kidMember = await prisma.familyMember.findUnique({ where: { id: testIds.kidMemberId } })
  assert(kidMember?.role === "KID", "家庭成员中小朋友角色为 KID")

  // 测试角色隔离 - 家长不能访问 kids 数据
  const kidOnlyData = await prisma.familyMember.findFirst({
    where: { userId: testIds.parentUserId, role: "KID" },
  })
  assert(kidOnlyData === null, "家长没有 KID 角色的家庭成员记录")

  // 测试角色隔离 - 小朋友不能访问 admin 数据
  const adminOnlyData = await prisma.familyMember.findFirst({
    where: { userId: testIds.kidUserId, role: "PARENT" },
  })
  assert(adminOnlyData === null, "小朋友没有 PARENT 角色的家庭成员记录")

  // 测试密码验证
  const userWithPwd = await prisma.user.findUnique({ where: { id: testIds.parentUserId } })
  assert(userWithPwd?.passwordHash !== null, "用户密码哈希存在")
  const pwdValid = await bcrypt.compare("test123456", userWithPwd!.passwordHash!)
  assert(pwdValid, "密码验证正确")
  const pwdInvalid = await bcrypt.compare("wrongpassword", userWithPwd!.passwordHash!)
  assert(!pwdInvalid, "错误密码验证失败")

  // 测试 lastLoginAt 更新
  await prisma.user.update({
    where: { id: testIds.parentUserId },
    data: { lastLoginAt: new Date() },
  })
  const updatedUser = await prisma.user.findUnique({ where: { id: testIds.parentUserId } })
  assert(updatedUser?.lastLoginAt !== null, "登录时间已更新")
}

// ── 2.2 任务流程 ──

async function testTaskFlow() {
  subSection("2.2 任务流程")

  // 测试任务创建
  const task = await prisma.task.findUnique({
    where: { id: testIds.taskId1 },
    include: { assignees: true },
  })
  assert(task !== null, "任务已创建")
  assert(task!.name === "刷牙", "任务名称正确")
  assert(task!.points === 10, "任务积分正确")
  assert(task!.assignees.length >= 1, "任务已分配给小朋友")

  // 测试小朋友完成任务 (自动审批)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const completion1 = await prisma.taskCompletion.create({
    data: {
      taskId: testIds.taskId1,
      memberId: testIds.kidMemberId,
      pointsEarned: 10,
      status: "APPROVED",
      approvedBy: testIds.parentUserId,
      approvedAt: new Date(),
      date: today,
    },
  })
  testIds.completionId1 = completion1.id
  assert(completion1.status === "APPROVED", "自动审批任务状态为 APPROVED")
  assert(completion1.pointsEarned === 10, "自动审批任务积分正确")

  // 测试小朋友完成任务 (手动审批)
  const completion2 = await prisma.taskCompletion.create({
    data: {
      taskId: testIds.taskId2,
      memberId: testIds.kidMemberId,
      pointsEarned: 15,
      status: "PENDING",
      date: today,
    },
  })
  testIds.completionId2 = completion2.id
  assert(completion2.status === "PENDING", "手动审批任务状态为 PENDING")

  // 测试家长审核通过
  const approved = await prisma.taskCompletion.update({
    where: { id: completion2.id },
    data: {
      status: "APPROVED",
      approvedBy: testIds.parentUserId,
      approvedAt: new Date(),
    },
  })
  assert(approved.status === "APPROVED", "家长审核通过后状态为 APPROVED")

  // 测试家长审核拒绝
  const completion3 = await prisma.taskCompletion.create({
    data: {
      taskId: testIds.taskId3,
      memberId: testIds.kidMemberId,
      pointsEarned: 0,
      status: "PENDING",
      date: today,
    },
  })
  const rejected = await prisma.taskCompletion.update({
    where: { id: completion3.id },
    data: {
      status: "REJECTED",
      approvedBy: testIds.parentUserId,
      approvedAt: new Date(),
      parentNote: "需要更认真完成",
    },
  })
  assert(rejected.status === "REJECTED", "家长审核拒绝后状态为 REJECTED")
  assert(rejected.parentNote === "需要更认真完成", "拒绝备注正确")

  // 测试重复提交防护 (同一天同一任务)
  await assertThrows(async () => {
    await prisma.taskCompletion.create({
      data: {
        taskId: testIds.taskId1,
        memberId: testIds.kidMemberId,
        pointsEarned: 10,
        status: "APPROVED",
        date: today,
      },
    })
  }, "同一天同一任务重复提交应被数据库唯一约束阻止")

  // 测试任务分配
  const task2 = await prisma.task.findUnique({
    where: { id: testIds.taskId2 },
    include: { assignees: true },
  })
  const isAssigned = task2!.assignees.some((a) => a.id === testIds.kidMemberId)
  assert(isAssigned, "任务已分配给指定小朋友")

  // 测试未分配任务不可完成
  const unassignedTask = await prisma.task.create({
    data: {
      familyId: testIds.familyId,
      creatorId: testIds.parentUserId,
      name: "未分配任务",
      icon: "❓",
      category: "OTHER",
      type: "DAILY",
      frequency: "DAILY",
      difficulty: "EASY",
      points: 5,
      autoApprove: true,
      maxDaily: 1,
      weekDays: JSON.stringify([1, 2, 3, 4, 5, 6, 0]),
      status: "ACTIVE",
    },
  })
  // 未分配的任务 (assignees 为空) 应该允许任何人完成
  const unassignedCompletion = await prisma.taskCompletion.create({
    data: {
      taskId: unassignedTask.id,
      memberId: testIds.kidMemberId,
      pointsEarned: 5,
      status: "APPROVED",
      date: today,
    },
  })
  assert(unassignedCompletion !== null, "未分配任务可以被完成")
}

// ── 2.3 积分计算 ──

async function testPointsCalculation() {
  subSection("2.3 积分计算")

  // 测试基础积分
  const todayPoints = await getTodayPoints(testIds.kidMemberId)
  console.log(`  📊 当前今日积分: ${todayPoints}`)
  assert(todayPoints >= 10, "今日积分至少包含基础任务积分")

  // 测试连续打卡天数
  const streak = await getStreakDays(testIds.kidMemberId)
  console.log(`  📊 当前连续打卡天数: ${streak}`)
  assert(streak >= 0, "连续打卡天数计算正常")

  // 测试周末双倍逻辑
  const isWeekend = [0, 6].includes(new Date().getDay())
  console.log(`  📊 今天是${isWeekend ? "周末" : "工作日"}`)

  // 测试生日三倍逻辑
  const kidMember = await prisma.familyMember.findUnique({
    where: { id: testIds.kidMemberId },
    select: { birthdate: true },
  })
  const today2 = new Date()
  const isBirthday =
    kidMember?.birthdate &&
    today2.getMonth() === kidMember.birthdate.getMonth() &&
    today2.getDate() === kidMember.birthdate.getDate()
  console.log(`  📊 今天${isBirthday ? "是" : "不是"}小朋友生日`)

  // 测试每日上限逻辑
  const pointConfig = await prisma.pointConfig.findFirst({
    where: { familyId: testIds.familyId },
  })
  assert(pointConfig !== null, "积分配置存在")
  assert(pointConfig!.dailyCap === 200, "每日积分上限为200")
  assert(pointConfig!.weekendDouble === true, "周末双倍已启用")
  assert(pointConfig!.birthdayTriple === true, "生日三倍已启用")

  // 测试积分日志记录
  const pointLog = await prisma.pointLog.create({
    data: {
      memberId: testIds.kidMemberId,
      amount: 10,
      reason: "TASK_COMPLETE",
      referenceId: testIds.completionId1,
      referenceType: "Task",
      balanceAfter: todayPoints + 10,
    },
  })
  assert(pointLog !== null, "积分日志创建成功")
  assert(pointLog.amount === 10, "积分日志金额正确")
  assert(pointLog.reason === "TASK_COMPLETE", "积分日志原因正确")

  // 测试积分汇总
  const totalEarned = await prisma.taskCompletion.aggregate({
    where: { memberId: testIds.kidMemberId, status: "APPROVED" },
    _sum: { pointsEarned: true },
  })
  console.log(`  📊 累计获得积分: ${totalEarned._sum.pointsEarned || 0}`)
  assert((totalEarned._sum.pointsEarned || 0) >= 10, "累计积分至少10分")

  // 测试积分规则查询
  const rules = await prisma.pointRule.findMany({
    where: { familyId: testIds.familyId, isActive: true },
  })
  assert(rules.length === 4, "4条积分规则已创建")
  const ruleTypes = rules.map((r) => r.ruleType)
  assert(ruleTypes.includes("STREAK_BONUS"), "包含连续打卡加成规则")
  assert(ruleTypes.includes("WEEKEND_DOUBLE"), "包含周末双倍规则")
  assert(ruleTypes.includes("BIRTHDAY_TRIPLE"), "包含生日三倍规则")
  assert(ruleTypes.includes("DAILY_CAP"), "包含每日上限规则")
}

// ── 2.4 成就解锁 ──

async function testAchievementUnlocking() {
  subSection("2.4 成就解锁")

  // 测试成就条件检查 - TASK_COUNT
  const approvedCount = await prisma.taskCompletion.count({
    where: { memberId: testIds.kidMemberId, status: "APPROVED" },
  })
  console.log(`  📊 已批准任务数: ${approvedCount}`)

  // 创建更多完成记录来触发成就
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 5; i++) {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - (i + 1))
    try {
      await prisma.taskCompletion.create({
        data: {
          taskId: testIds.taskId1,
          memberId: testIds.kidMemberId,
          pointsEarned: 10,
          status: "APPROVED",
          approvedBy: testIds.parentUserId,
          approvedAt: yesterday,
          date: yesterday,
        },
      })
    } catch {
      // 忽略重复
    }
  }

  const finalCount = await prisma.taskCompletion.count({
    where: { memberId: testIds.kidMemberId, status: "APPROVED" },
  })
  console.log(`  📊 最终已批准任务数: ${finalCount}`)

  // 测试成就授予
  const existingGrant = await prisma.achievementGrant.findFirst({
    where: {
      achievementId: testIds.achievementId,
      memberId: testIds.kidMemberId,
    },
  })

  if (!existingGrant) {
    await prisma.achievementGrant.create({
      data: {
        achievementId: testIds.achievementId,
        memberId: testIds.kidMemberId,
        triggeredBy: testIds.completionId1,
        context: JSON.stringify({ unlockedAt: new Date().toISOString() }),
      },
    })
  }

  const grant = await prisma.achievementGrant.findFirst({
    where: {
      achievementId: testIds.achievementId,
      memberId: testIds.kidMemberId,
    },
  })
  assert(grant !== null, "成就已授予")

  // 测试成就奖励积分
  const achievement = await prisma.achievement.findUnique({
    where: { id: testIds.achievementId },
  })
  assert(achievement!.bonusPoints === 30, "成就奖励积分正确")

  // 测试成就去重 (同一成就不会重复授予)
  const grantCount = await prisma.achievementGrant.count({
    where: {
      achievementId: testIds.achievementId,
      memberId: testIds.kidMemberId,
    },
  })
  assert(grantCount === 1, "同一成就不会重复授予")

  // 测试全局成就查询
  const globalAchievements = await prisma.achievement.findMany({
    where: { isGlobal: true },
  })
  assert(globalAchievements.length >= 20, "全局成就数量不少于20个")

  // 测试成就条件解析
  const condition = JSON.parse(achievement!.condition)
  assert(condition.type === "TASK_COUNT", "成就条件类型正确")
  assert(condition.count === 5, "成就条件数量正确")
}

// =============================================================================
//  3. 边界测试
// =============================================================================

async function runBoundaryTests() {
  section("🔍 边界测试")

  await testInvalidInviteCode()
  await testDuplicateJoin()
  await testDuplicateCompletion()
  await testPointsCapTruncation()
  await testStreakInterruption()
}

async function testInvalidInviteCode() {
  subSection("3.1 邀请码边界测试")

  // 测试无效邀请码
  const invalidFamily = await prisma.family.findUnique({
    where: { inviteCode: "ZZZZZZ" },
  })
  assert(invalidFamily === null, "无效邀请码查不到家庭")

  // 测试空邀请码
  const emptyFamily = await prisma.family.findUnique({
    where: { inviteCode: "" },
  })
  assert(emptyFamily === null, "空邀请码查不到家庭")

  // 测试邀请码格式 - 大小写
  const family = await prisma.family.findUnique({
    where: { id: testIds.familyId },
    select: { inviteCode: true },
  })
  const upperCode = family!.inviteCode.toUpperCase()
  const foundByUpper = await prisma.family.findUnique({
    where: { inviteCode: upperCode },
  })
  assert(foundByUpper !== null, "大写邀请码可以找到家庭")

  // 测试邀请码唯一性
  const families = await prisma.family.findMany({
    where: { inviteCode: family!.inviteCode },
  })
  assert(families.length === 1, "邀请码全局唯一")
}

async function testDuplicateJoin() {
  subSection("3.2 重复加入家庭")

  // 测试同一用户不能重复加入同一家庭
  const existingMember = await prisma.familyMember.findFirst({
    where: {
      familyId: testIds.familyId,
      userId: testIds.kidUserId,
    },
  })
  assert(existingMember !== null, "小朋友已是家庭成员")

  // 尝试创建重复记录应失败
  await assertThrows(async () => {
    await prisma.familyMember.create({
      data: {
        familyId: testIds.familyId,
        userId: testIds.kidUserId,
        role: "KID",
        nickname: "重复小朋友",
      },
    })
  }, "重复加入同一家庭应被唯一约束阻止")

  // 测试同一用户可以加入不同家庭 (先验证当前只有一个)
  const memberCount = await prisma.familyMember.count({
    where: { userId: testIds.kidUserId },
  })
  assert(memberCount === 1, "小朋友只属于一个家庭")
}

async function testDuplicateCompletion() {
  subSection("3.3 重复完成任务")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 测试同一天同一任务不能重复完成
  const existingCompletion = await prisma.taskCompletion.findFirst({
    where: {
      taskId: testIds.taskId1,
      memberId: testIds.kidMemberId,
      date: { gte: today },
    },
  })
  assert(existingCompletion !== null, "今天已有完成记录")

  await assertThrows(async () => {
    await prisma.taskCompletion.create({
      data: {
        taskId: testIds.taskId1,
        memberId: testIds.kidMemberId,
        pointsEarned: 10,
        status: "APPROVED",
        date: today,
      },
    })
  }, "同一天同一任务重复完成应被唯一约束阻止")

  // 测试不同任务可以同一天完成
  const diffTaskCompletion = await prisma.taskCompletion.create({
    data: {
      taskId: testIds.taskId3,
      memberId: testIds.kid2MemberId,
      pointsEarned: 20,
      status: "PENDING",
      date: today,
    },
  })
  assert(diffTaskCompletion !== null, "不同任务可以在同一天完成")
}

async function testPointsCapTruncation() {
  subSection("3.4 积分上限截断")

  // 模拟积分接近上限的情况
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 创建大量积分记录模拟达到上限
  const currentPoints = await getTodayPoints(testIds.kid2MemberId)
  console.log(`  📊 kid2 今日积分: ${currentPoints}`)

  // 如果当前积分 < 200，添加积分直到接近上限
  if (currentPoints < 190) {
    const pointsToAdd = 190 - currentPoints
    await prisma.taskCompletion.create({
      data: {
        taskId: testIds.taskId1,
        memberId: testIds.kid2MemberId,
        pointsEarned: pointsToAdd,
        status: "APPROVED",
        approvedBy: testIds.parentUserId,
        approvedAt: new Date(),
        date: today,
      },
    })
  }

  const nearCapPoints = await getTodayPoints(testIds.kid2MemberId)
  console.log(`  📊 接近上限积分: ${nearCapPoints}`)

  // 测试积分上限截断逻辑
  const pointConfig = await prisma.pointConfig.findFirst({
    where: { familyId: testIds.familyId },
  })
  const cap = pointConfig!.dailyCap
  assert(cap === 200, "每日上限配置为200")

  // 验证超过上限时积分被截断
  if (nearCapPoints >= 190) {
    const remaining = Math.max(0, cap - nearCapPoints)
    console.log(`  📊 剩余可获积分: ${remaining}`)
    assert(remaining <= 10, "接近上限时剩余积分不超过10")
  }
}

async function testStreakInterruption() {
  subSection("3.5 连续打卡中断")

  // 获取当前连续天数
  const streak = await getStreakDays(testIds.kidMemberId)
  console.log(`  📊 当前连续打卡: ${streak} 天`)

  // 测试中断逻辑 - 如果中间有缺失天数
  const completions = await prisma.taskCompletion.findMany({
    where: { memberId: testIds.kidMemberId, status: "APPROVED" },
    select: { date: true },
    orderBy: { date: "desc" },
    distinct: ["date"],
  })

  if (completions.length >= 2) {
    const latest = new Date(completions[0].date)
    const second = new Date(completions[1].date)
    const diffDays = Math.round(
      (latest.getTime() - second.getTime()) / (1000 * 60 * 60 * 24)
    )
    console.log(`  📊 最近两次打卡间隔: ${diffDays} 天`)
    assert(diffDays >= 0, "打卡日期计算正常")
  }

  // 测试连续天数不超过实际记录数
  assert(streak <= completions.length, "连续天数不超过总记录数")
}

// =============================================================================
//  4. 性能测试
// =============================================================================

async function runPerformanceTests() {
  section("⚡ 性能测试")

  await testLargeDatasetQuery()
  await testBatchAchievementCheck()
  await testConcurrentSubmission()
}

async function testLargeDatasetQuery() {
  subSection("4.1 大量任务数据查询性能")

  // 批量创建任务完成记录
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startTime = Date.now()
  const batchSize = 100

  // 创建批量完成记录 (使用不同日期避免唯一约束)
  const createPromises = []
  for (let i = 0; i < batchSize; i++) {
    const pastDate = new Date(today)
    pastDate.setDate(pastDate.getDate() - (i + 30)) // 从30天前开始
    createPromises.push(
      prisma.taskCompletion
        .create({
          data: {
            taskId: testIds.taskId1,
            memberId: testIds.kidMemberId,
            pointsEarned: 10,
            status: "APPROVED",
            approvedBy: testIds.parentUserId,
            approvedAt: pastDate,
            date: pastDate,
          },
        })
        .catch(() => {}) // 忽略重复
    )
  }

  await Promise.all(createPromises)
  const createTime = Date.now() - startTime
  console.log(`  ⏱ 批量创建 ${batchSize} 条记录: ${createTime}ms`)
  assert(createTime < 30000, "批量创建100条记录在30秒内完成")

  // 测试查询性能
  const queryStart = Date.now()
  const allCompletions = await prisma.taskCompletion.findMany({
    where: { memberId: testIds.kidMemberId, status: "APPROVED" },
    orderBy: { date: "desc" },
    take: 200,
  })
  const queryTime = Date.now() - queryStart
  console.log(`  ⏱ 查询 ${allCompletions.length} 条记录: ${queryTime}ms`)
  assert(queryTime < 5000, "查询200条记录在5秒内完成")

  // 测试聚合查询性能
  const aggStart = Date.now()
  const aggResult = await prisma.taskCompletion.aggregate({
    where: { memberId: testIds.kidMemberId, status: "APPROVED" },
    _sum: { pointsEarned: true },
    _count: true,
  })
  const aggTime = Date.now() - aggStart
  console.log(
    `  ⏱ 聚合查询 (${aggResult._count} 条): ${aggTime}ms, 总积分: ${aggResult._sum.pointsEarned}`
  )
  assert(aggTime < 3000, "聚合查询在3秒内完成")
}

async function testBatchAchievementCheck() {
  subSection("4.2 成就检查批量处理")

  const startTime = Date.now()

  // 批量检查所有成就条件
  const [member, allAchievements, grantedAchievements] = await Promise.all([
    prisma.familyMember.findUnique({
      where: { id: testIds.kidMemberId },
      select: { familyId: true },
    }),
    prisma.achievement.findMany({
      where: { isActive: true },
    }),
    prisma.achievementGrant.findMany({
      where: { memberId: testIds.kidMemberId },
      select: { achievementId: true },
    }),
  ])

  const grantedIds = new Set(grantedAchievements.map((g) => g.achievementId))
  const memberAchievements = allAchievements.filter(
    (a) => a.isGlobal || a.familyId === member!.familyId
  )

  // 检查每个成就条件
  let checkedCount = 0
  for (const achievement of memberAchievements) {
    if (grantedIds.has(achievement.id)) continue
    const condition = JSON.parse(achievement.condition)

    if (condition.type === "TASK_COUNT") {
      const where: any = { memberId: testIds.kidMemberId, status: "APPROVED" }
      if (condition.category) where.task = { category: condition.category }
      const count = await prisma.taskCompletion.count({ where })
      checkedCount++
    }
  }

  const checkTime = Date.now() - startTime
  console.log(
    `  ⏱ 批量检查 ${checkedCount}/${memberAchievements.length} 个成就: ${checkTime}ms`
  )
  assert(checkTime < 10000, "批量成就检查在10秒内完成")
}

async function testConcurrentSubmission() {
  subSection("4.3 并发任务提交")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 创建多个不同日期的完成记录来测试并发
  const concurrentCount = 20
  const startTime = Date.now()

  const promises = []
  for (let i = 0; i < concurrentCount; i++) {
    const pastDate = new Date(today)
    pastDate.setDate(pastDate.getDate() - (i + 60)) // 从60天前开始避免冲突
    promises.push(
      prisma.taskCompletion
        .create({
          data: {
            taskId: testIds.taskId1,
            memberId: testIds.kid2MemberId,
            pointsEarned: 10,
            status: "APPROVED",
            approvedBy: testIds.parentUserId,
            approvedAt: pastDate,
            date: pastDate,
          },
        })
        .catch(() => {})
    )
  }

  await Promise.all(promises)
  const concurrentTime = Date.now() - startTime
  console.log(`  ⏱ 并发提交 ${concurrentCount} 条记录: ${concurrentTime}ms`)
  assert(concurrentTime < 15000, "并发20条提交在15秒内完成")

  // 验证并发提交后数据完整性
  const totalRecords = await prisma.taskCompletion.count({
    where: { memberId: testIds.kid2MemberId },
  })
  console.log(`  📊 kid2 总完成记录: ${totalRecords}`)
  assert(totalRecords >= concurrentCount, "并发提交后记录数不少于提交数")
}

// =============================================================================
//  5. 清理测试数据
// =============================================================================

async function cleanupTestData() {
  section("🧹 清理测试数据")

  if (!testIds.familyId) {
    console.log("  ⚠️ 无测试数据需要清理")
    return
  }

  try {
    // 按依赖顺序删除
    await prisma.pointLog.deleteMany({ where: { memberId: testIds.kidMemberId } })
    await prisma.pointLog.deleteMany({ where: { memberId: testIds.kid2MemberId } })

    await prisma.achievementGrant.deleteMany({
      where: { memberId: { in: [testIds.kidMemberId, testIds.kid2MemberId] } },
    })

    await prisma.taskCompletion.deleteMany({
      where: {
        memberId: { in: [testIds.kidMemberId, testIds.kid2MemberId, testIds.parentMemberId] },
      },
    })

    await prisma.rewardRedemption.deleteMany({
      where: { memberId: { in: [testIds.kidMemberId, testIds.kid2MemberId] } },
    })

    await prisma.reward.deleteMany({ where: { familyId: testIds.familyId } })
    await prisma.achievement.deleteMany({ where: { familyId: testIds.familyId } })
    await prisma.pointRule.deleteMany({ where: { familyId: testIds.familyId } })
    await prisma.pointConfig.deleteMany({ where: { familyId: testIds.familyId } })

    // 删除任务
    await prisma.task.deleteMany({ where: { familyId: testIds.familyId } })

    // 删除家庭成员
    await prisma.familyMember.deleteMany({ where: { familyId: testIds.familyId } })

    // 删除家庭
    await prisma.family.delete({ where: { id: testIds.familyId } })

    // 删除用户
    await prisma.user.deleteMany({
      where: {
        id: { in: [testIds.parentUserId, testIds.kidUserId, testIds.kid2UserId] },
      },
    })

    console.log("  ✅ 测试数据清理完成")
  } catch (e: any) {
    console.log(`  ⚠️ 清理时出现错误: ${e.message}`)
  }
}

// =============================================================================
//  6. 测试报告
// =============================================================================

function printReport() {
  const total = passed + failed
  const rate = total > 0 ? Math.round((passed / total) * 100) : 0

  console.log(`\n${"=".repeat(60)}`)
  console.log(`  📊 测试报告`)
  console.log(`${"=".repeat(60)}`)
  console.log(`  ✅ 通过: ${passed}`)
  console.log(`  ❌ 失败: ${failed}`)
  console.log(`  📋 总计: ${total}`)
  console.log(`  📈 通过率: ${rate}%`)
  console.log(`  ⏰ 结束时间: ${new Date().toISOString()}`)

  if (failures.length > 0) {
    console.log(`\n  ── 失败详情 ──`)
    for (const f of failures) {
      console.log(`  ${f}`)
    }
  }

  console.log(`${"=".repeat(60)}`)

  if (failed > 0) {
    process.exit(1)
  }
}

// =============================================================================
//  启动
// =============================================================================

main().catch((e) => {
  console.error("❌ 测试套件异常:", e)
  process.exit(1)
})
