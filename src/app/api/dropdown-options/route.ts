import { createClient } from '@/lib/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function getCurrentTenantId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const tenantId = cookieStore.get('selectedTenantId')?.value
    
    if (tenantId) {
      return tenantId
    }
    
    // Fallback: get first available tenant for user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }
    
    const { data: tenantUsers } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
    
    return tenantUsers?.[0]?.tenant_id || null
  } catch (error) {
    console.error('Error getting current tenant ID:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type) {
      return NextResponse.json(
        { error: 'Missing type parameter' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const currentTenantId = await getCurrentTenantId()
    
    if (!currentTenantId) {
      return NextResponse.json(
        { error: 'No tenant context available' },
        { status: 403 }
      )
    }

    switch (type) {
      case 'tenants':
        const { data: tenants, error: tenantsError } = await supabase
          .rpc('get_tenant_dropdown_options', {
            org_tenant_id: currentTenantId
          })

        if (tenantsError) {
          console.error('Error fetching tenants:', tenantsError)
          return NextResponse.json(
            { error: tenantsError.message },
            { status: 500 }
          )
        }

        return NextResponse.json({ 
          data: tenants?.map(tenant => ({
            id: tenant.id,
            label: `${tenant.name} (Tenant)`,
            value: tenant.id,
            type: 'tenant'
          })) || []
        })

      case 'business_partners':
        const { data: businessPartners, error: businessPartnersError } = await supabase
          .rpc('get_business_partner_dropdown_options', {
            org_tenant_id: currentTenantId
          })

        if (businessPartnersError) {
          console.error('Error fetching business partners:', businessPartnersError)
          return NextResponse.json(
            { error: businessPartnersError.message },
            { status: 500 }
          )
        }

        return NextResponse.json({ 
          data: businessPartners?.map(partner => ({
            id: partner.id,
            label: `${partner.name} (Business)`,
            value: partner.id,
            type: 'business_partner'
          })) || []
        })

      case 'properties':
        const { data: properties, error: propertiesError } = await supabase
          .rpc('get_property_dropdown_options', {
            org_tenant_id: currentTenantId
          })

        if (propertiesError) {
          console.error('Error fetching properties:', propertiesError)
          return NextResponse.json(
            { error: propertiesError.message },
            { status: 500 }
          )
        }

        return NextResponse.json({ 
          data: properties?.map(property => ({
            id: property.id,
            label: property.display_name,
            value: property.id,  // Use ID for FK reference
            name: property.name  // Keep name for backward compatibility
          })) || []
        })

      case 'booking_categories':
        const { data: categories, error: categoriesError } = await supabase
          .from('booking_categories')
          .select('Name')
          .order('Name')

        if (categoriesError) {
          console.error('Error fetching booking categories:', categoriesError)
          return NextResponse.json(
            { error: categoriesError.message },
            { status: 500 }
          )
        }

        return NextResponse.json({ 
          data: categories?.map(category => ({
            label: category.Name,
            value: category.Name
          })) || []
        })

      case 'combined_partners':
        // Get both tenants and business partners for the partner dropdown
        const [tenantsResult, businessPartnersResult] = await Promise.all([
          supabase.rpc('get_tenant_dropdown_options', {
            org_tenant_id: currentTenantId
          }),
          supabase.rpc('get_business_partner_dropdown_options', {
            org_tenant_id: currentTenantId
          })
        ])

        if (tenantsResult.error || businessPartnersResult.error) {
          console.error('Error fetching combined partners:', tenantsResult.error || businessPartnersResult.error)
          return NextResponse.json(
            { error: 'Failed to fetch partner options' },
            { status: 500 }
          )
        }

        const combinedOptions = [
          ...(tenantsResult.data?.map(tenant => ({
            id: tenant.id,
            label: `${tenant.name} (Tenant)`,
            value: JSON.stringify({ partnerId: tenant.id, partnerType: 'tenant' }),
            type: 'tenant'
          })) || []),
          ...(businessPartnersResult.data?.map(partner => ({
            id: partner.id,
            label: `${partner.name} (Business)`,
            value: JSON.stringify({ partnerId: partner.id, partnerType: 'business_partner' }),
            type: 'business_partner'
          })) || [])
        ]

        return NextResponse.json({ data: combinedOptions })

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
