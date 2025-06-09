"use client"

import { useState, useEffect, useCallback } from 'react'

interface RentTransaction {
  id: string
  amount: number
  payer: string
  description: string
  date: string
  booking_category: string
  partner: string
  property?: string
}

interface Property {
  id: string
  name: string
  address: string
}

interface RentOverviewData {
  rentTransactions: RentTransaction[]
  properties: Property[]
  year: string
}

export function useRentOverview(year: string = '2025') {
  const [data, setData] = useState<RentOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRentData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/rent-overview?year=${year}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rent data: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      setData(result)
    } catch (err) {
      console.error('Error fetching rent overview:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    fetchRentData()
  }, [fetchRentData])

  return { data, loading, error, refetch: fetchRentData }
}