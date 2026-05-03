"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const registerAuthSchema = z
  .object({
    email: z.string().email("请输入有效的邮箱地址"),
    nickname: z.string().min(2, "昵称至少2个字符"),
    password: z.string().min(6, "密码至少6位"),
    confirmPassword: z.string(),
    role: z.enum(["PARENT", "KID"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"],
  })

type RegisterAuthValues = z.infer<typeof registerAuthSchema>

export default function RegisterAuthPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterAuthValues>({
    resolver: zodResolver(registerAuthSchema),
    defaultValues: { role: "PARENT" },
  })

  const watchRole = watch("role")

  const onSubmit = async (data: RegisterAuthValues) => {
    setIsLoading(true)
    setError("")

    const formData = new FormData()
    formData.append("email", data.email)
    formData.append("password", data.password)
    formData.append("nickname", data.nickname)
    formData.append("role", data.role)

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || "注册失败")
        setIsLoading(false)
        return
      }

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "邮箱或密码错误" : result.error)
        setIsLoading(false)
        return
      }

      router.push("/register")
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
          <div className="text-6xl mb-4">🎈</div>
          <h1 className="font-kids text-4xl text-candy-purple mb-2">
            创建账号
          </h1>
          <p className="text-warm-400">
            输入邮箱、昵称和密码即可注册
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
              htmlFor="nickname"
              className="block text-sm font-medium text-warm-600 mb-1.5"
            >
              昵称
            </label>
            <input
              id="nickname"
              type="text"
              autoComplete="name"
              placeholder="取个好听的名字"
              {...register("nickname")}
              className="w-full h-12 px-4 rounded-xl border-2 border-warm-200 bg-warm-50 
                text-warm-700 text-base placeholder:text-warm-400
                focus:border-candy-blue focus:bg-white focus:outline-none transition-colors"
            />
            {errors.nickname && (
              <p className="text-candy-red text-xs mt-1.5">{errors.nickname.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-600 mb-1.5">
              我是
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className={cn(
                "flex items-center justify-center gap-2 h-12 rounded-xl border-2 cursor-pointer transition-all font-kids text-base",
                watchRole === "PARENT"
                  ? "border-candy-blue bg-blue-50 text-candy-blue"
                  : "border-warm-200 bg-warm-50 text-warm-400 hover:border-warm-300"
              )}>
                <input
                  type="radio"
                  value="PARENT"
                  {...register("role")}
                  className="sr-only"
                />
                👑 家长
              </label>
              <label className={cn(
                "flex items-center justify-center gap-2 h-12 rounded-xl border-2 cursor-pointer transition-all font-kids text-base",
                watchRole === "KID"
                  ? "border-candy-purple bg-purple-50 text-candy-purple"
                  : "border-warm-200 bg-warm-50 text-warm-400 hover:border-warm-300"
              )}>
                <input
                  type="radio"
                  value="KID"
                  {...register("role")}
                  className="sr-only"
                />
                🌟 小朋友
              </label>
            </div>
            {errors.role && (
              <p className="text-candy-red text-xs mt-1.5">{errors.role.message}</p>
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
              autoComplete="new-password"
              placeholder="至少6位密码"
              {...register("password")}
              className="w-full h-12 px-4 rounded-xl border-2 border-warm-200 bg-warm-50 
                text-warm-700 text-base placeholder:text-warm-400
                focus:border-candy-blue focus:bg-white focus:outline-none transition-colors"
            />
            {errors.password && (
              <p className="text-candy-red text-xs mt-1.5">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-warm-600 mb-1.5"
            >
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="再次输入密码"
              {...register("confirmPassword")}
              className="w-full h-12 px-4 rounded-xl border-2 border-warm-200 bg-warm-50 
                text-warm-700 text-base placeholder:text-warm-400
                focus:border-candy-blue focus:bg-white focus:outline-none transition-colors"
            />
            {errors.confirmPassword && (
              <p className="text-candy-red text-xs mt-1.5">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 flex items-center justify-center gap-2
              bg-candy-purple text-white font-bold text-lg font-kids rounded-btn
              hover:brightness-110 active:scale-[0.98] transition-all
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">🔄</span>
                <span>注册中...</span>
              </>
            ) : (
              <>
                <span>🎈</span>
                <span>注册</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <Link
            href="/login"
            className="block text-sm text-candy-blue hover:underline"
          >
            已有账号？去登录
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
