"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface NavChatProps {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
  className?: string
}

export function NavChat({ items, className }: NavChatProps) {
  return (
    <div className={cn("px-4 py-2", className)}>
      <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight">
        Chat
      </h2>
      <nav className="grid gap-1">
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.url}
            className="group flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
