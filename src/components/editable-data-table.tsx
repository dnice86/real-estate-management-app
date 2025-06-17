"use client"

import { useState, useEffect } from 'react'
import { toast } from "sonner"
import { DataTable, ColumnConfig } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconEye,
  IconChevronDown,
  IconCircleCheckFilled,
  IconTable,
  IconList,
  IconGrid3x3,
  IconChartBar,
} from "@tabler/icons-react"
import * as React from "react"

// Table view definitions
export type TableView = {
  id: string
  name: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

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
              <IconCircleCheckFilled className="h-4 w-4 fill-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface EditableDataTableProps<TData> {
  data: TData[];
  columns: ColumnConfig<TData>[];
  tableName?: string; // Name of the Supabase table
  enableDragAndDrop?: boolean;
  enableRowSelection?: boolean;
  enableColumnFilters?: boolean;
  enableGlobalFilter?: boolean;
  enablePagination?: boolean;
  enableColumnResizing?: boolean;
  defaultPageSize?: number;
  // Additional props for monthly summary
  bookingCategories?: any[];
  partners?: any[];
  // Views functionality
  views?: TableView[];
  currentView?: string;
  onViewChange?: (viewId: string) => void;
}

export function EditableDataTable<TData extends { id: string | number }>({
  data,
  columns,
  tableName,
  bookingCategories = [],
  partners = [],
  views = [],
  currentView,
  onViewChange,
  ...props
}: EditableDataTableProps<TData>) {
  // State for dynamic dropdown options
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>({
    tenants: [],
    business_partners: [],
    properties: [],
    booking_categories: [],
    combined_partners: []
  })
  const [optionsLoading, setOptionsLoading] = useState(true)

  // Fetch dropdown options on component mount
  useEffect(() => {
    async function fetchDropdownOptions() {
      try {
        setOptionsLoading(true)
        
        const [
          tenantsRes,
          businessPartnersRes,
          propertiesRes,
          bookingCategoriesRes,
          combinedPartnersRes
        ] = await Promise.all([
          fetch('/api/dropdown-options?type=tenants'),
          fetch('/api/dropdown-options?type=business_partners'),
          fetch('/api/dropdown-options?type=properties'),
          fetch('/api/dropdown-options?type=booking_categories'),
          fetch('/api/dropdown-options?type=combined_partners')
        ])

        const [
          tenantsData,
          businessPartnersData,
          propertiesData,
          bookingCategoriesData,
          combinedPartnersData
        ] = await Promise.all([
          tenantsRes.json(),
          businessPartnersRes.json(),
          propertiesRes.json(),
          bookingCategoriesRes.json(),
          combinedPartnersRes.json()
        ])

        setDropdownOptions({
          tenants: tenantsData.data || [],
          business_partners: businessPartnersData.data || [],
          properties: propertiesData.data || [],
          booking_categories: bookingCategoriesData.data || [],
          combined_partners: combinedPartnersData.data || []
        })
      } catch (error) {
        console.error('Error fetching dropdown options:', error)
        toast.error('Failed to load dropdown options')
      } finally {
        setOptionsLoading(false)
      }
    }

    fetchDropdownOptions()
  }, [])

  // Function to handle saving edited cell data with enhanced foreign key support
  const handleSaveCell = async (rowId: string, field: string, value: any) => {
    console.log(`Saving ${field} for row ${rowId} with value: ${value}`);
    
    // Determine the table name based on the data or use the provided tableName
    let effectiveTableName = tableName;
    
    if (!effectiveTableName) {
      // Try to infer the table name from the data structure
      if (field === 'booking_category' || field === 'payer' || field === 'amount' || field === 'partner_selection') {
        effectiveTableName = 'bank_transactions';
      } else if (field === 'Name' || field === 'Business - Main Category' || field === 'Business - Sub Category') {
        effectiveTableName = 'booking_categories';
      } else if (field === 'name_1' || field === 'name_2' || field === 'status' || field === 'full_name') {
        effectiveTableName = 'tenants';
      } else if (field === 'business_type' || field === 'contact_email') {
        effectiveTableName = 'business_partners';
      } else {
        // Default fallback
        effectiveTableName = 'bank_transactions';
      }
    }
    
    try {
      // Make API call to update the data
      const response = await fetch('/api/update-table-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: effectiveTableName,
          id: rowId,
          field,
          value,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update data');
      }
      
      // Show a success toast notification
      if (field === 'partner_selection') {
        const partnerData = JSON.parse(value)
        toast.success(`Updated partner to ${partnerData.partnerType}`)
      } else {
        toast.success(`Updated ${field} to "${value}"`)
      }
      
      return result.data;
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to add the onSave handler to editable columns with enhanced options
  function addEditableHandlers<T>(columns: ColumnConfig<T>[]): ColumnConfig<T>[] {
    return columns.map(column => {
      if (column.cellConfig?.editable) {
        // Enhanced column configuration with dynamic options
        let enhancedCellConfig = {
          ...column.cellConfig,
          onSave: handleSaveCell
        };

        // Update dropdown options for specific fields
        if (column.cellConfig.type === 'dropdown') {
          const accessorKey = column.accessorKey as string;
          
          if (accessorKey === 'booking_category') {
            enhancedCellConfig.options = {
              ...enhancedCellConfig.options,
              items: dropdownOptions.booking_categories
            };
          } else if (accessorKey === 'partner_selection') {
            enhancedCellConfig.options = {
              ...enhancedCellConfig.options,
              items: dropdownOptions.combined_partners
            };
          } else if (accessorKey === 'property') {
            enhancedCellConfig.options = {
              ...enhancedCellConfig.options,
              items: dropdownOptions.properties
            };
          }
        }

        return {
          ...column,
          cellConfig: enhancedCellConfig
        };
      }
      return column;
    });
  }
  
  // Add the onSave handler to editable columns
  const columnsWithHandlers = addEditableHandlers(columns);
  
  // Get default views based on table type if none provided
  const defaultViews: TableView[] = React.useMemo(() => {
    if (views.length > 0) return views;
    
    const tableType = tableName || 'default';
    
    switch (tableType) {
      case 'bank_transactions':
        return [
          { id: 'table', name: 'Table View', description: 'Standard table layout', icon: IconTable },
          { id: 'list', name: 'List View', description: 'Compact list layout', icon: IconList },
          { id: 'monthly', name: 'Monthly View', description: 'Monthly summary layout', icon: IconChartBar },
        ];
      case 'booking_categories':
        return [
          { id: 'table', name: 'Table View', description: 'Standard table layout', icon: IconTable },
          { id: 'grid', name: 'Grid View', description: 'Card-based grid layout', icon: IconGrid3x3 },
        ];
      case 'tenants':
      case 'business_partners':
        return [
          { id: 'table', name: 'Table View', description: 'Standard table layout', icon: IconTable },
          { id: 'list', name: 'List View', description: 'Compact list layout', icon: IconList },
          { id: 'grid', name: 'Grid View', description: 'Card-based grid layout', icon: IconGrid3x3 },
        ];
      default:
        return [
          { id: 'table', name: 'Table View', description: 'Standard table layout', icon: IconTable },
        ];
    }
  }, [views, tableName]);
  
  if (optionsLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading dropdown options...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Enhanced foreign key notice for bank transactions */}
      {tableName === 'bank_transactions' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Enhanced Data Integrity</p>
              <p className="text-sm">Partner and Property dropdowns now use foreign key constraints to ensure data consistency.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Data table */}
      <DataTable
        data={data}
        columns={columnsWithHandlers}
        enableDragAndDrop={props.enableDragAndDrop}
        enableRowSelection={props.enableRowSelection}
        enableColumnFilters={props.enableColumnFilters}
        enableGlobalFilter={props.enableGlobalFilter}
        enablePagination={props.enablePagination}
        enableColumnResizing={props.enableColumnResizing}
        defaultPageSize={props.defaultPageSize}
      />
    </div>
  );
}
