import { createClient } from '@/lib/server'
import { cookies } from 'next/headers'

/**
 * Server-side tenant utilities for RLS
 */

/**
 * Initialize tenant session on the server side
 * This should be called in server components that need tenant-filtered data
 */
export async function initializeServerTenantSession(tenantId?: string): Promise<void> {
  try {
    const supabase = await createClient()
    
    // If no tenant provided, try to get from cookies
    if (!tenantId) {
      const cookieStore = await cookies()
      tenantId = cookieStore.get('selectedTenantId')?.value
    }
    
    if (tenantId) {
      const { error } = await supabase.rpc('set_current_tenant', {
        tenant_id: tenantId
      })
      
      if (error) {
        console.error('Error setting server-side tenant session:', error)
      } else {
        console.log('Server-side tenant session initialized:', tenantId)
      }
    }
  } catch (error) {
    console.error('Failed to initialize server-side tenant session:', error)
  }
}

/**
 * Get user's available tenants from server context
 */
export async function getUserTenants() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { tenants: [], error: 'Not authenticated' }
  }
  
  const { data: tenants, error } = await supabase
    .from('tenant_users_detailed')
    .select('tenant_id, tenant_name, tenant_subdomain, tenant_plan, role')
    .eq('user_id', user.id)
    .order('tenant_name')
  
  return {
    tenants: tenants || [],
    error: error?.message
  }
}

/**
 * Verify user has access to specific tenant (server-side)
 */
export async function verifyServerTenantAccess(tenantId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data, error } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .limit(1)
  
  if (error) {
    console.error('Error verifying server-side tenant access:', error)
    return false
  }
  
  return data && data.length > 0
}
