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
    const validTables = ['bank_transactions', 'booking_categories', 'partner']
    if (!validTables.includes(table)) {
      return NextResponse.json(
        { error: 'Invalid table name' },
        { status: 400 }
      )
    }

    // Update the data in Supabase
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
