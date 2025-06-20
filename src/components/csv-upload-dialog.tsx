"use client"

import { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/client"
import { 
  IconUpload, 
  IconCheck, 
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconAlertCircle,
  IconInfoCircle,
  IconArrowRight
} from "@tabler/icons-react"
import Papa from 'papaparse'

interface CsvUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
  onImportComplete?: () => void
}

interface ParsedTransaction {
  description: string
  amount: number
  payer: string
  date: string
  booking_date: string
  // Additional fields that might come from CSV
  [key: string]: any
}

interface DuplicateTransaction extends ParsedTransaction {
  rowNumber: number
  originallyAdded: string
}

interface ColumnMapping {
  description: string
  amount: string
  payer: string
  date: string
  booking_date?: string
}

type Step = 'upload' | 'configure' | 'preview' | 'complete'

const STEP_CONFIG = {
  upload: { number: 1, label: 'Upload' },
  configure: { number: 2, label: 'Configure' },
  preview: { number: 3, label: 'Preview' },
  complete: { number: 4, label: 'Import' }
}

// Helper functions for parsing different formats
const parseNumber = (value: string, format: 'standard' | 'german'): number => {
  if (!value || value.trim() === '') return NaN
  
  // Remove currency symbols and spaces
  let cleanValue = value.replace(/[€$£¥]/g, '').trim()
  
  if (format === 'german') {
    // Convert German number format (1.234,56) to standard format (1234.56)
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.')
  } else {
    // Remove thousands separators in standard format
    cleanValue = cleanValue.replace(/,/g, '')
  }
  
  return parseFloat(cleanValue)
}

const parseDate = (value: string, format: string): string => {
  if (!value || value.trim() === '') return ''
  
  const cleanValue = value.trim()
  
  switch (format) {
    case 'DD.MM.YYYY':
      const germanMatch = cleanValue.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
      if (germanMatch) {
        return `${germanMatch[3]}-${germanMatch[2].padStart(2, '0')}-${germanMatch[1].padStart(2, '0')}`
      }
      break
      
    case 'DD.MM.YY':
      const germanShortMatch = cleanValue.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/)
      if (germanShortMatch) {
        const year = parseInt(germanShortMatch[3])
        const fullYear = year < 50 ? `20${germanShortMatch[3].padStart(2, '0')}` : `19${germanShortMatch[3].padStart(2, '0')}`
        return `${fullYear}-${germanShortMatch[2].padStart(2, '0')}-${germanShortMatch[1].padStart(2, '0')}`
      }
      break
      
    case 'MM/DD/YYYY':
      const usMatch = cleanValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (usMatch) {
        return `${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`
      }
      break
      
    case 'YYYY-MM-DD':
      // Already in ISO format
      return cleanValue
  }
  
  return cleanValue
}

