import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { cn } from "@/lib/utils"

export default async function RegisterPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const existingMember = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
    include: { family: true },
  })

  if (existingMember) {
    const isKid = String(existingMember.role) === "KID"
    redirect(isKid ? "/kids" : "/admin")
  }

  const userRole = session.user.role
  const isKid = userRole === "KID"

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">{isKid ? "🔑" : "👨‍👩‍👧‍👦"}</div>
          <h1 className="font-kids text-4xl text-candy-purple mb-2">
            {isKid ? "加入家庭" : "加入或创建家庭"}
          </h1>
          <p className="text-warm-400">
            {isKid
              ? "输入邀请码，加入家长已创建的家庭"
              : "创建一个新家庭，或用邀请码加入已有家庭"}
          </p>
        </div>

        <div className={isKid ? "" : "grid gap-6 md:grid-cols-2"}>
          {!isKid && (
            <div className="bg-white rounded-card shadow-soft p-6 space-y-4">
              <h2 className="font-kids text-xl text-candy-blue">🏡 创建家庭</h2>
              <p className="text-sm text-warm-400">
                创建一个新家庭，你将成为管理员
              </p>

              <form className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-warm-600 mb-1">
                    家庭名称
                  </label>
                  <input
                    name="name"
                    placeholder="如：朵朵一家"
                    required
                    minLength={2}
                    className="w-full h-11 px-3 rounded-xl border border-warm-200 bg-warm-50 text-warm-700 text-sm focus:border-candy-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-600 mb-1">
                    你的昵称
                  </label>
                  <input
                    name="nickname"
                    placeholder="如：爸爸、妈妈"
                    required
                    minLength={2}
                    className="w-full h-11 px-3 rounded-xl border border-warm-200 bg-warm-50 text-warm-700 text-sm focus:border-candy-blue focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  formAction={async (formData: FormData) => {
                    "use server"
                    const { createFamily } = await import("@/lib/actions/family")
                    await createFamily(formData)
                  }}
                  className="w-full h-11 bg-candy-blue text-white font-bold text-sm font-kids rounded-btn hover:brightness-110 transition-all"
                >
                  ✨ 创建家庭
                </button>
              </form>
            </div>
          )}

          <div className={cn(
            "bg-white rounded-card shadow-soft p-6 space-y-4",
            isKid && "max-w-sm mx-auto"
          )}>
            <h2 className="font-kids text-xl text-candy-green">🔑 加入家庭</h2>
            <p className="text-sm text-warm-400">
              输入邀请码，加入已有家庭
            </p>

            <form className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-warm-600 mb-1">
                  邀请码
                </label>
                <input
                  name="inviteCode"
                  placeholder="输入6位邀请码"
                  required
                  minLength={5}
                  className="w-full h-11 px-3 rounded-xl border border-warm-200 bg-warm-50 text-warm-700 text-sm focus:border-candy-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-600 mb-1">
                  你的昵称
                </label>
                <input
                  name="nickname"
                  placeholder="如：朵朵、小明"
                  required
                  minLength={2}
                  className="w-full h-11 px-3 rounded-xl border border-warm-200 bg-warm-50 text-warm-700 text-sm focus:border-candy-blue focus:outline-none"
                />
              </div>
              {isKid ? (
                <input type="hidden" name="role" value="KID" />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-warm-600 mb-1">
                    你的角色
                  </label>
                  <select
                    name="role"
                    className="w-full h-11 px-3 rounded-xl border border-warm-200 bg-warm-50 text-warm-700 text-sm focus:border-candy-blue focus:outline-none"
                  >
                    <option value="KID">🌟 我是小朋友</option>
                    <option value="PARENT">👑 我是家长</option>
                  </select>
                </div>
              )}
              <button
                type="submit"
                formAction={async (formData: FormData) => {
                  "use server"
                  const { joinFamily } = await import("@/lib/actions/family")
                  await joinFamily(formData)
                }}
                className="w-full h-11 bg-candy-green text-white font-bold text-sm font-kids rounded-btn hover:brightness-110 transition-all"
              >
                🚀 加入家庭
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
