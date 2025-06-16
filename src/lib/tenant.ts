import { createClient } from '@/lib/client'

/**
 * Utility functions for managing tenant sessions with RLS
 */

/**
 * Set the current tenant in the database session for RLS
 * This must be called when switching tenants or initializing the app
 */
export async function setCurrentTenant(tenantId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase.rpc('set_current_tenant', {
    tenant_id: tenantId
  })
  
  if (error) {
    console.error('Error setting current tenant:', error)
    throw error
  }
  
  console.log('Successfully set current tenant:', tenantId)
}

/**
 * Initialize tenant session when the app loads
 * This ensures RLS policies work correctly
 */
export async function initializeTenantSession(tenantId?: string): Promise<void> {
  if (!tenantId) {
    // Try to get from localStorage
    tenantId = localStorage.getItem('selectedCompanyId') || undefined
  }
  
  if (tenantId) {
    try {
      await setCurrentTenant(tenantId)
    } catch (error) {
      console.error('Failed to initialize tenant session:', error)
      // Clear invalid tenant from localStorage
      localStorage.removeItem('selectedCompanyId')
      throw error
    }
  }
}

/**
 * Verify that the current user has access to a specific tenant
 */
export async function verifyTenantAccess(tenantId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data, error } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .limit(1)
  
  if (error) {
    console.error('Error verifying tenant access:', error)
    return false
  }
  
  return data && data.length > 0
}
