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
  const currentTab = searchParams.get('tab') || 'booking-categories'
  const currentTenant = searchParams.get('tenant') // Get the current tenant ID

  const tableItems = [
    {
      title: "Booking Categories",
      tabKey: "booking-categories",
      icon: IconCategory,
      url: "/protected/real-estate-tables"
    },
    {
      title: "Bank Transactions", 
      tabKey: "bank-transactions",
      icon: IconCreditCard,
      url: "/protected/real-estate-tables"
    },
    {
      title: "Tenants",
      tabKey: "tenants",
      icon: IconUsers,
      url: "/protected/real-estate-tables"
    },
    {
      title: "Business Partners",
      tabKey: "business-partners",
      icon: IconBuilding,
      url: "/protected/real-estate-tables"
    },
    {
      title: "Tenant Rent Milestones",
      tabKey: "tenant-rent-milestones",
      icon: IconCalendarTime,
      url: "/protected/real-estate-tables"
    },
  ]

  const simplifiedItems = [
    {
      title: "Simple Bank Transactions",
      tabKey: "bank-transactions",
      icon: IconCreditCard,
      url: "/protected/simple-tables"
    },
    {
      title: "Simple Renters",
      tabKey: "renters",
      icon: IconUsers,
      url: "/protected/simple-tables"
    },
    {
      title: "Simple Business Partners",
      tabKey: "business-partners",
      icon: IconBuilding,
      url: "/protected/simple-tables"
    },
    {
      title: "Simple Categories",
      tabKey: "booking-categories",
      icon: IconCategory,
      url: "/protected/simple-tables"
    },
    {
      title: "Simple Payment Schedule",
      tabKey: "renters-payment-schedule",
      icon: IconCalendarTime,
      url: "/protected/simple-tables"
    },
  ]

  // Helper function to build URL with preserved tenant parameter
  const buildUrl = (tabKey: string, baseUrl: string) => {
    const params = new URLSearchParams()
    params.set('tab', tabKey)
    if (currentTenant) {
      params.set('tenant', currentTenant)
    }
    return `${baseUrl}?${params.toString()}`
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Complex Tables</SidebarGroupLabel>
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
                <a href={buildUrl(item.tabKey, item.url)}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
      
      <SidebarGroup>
        <SidebarGroupLabel>Simplified Tables</SidebarGroupLabel>
        <SidebarMenu>
          {simplifiedItems.map((item) => (
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
    </>
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
