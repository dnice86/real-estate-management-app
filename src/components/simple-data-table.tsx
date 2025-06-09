"use client"

import * as React from "react"
import {
  IconEye,
  IconChevronDown,
  IconLayoutColumns,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable, TableView, DataTableProps } from "@/components/data-table"

// Views dropdown component
function ViewsDropdown({ 
  views, 
  currentView, 
  onViewChange 
}: { 
  views: TableView[]
  currentView?: string
  onViewChange?: (viewId: string) => void 
}) {
  const activeView = views.find(view => view.id === currentView) || views[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <IconEye className="h-4 w-4" />
          <span className="hidden lg:inline">Views</span>
          <span className="lg:hidden">Views</span>
          <IconChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Table Views</p>
          <p className="text-xs text-muted-foreground">
            Switch between different table layouts
          </p>
        </div>
        <DropdownMenuSeparator />
        {views.map((view) => (
          <DropdownMenuItem
            key={view.id}
            onClick={() => onViewChange?.(view.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {view.icon && <view.icon className="h-4 w-4" />}
              <div>
                <p className="text-sm font-medium">{view.name}</p>
                {view.description && (
                  <p className="text-xs text-muted-foreground">{view.description}</p>
                )}
              </div>
            </div>
            {activeView.id === view.id && (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Global search component
function GlobalSearch({ table }: { table: any }) {
  const globalFilter = table.getState().globalFilter || "";
  
  return (
    <div className="flex items-center relative">
      <IconSearch className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
      <Input
        placeholder="Search all columns..."
        value={globalFilter}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        className={`w-full pl-10 pr-8 h-9 shadow-sm placeholder:text-center transition-all duration-200 focus:shadow-md ${globalFilter ? 'text-left' : 'text-center'}`}
      />
      {globalFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 h-6 w-6 p-0 z-10 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => table.setGlobalFilter("")}
        >
          <IconX size={14} />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}

// Status filter component with indicators for active filters
function DataTableFilters({ table }: { table: any }) {
  const filters = table.getState().columnFilters
  const globalFilter = table.getState().globalFilter

  // Check if any filters are active
  const hasColumnFilters = filters.length > 0
  const hasGlobalFilter = Boolean(globalFilter)
  const hasActiveFilters = hasColumnFilters || hasGlobalFilter
  
  // Calculate total number of active filters
  const totalFilters = filters.length + (hasGlobalFilter ? 1 : 0)

  return (
    <div className="flex items-center gap-2">
      {hasActiveFilters && (
        <div className="flex items-center gap-1 mr-2">
          <Badge variant="secondary" className="font-normal">
            {totalFilters} active filter{totalFilters > 1 ? 's' : ''}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => {
              table.resetColumnFilters()
              if (hasGlobalFilter) {
                table.setGlobalFilter("")
              }
            }}
          >
            <IconX size={14} className="mr-1" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

export function SimpleDataTable<TData extends { id: string | number }>({
  data,
  columns,
  views = [],
  currentView,
  onViewChange,
  ...props
}: DataTableProps<TData>) {
  return (
    <div className="w-full space-y-4">
      {/* Header with search and controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Search box */}
        <div className="flex-1 max-w-md">
          <GlobalSearch table={{ getState: () => ({ globalFilter: "" }), setGlobalFilter: () => {} }} />
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          {views.length > 0 && (
            <ViewsDropdown 
              views={views}
              currentView={currentView}
              onViewChange={onViewChange}
            />
          )}
          <Button variant="outline" size="sm">
            <IconLayoutColumns />
            <span className="hidden lg:inline">Customize Columns</span>
            <span className="lg:hidden">Columns</span>
            <IconChevronDown />
          </Button>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Section</span>
          </Button>
        </div>
      </div>
      
      {/* Filters row */}
      <div className="flex items-center justify-between">
        <DataTableFilters table={{ getState: () => ({ columnFilters: [], globalFilter: "" }), resetColumnFilters: () => {}, setGlobalFilter: () => {} }} />
      </div>

      {/* Use the original DataTable but with custom header */}
      <DataTable 
        data={data}
        columns={columns}
        {...props}
      />
    </div>
  )
}

export { ViewsDropdown, GlobalSearch, DataTableFilters }
