"use client"

import { CompanyProvider } from "@/components/company-context"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CompanyProvider>
      {children}
    </CompanyProvider>
  )
}
