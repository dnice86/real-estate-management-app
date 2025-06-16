"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TestRLSPage() {
  const [tenantId, setTenantId] = useState('')
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runRLSTest = async () => {
    setLoading(true)
    try {
      const url = tenantId 
        ? `/api/test-rls?tenant=${encodeURIComponent(tenantId)}`
        : '/api/test-rls'
      
      const response = await fetch(url)
      const results = await response.json()
      setTestResults(results)
    } catch (error) {
      console.error('Error running RLS test:', error)
      setTestResults({ error: 'Failed to run test' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🔒 RLS Test Page</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Row Level Security</CardTitle>
          <CardDescription>
            This page tests if the RLS policies and tenant switching are working correctly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-id">Tenant ID (optional)</Label>
            <Input
              id="tenant-id"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="Enter tenant ID to test specific tenant..."
            />
          </div>
          
          <Button onClick={runRLSTest} disabled={loading}>
            {loading ? 'Running Test...' : 'Run RLS Test'}
          </Button>
        </CardContent>
      </Card>

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
