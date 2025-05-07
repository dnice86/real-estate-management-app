"use client"

import { toast } from "sonner"
import { DataTable, ColumnConfig } from "@/components/data-table"

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
}

export function EditableDataTable<TData extends { id: string | number }>({
  data,
  columns,
  tableName,
  ...props
}: EditableDataTableProps<TData>) {
  // Function to handle saving edited cell data
  const handleSaveCell = async (rowId: string, field: string, value: any) => {
    console.log(`Saving ${field} for row ${rowId} with value: ${value}`);
    
    // Determine the table name based on the data or use the provided tableName
    let effectiveTableName = tableName;
    
    if (!effectiveTableName) {
      // Try to infer the table name from the data structure
      if (field === 'booking_category' || field === 'payer' || field === 'amount') {
        effectiveTableName = 'bank_transactions';
      } else if (field === 'Name' || field === 'Business - Main Category' || field === 'Business - Sub Category') {
        effectiveTableName = 'booking_categories';
      } else if (field === 'name_1' || field === 'name_2' || field === 'status' || field === 'full_name') {
        effectiveTableName = 'partner';
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
      toast.success(`Updated ${field} to "${value}"`);
      
      return result.data;
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to add the onSave handler to editable columns
  function addEditableHandlers<T>(columns: ColumnConfig<T>[]): ColumnConfig<T>[] {
    return columns.map(column => {
      if (column.cellConfig?.editable) {
        return {
          ...column,
          cellConfig: {
            ...column.cellConfig,
            onSave: handleSaveCell
          }
        };
      }
      return column;
    });
  }
  
  // Add the onSave handler to editable columns
  const columnsWithHandlers = addEditableHandlers(columns);
  
  return (
    <DataTable
      data={data}
      columns={columnsWithHandlers}
      {...props}
    />
  );
}
