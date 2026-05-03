import { NextResponse } from "next/server"
import { registerUser } from "@/lib/actions/register"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    await registerUser(formData)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
