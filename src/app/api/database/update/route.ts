import { createClient } from '@/lib/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { table, id, field, value } = await request.json()

    if (!table || !id || !field || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Use database functions instead of direct updates
    if (table === 'bank_transactions') {
      const { data, error } = await supabase.rpc('update_bank_transaction', {
        transaction_id: id,
        field_name: field,
        field_value: value
      })

      if (error) {
        console.error('Database function error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ data })
    } else {
      // Use generic update function for other tables
      const { data, error } = await supabase.rpc('update_table_record', {
        table_name: table,
        record_id: id,
        field_name: field,
        field_value: value
      })

      if (error) {
        console.error('Database function error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ data })
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
