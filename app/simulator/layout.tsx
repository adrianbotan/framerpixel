"use client"

import { ThemeProvider } from "next-themes"
import type React from "react"

export default function SimulatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="h-screen flex flex-col">{children}</div>
    </ThemeProvider>
  )
}
