"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { signIn, getSession } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6位"),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "邮箱或密码不正确" : result.error)
        setIsLoading(false)
        return
      }

      const session = await getSession()
      const role = session?.user?.role
      if (role === "PARENT") {
        router.push("/admin")
      } else {
        router.push("/kids")
      }
      router.refresh()
    } catch {
      setError("网络错误，请稍后再试")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌟</div>
          <h1 className="font-kids text-4xl text-candy-purple mb-2">
            欢迎回来
          </h1>
          <p className="text-warm-400">
            输入邮箱和密码登录
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-card shadow-soft p-6 space-y-4"
        >
          {error && (
            <div className="bg-candy-red/10 text-candy-red text-sm rounded-xl p-3 text-center">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-warm-600 mb-1.5"
            >
              电子邮箱
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="hello@example.com"
              {...register("email")}
              className="w-full h-12 px-4 rounded-xl border-2 border-warm-200 bg-warm-50 
                text-warm-700 text-base placeholder:text-warm-400
                focus:border-candy-blue focus:bg-white focus:outline-none transition-colors"
            />
            {errors.email && (
              <p className="text-candy-red text-xs mt-1.5">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-warm-600 mb-1.5"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="输入密码"
              {...register("password")}
              className="w-full h-12 px-4 rounded-xl border-2 border-warm-200 bg-warm-50 
                text-warm-700 text-base placeholder:text-warm-400
                focus:border-candy-blue focus:bg-white focus:outline-none transition-colors"
            />
            {errors.password && (
              <p className="text-candy-red text-xs mt-1.5">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 flex items-center justify-center gap-2
              bg-candy-blue text-white font-bold text-lg font-kids rounded-btn
              hover:brightness-110 active:scale-[0.98] transition-all
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">🔄</span>
                <span>登录中...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>登录</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <Link
            href="/register-auth"
            className="block text-sm text-candy-blue hover:underline"
          >
            没有账号？去注册
          </Link>
          <Link
            href="/"
            className="block text-sm text-warm-400 hover:text-warm-600 transition-colors"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