export function CsvUploadDialog({ isOpen, onClose, tenantId, onImportComplete }: CsvUploadDialogProps) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    description: '',
    amount: '',
    payer: '',
    date: ''
  })
  const [numberFormat, setNumberFormat] = useState<'standard' | 'german'>('german')
  const [dateFormat, setDateFormat] = useState('DD.MM.YY')
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t' | 'auto'>('auto')
  const [loading, setLoading] = useState(false)
  const [validTransactions, setValidTransactions] = useState<ParsedTransaction[]>([])
  const [duplicates, setDuplicates] = useState<DuplicateTransaction[]>([])
  const [errors, setErrors] = useState<string[]>([])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setStep('upload')
      setFile(null)
      setCsvData([])
      setHeaders([])
      setColumnMapping({ description: '', amount: '', payer: '', date: '' })
      setValidTransactions([])
      setDuplicates([])
      setErrors([])
    }
  }, [isOpen])

  const handleFileUpload = (acceptedFile: File) => {
    setFile(acceptedFile)
    
    // Read file as text with proper encoding
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const content = e.target?.result as string
      
      Papa.parse(content, {
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            // Filter out empty rows
            const filteredData = results.data.filter((row: any) => 
              Object.values(row).some(val => val !== null && val !== undefined && val !== '')
            )
            
            if (filteredData.length > 0) {
              const headers = Object.keys(filteredData[0])
              setHeaders(headers)
              setCsvData(filteredData)
              
              // Auto-detect column mappings
              autoDetectColumns(headers)
              
              // Auto-detect format
              autoDetectFormats(filteredData, headers)
              
              setStep('configure')
            }
          }
        },
        header: true,
        skipEmptyLines: true,
        delimiter: delimiter === 'auto' ? undefined : delimiter,
        delimitersToGuess: [',', ';', '\t', '|']
      })
    }
    
    // Try to read with proper encoding for German characters
    reader.readAsText(acceptedFile, 'windows-1252')
  }

  const autoDetectColumns = (headers: string[]) => {
    const mapping: ColumnMapping = {
      description: '',
      amount: '',
      payer: '',
      date: ''
    }

    headers.forEach(header => {
      const lower = header.toLowerCase()
      
      // Description detection - including German terms
      if (lower.includes('beschreibung') || lower.includes('description') || 
          lower.includes('verwendung') || lower.includes('purpose') || 
          lower.includes('text') || lower.includes('memo') ||
          lower === 'verwendungszweck') {
        mapping.description = header
      }
      
      // Amount detection - including German terms
      if (lower.includes('betrag') || lower.includes('amount') || 
          lower.includes('sum') || lower.includes('value') || 
          lower.includes('umsatz') || lower.includes('summe')) {
        mapping.amount = header
      }
      
      // Payer detection - including German bank terms
      if (lower.includes('empfänger') || lower.includes('payer') || 
          lower.includes('sender') || lower.includes('from') || 
          lower.includes('auftraggeber') || lower.includes('name') ||
          lower.includes('beguenstigter') || lower.includes('zahlungspflichtiger')) {
        mapping.payer = header
      }
      
      // Date detection - including German terms
      if (lower.includes('datum') || lower.includes('date') || 
          lower.includes('buchung') || lower.includes('booking') || 
          lower.includes('valuta') || lower.includes('wert') ||
          lower === 'buchungstag') {
        mapping.date = header
      }
    })

    setColumnMapping(mapping)
  }

  const autoDetectFormats = (data: any[], headers: string[]) => {
    // Detect number format from amount column
    const amountHeader = headers.find(h => 
      h.toLowerCase().includes('betrag') || h.toLowerCase().includes('amount')
    )
    
    if (amountHeader && data.length > 0) {
      const sampleAmount = data[0][amountHeader]
      if (sampleAmount && typeof sampleAmount === 'string') {
        if (sampleAmount.includes(',') && sampleAmount.includes('.')) {
          // Check if it's German format (1.234,56) or standard (1,234.56)
          const lastComma = sampleAmount.lastIndexOf(',')
          const lastDot = sampleAmount.lastIndexOf('.')
          setNumberFormat(lastComma > lastDot ? 'german' : 'standard')
        } else if (sampleAmount.includes(',')) {
          setNumberFormat('german')
        } else {
          setNumberFormat('standard')
        }
      }
    }

    // Detect date format
    const dateHeader = headers.find(h => 
      h.toLowerCase().includes('datum') || h.toLowerCase().includes('date')
    )
    
    if (dateHeader && data.length > 0) {
      const sampleDate = data[0][dateHeader]
      if (sampleDate && typeof sampleDate === 'string') {
        if (sampleDate.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
          setDateFormat('DD.MM.YYYY')
        } else if (sampleDate.match(/^\d{1,2}\.\d{1,2}\.\d{2}$/)) {
          setDateFormat('DD.MM.YY')
        } else if (sampleDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          setDateFormat('MM/DD/YYYY')
        } else if (sampleDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          setDateFormat('YYYY-MM-DD')
        }
      }
    }
  }

  const handlePreview = async () => {
    setLoading(true)
    setErrors([])
    
    try {
      // Parse all transactions
      const parsed: ParsedTransaction[] = csvData.map((row, index) => {
        const amount = parseNumber(row[columnMapping.amount], numberFormat)
        const date = parseDate(row[columnMapping.date], dateFormat)
        
        if (isNaN(amount)) {
          setErrors(prev => [...prev, `Row ${index + 2}: Invalid amount "${row[columnMapping.amount]}"`])
        }
        
        if (!date) {
          setErrors(prev => [...prev, `Row ${index + 2}: Invalid date "${row[columnMapping.date]}"`])
        }
        
        return {
          description: row[columnMapping.description] || '',
          amount,
          payer: row[columnMapping.payer] || '',
          date,
          booking_date: date, // Use same date for booking_date if not separately mapped
          tenant_id: tenantId
        }
      }).filter(t => !isNaN(t.amount) && t.date) // Filter out invalid entries

      // Check for duplicates
      const supabase = createClient()
      const { data: existingTransactions, error } = await supabase
        .from('bank_transactions')
        .select('description, amount, payer, booking_date, created_at')
        .eq('tenant_id', tenantId)

      if (error) throw error

      const duplicatesList: DuplicateTransaction[] = []
      const validList: ParsedTransaction[] = []

      parsed.forEach((transaction, index) => {
        const isDuplicate = existingTransactions?.some(existing => 
          existing.description === transaction.description &&
          existing.amount === transaction.amount &&
          existing.payer === transaction.payer &&
          existing.booking_date === transaction.date
        )

        if (isDuplicate) {
          const existing = existingTransactions?.find(e => 
            e.description === transaction.description &&
            e.amount === transaction.amount &&
            e.payer === transaction.payer &&
            e.booking_date === transaction.date
          )
          
          duplicatesList.push({
            ...transaction,
            rowNumber: index + 2,
            originallyAdded: existing?.created_at ? new Date(existing.created_at).toLocaleDateString('de-DE') : 'Unknown'
          })
        } else {
          validList.push(transaction)
        }
      })

      setValidTransactions(validList)
      setDuplicates(duplicatesList)
      setStep('preview')
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Failed to preview data')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    
    try {
      const supabase = createClient()
      
      // Insert in batches
      const batchSize = 50
      for (let i = 0; i < validTransactions.length; i += batchSize) {
        const batch = validTransactions.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from('bank_transactions')
          .insert(batch)
        
        if (error) throw error
      }

      toast.success(`Successfully imported ${validTransactions.length} transactions`)
      setStep('complete')
      
      // Wait a moment before closing to show success state
      setTimeout(() => {
        onClose()
        onImportComplete?.()
      }, 1500)
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import transactions')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE')
  }

  const renderStepIndicator = () => {
    const steps = Object.entries(STEP_CONFIG)
    const currentStepIndex = steps.findIndex(([key]) => key === step)

    return (
      <div className="flex items-center gap-2">
        {steps.map(([key, config], index) => {
          const isCompleted = index < currentStepIndex
          const isActive = key === step

          return (
            <div key={key} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    isCompleted && "bg-green-600 text-white",
                    isActive && "bg-blue-600 text-white",
                    !isCompleted && !isActive && "bg-zinc-800 text-zinc-400"
                  )}
                >
                  {isCompleted ? <IconCheck size={14} /> : config.number}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    isActive && "text-blue-600 font-medium",
                    isCompleted && "text-green-600",
                    !isCompleted && !isActive && "text-zinc-500"
                  )}
                >
                  {config.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-12 h-px bg-zinc-700 mx-2" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-zinc-900 text-zinc-100">
        <DialogHeader className="px-6 py-5 border-b border-zinc-800">
          <div>
            <DialogTitle className="text-2xl font-semibold">Import Bank Transactions</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Upload and import your bank transaction data
            </DialogDescription>
          </div>
          <div className="mt-4">
            {renderStepIndicator()}
          </div>
        </DialogHeader>

        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div
              className="border-2 border-dashed border-zinc-700 rounded-lg p-12 text-center cursor-pointer hover:border-blue-600 hover:bg-zinc-800/50 transition-all"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
              />
              <IconUpload size={48} className="mx-auto mb-4 text-zinc-500" />
              <p className="text-lg font-medium mb-1">Drop your CSV file here or click to browse</p>
              <p className="text-sm text-zinc-500">Supported format: CSV (.csv)</p>
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 'configure' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Format Detection</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-zinc-800 border-zinc-700">
                    <div className="text-sm font-medium text-zinc-400 mb-2">Number Format</div>
                    <Select value={numberFormat} onValueChange={(v: 'standard' | 'german') => setNumberFormat(v)}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (1,234.56)</SelectItem>
                        <SelectItem value="german">German (1.234,56)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Card>

                  <Card className="p-4 bg-zinc-800 border-zinc-700">
                    <div className="text-sm font-medium text-zinc-400 mb-2">Date Format</div>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
                        <SelectItem value="DD.MM.YY">DD.MM.YY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Column Mapping</h3>
                <div className="bg-zinc-800 rounded-lg border border-zinc-700">
                  <div className="grid grid-cols-4 gap-4 p-4 border-b border-zinc-700 text-sm font-medium text-zinc-400">
                    <div>CSV Column</div>
                    <div className="text-center">→</div>
                    <div>Maps To</div>
                    <div>Format</div>
                  </div>
                  
                  {Object.entries(columnMapping).map(([field, value]) => (
                    <div key={field} className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-zinc-700/50">
                      <div>
                        <Select 
                          value={value || "_none"} 
                          onValueChange={(v) => setColumnMapping(prev => ({ ...prev, [field]: v === "_none" ? "" : v }))}
                        >
                          <SelectTrigger className="bg-zinc-900 border-zinc-700">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">None</SelectItem>
                            {headers.map(header => (
                              <SelectItem key={header} value={header}>{header}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-center text-zinc-500">
                        <IconArrowRight size={20} />
                      </div>
                      <div className="text-sm font-medium capitalize">
                        {field.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-zinc-500 font-mono">
                        {value && csvData.length > 0 && csvData[0][value]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Data Preview</h3>
                <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-auto max-h-60">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-700">
                        {headers.map(header => (
                          <TableHead key={header} className="text-zinc-400">{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 5).map((row, idx) => (
                        <TableRow key={idx} className="border-zinc-700">
                          {headers.map(header => (
                            <TableCell key={header} className="text-sm">{row[header]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Showing {Math.min(5, csvData.length)} of {csvData.length} rows
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Import Preview</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="border-green-600 text-green-600">
                      <IconCheck size={14} className="mr-1" />
                      {validTransactions.length} ready
                    </Badge>
                    {duplicates.length > 0 && (
                      <>
                        <span className="text-zinc-500">•</span>
                        <Badge variant="outline" className="border-zinc-500 text-zinc-400">
                          {duplicates.length} duplicates removed
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-zinc-400 mb-4">
                  Showing first and last transaction from your file
                </p>

                <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden mb-8">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-700">
                        <TableHead className="w-20 text-zinc-400">Position</TableHead>
                        <TableHead className="text-zinc-400">Description</TableHead>
                        <TableHead className="w-32 text-right text-zinc-400">Amount</TableHead>
                        <TableHead className="w-48 text-zinc-400">Payer</TableHead>
                        <TableHead className="w-28 text-zinc-400">Date</TableHead>
                        <TableHead className="w-28 text-zinc-400">Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validTransactions.length > 0 && (
                        <>
                          <TableRow className="border-zinc-700">
                            <TableCell className="text-green-600 font-medium">First</TableCell>
                            <TableCell>{validTransactions[0].description}</TableCell>
                            <TableCell className={cn("text-right font-mono", validTransactions[0].amount < 0 && "text-red-500")}>
                              {formatCurrency(validTransactions[0].amount)}
                            </TableCell>
                            <TableCell>{validTransactions[0].payer}</TableCell>
                            <TableCell>{formatDate(validTransactions[0].date)}</TableCell>
                            <TableCell>-</TableCell>
                          </TableRow>
                          {validTransactions.length > 1 && (
                            <TableRow className="border-zinc-700">
                              <TableCell className="text-blue-600 font-medium">Last</TableCell>
                              <TableCell>{validTransactions[validTransactions.length - 1].description}</TableCell>
                              <TableCell className={cn("text-right font-mono", validTransactions[validTransactions.length - 1].amount < 0 && "text-red-500")}>
                                {formatCurrency(validTransactions[validTransactions.length - 1].amount)}
                              </TableCell>
                              <TableCell>{validTransactions[validTransactions.length - 1].payer}</TableCell>
                              <TableCell>{formatDate(validTransactions[validTransactions.length - 1].date)}</TableCell>
                              <TableCell>-</TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {duplicates.length > 0 && (
                  <>
                    <h3 className="text-lg font-medium mb-3">Duplicate Entries Found</h3>
                    <p className="text-sm text-zinc-400 mb-4">
                      The following entries already exist in the database and will not be imported:
                    </p>

                    <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-zinc-700">
                            <TableHead className="w-20 text-zinc-400">Row #</TableHead>
                            <TableHead className="text-zinc-400">Description</TableHead>
                            <TableHead className="w-32 text-right text-zinc-400">Amount</TableHead>
                            <TableHead className="w-48 text-zinc-400">Payer</TableHead>
                            <TableHead className="w-28 text-zinc-400">Date</TableHead>
                            <TableHead className="w-32 text-zinc-400">Originally Added</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {duplicates.slice(0, 5).map((dup, idx) => (
                            <TableRow key={idx} className="border-zinc-700">
                              <TableCell className="text-red-500">{dup.rowNumber}</TableCell>
                              <TableCell>{dup.description}</TableCell>
                              <TableCell className={cn("text-right font-mono", dup.amount < 0 && "text-red-500")}>
                                {formatCurrency(dup.amount)}
                              </TableCell>
                              <TableCell>{dup.payer}</TableCell>
                              <TableCell>{formatDate(dup.date)}</TableCell>
                              <TableCell className="text-zinc-500">{dup.originallyAdded}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {duplicates.length > 5 && (
                      <p className="text-xs text-zinc-500 mt-2">
                        Showing 5 of {duplicates.length} duplicate entries
                      </p>
                    )}
                  </>
                )}

                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 flex items-center gap-2 mt-4">
                  <IconInfoCircle size={16} className="text-blue-500" />
                  <span className="text-sm text-zinc-400">
                    Duplicate detection is based on exact matches of: Description + Amount + Payer + Date
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconCheck size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-medium mb-2">Import Complete!</h3>
              <p className="text-zinc-400">
                Successfully imported {validTransactions.length} transactions
              </p>
            </div>
          )}

          {/* Error display */}
          {errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <IconAlertCircle size={20} className="text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-500 mb-1">Validation Errors</h4>
                  <ul className="text-sm text-red-400 space-y-1">
                    {errors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                  {errors.length > 5 && (
                    <p className="text-xs text-red-400 mt-2">
                      And {errors.length - 5} more errors...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-zinc-800">
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </>
          )}

          {step === 'configure' && (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('upload')}
                >
                  <IconChevronLeft size={16} className="mr-1" />
                  Previous
                </Button>
                <Button 
                  onClick={handlePreview}
                  disabled={!columnMapping.description || !columnMapping.amount || !columnMapping.payer || !columnMapping.date || loading}
                >
                  {loading ? 'Processing...' : 'Preview Import'}
                  <IconChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('configure')}
                >
                  <IconChevronLeft size={16} className="mr-1" />
                  Previous
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={validTransactions.length === 0 || loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Importing...' : `Import ${validTransactions.length} Transactions`}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
