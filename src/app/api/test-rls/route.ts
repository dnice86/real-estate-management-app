import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant')
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    let results: any = {
      user_id: user.id,
      requested_tenant: tenantId,
      step_results: []
    }
    
    // Step 1: Check current tenant before setting
    try {
      const { data: currentTenant, error } = await supabase.rpc('get_current_tenant')
      results.step_results.push({
        step: 'get_current_tenant_before',
        success: !error,
        result: currentTenant,
        error: error?.message
      })
    } catch (error) {
      results.step_results.push({
        step: 'get_current_tenant_before',
        success: false,
        error: (error as Error).message
      })
    }
    
    // Step 2: Set tenant if requested
    if (tenantId) {
      try {
        const { error } = await supabase.rpc('set_current_tenant', {
          tenant_id: tenantId
        })
        results.step_results.push({
          step: 'set_current_tenant',
          success: !error,
          tenant_id: tenantId,
          error: error?.message
        })
      } catch (error) {
        results.step_results.push({
          step: 'set_current_tenant',
          success: false,
          error: (error as Error).message
        })
      }
    }
    
    // Step 3: Check current tenant after setting
    try {
      const { data: currentTenant, error } = await supabase.rpc('get_current_tenant')
      results.step_results.push({
        step: 'get_current_tenant_after',
        success: !error,
        result: currentTenant,
        error: error?.message
      })
    } catch (error) {
      results.step_results.push({
        step: 'get_current_tenant_after',
        success: false,
        error: (error as Error).message
      })
    }
    
    // Step 4: Test data access with RLS
    try {
      const { data: bankTransactions, error } = await supabase
        .from('bank_transactions')
        .select('id, tenant_id, date, amount')
        .limit(5)
      
      results.step_results.push({
        step: 'test_rls_bank_transactions',
        success: !error,
        count: bankTransactions?.length || 0,
        sample_tenant_ids: bankTransactions?.map(t => t.tenant_id).slice(0, 3) || [],
        error: error?.message
      })
    } catch (error) {
      results.step_results.push({
        step: 'test_rls_bank_transactions',
        success: false,
        error: (error as Error).message
      })
    }
    
    // Step 5: Test properties access
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, tenant_id, name')
        .limit(5)
      
      results.step_results.push({
        step: 'test_rls_properties',
        success: !error,
        count: properties?.length || 0,
        sample_tenant_ids: properties?.map(p => p.tenant_id).slice(0, 3) || [],
        error: error?.message
      })
    } catch (error) {
      results.step_results.push({
        step: 'test_rls_properties',
        success: false,
        error: (error as Error).message
      })
    }
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Test RLS Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: (error as Error).message 
    }, { status: 500 })
  }
}
