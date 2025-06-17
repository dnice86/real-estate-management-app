import { createClient } from '@/lib/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { table, id, field, value } = await request.json()

    // Validate required fields
    if (!table || !id || !field || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Validate table name to prevent SQL injection
    const validTables = [
      'bank_transactions', 
      'booking_categories', 
      'business_partners', 
      'tenants', 
      'properties',
      'tenant_rent_milestones'
    ]
    if (!validTables.includes(table)) {
      return NextResponse.json(
        { error: 'Invalid table name' },
        { status: 400 }
      )
    }

    // Special handling for foreign key fields in bank_transactions
    if (table === 'bank_transactions') {
      if (field === 'tenant_ref') {
        // Handle tenant reference update
        const { data, error } = await supabase
          .from('bank_transactions')
          .update({ 
            tenant_ref: value,
            business_partner_ref: null // Clear business partner when setting tenant
          })
          .eq('id', id)
          .select()

        if (error) {
          console.error('Error updating tenant reference:', error)
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          )
        }

        return NextResponse.json({ data })
      }
      
      if (field === 'business_partner_ref') {
        // Handle business partner reference update
        const { data, error } = await supabase
          .from('bank_transactions')
          .update({ 
            business_partner_ref: value,
            tenant_ref: null // Clear tenant when setting business partner
          })
          .eq('id', id)
          .select()

        if (error) {
          console.error('Error updating business partner reference:', error)
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          )
        }

        return NextResponse.json({ data })
      }

      if (field === 'property_ref') {
        // Handle property reference update
        const { data, error } = await supabase
          .from('bank_transactions')
          .update({ property_ref: value })
          .eq('id', id)
          .select()

        if (error) {
          console.error('Error updating property reference:', error)
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          )
        }

        return NextResponse.json({ data })
      }

      if (field === 'partner_selection') {
        // Handle the special partner selection field that determines which FK to set
        const { partnerId, partnerType } = JSON.parse(value)
        
        const updateData: any = {}
        if (partnerType === 'tenant') {
          updateData.tenant_ref = partnerId
          updateData.business_partner_ref = null
        } else if (partnerType === 'business_partner') {
          updateData.business_partner_ref = partnerId
          updateData.tenant_ref = null
        }

        const { data, error } = await supabase
          .from('bank_transactions')
          .update(updateData)
          .eq('id', id)
          .select()

        if (error) {
          console.error('Error updating partner reference:', error)
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          )
        }

        return NextResponse.json({ data })
      }
    }

    // Standard field update for all other cases
    const { data, error } = await supabase
      .from(table)
      .update({ [field]: value })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating data:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Return the updated data
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
