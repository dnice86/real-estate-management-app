'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useDropzone } from 'react-dropzone'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/client'
import { Loader2, Upload, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface CsvRow {
  [key: string]: string
}

interface MappedData {
  amount: number
  payer: string
  description: string
  date: string
}

interface ColumnMapping {
  amount: string
  payer: string
  description: string
  date: string
}

interface FormatOptions {
  numberFormat: 'standard' | 'german'
  dateFormat: 'iso' | 'german' | 'german-short' | 'us'
}

// Helper functions for parsing different formats
const parseNumber = (value: string, format: 'standard' | 'german'): number => {
  if (!value || value.trim() === '') return NaN;
  
  if (format === 'german') {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  }
  
  return parseFloat(value);
};

const parseDate = (value: string, format: 'iso' | 'german' | 'german-short' | 'us'): string => {
  if (!value || value.trim() === '') return '';
  
  if (format === 'german') {
    const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
      return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    }
  } else if (format === 'german-short') {
    const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/);
    if (match) {
      const year = parseInt(match[3]);
      const fullYear = year < 50 ? `20${match[3].padStart(2, '0')}` : `19${match[3].padStart(2, '0')}`;
      return `${fullYear}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    }
  } else if (format === 'us') {
    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    }
  }
  
  return value;
};

export function CsvUploadBankTransactions() {
  const [isOpen, setIsOpen] = useState(false)
  const [csvData, setCsvData] = useState<CsvRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    amount: '',
    payer: '',
    description: '',
    date: ''
  })
  const [formatOptions, setFormatOptions] = useState<FormatOptions>({
    numberFormat: 'german',
    dateFormat: 'german-short'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadStep, setUploadStep] = useState<'upload' | 'mapping'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Function to parse CSV
  const parseCsv = (text: string) => {
    const lines = text.split('\n')
    if (lines.length === 0) return { headers: [], data: [] }
    
    const headers = lines[0].split(',').map(header => header.trim())
    
    const data = lines.slice(1).filter(line => line.trim() !== '').map(line => {
      const values = line.split(',').map(value => value.trim())
      const row: CsvRow = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      return row
    })
    
    return { headers, data }
  }

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setError(null)
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const { headers, data } = parseCsv(text)
        
        if (headers.length === 0 || data.length === 0) {
          setError('Invalid CSV format or empty file')
          return
        }
        
        setHeaders(headers)
        setCsvData(data)
        setUploadStep('mapping')
        
        // Auto-map columns based on header names
        const mapping: ColumnMapping = {
          amount: '',
          payer: '',
          description: '',
          date: ''
        }
        
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase()
          if (lowerHeader.includes('amount') || lowerHeader.includes('sum') || lowerHeader.includes('value')) {
            mapping.amount = header
          } else if (lowerHeader.includes('payer') || lowerHeader.includes('from') || lowerHeader.includes('sender')) {
            mapping.payer = header
          } else if (lowerHeader.includes('desc') || lowerHeader.includes('note') || lowerHeader.includes('memo')) {
            mapping.description = header
          } else if (lowerHeader.includes('date') || lowerHeader.includes('time')) {
            mapping.date = header
          }
        })
        
        setColumnMapping(mapping)
      } catch (err) {
        setError('Failed to parse CSV file')
        console.error(err)
      }
    }
    
    reader.onerror = () => {
      setError('Failed to read file')
    }
    
    reader.readAsText(file)
  }

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileSelect(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.csv']
    },
    maxFiles: 1,
    noClick: true
  })

  // Handle column mapping change
  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Check if all required fields are mapped
  const isMappingComplete = () => {
    return Object.values(columnMapping).every(value => value !== '' && value !== '_none_')
  }

  // Process and submit data
  const handleSubmit = async () => {
    if (!isMappingComplete()) {
      setError('Please map all required fields')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const mappedData: MappedData[] = csvData.map(row => {
        const amount = parseNumber(row[columnMapping.amount], formatOptions.numberFormat);
        const dateStr = parseDate(row[columnMapping.date], formatOptions.dateFormat);
        
        return {
          amount,
          payer: row[columnMapping.payer],
          description: row[columnMapping.description],
          date: dateStr
        };
      });
      
      const invalidRows = mappedData.filter(row => 
        isNaN(row.amount) || 
        !row.payer || 
        !row.description || 
        !row.date
      )
      
      if (invalidRows.length > 0) {
        setError(`Found ${invalidRows.length} invalid rows. Please check your data and mapping.`)
        setLoading(false)
        return
      }
      
      const supabase = createClient()
      
      const batchSize = 50
      const batches = []
      
      for (let i = 0; i < mappedData.length; i += batchSize) {
        batches.push(mappedData.slice(i, i + batchSize))
      }
      
      for (const batch of batches) {
        const { error } = await supabase
          .from('bank_transactions')
          .insert(batch)
        
        if (error) throw error
      }
      
      toast.success(`Successfully imported ${csvData.length} bank transactions`)
      handleReset()
      setIsOpen(false)
      
      // Refresh the page to show new data
      window.location.reload()
    } catch (err) {
      console.error(err)
      setError('Failed to import data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Reset the form
  const handleReset = () => {
    setCsvData([])
    setHeaders([])
    setColumnMapping({
      amount: '',
      payer: '',
      description: '',
      date: ''
    })
    setError(null)
    setUploadStep('upload')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      handleReset()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Bank Transactions</DialogTitle>
          <DialogDescription>
            Upload a CSV file and map the columns to import bank transactions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {uploadStep === 'upload' && (
            <div>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-y-2">
                  <Upload size={32} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Drop your CSV file here</p>
                    <p className="text-xs text-muted-foreground">or</p>
                  </div>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {uploadStep === 'mapping' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/20 rounded-lg border">
                <h3 className="text-sm font-medium mb-3">Data Format Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="number-format">Number Format</Label>
                    <Select 
                      value={formatOptions.numberFormat} 
                      onValueChange={(value: 'standard' | 'german') => 
                        setFormatOptions(prev => ({ ...prev, numberFormat: value }))
                      }
                    >
                      <SelectTrigger id="number-format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (1234.56)</SelectItem>
                        <SelectItem value="german">German (1.234,56)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select 
                      value={formatOptions.dateFormat} 
                      onValueChange={(value: 'iso' | 'german' | 'german-short' | 'us') => 
                        setFormatOptions(prev => ({ ...prev, dateFormat: value }))
                      }
                    >
                      <SelectTrigger id="date-format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iso">ISO (YYYY-MM-DD)</SelectItem>
                        <SelectItem value="german">German (DD.MM.YYYY)</SelectItem>
                        <SelectItem value="german-short">German (DD.MM.YY)</SelectItem>
                        <SelectItem value="us">US (MM/DD/YYYY)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount-mapping">Amount</Label>
                  <Select 
                    value={columnMapping.amount} 
                    onValueChange={(value) => handleMappingChange('amount', value)}
                  >
                    <SelectTrigger id="amount-mapping">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none_">Select column</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="payer-mapping">Payer</Label>
                  <Select 
                    value={columnMapping.payer} 
                    onValueChange={(value) => handleMappingChange('payer', value)}
                  >
                    <SelectTrigger id="payer-mapping">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none_">Select column</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="description-mapping">Description</Label>
                  <Select 
                    value={columnMapping.description} 
                    onValueChange={(value) => handleMappingChange('description', value)}
                  >
                    <SelectTrigger id="description-mapping">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none_">Select column</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date-mapping">Date</Label>
                  <Select 
                    value={columnMapping.date} 
                    onValueChange={(value) => handleMappingChange('date', value)}
                  >
                    <SelectTrigger id="date-mapping">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none_">Select column</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">CSV Data Preview</h3>
                <div className="border rounded-lg overflow-auto max-h-40">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map(header => (
                          <TableHead key={header} className="text-xs">{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 3).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {headers.map(header => (
                            <TableCell key={`${rowIndex}-${header}`} className="text-xs">{row[header]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Showing {Math.min(3, csvData.length)} of {csvData.length} rows
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert className="bg-red-50 border-red-200 text-red-800">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {uploadStep === 'mapping' && (
              <Button variant="outline" onClick={() => setUploadStep('upload')}>
                Back
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            
            {uploadStep === 'mapping' && (
              <Button 
                onClick={handleSubmit} 
                disabled={!isMappingComplete() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Data'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
