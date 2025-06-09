"use client"

import * as React from "react"
import { ChevronsUpDown, Building, Building2 } from "lucide-react"
import { useCompany } from "@/components/company-context"

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
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {currentCompany.plan_type === 'enterprise' ? (
                  <Building2 className="size-4" />
                ) : (
                  <Building className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{currentCompany.name}</span>
                <span className="truncate text-xs capitalize">
                  {currentCompany.plan_type} • {currentCompany.role}
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
                onClick={() => switchCompany(company)}
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
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
