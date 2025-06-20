"use client"

import { useState, useEffect } from 'react'
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconX,
  IconEdit,
  IconCheck,
} from "@tabler/icons-react"
import { CsvUploadButton } from "./csv-upload-button"

// Simple column configuration
export interface SimpleColumn {
  key: string
  label: string
  type?: 'text' | 'number' | 'date' | 'currency' | 'select'
  editable?: boolean
  options?: Array<{ label: string; value: string }>
  width?: string
  sortable?: boolean
}

interface SimpleDataGridProps {
  data: any[]
  columns: SimpleColumn[]
  tableName?: string
  onUpdate?: (id: string, field: string, value: any) => Promise<void>
  onRefresh?: () => void
  searchable?: boolean
  paginated?: boolean
  selectable?: boolean
  pageSize?: number
  options?: {
    partners?: any[]
    properties?: any[]
    bookingCategories?: any[]
  }
  tenantId?: string
}

export function SimpleDataGrid({
  data,
  columns,
  tableName,
  onUpdate,
  onRefresh,
  searchable = true,
  paginated = true,
  selectable = false,
  pageSize = 25,
  options = {},
  tenantId
}: SimpleDataGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')

  // Convert options to the format expected by the component
  const getOptionsForColumn = (column: SimpleColumn) => {
    if (column.options) {
      return column.options
    }

    if (column.key === 'partner_selection' && options.partners) {
      return options.partners.map((item: any) => ({
        label: item.display_label,
        value: JSON.stringify(item.value)
      }))
    }
    
    if (column.key === 'property_ref' && options.properties) {
      return options.properties.map((item: any) => ({
        label: item.display_label,
        value: item.id
      }))
    }
    
    if (column.key === 'booking_category' && options.bookingCategories) {
      return options.bookingCategories.map((item: any) => ({
        label: item.name,
        value: item.name
      }))
    }

    return []
  }

  // Filter data based on search term
  const filteredData = searchTerm
    ? data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data

  // Sort data
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        
        if (aVal === bVal) return 0
        
        let comparison = 0
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime()
        } else {
          comparison = String(aVal).localeCompare(String(bVal))
        }
        
        return sortDirection === 'asc' ? comparison : -comparison
      })
    : filteredData

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = paginated
    ? sortedData.slice(startIndex, startIndex + pageSize)
    : sortedData

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  // Handle cell editing
  const handleCellEdit = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field })
    setEditValue(String(currentValue || ''))
  }

  const handleCellSave = async () => {
    if (!editingCell) return

    try {
      // Call the simplified update API
      const response = await fetch('/api/database/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: tableName,
          id: editingCell.id,
          field: editingCell.field,
          value: editValue,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Update failed')
      }

      toast.success('Updated successfully')
      onRefresh?.()
    } catch (error) {
      toast.error('Failed to update')
      console.error('Update error:', error)
    }

    setEditingCell(null)
    setEditValue('')
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  // Handle row selection
  const handleRowSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRows(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(row => row.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  // Render cell content
  const renderCell = (row: any, column: SimpleColumn) => {
    const value = row[column.key]
    const isEditing = editingCell?.id === row.id && editingCell?.field === column.key

    if (isEditing) {
      if (column.type === 'select') {
        const columnOptions = getOptionsForColumn(column)
        return (
          <div className="flex items-center gap-1">
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columnOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCellSave}>
              <IconCheck size={12} />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCellCancel}>
              <IconX size={12} />
            </Button>
          </div>
        )
      } else {
        return (
          <div className="flex items-center gap-1">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCellSave()
                if (e.key === 'Escape') handleCellCancel()
              }}
              className="h-7 text-xs"
              type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
              autoFocus
            />
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCellSave}>
              <IconCheck size={12} />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCellCancel}>
              <IconX size={12} />
            </Button>
          </div>
        )
      }
    }

    // Display value based on type
    let displayValue = value
    if (column.type === 'currency' && typeof value === 'number') {
      displayValue = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
      }).format(value)
    } else if (column.type === 'date' && value) {
      displayValue = new Date(value).toLocaleDateString('de-DE')
    } else if (column.type === 'select') {
      const columnOptions = getOptionsForColumn(column)
      const option = columnOptions.find(opt => opt.value === value)
      displayValue = option ? option.label : value
    }

    return (
      <div className="flex items-center justify-between group">
        <span className="text-xs truncate flex-1">{displayValue}</span>
        {column.editable && (
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 ml-1"
            onClick={() => handleCellEdit(row.id, column.key, value)}
          >
            <IconEdit size={10} />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and controls */}
      {searchable && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0"
                onClick={() => setSearchTerm('')}
              >
                <IconX size={12} />
              </Button>
            )}
          </div>
          
          {tableName === 'bank_transactions' && (
            <CsvUploadButton tenantId={tenantId || ''} onImportComplete={onRefresh} />
          )}
          
          {selectedRows.size > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedRows.size} row(s) selected
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`${column.width || ''} ${column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {sortColumn === column.key && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow
                  key={row.id}
                  className={selectedRows.has(row.id) ? "bg-muted/50" : ""}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(row.id)}
                        onCheckedChange={(checked) => handleRowSelect(row.id, checked as boolean)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key} className={`${column.width || ''} px-2 py-1`}>
                      {renderCell(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <IconChevronLeft size={16} />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <IconChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
