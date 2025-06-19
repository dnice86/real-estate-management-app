import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get tenant ID from cookies or use default
    const cookieStore = await cookies()
    const tenantId = cookieStore.get('selectedTenantId')?.value || '00000000-0000-0000-0000-000000000001'

    const { data, error } = await supabase.rpc('get_partner_options', {
      tenant_id_param: tenantId
    })

    if (error) {
      console.error('Error fetching partner options:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
