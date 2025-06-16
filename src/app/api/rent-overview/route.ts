import { createClient } from '@/lib/server'
import { initializeServerTenantSession } from '@/lib/server-tenant'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || '2025'
    
    // Initialize tenant session for RLS
    await initializeServerTenantSession()
    
    // Fetch all bank transactions with "Miete" category for the specified year
    // Note: RLS automatically filters by current tenant, no need for explicit tenant_id filter
    const { data: rentTransactions, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('booking_category', 'Miete')
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
      .order('date', { ascending: false })
    
    if (error) {
      console.error('Error fetching rent transactions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('DEBUG: Fetched rent transactions:', {
      count: rentTransactions?.length || 0,
      sample: rentTransactions?.slice(0, 3) || [],
      yearRequested: year
    })

    // Also fetch property data if you have a properties table
    // Note: RLS automatically filters by current tenant
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
    
    // If properties table doesn't exist, we'll work with just the transaction data
    
    return NextResponse.json({ 
      rentTransactions: rentTransactions || [],
      properties: properties || [],
      year
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}