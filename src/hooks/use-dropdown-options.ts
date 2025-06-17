import { useState, useEffect } from 'react'

interface DropdownOption {
  id?: string
  label: string
  value: string
  type?: string
}

export function useDropdownOptions(type: string) {
  const [options, setOptions] = useState<DropdownOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOptions() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/dropdown-options?type=${type}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${type} options`)
        }
        
        const result = await response.json()
        
        if (result.error) {
          throw new Error(result.error)
        }
        
        setOptions(result.data || [])
      } catch (err) {
        console.error(`Error fetching ${type} options:`, err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchOptions()
  }, [type])

  return { options, loading, error, refetch: () => fetchOptions() }
}

// Specialized hooks for common use cases
export function useTenantOptions() {
  return useDropdownOptions('tenants')
}

export function useBusinessPartnerOptions() {
  return useDropdownOptions('business_partners')
}

export function usePropertyOptions() {
  return useDropdownOptions('properties')
}

export function useBookingCategoryOptions() {
  return useDropdownOptions('booking_categories')
}

export function useCombinedPartnerOptions() {
  return useDropdownOptions('combined_partners')
}
