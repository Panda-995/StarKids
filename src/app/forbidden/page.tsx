import Link from "next/link"

const MESSAGES: Record<string, { emoji: string; title: string; desc: string; link: string; linkText: string }> = {
  kid_to_admin: {
    emoji: "🚫",
    title: "小朋友账号无法访问家长后台",
    desc: "你当前登录的是小朋友账号，家长后台仅限家长账号使用。如需管理家庭，请使用家长账号登录。",
    link: "/kids",
    linkText: "返回小朋友乐园 →",
  },
  parent_to_kids: {
    emoji: "🚫",
    title: "家长账号无法访问小朋友界面",
    desc: "你当前登录的是家长账号，小朋友界面仅限小朋友账号使用。如需查看小朋友界面，请使用小朋友账号登录。",
    link: "/admin",
    linkText: "返回家长后台 →",
  },
}

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const msg = MESSAGES[reason || ""] || MESSAGES.kid_to_admin

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="text-7xl">{msg.emoji}</div>
        <h1 className="font-kids text-3xl text-warm-700">{msg.title}</h1>
        <p className="text-sm text-warm-400 leading-relaxed">{msg.desc}</p>
        <div className="flex flex-col gap-2">
          <Link
            href={msg.link}
            className="inline-flex items-center justify-center h-12 px-6 bg-candy-blue text-white font-bold font-kids rounded-btn hover:brightness-110 transition-all"
          >
            {msg.linkText}
          </Link>
          <Link
            href="/login"
            className="text-sm text-warm-400 hover:text-warm-600 transition-colors"
          >
            切换账号，重新登录
          </Link>
        </div>
      </div>
    </div>
  )
}
