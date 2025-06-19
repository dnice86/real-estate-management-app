"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/client'

interface Company {
  id: string
  name: string
  subdomain: string
  plan_type: string
  role: string
}

interface CompanyContextType {
  currentCompany: Company | null
  companies: Company[]
  switchCompany: (company: Company) => Promise<void>
  loading: boolean
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadUserCompanies() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get user's companies from tenant_users_detailed view
        const { data: userCompanies, error } = await supabase
          .from('tenant_users_detailed')
          .select('tenant_id, tenant_name, tenant_subdomain, tenant_plan, role')
          .eq('user_id', user.id)
          .order('tenant_name')

        if (error) {
          console.error('Error loading companies:', error)
          return
        }

        const formattedCompanies: Company[] = userCompanies?.map(company => ({
          id: company.tenant_id,
          name: company.tenant_name,
          subdomain: company.tenant_subdomain,
          plan_type: company.tenant_plan,
          role: company.role
        })) || []

        setCompanies(formattedCompanies)
        
        // Simple priority order for selecting current company:
        // 1. Saved company from localStorage 
        // 2. First available company
        
        const savedCompanyId = localStorage.getItem('selectedCompanyId')
        
        let selectedCompany: Company | null = null
        
        if (savedCompanyId) {
          // Try to find saved company
          selectedCompany = formattedCompanies.find(c => c.id === savedCompanyId) || null
        }
        
        if (!selectedCompany && formattedCompanies.length > 0) {
          // Fall back to first available company
          selectedCompany = formattedCompanies[0]
        }
        
        if (selectedCompany) {
          setCurrentCompany(selectedCompany)
          localStorage.setItem('selectedCompanyId', selectedCompany.id)
          
          // Set cookie for server-side access (no session state)
          document.cookie = `selectedTenantId=${selectedCompany.id}; path=/; max-age=${60 * 60 * 24 * 30}` // 30 days
        }
      } catch (error) {
        console.error('Error in loadUserCompanies:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserCompanies()
  }, [supabase])

  const switchCompany = async (company: Company) => {
    try {
      // Update local state
      setCurrentCompany(company)
      localStorage.setItem('selectedCompanyId', company.id)
      
      // Set cookie for server-side access (explicit parameter approach)
      document.cookie = `selectedTenantId=${company.id}; path=/; max-age=${60 * 60 * 24 * 30}` // 30 days
      
      // Refresh the page to reload data with new tenant
      window.location.reload()
    } catch (error) {
      console.error('Failed to switch tenant:', error)
      throw error
    }
  }

  return (
    <CompanyContext.Provider value={{
      currentCompany,
      companies,
      switchCompany,
      loading
    }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}
