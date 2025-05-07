"use client"

import * as React from "react"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconFilter,
  IconGripHorizontal,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
  IconX,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnResizeMode,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { TrendingUpIcon } from "lucide-react"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"

// This schema is kept for backward compatibility
export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
})

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string | number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// Resizable header component with drag handle
function ResizableHeader({
  header,
  table,
}: {
  header: any
  table: any
}) {
  return (
    <div
      className="flex items-center justify-between h-full relative"
      style={{ width: header.getSize() }}
    >
      <div className="flex-1 overflow-hidden text-ellipsis">
        {flexRender(header.column.columnDef.header, header.getContext())}
      </div>
      {header.column.getCanResize() && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none flex items-center justify-center ${
            header.column.getIsResizing() ? "bg-primary/20 opacity-100" : "opacity-0 hover:opacity-100"
          }`}
        >
          <IconGripHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

// DataTableColumnHeader component for filter dropdown
function DataTableColumnHeader({
  column,
  title,
  table,
}: {
  column: any
  title: string
  table: any
}) {
  const [searchTerm, setSearchTerm] = React.useState("")
  
  const uniqueValues = Array.from(
    column.getFacetedUniqueValues().keys()
  ).sort() as string[]
  
  const filteredUniqueValues = uniqueValues.filter((value: string) => 
    String(value).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isFiltered = column.getFilterValue() !== undefined
  
  // Determine if all filtered values are selected
  const areAllFilteredValuesSelected = React.useMemo(() => {
    if (!isFiltered || filteredUniqueValues.length === 0) return false;
    
    const filterValue = column.getFilterValue();
    if (!Array.isArray(filterValue)) return false;
    
      return filteredUniqueValues.every((value: string) => 
        filterValue.includes(value)
      );
  }, [isFiltered, filteredUniqueValues, column]);

  // Determine if some filtered values are selected (for indeterminate state)
  const areSomeFilteredValuesSelected = React.useMemo(() => {
    if (!isFiltered || filteredUniqueValues.length === 0) return false;
    
    const filterValue = column.getFilterValue();
    if (!Array.isArray(filterValue)) return false;
    
      return filteredUniqueValues.some((value: string) => 
        filterValue.includes(value)
      ) && !areAllFilteredValuesSelected;
  }, [isFiltered, filteredUniqueValues, column, areAllFilteredValuesSelected]);

  // Handle "Select All" checkbox changes
  const handleSelectAllFiltered = (checked: boolean) => {
    if (checked) {
      // If checked, add all filtered values to the current selection
      const currentFilterValue = Array.isArray(column.getFilterValue()) 
        ? column.getFilterValue() 
        : [];
      
      // Get values that aren't in the filter yet
      const valuesToAdd = filteredUniqueValues.filter(
        (value: string) => !currentFilterValue.includes(value)
      );
      
      if (valuesToAdd.length > 0) {
        column.setFilterValue([...currentFilterValue, ...valuesToAdd]);
      }
    } else {
      // If unchecked, remove all filtered values from the current selection
      const currentFilterValue = Array.isArray(column.getFilterValue()) 
        ? column.getFilterValue() 
        : [];
      
      // Keep only values that aren't in the filtered list
      const newFilterValue = currentFilterValue.filter(
        (value: string) => !filteredUniqueValues.includes(value)
      );
      
      if (newFilterValue.length === 0) {
        column.setFilterValue(undefined);
      } else {
        column.setFilterValue(newFilterValue);
      }
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {title}
      </div>
      {column.getCanFilter() && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              aria-label={`Filter ${title}`}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-1"
            >
              <IconFilter className={isFiltered ? "text-primary" : "text-muted-foreground"} size={14} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2" align="start">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filter by {title}</h4>
                {isFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => column.setFilterValue(undefined)}
                  >
                    <IconX size={14} />
                    <span className="sr-only">Clear filter</span>
                  </Button>
                )}
              </div>
              <Separator className="my-1" />
              {/* Search input for filtering values */}
              <div className="relative mb-2">
                <Input
                  placeholder="Search values..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchTerm("")}
                  >
                    <IconX size={14} />
                    <span className="sr-only">Clear search</span>
                  </Button>
                )}
              </div>
              
              {/* Select All checkbox for filtered values */}
              {filteredUniqueValues.length > 0 && (
                <div className="flex items-center gap-2 mb-1 px-1">
                  <div className="relative flex items-center">
                    <Checkbox
                      id={`${column.id}-select-all-filtered`}
                      checked={areAllFilteredValuesSelected || areSomeFilteredValuesSelected}
                      onCheckedChange={handleSelectAllFiltered}
                    />
                    {areSomeFilteredValuesSelected && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="h-[7px] w-[7px] rounded-sm bg-primary" />
                      </div>
                    )}
                  </div>
                  <Label
                    htmlFor={`${column.id}-select-all-filtered`}
                    className="text-xs font-medium cursor-pointer"
                  >
                    Select all {filteredUniqueValues.length} {searchTerm ? "filtered" : ""} items
                  </Label>
                </div>
              )}
              
              <div className="max-h-[200px] overflow-auto flex flex-col gap-1">
                {filteredUniqueValues.length > 0 ? (
                  filteredUniqueValues.map((value) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${column.id}-${value}`}
                        checked={
                          isFiltered
                            ? Array.isArray(column.getFilterValue())
                              ? column.getFilterValue().includes(value)
                              : column.getFilterValue() === value
                            : false
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            if (isFiltered && Array.isArray(column.getFilterValue())) {
                              column.setFilterValue([
                                ...column.getFilterValue(),
                                value,
                              ])
                            } else {
                              column.setFilterValue([value])
                            }
                          } else {
                            if (
                              isFiltered &&
                              Array.isArray(column.getFilterValue())
                            ) {
                              column.setFilterValue(
                                column
                                  .getFilterValue()
                                  .filter((v: string) => v !== value)
                              )
                            } else {
                              column.setFilterValue(undefined)
                            }
                          }
                        }}
                      />
                      <Label
                        htmlFor={`${column.id}-${value}`}
                        className="text-xs font-normal cursor-pointer flex-1 truncate"
                      >
                        {value}
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    {uniqueValues.length > 0 
                      ? "No matching values found" 
                      : "No values available"}
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

