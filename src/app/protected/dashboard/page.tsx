"use client"

import React, { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { CompanyProvider } from "@/components/company-context"
import { DataTable } from "@/components/data-table"
import { RentMatrix } from "@/components/rent-matrix"
import { RentSummaryCards } from "@/components/rent-summary-cards"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import data from "./data.json"

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const [selectedYear, setSelectedYear] = useState("2022")
  const [resolvedSearchParams, setResolvedSearchParams] = useState<{ tab?: string }>({})
  
  // Resolve searchParams in useEffect or handle it properly
  React.useEffect(() => {
    searchParams.then(setResolvedSearchParams)
  }, [searchParams])
  
  const activeTab = resolvedSearchParams.tab || 'rent-overview'

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
              <Tabs
                defaultValue="rent-overview"
                value={activeTab}
                className="w-full flex-col justify-start gap-3"
              >
                <div className="flex items-center justify-center px-4 lg:px-6">
                  {/* Tabs for larger screens */}
                  <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
                    <TabsTrigger value="rent-overview">Rent Overview</TabsTrigger>
                    <TabsTrigger value="financial-analytics">
                      Financial Analytics
                      <Badge variant="secondary">New</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="property-performance">Property Performance</TabsTrigger>
                    <TabsTrigger value="tenant-insights">Tenant Insights</TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Tab Contents */}
                <TabsContent
                  value="rent-overview"
                  className="relative flex flex-col gap-2 overflow-auto px-4 lg:px-6"
                >
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground">🏠 Rent Overview</h1>
                    <p className="text-muted-foreground mt-2">
                      Monthly rent payment tracking and analysis
                    </p>
                  </div>
                  
                  <RentSummaryCards selectedYear={selectedYear} />
                  <RentMatrix selectedYear={selectedYear} onYearChange={setSelectedYear} />
                </TabsContent>
                
                <TabsContent
                  value="financial-analytics"
                  className="flex flex-col px-4 lg:px-6"
                >
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground">📊 Financial Analytics</h1>
                    <p className="text-muted-foreground mt-2">
                      Comprehensive financial analysis and reporting
                    </p>
                  </div>
                  <SectionCards />
                  <div className="mt-6">
                    <ChartAreaInteractive />
                  </div>
                  <div className="mt-6">
                    <DataTable data={data} />
                  </div>
                </TabsContent>
                
                <TabsContent
                  value="property-performance"
                  className="flex flex-col px-4 lg:px-6"
                >
                  <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-muted-foreground">🏢 Property Performance</h2>
                      <p className="text-muted-foreground">Coming soon - Property analytics and performance metrics</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent
                  value="tenant-insights"
                  className="flex flex-col px-4 lg:px-6"
                >
                  <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-muted-foreground">👥 Tenant Insights</h2>
                      <p className="text-muted-foreground">Coming soon - Tenant behavior and satisfaction analytics</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </CompanyProvider>
  )
}
