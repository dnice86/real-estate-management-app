"use client"

import {
  IconCategory,
  IconCreditCard,
  IconUsers,
  IconBuilding,
  type Icon,
} from "@tabler/icons-react"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

function NavRealEstateContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'booking-categories'
  const currentTenant = searchParams.get('tenant') // Get the current tenant ID

  const tableItems = [
    {
      title: "Booking Categories",
      tabKey: "booking-categories",
      icon: IconCategory,
    },
    {
      title: "Bank Transactions", 
      tabKey: "bank-transactions",
      icon: IconCreditCard,
    },
    {
      title: "Tenants",
      tabKey: "tenants",
      icon: IconUsers,
    },
    {
      title: "Business Partners",
      tabKey: "business-partners",
      icon: IconBuilding,
    },
  ]

  // Helper function to build URL with preserved tenant parameter
  const buildUrl = (tabKey: string) => {
    const params = new URLSearchParams()
    params.set('tab', tabKey)
    if (currentTenant) {
      params.set('tenant', currentTenant)
    }
    return `/protected/real-estate-tables?${params.toString()}`
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Tables</SidebarGroupLabel>
      <SidebarMenu>
        {tableItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
              asChild
              isActive={
                pathname.includes('/protected/real-estate-tables') && currentTab === item.tabKey
              }
              tooltip={item.title}
            >
              <a href={buildUrl(item.tabKey)}>
                <item.icon />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function NavRealEstate() {
  return (
    <Suspense fallback={
      <SidebarGroup>
        <SidebarGroupLabel>Tables</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              Loading...
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    }>
      <NavRealEstateContent />
    </Suspense>
  )
}
