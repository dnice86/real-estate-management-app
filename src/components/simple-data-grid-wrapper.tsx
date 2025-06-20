"use client"

import { SimpleDataGrid, SimpleColumn } from "@/components/simple-data-grid"

interface SimpleDataGridWrapperProps {
  data: any[]
  columns: SimpleColumn[]
  tableName?: string
  searchable?: boolean
  paginated?: boolean
  selectable?: boolean
  pageSize?: number
  options?: {
    partners?: any[]
    properties?: any[]
    bookingCategories?: any[]
  }
  tenantId: string
}

export function SimpleDataGridWrapper({
  data,
  columns,
  tableName,
  searchable = true,
  paginated = true,
  selectable = false,
  pageSize = 25,
  options = {},
  tenantId
}: SimpleDataGridWrapperProps) {
  // Ensure tenantId is passed correctly to the SimpleDataGrid
  console.log('SimpleDataGridWrapper - tenantId:', tenantId)
  
  const handleRefresh = () => {
    // Use replace instead of reload to avoid history pollution
    // This maintains a cleaner browser history
    window.location.replace(window.location.href)
  }
  
  return (
    <SimpleDataGrid
      data={data}
      columns={columns}
      tableName={tableName}
      searchable={searchable}
      paginated={paginated}
      selectable={selectable}
      pageSize={pageSize}
      options={options}
      tenantId={tenantId}
      onRefresh={handleRefresh}
    />
  )
}
