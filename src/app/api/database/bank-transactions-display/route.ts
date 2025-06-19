import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get tenant ID from cookies
    const cookieStore = await cookies()
    const tenantId = cookieStore.get('selectedTenantId')?.value || '00000000-0000-0000-0000-000000000001'

    // Get all data needed for the component in one call
    const [transactionsResult, partnerOptionsResult, propertyOptionsResult, bookingCategoriesResult] = await Promise.all([
      supabase.rpc('get_bank_transactions_display', { tenant_uuid: tenantId }),
      supabase.rpc('get_partner_options_for_tenant', { tenant_id_param: tenantId }),
      supabase.rpc('get_property_options_for_tenant', { tenant_id_param: tenantId }),
      supabase.rpc('get_booking_category_options_for_tenant', { tenant_id_param: tenantId })
    ])

    // Check for errors
    if (transactionsResult.error) {
      console.error('Error fetching bank transactions:', transactionsResult.error)
      return NextResponse.json({ error: transactionsResult.error.message }, { status: 500 })
    }

    // Return combined data with options embedded
    return NextResponse.json({ 
      data: transactionsResult.data || [],
      options: {
        partners: partnerOptionsResult.data || [],
        properties: propertyOptionsResult.data || [],
        bookingCategories: bookingCategoriesResult.data || []
      }
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
