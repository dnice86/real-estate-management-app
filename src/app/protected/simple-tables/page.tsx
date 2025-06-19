import { AppSidebar } from "@/components/app-sidebar"
import { CompanyProvider } from "@/components/company-context"
import { SimpleDataGrid, SimpleColumn } from "@/components/simple-data-grid"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/server"
import { initializeServerTenantSession } from "@/lib/server-tenant"
import { redirect } from 'next/navigation'

// Column definitions for each table
const bankTransactionColumns: SimpleColumn[] = [
  {
    key: 'description',
    label: 'Description',
    type: 'text',
    editable: true,
    width: 'w-64'
  },
  {
    key: 'amount_formatted',
    label: 'Amount',
    type: 'text',
    width: 'w-24'
  },
  {
    key: 'payer',
    label: 'Payer',
    type: 'text',
    editable: true,
    width: 'w-40'
  },
  {
    key: 'date_formatted',
    label: 'Date',
    type: 'text',
    width: 'w-24'
  },
  {
    key: 'booking_category',
    label: 'Category',
    type: 'select',
    editable: true,
    width: 'w-32'
  },
  {
    key: 'partner_name',
    label: 'Current Partner',
    type: 'text',
    width: 'w-40'
  },
  {
    key: 'partner_selection',
    label: 'Update Partner',
    type: 'select',
    editable: true,
    width: 'w-40'
  },
  {
    key: 'property_name',
    label: 'Property',
    type: 'text',
    width: 'w-40'
  },
  {
    key: 'transaction_type',
    label: 'Type',
    type: 'text',
    width: 'w-20'
  }
]

const renterColumns: SimpleColumn[] = [
  {
    key: 'full_name',
    label: 'Name',
    type: 'text',
    editable: true,
    sortable: true,
    width: 'w-48'
  },
  {
    key: 'computed_status',
    label: 'Status',
    type: 'text',
    width: 'w-24'
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    editable: true,
    width: 'w-48'
  },
  {
    key: 'phone',
    label: 'Phone',
    type: 'text',
    editable: true,
    width: 'w-32'
  },
  {
    key: 'cold_rent_formatted',
    label: 'Cold Rent',
    type: 'text',
    width: 'w-24'
  },
  {
    key: 'total_rent_formatted',
    label: 'Total Rent',
    type: 'text',
    width: 'w-24'
  },
  {
    key: 'lease_start_date',
    label: 'Lease Start',
    type: 'date',
    editable: true,
    width: 'w-28'
  },
  {
    key: 'lease_end_date',
    label: 'Lease End',
    type: 'date',
    editable: true,
    width: 'w-28'
  }
]

const businessPartnerColumns: SimpleColumn[] = [
  {
    key: 'full_name',
    label: 'Company Name',
    type: 'text',
    editable: true,
    sortable: true,
    width: 'w-48'
  },
  {
    key: 'business_type',
    label: 'Business Type',
    type: 'text',
    editable: true,
    width: 'w-32'
  },
  {
    key: 'status_display',
    label: 'Status',
    type: 'text',
    width: 'w-24'
  },
  {
    key: 'contact_email',
    label: 'Email',
    type: 'text',
    editable: true,
    width: 'w-48'
  },
  {
    key: 'contact_phone',
    label: 'Phone',
    type: 'text',
    editable: true,
    width: 'w-32'
  },
  {
    key: 'comment',
    label: 'Comment',
    type: 'text',
    editable: true,
    width: 'w-64'
  }
]

const rentersPaymentScheduleColumns: SimpleColumn[] = [
  {
    key: 'tenant_name',
    label: 'Renter Name',
    type: 'text',
    editable: true,
    sortable: true,
    width: 'w-48'
  },
  {
    key: 'cold_rent_formatted',
    label: 'Cold Rent',
    type: 'text',
    width: 'w-24'
  },
  {
    key: 'heating_costs_formatted',
    label: 'Heating',
    type: 'text',
    width: 'w-20'
  },
  {
    key: 'additional_costs_formatted',
    label: 'Additional',
    type: 'text',
    width: 'w-20'
  },
  {
    key: 'parking_costs_formatted',
    label: 'Parking',
    type: 'text',
    width: 'w-20'
  },
  {
    key: 'total_monthly_cost_formatted',
    label: 'Total Monthly',
    type: 'text',
    width: 'w-28'
  },
  {
    key: 'effective_from_formatted',
    label: 'Effective From',
    type: 'text',
    width: 'w-28'
  },
  {
    key: 'legal_notice_date_formatted',
    label: 'Notice Date',
    type: 'text',
    width: 'w-28'
  },
  {
    key: 'schedule_status',
    label: 'Status',
    type: 'text',
    width: 'w-20'
  },
  {
    key: 'months_active',
    label: 'Months Active',
    type: 'number',
    width: 'w-24'
  },
  {
    key: 'notes',
    label: 'Notes',
    type: 'text',
    editable: true,
    width: 'w-64'
  }
]

const bookingCategoryColumns: SimpleColumn[] = [
  {
    key: 'Name',
    label: 'Name',
    type: 'text',
    editable: true,
    sortable: true,
    width: 'w-48'
  },
  {
    key: 'Business - Main Category',
    label: 'Main Category',
    type: 'text',
    editable: true,
    width: 'w-40'
  },
  {
    key: 'Business - Sub Category',
    label: 'Sub Category',
    type: 'text',
    editable: true,
    width: 'w-40'
  },
  {
    key: 'Schedule E - ID',
    label: 'Schedule E ID',
    type: 'text',
    editable: true,
    width: 'w-32'
  },
  {
    key: 'Schedule C - ID',
    label: 'Schedule C ID',
    type: 'text',
    editable: true,
    width: 'w-32'
  },
  {
    key: 'Comment',
    label: 'Comment',
    type: 'text',
    editable: true,
    width: 'w-64'
  }
]

