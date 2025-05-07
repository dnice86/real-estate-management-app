"use client"

import { toast } from "sonner"
import { DataTable, ColumnConfig } from "@/components/data-table"

// Function to handle saving edited cell data
const handleSaveCell = (rowId: string, field: string, value: any) => {
  console.log(`Saving ${field} for row ${rowId} with value: ${value}`);
  // In a real application, you would make an API call to update the data
  // For example:
  // supabase.from('bank_transactions').update({ [field]: value }).eq('id', rowId)
  
  // Show a toast notification
  toast.success(`Updated ${field} to "${value}"`);
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

interface EditableDataTableProps<TData> {
  data: TData[];
  columns: ColumnConfig<TData>[];
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
  ...props
}: EditableDataTableProps<TData>) {
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
