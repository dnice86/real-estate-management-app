'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'

interface BookingCategory {
  id: string;
  Name: string;
  "Business - Main Category": string;
  "Business - Sub Category": string;
  "Schedule E - ID": string;
  "Schedule C - ID": string;
  Comment: string;
}

export default function DebugTables() {
  const [bookingCategories, setBookingCategories] = useState<BookingCategory[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        
        // Fetch booking categories data
        const { data, error } = await supabase
          .from('booking_categories')
          .select('*')
          .limit(100)
        
        if (error) {
          throw error
        }
        
        setBookingCategories(data || [])
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug: Booking Categories Table</h1>
      
      {loading && <p>Loading data...</p>}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error fetching data:</p>
          <p>{error}</p>
        </div>
      )}
      
      {!loading && !error && bookingCategories.length === 0 && (
        <p>No booking categories found.</p>
      )}
      
      {bookingCategories.length > 0 && (
        <div>
          <p className="mb-2">Found {bookingCategories.length} booking categories:</p>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">ID</th>
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Main Category</th>
                  <th className="border px-4 py-2">Sub Category</th>
                  <th className="border px-4 py-2">Schedule E ID</th>
                  <th className="border px-4 py-2">Schedule C ID</th>
                  <th className="border px-4 py-2">Comment</th>
                </tr>
              </thead>
              <tbody>
                {bookingCategories.map((category) => (
                  <tr key={category.id}>
                    <td className="border px-4 py-2">{category.id}</td>
                    <td className="border px-4 py-2">{category.Name}</td>
                    <td className="border px-4 py-2">{category["Business - Main Category"]}</td>
                    <td className="border px-4 py-2">{category["Business - Sub Category"]}</td>
                    <td className="border px-4 py-2">{category["Schedule E - ID"]}</td>
                    <td className="border px-4 py-2">{category["Schedule C - ID"]}</td>
                    <td className="border px-4 py-2">{category.Comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Raw Data:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(bookingCategories, null, 2)}
        </pre>
      </div>
    </div>
  )
}