// Define a custom filter function for arrays
function arrFilterFn(row: any, columnId: string, filterValue: string[]) {
  if (!filterValue || filterValue.length === 0) return true
  const value = row.getValue(columnId)
  return filterValue.includes(value)
}

// Define a custom global filter function
function globalFilterFn(row: any, columnId: string, filterValue: string) {
  // Skip filtering on certain columns
  if (columnId === 'actions' || columnId === 'select' || columnId === 'drag') {
    return true;
  }
  
  const value = row.getValue(columnId);
  
  // Handle different value types
  if (value === null || value === undefined) {
    return false;
  }
  
  // Convert to string and perform case-insensitive search
  return String(value).toLowerCase().includes(filterValue.toLowerCase());
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    size: 40,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    size: 40,
  },
  {
    accessorKey: "header",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} title="Header" table={table} />
    ),
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} titleField="header" />
    },
    enableHiding: false,
    filterFn: arrFilterFn,
    size: 250,
  },
  {
    accessorKey: "type",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} title="Section Type" table={table} />
    ),
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.type}
        </Badge>
      </div>
    ),
    filterFn: arrFilterFn,
    size: 150,
  },
  {
    accessorKey: "status",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} title="Status" table={table} />
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.status === "Done" ? (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
        ) : (
          <IconLoader />
        )}
        {row.original.status}
      </Badge>
    ),
    filterFn: arrFilterFn,
    size: 120,
  },
  {
    accessorKey: "target",
    header: ({ column, table }) => (
      <div className="flex items-center justify-end">
        <DataTableColumnHeader column={column} title="Target" table={table} />
      </div>
    ),
    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Saving ${row.original.header}`,
            success: "Done",
            error: "Error",
          })
        }}
      >
        <Label htmlFor={`${row.original.id}-target`} className="sr-only">
          Target
        </Label>
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          defaultValue={row.original.target}
          id={`${row.original.id}-target`}
        />
      </form>
    ),
    filterFn: arrFilterFn,
    size: 80,
  },
  {
    accessorKey: "limit",
    header: ({ column, table }) => (
      <div className="flex items-center justify-end">
        <DataTableColumnHeader column={column} title="Limit" table={table} />
      </div>
    ),
    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Saving ${row.original.header}`,
            success: "Done",
            error: "Error",
          })
        }}
      >
        <Label htmlFor={`${row.original.id}-limit`} className="sr-only">
          Limit
        </Label>
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          defaultValue={row.original.limit}
          id={`${row.original.id}-limit`}
        />
      </form>
    ),
    filterFn: arrFilterFn,
    size: 80,
  },
  {
    accessorKey: "reviewer",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} title="Reviewer" table={table} />
    ),
    cell: ({ row }) => {
      const isAssigned = row.original.reviewer !== "Assign reviewer"

      if (isAssigned) {
        return row.original.reviewer
      }

      return (
        <>
          <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
            Reviewer
          </Label>
          <Select>
            <SelectTrigger
              className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              id={`${row.original.id}-reviewer`}
            >
              <SelectValue placeholder="Assign reviewer" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
              <SelectItem value="Jamik Tashpulatov">
                Jamik Tashpulatov
              </SelectItem>
            </SelectContent>
          </Select>
        </>
      )
    },
    filterFn: arrFilterFn,
    size: 180,
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    size: 60,
  },
]

