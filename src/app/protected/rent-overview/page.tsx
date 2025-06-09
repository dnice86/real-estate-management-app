"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { CompanyProvider } from "@/components/company-context"
import { RentMatrix } from "@/components/rent-matrix"
import { RentSummaryCards } from "@/components/rent-summary-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function RentOverviewPage() {
  const [selectedYear, setSelectedYear] = useState("2022")  // Changed to 2022 where the actual data is
  return (
    <CompanyProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground">🏠 Rent Overview</h1>
                    <p className="text-muted-foreground mt-2">
                      Monthly rent payment tracking and analysis
                    </p>
                  </div>
                  
                  <RentSummaryCards selectedYear={selectedYear} />
                  <RentMatrix selectedYear={selectedYear} onYearChange={setSelectedYear} />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </CompanyProvider>
  )
}