export const SPECIES_EMOJI: Record<string, string> = {
  CAT: "🐱", DOG: "🐶", FOX: "🦊", RABBIT: "🐰",
  DRAGON: "🐲", UNICORN: "🦄", PANDA: "🐼", PENGUIN: "🐧",
}

export const SPECIES_LABELS: Record<string, string> = {
  CAT: "小猫", DOG: "小狗", FOX: "小狐狸", RABBIT: "小兔",
  DRAGON: "小龙", UNICORN: "独角兽", PANDA: "小熊猫", PENGUIN: "小企鹅",
}

export const STAGE_LABELS: Record<string, string> = {
  EGG: "蛋宝宝", BABY: "破壳啦", GROWING: "成长中", EVOLVED: "进化了", ULTIMATE: "完全体",
}

export const STAGE_CONFIG: Record<string, { threshold: number; emoji: string; label: string }> = {
  EGG: { threshold: 0, emoji: "🥚", label: "蛋宝宝" },
  BABY: { threshold: 200, emoji: "🐣", label: "破壳啦" },
  GROWING: { threshold: 500, emoji: "🐥", label: "成长中" },
  EVOLVED: { threshold: 1000, emoji: "🦋", label: "进化了" },
  ULTIMATE: { threshold: 2000, emoji: "👑", label: "完全体" },
}

export const CATEGORY_LABELS: Record<string, string> = {
  HABIT: "习惯", HOUSEWORK: "家务", STUDY: "学习",
  EXERCISE: "运动", SOCIAL: "社交", CREATIVE: "创意", OTHER: "其他",
}

export const CATEGORY_COLORS: Record<string, string> = {
  LABOR: "bg-green-100 text-green-700",
  HABIT: "bg-blue-100 text-blue-700",
  STUDY: "bg-purple-100 text-purple-700",
  EXERCISE: "bg-orange-100 text-orange-700",
  SOCIAL: "bg-pink-100 text-pink-700",
  REDEMPTION: "bg-brand-100 text-brand-700",
  SPECIAL: "bg-red-100 text-red-700",
}

export const MOOD_EMOJIS: Record<number, string> = {
  0: "😢", 20: "😔", 40: "😐", 60: "🙂", 80: "😊", 100: "🥰",
}
