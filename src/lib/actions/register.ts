"use server"

import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import type { UserAccountRole } from "@prisma/client"

export async function registerUser(formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase().trim()
  const password = formData.get("password") as string
  const nickname = (formData.get("nickname") as string).trim()
  const role = (formData.get("role") as string) || "PARENT"

  if (!email || !password || !nickname) {
    throw new Error("请填写所有必填字段")
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("邮箱格式不正确")
  }

  if (password.length < 6) {
    throw new Error("密码至少6位")
  }

  if (role !== "PARENT" && role !== "KID") {
    throw new Error("无效的角色选择")
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new Error("该邮箱已被注册")
  }

  const hash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      email,
      name: nickname,
      passwordHash: hash,
      role: role as UserAccountRole,
    },
  })
}
