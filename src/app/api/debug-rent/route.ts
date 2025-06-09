import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // First, let's see all booking categories to understand what we have
    const { data: allCategories, error: categoriesError } = await supabase
      .from('bank_transactions')
      .select('booking_category')
      .not('booking_category', 'is', null)
    
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
    }
    
    // Get unique categories
    const uniqueCategories = [...new Set(allCategories?.map(t => t.booking_category) || [])]
    
    // Fetch transactions with "Miete" category
    const { data: mieteTransactions, error: mieteError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('booking_category', 'Miete')
      .order('date', { ascending: false })
      .limit(10)
    
    // Also check for transactions that might contain "miete" in description
    const { data: mieteInDescription, error: descError } = await supabase
      .from('bank_transactions')
      .select('*')
      .ilike('description', '%miete%')
      .order('date', { ascending: false })
      .limit(10)
    
    // Get total count of each
    const { count: mieteCount } = await supabase
      .from('bank_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('booking_category', 'Miete')
    
    const { count: mieteDescCount } = await supabase
      .from('bank_transactions')
      .select('*', { count: 'exact', head: true })
      .ilike('description', '%miete%')
    
    return NextResponse.json({
      debug: {
        uniqueCategories,
        totalCategorizedTransactions: allCategories?.length || 0,
        mieteCategory: {
          count: mieteCount || 0,
          sample: mieteTransactions || []
        },
        mieteInDescription: {
          count: mieteDescCount || 0,
          sample: mieteInDescription || []
        }
      }
    })
    
  } catch (error) {
    console.error('Debug API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}