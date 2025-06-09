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

  const tableItems = [
    {
      title: "Booking Categories",
      url: "/protected/real-estate-tables?tab=booking-categories",
      icon: IconCategory,
      tabKey: "booking-categories",
    },
    {
      title: "Bank Transactions", 
      url: "/protected/real-estate-tables?tab=bank-transactions",
      icon: IconCreditCard,
      tabKey: "bank-transactions",
    },
    {
      title: "Tenants",
      url: "/protected/real-estate-tables?tab=tenants", 
      icon: IconUsers,
      tabKey: "tenants",
    },
    {
      title: "Business Partners",
      url: "/protected/real-estate-tables?tab=business-partners", 
      icon: IconBuilding,
      tabKey: "business-partners",
    },
  ]

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
              <a href={item.url}>
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
