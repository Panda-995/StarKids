import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-8">
        <div className="text-7xl">🌟</div>
        <h1 className="font-kids text-5xl text-candy-purple">
          StarKids
        </h1>
        <p className="text-xl text-warm-500">
          用游戏化的方式，让好习惯自然生长
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/kids"
            className="inline-flex items-center justify-center h-16 px-8 text-xl font-bold font-kids text-white bg-candy-blue rounded-btn shadow-soft hover:scale-105 transition-transform"
          >
            🌟 我是小朋友
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center h-12 px-6 text-base font-semibold text-admin-primary bg-white border-2 border-admin-primary rounded-xl hover:bg-admin-primary hover:text-white transition-colors"
          >
            👑 我是家长
          </Link>
        </div>
      </div>
    </div>
  )
}
