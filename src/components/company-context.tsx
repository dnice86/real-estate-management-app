"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/client'
import { useSearchParams } from 'next/navigation'

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
  switchCompany: (company: Company) => void
  loading: boolean
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const searchParams = useSearchParams()

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
        
        // Priority order for selecting current company:
        // 1. URL tenant parameter
        // 2. Saved company from localStorage
        // 3. First available company
        
        const urlTenantId = searchParams.get('tenant')
        const savedCompanyId = localStorage.getItem('selectedCompanyId')
        
        let selectedCompany: Company | null = null
        
        if (urlTenantId) {
          // Try to find company matching URL tenant parameter
          selectedCompany = formattedCompanies.find(c => c.id === urlTenantId) || null
        }
        
        if (!selectedCompany && savedCompanyId) {
          // Fall back to saved company from localStorage
          selectedCompany = formattedCompanies.find(c => c.id === savedCompanyId) || null
        }
        
        if (!selectedCompany && formattedCompanies.length > 0) {
          // Fall back to first available company
          selectedCompany = formattedCompanies[0]
        }
        
        if (selectedCompany) {
          setCurrentCompany(selectedCompany)
          localStorage.setItem('selectedCompanyId', selectedCompany.id)
        }
      } catch (error) {
        console.error('Error in loadUserCompanies:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserCompanies()
  }, [supabase, searchParams])

  // Update current company when URL tenant parameter changes
  useEffect(() => {
    const urlTenantId = searchParams.get('tenant')
    if (urlTenantId && companies.length > 0) {
      const urlCompany = companies.find(c => c.id === urlTenantId)
      if (urlCompany && (!currentCompany || currentCompany.id !== urlTenantId)) {
        setCurrentCompany(urlCompany)
        localStorage.setItem('selectedCompanyId', urlCompany.id)
      }
    }
  }, [searchParams, companies, currentCompany])

  const switchCompany = (company: Company) => {
    setCurrentCompany(company)
    localStorage.setItem('selectedCompanyId', company.id)
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
