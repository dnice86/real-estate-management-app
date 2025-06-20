'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone'
import { useDropzone } from 'react-dropzone'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/client'

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

// Format options for different locales
interface FormatOptions {
  numberFormat: 'standard' | 'german'
  dateFormat: 'iso' | 'german' | 'german-short' | 'us'
}

// Helper functions for parsing different formats
const parseNumber = (value: string, format: 'standard' | 'german'): number => {
  if (!value || value.trim() === '') return NaN;
  
  if (format === 'german') {
    // Convert German number format (1.234,56) to standard format (1234.56)
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  }
  
  // Standard format
  return parseFloat(value);
};

const parseDate = (value: string, format: 'iso' | 'german' | 'german-short' | 'us'): string => {
  if (!value || value.trim() === '') return '';
  
  if (format === 'german') {
    // Parse German date format (DD.MM.YYYY)
    const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
      // Convert to ISO format (YYYY-MM-DD)
      return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    }
  } else if (format === 'german-short') {
    // Parse German date format with 2-digit year (DD.MM.YY)
    const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/);
    if (match) {
      // Convert to ISO format (YYYY-MM-DD) assuming 20YY for years
      const year = parseInt(match[3]);
      const fullYear = year < 50 ? `20${match[3].padStart(2, '0')}` : `19${match[3].padStart(2, '0')}`;
      return `${fullYear}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    }
  } else if (format === 'us') {
    // Parse US date format (MM/DD/YYYY)
    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      // Convert to ISO format (YYYY-MM-DD)
      return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    }
  }
  
  // For ISO format or if parsing fails, return as is
  return value;
};

export function CsvUploadBankTransactions() {
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
  const [success, setSuccess] = useState(false)
  const [uploadStep, setUploadStep] = useState<'upload' | 'mapping' | 'complete'>('upload')

  // Function to parse CSV
  const parseCsv = (text: string) => {
    const lines = text.split('\n')
    if (lines.length === 0) return { headers: [], data: [] }
    
    // Extract headers from the first line
    const headers = lines[0].split(',').map(header => header.trim())
    
    // Parse data rows
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

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null)
    setSuccess(false)
    
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0]
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
        
        // Try to auto-map columns based on header names
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
  }, [])

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.csv']
    },
    maxFiles: 1
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
      // Map CSV data to the required format using the selected format options
      const mappedData: MappedData[] = csvData.map(row => {
        // Parse amount using the selected number format
        const amount = parseNumber(row[columnMapping.amount], formatOptions.numberFormat);
        
        // Parse date using the selected date format
        const dateStr = parseDate(row[columnMapping.date], formatOptions.dateFormat);
        
        return {
          amount,
          payer: row[columnMapping.payer],
          description: row[columnMapping.description],
          date: dateStr
        };
      });
      
      // Validate data
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
      
      // Submit data to API
      const supabase = createClient()
      
      // Insert data in batches to avoid hitting API limits
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
      
      setSuccess(true)
      setUploadStep('complete')
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
    setSuccess(false)
    setUploadStep('upload')
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import Bank Transactions</CardTitle>
        <CardDescription>
          Upload a CSV file and map the columns to import bank transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {uploadStep === 'upload' && (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <div {...getRootProps()} className="cursor-pointer">
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-y-2">
                <Upload size={20} className="text-muted-foreground" />
                <p className="text-sm">Upload CSV file</p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop or click to select a CSV file
                </p>
              </div>
            </div>
          </div>
        )}

        {uploadStep === 'mapping' && (
          <div className="space-y-6">
            <div className="mb-6 p-4 bg-muted/20 rounded-lg border">
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
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium mb-2">CSV Data Preview</h3>
              <div className="border rounded-lg overflow-auto max-h-60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map(header => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 5).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {headers.map(header => (
                          <TableCell key={`${rowIndex}-${header}`}>{row[header]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Showing {Math.min(5, csvData.length)} of {csvData.length} rows
              </p>
            </div>
            
            {isMappingComplete() && (
              <div className="mt-6 p-4 bg-green-50/50 border border-green-100 rounded-lg">
                <h3 className="text-sm font-medium mb-3">Parsed Data Preview</h3>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs font-medium">Amount Column</p>
                    <div className="mt-1 p-2 bg-white rounded border text-sm">
                      {columnMapping.amount && csvData.length > 0 ? (
                        <div>
                          <p className="text-xs text-muted-foreground">Original: <span className="font-mono">{csvData[0][columnMapping.amount]}</span></p>
                          <p className="text-xs text-muted-foreground">Parsed: <span className="font-mono font-medium">{parseNumber(csvData[0][columnMapping.amount], formatOptions.numberFormat)}</span></p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No data to preview</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium">Date Column</p>
                    <div className="mt-1 p-2 bg-white rounded border text-sm">
                      {columnMapping.date && csvData.length > 0 ? (
                        <div>
                          <p className="text-xs text-muted-foreground">Original: <span className="font-mono">{csvData[0][columnMapping.date]}</span></p>
                          <p className="text-xs text-muted-foreground">Parsed: <span className="font-mono font-medium">{parseDate(csvData[0][columnMapping.date], formatOptions.dateFormat)}</span></p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No data to preview</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  This preview shows how your data will be parsed. If the parsed values look incorrect, 
                  try changing the format options above.
                </p>
              </div>
            )}
          </div>
        )}

        {uploadStep === 'complete' && success && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Successfully imported {csvData.length} bank transactions.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="bg-red-50 border-red-200 text-red-800 mt-4">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {uploadStep === 'upload' ? (
          <div></div>
        ) : (
          <Button variant="outline" onClick={handleReset}>
            Start Over
          </Button>
        )}
        
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
        
        {uploadStep === 'complete' && (
          <Button onClick={handleReset}>
            Upload Another File
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
