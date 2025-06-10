"use client"

import * as React from "react"
import { ChevronsUpDown, Building, Building2, Loader2 } from "lucide-react"
import { useCompany } from "@/components/company-context"
import { useSearchParams, usePathname } from 'next/navigation'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function CompanySwitcher() {
  const { isMobile } = useSidebar()
  const { currentCompany, companies, switchCompany, loading } = useCompany()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [switching, setSwitching] = React.useState(false)

  const handleCompanySwitch = async (company: any) => {
    if (switching || company.id === currentCompany?.id) return
    
    setSwitching(true)
    
    try {
      // Update the company context
      switchCompany(company)
      
      // Build new URL with updated tenant parameter
      const current = new URLSearchParams(Array.from(searchParams.entries()))
      current.set('tenant', company.id)
      
      const search = current.toString()
      const newUrl = `${pathname}?${search}`
      
      // Use window.location.href for a full page reload to ensure server component re-renders
      window.location.href = newUrl
    } catch (error) {
      console.error('Error switching company:', error)
      setSwitching(false)
    }
  }

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Building className="size-4" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading...</span>
              <span className="truncate text-xs">Please wait</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!currentCompany) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Building className="size-4" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">No Companies</span>
              <span className="truncate text-xs">Contact admin</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={switching}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {switching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : currentCompany.plan_type === 'enterprise' ? (
                  <Building2 className="size-4" />
                ) : (
                  <Building className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {switching ? 'Switching...' : currentCompany.name}
                </span>
                <span className="truncate text-xs capitalize">
                  {switching ? 'Please wait' : `${currentCompany.plan_type} • ${currentCompany.role}`}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Your Companies
            </DropdownMenuLabel>
            {companies.map((company, index) => (
              <DropdownMenuItem
                key={company.id}
                onClick={() => handleCompanySwitch(company)}
                disabled={switching || company.id === currentCompany?.id}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  {company.plan_type === 'enterprise' ? (
                    <Building2 className="size-3.5 shrink-0" />
                  ) : (
                    <Building className="size-3.5 shrink-0" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{company.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {company.plan_type} • {company.role}
                  </span>
                </div>
                {company.id === currentCompany?.id && (
                  <div className="ml-auto text-primary">✓</div>
                )}
                {company.id !== currentCompany?.id && (
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
