"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NavUserProps {
  user: {
    name: string
    email: string
    avatar: string
  }
  className?: string
}

export function NavUser({ user, className }: NavUserProps) {
  return (
    <div className={cn("flex items-center gap-2 px-4", className)}>
      <div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={`${user.name}'s avatar`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium uppercase text-muted-foreground">
            {user.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-medium">{user.name}</span>
        <span className="text-xs text-muted-foreground">{user.email}</span>
      </div>
      <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
        <ChevronDownIcon className="h-4 w-4" />
        <span className="sr-only">User menu</span>
      </Button>
    </div>
  )
}