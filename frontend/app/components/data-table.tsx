"use client"

import * as React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps {
  data: any[]
}

export function DataTable({ data }: DataTableProps) {
  // Skip rendering if no data
  if (!data || data.length === 0) {
    return (
      <div className="w-full px-4 lg:px-6">
        <div className="rounded-xl border bg-card p-4 text-center">
          No data available
        </div>
      </div>
    )
  }

  // Get headers from the first data item
  const headers = Object.keys(data[0])

  return (
    <div className="w-full px-4 lg:px-6">
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="text-left">
                    {header.charAt(0).toUpperCase() + header.slice(1)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((header) => (
                    <TableCell key={`${rowIndex}-${header}`}>
                      {row[header]?.toString() || ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end border-t p-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {data.length} row(s)
          </div>
        </div>
      </div>
    </div>
  )
}
