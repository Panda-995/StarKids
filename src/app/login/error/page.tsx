import Link from "next/link"

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="text-7xl">😕</div>
        <h1 className="font-kids text-3xl text-candy-purple">
          登录出错了
        </h1>
        <p className="text-warm-500">
          登录过程中发生了错误，请检查邮箱和密码后重试
        </p>

        <Link
          href="/login"
          className="inline-block h-12 px-8 flex items-center justify-center
            bg-candy-blue text-white font-bold font-kids rounded-btn
            hover:brightness-110 transition-all"
        >
          重新登录
        </Link>

        <br />

        <Link
          href="/"
          className="inline-block text-sm text-warm-400 hover:text-warm-600 transition-colors"
        >
          ← 返回首页
        </Link>
      </div>
    </div>
  )
}
