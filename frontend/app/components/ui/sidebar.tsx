"use client"

import * as React from "react"
import { createContext, useContext } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Create context for sidebar state
const SidebarContext = createContext<{
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  variant: "default" | "inset"
}>({
  collapsed: false,
  setCollapsed: () => null,
  variant: "default",
})

// Provider for sidebar context
export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: {
  children: React.ReactNode
  defaultCollapsed?: boolean
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, variant: "default" }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

// Hook to use sidebar context
function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

// Sidebar variants
const sidebarVariants = cva(
  "flex h-full flex-col border-r bg-background",
  {
    variants: {
      variant: {
        default: "w-[270px] transition-all duration-300 ease-in-out",
        inset: "w-full border-0",
      },
      collapsed: {
        true: "w-[70px]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      collapsed: false,
    },
  }
)

// Sidebar component
export interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  collapsible?: "offcanvas" | boolean
}

export function Sidebar({
  className,
  variant = "default",
  collapsible = false,
  ...props
}: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, variant: variant || "default" }}>
      <div
        className={cn(
          sidebarVariants({ variant, collapsed: collapsible && collapsed }),
          className
        )}
        {...props}
      />
    </SidebarContext.Provider>
  )
}

// Sidebar header component
export function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex h-14 items-center border-b px-4", className)}
      {...props}
    />
  )
}

// Sidebar content component
export function SidebarContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-1 flex-col gap-4 overflow-y-auto py-4", className)}
      {...props}
    />
  )
}

// Sidebar footer component
export function SidebarFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex h-14 items-center border-t px-4", className)}
      {...props}
    />
  )
}

// Sidebar menu component
export function SidebarMenu({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />
}

// Sidebar menu item component
export function SidebarMenuItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { collapsed } = useSidebar()

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors",
        collapsed && "justify-center px-2",
        className
      )}
      {...props}
    />
  )
}

// Sidebar menu button component
export interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "button"
  if (asChild) {
    return (
      <Comp
        ref={ref}
        {...props}
      />
    )
  }
  return (
    <Comp
      ref={ref}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

// Sidebar inset component
export function SidebarInset({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { variant } = useSidebar()
  return (
    <div
      className={cn(
        "flex flex-1 flex-col",
        variant === "inset" ? "pl-[270px]" : "",
        className
      )}
      {...props}
    />
  )
}