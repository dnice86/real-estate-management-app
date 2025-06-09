"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Check, X, AlertCircle, DollarSign, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRentOverview } from "@/hooks/use-rent-overview"

type PaymentStatus = "paid" | "city" | "partial" | "missing" | "overdue"

interface ProcessedRentData {
  property: string
  partner: string
  months: Record<string, {
    amount: number
    status: PaymentStatus
    payer: string
    date: string
  }>
}

interface RentMatrixProps {
  selectedYear: string
  onYearChange: (year: string) => void
}

export function RentMatrix({ selectedYear, onYearChange }: RentMatrixProps) {
  const { data, loading, error } = useRentOverview(selectedYear)
  
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-semibold">Rent Payment Matrix</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Loading rent data...</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-red-600">Error Loading Rent Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }
  
  if (!data || data.rentTransactions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">No Rent Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No rent transactions found for {selectedYear}</p>
        </CardContent>
      </Card>
    )
  }
  
  // Process the real data into a matrix format
  const processedData = processRentData(data.rentTransactions, selectedYear)
  
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]
  
  const monthNumbers = [
    "01", "02", "03", "04", "05", "06", 
    "07", "08", "09", "10", "11", "12"
  ]

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return <Check className="h-3 w-3" />
      case "city":
        return <DollarSign className="h-3 w-3" />
      case "partial":
        return <AlertCircle className="h-3 w-3" />
      case "missing":
      case "overdue":
        return <X className="h-3 w-3" />
      default:
        return null
    }
  }

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return "bg-green-500 text-white hover:bg-green-600"
      case "city":
        return "bg-blue-500 text-white hover:bg-blue-600"
      case "partial":
        return "bg-yellow-500 text-white hover:bg-yellow-600"
      case "missing":
        return "bg-gray-300 text-gray-600 hover:bg-gray-400"
      case "overdue":
        return "bg-red-500 text-white hover:bg-red-600"
      default:
        return "bg-gray-100 text-gray-400"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">
              Rent Payment Matrix
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Monthly payment status across all properties and tenants
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedYear} onValueChange={onYearChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500 flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Paid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center">
              <DollarSign className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">City Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500 flex items-center justify-center">
              <AlertCircle className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500 flex items-center justify-center">
              <X className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Missing/Overdue</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium text-sm text-muted-foreground min-w-[200px]">
                  Tenant / Property
                </th>
                {months.map((month, index) => (
                  <th key={month} className="text-center p-2 font-medium text-xs text-muted-foreground min-w-[60px]">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(processedData).map(([property, tenants]) => (
                <React.Fragment key={property}>
                  {/* Property Header */}
                  <tr className="bg-muted/50">
                    <td colSpan={13} className="p-3 font-medium text-sm border-t">
                      🏢 {property.replace('Mehrfamilienhaus - ', '').replace(' - Osnabrueck', '')}
                    </td>
                  </tr>
                  
                  {/* Tenant Rows */}
                  {Object.entries(tenants).map(([partner, monthsData]) => (
                    <tr key={`${property}-${partner}`} className="border-b hover:bg-muted/20">
                      <td className="p-3 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">👤</span>
                          <span className="truncate">{partner}</span>
                        </div>
                      </td>
                      {monthNumbers.map((monthNum, index) => {
                        const monthData = monthsData[monthNum]
                        const amount = monthData?.amount || 0
                        const status = monthData?.status || "missing"
                        
                        return (
                          <td key={monthNum} className="p-1 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-10 h-8 p-0 rounded transition-all duration-200",
                                getStatusColor(status),
                                amount > 0 && "hover:scale-105"
                              )}
                              title={amount > 0 ? 
                                `€${amount} - ${monthData?.payer} - ${monthData?.date}` : 
                                `No payment recorded for ${months[index]} ${selectedYear}`
                              }
                            >
                              {amount > 0 ? (
                                <div className="flex flex-col items-center">
                                  {getStatusIcon(status)}
                                  <span className="text-[10px] font-medium">
                                    {Math.round(amount)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs">-</span>
                              )}
                            </Button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function processRentData(data: any[], year: string): Record<string, Record<string, Record<string, { amount: number; status: PaymentStatus; payer: string; date: string }>>> {
  const result: Record<string, Record<string, Record<string, { amount: number; status: PaymentStatus; payer: string; date: string }>>> = {}
  
  const yearData = data.filter(item => item.date && item.date.startsWith(year))
  
  yearData.forEach(item => {
    // Extract property from description if not available in property field
    let property = item.property || 'Unknown Property'
    if (!item.property && item.description) {
      const desc = item.description
      if (desc.includes('Iburger')) property = 'Iburgerstrasse 107'
      else if (desc.includes('Meller')) property = 'Mellerstrasse 225'
      else if (desc.includes('Schwelmer')) property = 'Schwelmerstrasse 16'
      else property = 'Other Properties'
    }
    
    const partner = item.partner || "Unknown Tenant"
    const month = item.date.split('-')[1]
    const amount = parseFloat(item.amount) || 0
    
    if (!result[property]) result[property] = {}
    if (!result[property][partner]) result[property][partner] = {}
    
    // Determine payment status
    let status: PaymentStatus = "missing"
    
    if (amount > 0) {
      if (item.payer === "Stadt Osnabrueck" || item.payer === "Bundesagentur fuer Arbeit-Service-Haus") {
        status = "city"
      } else if (amount >= 500) {
        status = "paid"
      } else if (amount >= 200) {
        status = "partial"
      } else {
        status = "paid" // Any positive amount counts as paid
      }
    }
    
    // Sum up amounts for the same partner/month if multiple payments exist
    if (result[property][partner][month]) {
      result[property][partner][month].amount += amount
    } else {
      result[property][partner][month] = {
        amount,
        status,
        payer: item.payer,
        date: item.date
      }
    }
  })
  
  return result
}