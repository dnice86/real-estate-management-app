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
  switchCompany: (company: Company) => void
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
        
        // Try to restore previously selected company from localStorage
        const savedCompanyId = localStorage.getItem('selectedCompanyId')
        const savedCompany = formattedCompanies.find(c => c.id === savedCompanyId)
        
        // Set saved company or first available company as current
        if (savedCompany) {
          setCurrentCompany(savedCompany)
        } else if (formattedCompanies.length > 0) {
          setCurrentCompany(formattedCompanies[0])
          localStorage.setItem('selectedCompanyId', formattedCompanies[0].id)
        }
      } catch (error) {
        console.error('Error in loadUserCompanies:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserCompanies()
  }, [supabase])

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
