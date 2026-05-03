import { NextResponse } from "next/server"
import { addKidToFamily } from "@/lib/actions/family"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const result = await addKidToFamily(formData)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
