"use client"

import { useState, useEffect } from 'react'

interface PartnerDisplayCellProps {
  row: any
  onUpdate: (value: string) => void
  isEditing: boolean
  onEditToggle: () => void
}

export function PartnerDisplayCell({ 
  row, 
  onUpdate, 
  isEditing, 
  onEditToggle 
}: PartnerDisplayCellProps) {
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPartners() {
      try {
        const response = await fetch('/api/dropdown-options?type=combined_partners')
        const result = await response.json()
        setPartners(result.data || [])
      } catch (error) {
        console.error('Error fetching partners:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPartners()
  }, [])

  const getCurrentPartnerDisplay = (): string => {
    if (row.tenant_ref) {
      const tenant = partners.find(p => {
        try {
          const data = JSON.parse(p.value)
          return data.partnerType === 'tenant' && data.partnerId === row.tenant_ref
        } catch {
          return false
        }
      })
      return tenant ? tenant.label : 'Unknown Tenant'
    }
    
    if (row.business_partner_ref) {
      const partner = partners.find(p => {
        try {
          const data = JSON.parse(p.value)
          return data.partnerType === 'business_partner' && data.partnerId === row.business_partner_ref
        } catch {
          return false
        }
      })
      return partner ? partner.label : 'Unknown Business Partner'
    }
    
    return row.partner || 'No partner selected'
  }

  if (loading) {
    return <span className="text-gray-400">Loading...</span>
  }

  if (isEditing) {
    return (
      <select
        value={(() => {
          if (row.tenant_ref) {
            return JSON.stringify({ partnerId: row.tenant_ref, partnerType: 'tenant' })
          }
          if (row.business_partner_ref) {
            return JSON.stringify({ partnerId: row.business_partner_ref, partnerType: 'business_partner' })
          }
          return ''
        })()}
        onChange={(e) => {
          onUpdate(e.target.value)
          onEditToggle()
        }}
        className="w-full border rounded px-2 py-1"
        autoFocus
      >
        <option value="">Select partner...</option>
        {partners.map((partner, index) => (
          <option key={index} value={partner.value}>
            {partner.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <span 
      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
      onClick={onEditToggle}
    >
      {getCurrentPartnerDisplay()}
    </span>
  )
}