// Generic draggable row component
function DraggableRow<TData extends { id: string | number }>({ row }: { row: Row<TData> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
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

// Global search component
function GlobalSearch({ table }: { table: any }) {
  const globalFilter = table.getState().globalFilter || "";
  
  return (
    <div className="flex items-center relative">
      <Input
        placeholder="Search all columns..."
        value={globalFilter}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        className="max-w-sm pr-8"
      />
      {globalFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 h-6 w-6 p-0"
          onClick={() => table.setGlobalFilter("")}
        >
          <IconX size={14} />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}

// Cell renderer configuration type
export type CellConfig = {
  type: 'text' | 'badge' | 'currency' | 'date' | 'boolean' | 'link' | 'custom' | 'editable' | 'dropdown'
  options?: Record<string, any>
  editable?: boolean
  onSave?: (rowId: string, field: string, value: any) => void
}

// Column definition without render functions
export type ColumnConfig<TData> = {
  accessorKey: keyof TData & string
  header: string
  cellConfig?: CellConfig
  size?: number
  enableSorting?: boolean
  enableHiding?: boolean
  enableColumnFilter?: boolean
}

// Define a generic type for the DataTable component
export type DataTableProps<TData> = {
  data: TData[]
  columns?: ColumnConfig<TData>[]
  enableDragAndDrop?: boolean
  enableRowSelection?: boolean
  enableColumnFilters?: boolean
  enableGlobalFilter?: boolean
  enablePagination?: boolean
  enableColumnResizing?: boolean
  defaultPageSize?: number
}

export function DataTable<TData extends { id: string | number }>({
  data: initialData,
  columns: customColumns,
  enableDragAndDrop = true,
  enableRowSelection = true,
  enableColumnFilters = true,
  enableGlobalFilter = true,
  enablePagination = true,
  enableColumnResizing = true,
  defaultPageSize = 10,
}: DataTableProps<TData>) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })
  const [columnResizeMode] = React.useState<ColumnResizeMode>(enableColumnResizing ? 'onChange' : 'onEnd')
  const [columnSizing, setColumnSizing] = React.useState({})
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map((item) => item.id) || [],
    [data]
  )

  // Set default column sizes
  const defaultColumn = React.useMemo(
    () => ({
      minSize: 40,
      size: 150,
      maxSize: 500,
    }),
    []
  )

  // Editable Cell component for inline editing
function EditableCell({ 
  value: initialValue, 
  row, 
  column, 
  onSave 
}: { 
  value: any, 
  row: any, 
  column: any, 
  onSave?: (rowId: string, field: string, value: any) => void 
}) {
  const [value, setValue] = React.useState(initialValue);
  const [isEditing, setIsEditing] = React.useState(false);
  
  // Update the internal state when the value prop changes
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };
  
  const handleBlur = () => {
    setIsEditing(false);
    if (value !== initialValue && onSave) {
      onSave(row.original.id.toString(), column.id, value);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (value !== initialValue && onSave) {
        onSave(row.original.id.toString(), column.id, value);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(initialValue); // Reset to initial value
    }
  };
  
  if (isEditing) {
    return (
      <Input
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 border-transparent bg-transparent shadow-none focus-visible:border dark:bg-transparent"
      />
    );
  }
  
  return (
    <div 
      className="cursor-pointer px-1 py-1 rounded hover:bg-muted/50"
      onClick={() => setIsEditing(true)}
    >
      {value}
    </div>
  );
}

// Dropdown Cell component for selecting from a list of options
function DropdownCell({ 
  value: initialValue, 
  row, 
  column, 
  onSave,
  options = []
}: { 
  value: any, 
  row: any, 
  column: any, 
  onSave?: (rowId: string, field: string, value: any) => void,
  options: { label: string, value: string }[]
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const handleSelect = (newValue: string) => {
    if (newValue !== initialValue && onSave) {
      onSave(row.original.id.toString(), column.id, newValue);
    }
    setIsOpen(false);
  };
  
  // Find the selected option label
  const selectedOption = options.find(option => option.value === initialValue);
  const displayValue = selectedOption ? selectedOption.label : initialValue;
  
  return (
    <Select
      value={initialValue}
      onValueChange={handleSelect}
    >
      <SelectTrigger className="h-8 w-full border-transparent bg-transparent hover:bg-muted/50 focus:bg-muted/50 text-foreground">
        <SelectValue placeholder="Select option" className="text-foreground">
          {displayValue}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Cell renderer function based on configuration
  const renderCell = React.useCallback(({ row, column, value, cellConfig }: { 
    row: any, 
    column: any, 
    value: any,
    cellConfig?: CellConfig
  }) => {
    if (!cellConfig) {
      return value;
    }

    const { type, options = {}, editable, onSave } = cellConfig;
    
    // If the cell is editable, use the EditableCell component
    if (editable && type !== 'dropdown') {
      return (
        <EditableCell 
          value={value} 
          row={row} 
          column={column} 
          onSave={onSave} 
        />
      );
    }
    
    switch (type) {
      case 'text':
        return value;
      
      case 'badge':
        return (
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {value}
          </Badge>
        );
      
      case 'currency':
        return typeof value === 'number' 
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: options.currency || 'USD' }).format(value)
          : value;
      
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      
      case 'boolean':
        return value ? (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
        ) : null;
      
      case 'link':
        const titleField = options.titleField || 'name';
        return (
          <Button variant="link" className="w-fit px-0 text-left text-foreground">
            {row.original[titleField] || value}
          </Button>
        );
      
      case 'editable':
        return (
          <EditableCell 
            value={value} 
            row={row} 
            column={column} 
            onSave={onSave} 
          />
        );
      
      case 'dropdown':
        return (
          <DropdownCell 
            value={value} 
            row={row} 
            column={column} 
            onSave={onSave}
            options={options.items || []}
          />
        );
      
      default:
        return value;
    }
  }, []);

  // Store column configs in a ref to access them in cell renderers
  const columnConfigsRef = React.useRef<Map<string, ColumnConfig<TData>>>(new Map());
  
  // Convert ColumnConfig to ColumnDef
  const convertToColumnDef = React.useCallback((config: ColumnConfig<TData>): ColumnDef<TData> => {
    // Generate a unique ID for this column if not using accessorKey as ID
    const columnId = config.accessorKey as string;
    
    // Store the config in the ref for later access
    columnConfigsRef.current.set(columnId, config);
    
    const columnDef: ColumnDef<TData> = {
      accessorKey: config.accessorKey,
      header: config.header,
      size: config.size,
      enableSorting: config.enableSorting,
      enableHiding: config.enableHiding !== false,
      enableColumnFilter: config.enableColumnFilter,
      filterFn: arrFilterFn,
    };

    // Add cell renderer based on cellConfig
    if (config.cellConfig) {
      if (config.cellConfig.type === 'link') {
        // Special case for link type - use TableCellViewer
        columnDef.cell = ({ row }) => (
          <TableCellViewer 
            item={row.original} 
            titleField={config.cellConfig?.options?.titleField || config.accessorKey as string} 
          />
        );
      } else {
        // For other types, use the generic renderer
        columnDef.cell = ({ row, column }) => {
          const value = row.getValue(column.id);
          const columnConfig = columnConfigsRef.current.get(column.id);
          return renderCell({ 
            row, 
            column, 
            value, 
            cellConfig: columnConfig?.cellConfig 
          });
        };
      }
    } else {
      // Default cell renderer
      columnDef.cell = ({ row, column }) => {
        const value = row.getValue(column.id);
        return value;
      };
    }

    return columnDef;
  }, [renderCell]);

  // Use the provided columns or fall back to the default columns for backward compatibility
  const effectiveColumns = React.useMemo(() => {
    const finalColumns: ColumnDef<TData>[] = [];
    
    // Add utility columns if enabled
    if (enableDragAndDrop) {
      finalColumns.push({
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        size: 40,
      } as ColumnDef<TData>);
    }
    
    if (enableRowSelection) {
      finalColumns.push({
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        size: 40,
      } as ColumnDef<TData>);
    }
    
    // Add data columns
    if (customColumns && customColumns.length > 0) {
      // Convert ColumnConfig to ColumnDef
      const dataColumns = customColumns.map(convertToColumnDef);
      finalColumns.push(...dataColumns);
    } else {
      // For backward compatibility, use the default columns
      finalColumns.push(...(columns as unknown as ColumnDef<TData>[]));
    }
    
    return finalColumns;
  }, [customColumns, enableDragAndDrop, enableRowSelection, convertToColumnDef]);

  const table = useReactTable({
    data,
    columns: effectiveColumns,
    defaultColumn,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
      columnSizing,
    },
    columnResizeMode,
    onColumnSizingChange: setColumnSizing,
    globalFilterFn: globalFilterFn,
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    enableColumnFilters: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="past-performance">Past Performance</SelectItem>
            <SelectItem value="key-personnel">Key Personnel</SelectItem>
            <SelectItem value="focus-documents">Focus Documents</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="past-performance">
            Past Performance <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Key Personnel <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Section</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        {/* Search and filter row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GlobalSearch table={table} />
            <DataTableFilters table={table} />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table className="w-full table-fixed">
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead 
                          key={header.id} 
                          colSpan={header.colSpan}
                          style={{ width: header.getSize() }}
                          className={header.column.getCanResize() ? "relative select-none" : ""}
                        >
                          {header.isPlaceholder
                            ? null
                            : <ResizableHeader header={header} table={table} />}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig
// Generic TableCellViewer component
export function TableCellViewer<TData extends Record<string, any>>({ 
  item, 
  titleField = "header" 
}: { 
  item: TData,
  titleField?: string 
}) {
  const isMobile = useIsMobile()
  const title = item[titleField] || "Item Details"
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-left text-foreground">
          {title}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader className="gap-1">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Item Details
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 font-medium leading-none">
                  Trending up by 5.2% this month{" "}
                  <TrendingUpIcon className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing total visitors for the last 6 months. This is just
                  some random text to test the layout. It spans multiple lines
                  and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            {/* Dynamically render form fields based on the item's properties */}
            {Object.entries(item).map(([key, value]) => {
              // Skip the id field
              if (key === 'id') return null;
              
              return (
                <div key={key} className="flex flex-col gap-3">
                  <Label htmlFor={key} className="capitalize">{key}</Label>
                  <Input 
                    id={key} 
                    defaultValue={value as string} 
                  />
                </div>
              );
            })}
          </form>
        </div>
        <SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
          <Button className="w-full">Submit</Button>
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              Done
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
