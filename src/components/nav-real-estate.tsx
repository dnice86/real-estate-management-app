"use client"

import {
  IconCategory,
  IconCreditCard,
  IconUsers,
  IconBuilding,
  IconCalendarTime,
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
  const currentTab = searchParams.get('tab') || 'bank-transactions'

  const tableItems = [
    {
      title: "Bank Transactions",
      tabKey: "bank-transactions",
      icon: IconCreditCard,
      url: "/protected/simple-tables"
    },
    {
      title: "Renters",
      tabKey: "renters",
      icon: IconUsers,
      url: "/protected/simple-tables"
    },
    {
      title: "Business Partners",
      tabKey: "business-partners",
      icon: IconBuilding,
      url: "/protected/simple-tables"
    },
    {
      title: "Booking Categories",
      tabKey: "booking-categories",
      icon: IconCategory,
      url: "/protected/simple-tables"
    },
    {
      title: "Payment Schedule",
      tabKey: "renters-payment-schedule",
      icon: IconCalendarTime,
      url: "/protected/simple-tables"
    },
  ]

  // Helper function to build URL with tab parameter
  const buildUrl = (tabKey: string, baseUrl: string) => {
    const params = new URLSearchParams()
    params.set('tab', tabKey)
    return `${baseUrl}?${params.toString()}`
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
                pathname.includes('/protected/simple-tables') && currentTab === item.tabKey
              }
              tooltip={item.title}
            >
              <a href={buildUrl(item.tabKey, item.url)}>
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
