'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'

interface DebugData {
  table: string;
  totalRows: number;
  tenantBreakdown: Record<string, number>;
  sampleData: any[];
}

export default function DebugTables() {
  const [debugData, setDebugData] = useState<DebugData[]>([])
  const [tenantInfo, setTenantInfo] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDebugData() {
      try {
        const supabase = createClient()
        
        // Get tenant information
        const { data: tenants } = await supabase
          .from('tenant_users_detailed')
          .select('tenant_id, tenant_name, user_id')
        
        setTenantInfo(tenants || [])
        
        // Tables to analyze
        const tables = [
          'bank_transactions',
          'booking_categories', 
          'tenants',
          'business_partners'
        ]
        
        const debugResults: DebugData[] = []
        
        for (const table of tables) {
          try {
            // Get total count
            const { count: totalCount } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true })
            
            // Get sample data to check structure
            const { data: sampleData } = await supabase
              .from(table)
              .select('*')
              .limit(5)
            
            // Get tenant breakdown if tenant_id column exists
            let tenantBreakdown: Record<string, number> = {}
            
            if (sampleData && sampleData.length > 0 && 'tenant_id' in sampleData[0]) {
              const { data: tenantData } = await supabase
                .from(table)
                .select('tenant_id')
              
              if (tenantData) {
                tenantBreakdown = tenantData.reduce((acc, row) => {
                  const tenantId = row.tenant_id || 'NULL'
                  acc[tenantId] = (acc[tenantId] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              }
            } else {
              tenantBreakdown['No tenant_id column'] = totalCount || 0
            }
            
            debugResults.push({
              table,
              totalRows: totalCount || 0,
              tenantBreakdown,
              sampleData: sampleData || []
            })
          } catch (tableError) {
            console.error(`Error analyzing table ${table}:`, tableError)
            debugResults.push({
              table,
              totalRows: 0,
              tenantBreakdown: { 'Error': 0 },
              sampleData: []
            })
          }
        }
        
        setDebugData(debugResults)
      } catch (err) {
        console.error('Error fetching debug data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDebugData()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">🔍 Database Debug Analysis</h1>
      
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
          <p>🔄 Analyzing database structure and tenant assignments...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">❌ Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Tenant Information */}
      {tenantInfo.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">🏢 Available Tenants</h2>
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            {tenantInfo.map((tenant, index) => (
              <div key={index} className="mb-2">
                <strong>{tenant.tenant_name}</strong> - ID: <code className="bg-gray-200 px-2 py-1 rounded">{tenant.tenant_id}</code>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Table Analysis */}
      {debugData.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">📊 Table Analysis</h2>
          
          {debugData.map((tableData) => (
            <div key={tableData.table} className="border border-gray-300 rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-3">
                📋 {tableData.table} ({tableData.totalRows} total rows)
              </h3>
              
              {/* Tenant Breakdown */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Tenant Distribution:</h4>
                <div className="bg-gray-50 p-3 rounded">
                  {Object.entries(tableData.tenantBreakdown).map(([tenantId, count]) => (
                    <div key={tenantId} className="flex justify-between">
                      <span>
                        {tenantId === 'NULL' ? '🚫 No Tenant ID' : 
                         tenantId === 'No tenant_id column' ? '⚠️ No tenant_id column' :
                         tenantInfo.find(t => t.tenant_id === tenantId)?.tenant_name || tenantId}
                      </span>
                      <span className="font-mono">{count} rows</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Sample Data Structure */}
              {tableData.sampleData.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Sample Data Structure:</h4>
                  <div className="bg-gray-100 p-3 rounded overflow-auto">
                    <div className="text-sm font-mono">
                      <strong>Columns:</strong> {Object.keys(tableData.sampleData[0]).join(', ')}
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        Show sample records
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-40">
                        {JSON.stringify(tableData.sampleData, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Summary */}
      {!loading && debugData.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-bold text-blue-800 mb-2">🎯 Key Findings:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {debugData.map(table => (
              <li key={table.table}>
                <strong>{table.table}:</strong> {table.totalRows} rows - 
                {Object.keys(table.tenantBreakdown).length === 1 && Object.keys(table.tenantBreakdown)[0] === 'NULL' 
                  ? ' ⚠️ All rows missing tenant_id'
                  : Object.keys(table.tenantBreakdown).length === 1 && Object.keys(table.tenantBreakdown)[0] === 'No tenant_id column'
                  ? ' ⚠️ No tenant_id column exists'
                  : ` ✅ Distributed across ${Object.keys(table.tenantBreakdown).length} tenants`
                }
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
