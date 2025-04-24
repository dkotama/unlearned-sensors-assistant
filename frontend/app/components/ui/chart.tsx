"use client"

import * as React from "react"
import { createContext, useContext } from "react"
import { TooltipProps } from "recharts"
import { cn } from "@/lib/utils"

export interface ChartConfig {
  [key: string]: {
    label: string
    color?: string
  }
}

interface ChartContextValue {
  config: ChartConfig
}

const ChartContext = createContext<ChartContextValue | null>(null)

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({
  children,
  config,
  className,
  ...props
}: ChartContainerProps) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn(
          "relative h-full w-full [--color-desktop:hsl(var(--chart-1))] [--color-mobile:hsl(var(--chart-2))]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
}

// A helper to get chart context
function useChartContext() {
  const context = useContext(ChartContext)
  if (!context) {
    throw new Error("Chart components must be used within a ChartContainer")
  }
  return context
}

// Custom tooltip component for Recharts
export function ChartTooltip({
  children,
  ...props
}: TooltipProps<number, string>) {
  return (
    <foreignObject
      className="overflow-visible"
      width={1}
      height={1}
      {...props}
    >
      {children}
    </foreignObject>
  )
}

// Content component for chart tooltips
interface ChartTooltipContentProps {
  active?: boolean
  payload?: any[]
  label?: string
  labelFormatter?: (value: string) => React.ReactNode
  formatter?: (value: number, name: string) => React.ReactNode
  indicator?: "line" | "dot"
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  indicator = "line",
}: ChartTooltipContentProps) {
  const { config } = useChartContext()

  if (!active || !payload?.length || !config) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-md">
      <div className="grid gap-2">
        <div className="flex items-center gap-1">
          {labelFormatter ? labelFormatter(label as string) : label}
        </div>
        <div className="grid gap-1">
          {payload.map((item: any, index: number) => {
            const dataKey = item.dataKey as string
            const color = item.color || config[dataKey]?.color || "#888"
            const name = config[dataKey]?.label || dataKey
            const value = item.value

            return (
              <div
                key={`item-${index}`}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1">
                  {indicator === "line" ? (
                    <div
                      className="h-0.5 w-3"
                      style={{ backgroundColor: color }}
                    />
                  ) : (
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  )}
                  <span className="text-xs text-muted-foreground">{name}</span>
                </div>
                <span className="text-xs font-medium">
                  {formatter ? formatter(value, name) : value}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}