// Simple data fetching using database functions (better than views for tenant context)
async function fetchTableDataWithTenant(supabase: any, dataType: string, tenantId?: string) {
  // Get tenant ID if not provided
  if (!tenantId) {
    // Try to get from a default tenant for now - in production this would come from session
    tenantId = '00000000-0000-0000-0000-000000000001';
  }

  try {
    switch (dataType) {
      case 'bank_transactions_display':
        const { data: btData, error: btError } = await supabase.rpc('get_bank_transactions_display', {
          tenant_uuid: tenantId
        });
        if (btError) {
          console.error(`Error fetching bank transactions:`, btError);
          return [];
        }
        return btData || [];

      case 'renters_display':
        const { data: rentersData, error: rentersError } = await supabase.rpc('get_renters_display', {
          tenant_uuid: tenantId
        });
        if (rentersError) {
          console.error(`Error fetching renters:`, rentersError);
          return [];
        }
        return rentersData || [];

      case 'business_partners_display':
        const { data: bpData, error: bpError } = await supabase.rpc('get_business_partners_display', {
          tenant_uuid: tenantId
        });
        if (bpError) {
          console.error(`Error fetching business partners:`, bpError);
          return [];
        }
        return bpData || [];

      case 'booking_categories':
        // For booking categories, use direct query since it's simpler
        const { data: bcData, error: bcError } = await supabase
          .from('booking_categories')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(1000);
        
        if (bcError) {
          console.error(`Error fetching booking categories:`, bcError);
          return [];
        }
        return bcData || [];

      case 'renters_payment_schedule':
        const { data: rpsData, error: rpsError } = await supabase.rpc('get_renters_payment_schedule_display', {
          tenant_uuid: tenantId
        });
        if (rpsError) {
          console.error(`Error fetching renters payment schedule:`, rpsError);
          return [];
        }
        return rpsData || [];

      default:
        console.error(`Unknown data type: ${dataType}`);
        return [];
    }
  } catch (error) {
    console.error(`Error in fetchTableDataWithTenant:`, error);
    return [];
  }
}

export default async function SimplifiedRealEstatePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()
  
  // Auth check
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/auth/login')
  }
  
  // Initialize tenant session
  await initializeServerTenantSession()
  
  const activeTab = resolvedSearchParams.tab || 'bank-transactions'
  
  // Fetch data from simplified database functions
  const [
    bankTransactions,
    renters,
    businessPartners,
    bookingCategories,
    rentersPaymentSchedule
  ] = await Promise.all([
    fetchTableDataWithTenant(supabase, 'bank_transactions_display'),
    fetchTableDataWithTenant(supabase, 'renters_display'),
    fetchTableDataWithTenant(supabase, 'business_partners_display'),
    fetchTableDataWithTenant(supabase, 'booking_categories'),
    fetchTableDataWithTenant(supabase, 'renters_payment_schedule')
  ])

  function getTableNameForTab(tab: string): string {
    switch (tab) {
      case 'bank-transactions': return 'bank_transactions'
      case 'renters': return 'renters'
      case 'business-partners': return 'business_partners'
      case 'booking-categories': return 'booking_categories'
      case 'renters-payment-schedule': return 'renters_payment_schedule'
      default: return 'bank_transactions'
    }
  }

  function getDataForTab() {
    switch (activeTab) {
      case 'bank-transactions':
        return { data: bankTransactions, columns: bankTransactionColumns, title: 'Bank Transactions' }
      case 'renters':
        return { data: renters, columns: renterColumns, title: 'Renters' }
      case 'business-partners':
        return { data: businessPartners, columns: businessPartnerColumns, title: 'Business Partners' }
      case 'booking-categories':
        return { data: bookingCategories, columns: bookingCategoryColumns, title: 'Booking Categories' }
      case 'renters-payment-schedule':
        return { data: rentersPaymentSchedule, columns: rentersPaymentScheduleColumns, title: 'Renters Payment Schedule' }
      default:
        return { data: bankTransactions, columns: bankTransactionColumns, title: 'Bank Transactions' }
    }
  }

  const { data, columns, title } = getDataForTab()

  // Debug: Log the data counts for troubleshooting
  console.log('Debug - Data counts:', {
    bankTransactions: bankTransactions.length,
    renters: renters.length,
    businessPartners: businessPartners.length,
    bookingCategories: bookingCategories.length,
    rentersPaymentSchedule: rentersPaymentSchedule.length,
    activeTab,
    selectedData: data.length
  })

  return (
    <CompanyProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-1">
              <div className="flex flex-col gap-2 py-2 md:gap-3 md:py-3">
                <div className="px-4 lg:px-6">
                  <div className="mb-4">
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-sm text-muted-foreground">
                      Simplified interface powered by database views and functions
                    </p>
                  </div>

                  <SimpleDataGrid
                    data={data}
                    columns={columns}
                    tableName={getTableNameForTab(activeTab)}
                    searchable={true}
                    paginated={true}
                    selectable={true}
                    pageSize={50}
                  />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </CompanyProvider>
  )
}
