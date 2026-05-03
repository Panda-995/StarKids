"use client"

import { type ReactNode } from "react"

type EmptyStateProps = {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 space-y-3">
      <div className="text-5xl animate-bounce">{icon}</div>
      <p className="text-warm-600 font-semibold">{title}</p>
      {description && <p className="text-sm text-warm-400">{description}</p>}
      {action && <div className="pt-3">{action}</div>}
    </div>
  )
}

export function ErrorState({
  message = "加载失败，请稍后重试",
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="text-center py-12 space-y-3">
      <div className="text-5xl">😵</div>
      <p className="text-warm-600 font-semibold">出错了</p>
      <p className="text-sm text-warm-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-10 px-6 bg-candy-blue text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all mt-3"
        >
          重试
        </button>
      )}
    </div>
  )
}
