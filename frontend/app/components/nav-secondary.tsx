"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface NavSecondaryProps {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
  className?: string
}

export function NavSecondary({ items, className }: NavSecondaryProps) {
  return (
    <nav className={cn("flex flex-col gap-1 px-4", className)}>
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
  )
}