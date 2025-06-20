import { AppSidebar } from "@/components/app-sidebar"
import { CompanyProvider } from "@/components/company-context"
import { SimpleColumn } from "@/components/simple-data-grid"
import { SimpleDataGridWrapper } from "@/components/simple-data-grid-wrapper"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/server"
import { cookies } from 'next/headers'
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

// Simplified data fetching using database functions with explicit tenant parameters
async function fetchTableDataWithTenant(supabase: any, dataType: string, tenantId: string) {
  try {
    switch (dataType) {
      case 'bank_transactions_display':
        const { data: btData, error: btError } = await supabase.rpc('get_bank_transactions_display', {
          tenant_uuid: tenantId
        });
        if (btError) {
          console.error(`Error fetching bank transactions:`, btError);
          return { data: [], options: {} };
        }
        
        // Get options for bank transactions
        const [partnerOptions, propertyOptions, bookingCategoryOptions] = await Promise.all([
          supabase.rpc('get_partner_options_for_tenant', { tenant_id_param: tenantId }),
          supabase.rpc('get_property_options_for_tenant', { tenant_id_param: tenantId }),
          supabase.rpc('get_booking_category_options_for_tenant', { tenant_id_param: tenantId })
        ]);
        
        return {
          data: btData || [],
          options: {
            partners: partnerOptions.data || [],
            properties: propertyOptions.data || [],
            bookingCategories: bookingCategoryOptions.data || []
          }
        };

      case 'renters_display':
        const { data: rentersData, error: rentersError } = await supabase.rpc('get_renters_display', {
          tenant_uuid: tenantId
        });
        if (rentersError) {
          console.error(`Error fetching renters:`, rentersError);
          return { data: [], options: {} };
        }
        return { data: rentersData || [], options: {} };

      case 'business_partners_display':
        const { data: bpData, error: bpError } = await supabase.rpc('get_business_partners_display', {
          tenant_uuid: tenantId
        });
        if (bpError) {
          console.error(`Error fetching business partners:`, bpError);
          return { data: [], options: {} };
        }
        return { data: bpData || [], options: {} };

      case 'booking_categories':
        // Use database function for consistency with architecture
        const { data: bcData, error: bcError } = await supabase.rpc('get_booking_categories_display', {
          tenant_uuid: tenantId
        });
        
        if (bcError) {
          console.error(`Error fetching booking categories:`, bcError);
          return { data: [], options: {} };
        }
        return { data: bcData || [], options: {} };

      case 'renters_payment_schedule':
        const { data: rpsData, error: rpsError } = await supabase.rpc('get_renters_payment_schedule_display', {
          tenant_uuid: tenantId
        });
        if (rpsError) {
          console.error(`Error fetching renters payment schedule:`, rpsError);
          return { data: [], options: {} };
        }
        return { data: rpsData || [], options: {} };

      default:
        console.error(`Unknown data type: ${dataType}`);
        return { data: [], options: {} };
    }
  } catch (error) {
    console.error(`Error in fetchTableDataWithTenant:`, error);
    return { data: [], options: {} };
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
  
  // Get tenant ID from cookies with explicit parameter approach
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('selectedTenantId')?.value || '00000000-0000-0000-0000-000000000001'
  
  const activeTab = resolvedSearchParams.tab || 'bank-transactions'
  
  // Fetch data from simplified database functions with explicit tenant parameters
  const [
    bankTransactionsResult,
    rentersResult,
    businessPartnersResult,
    bookingCategoriesResult,
    rentersPaymentScheduleResult
  ] = await Promise.all([
    fetchTableDataWithTenant(supabase, 'bank_transactions_display', tenantId),
    fetchTableDataWithTenant(supabase, 'renters_display', tenantId),
    fetchTableDataWithTenant(supabase, 'business_partners_display', tenantId),
    fetchTableDataWithTenant(supabase, 'booking_categories', tenantId),
    fetchTableDataWithTenant(supabase, 'renters_payment_schedule', tenantId)
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
        return { 
          data: bankTransactionsResult.data, 
          columns: bankTransactionColumns, 
          title: 'Bank Transactions',
          options: bankTransactionsResult.options
        }
      case 'renters':
        return { 
          data: rentersResult.data, 
          columns: renterColumns, 
          title: 'Renters',
          options: rentersResult.options
        }
      case 'business-partners':
        return { 
          data: businessPartnersResult.data, 
          columns: businessPartnerColumns, 
          title: 'Business Partners',
          options: businessPartnersResult.options
        }
      case 'booking-categories':
        return { 
          data: bookingCategoriesResult.data, 
          columns: bookingCategoryColumns, 
          title: 'Booking Categories',
          options: bookingCategoriesResult.options
        }
      case 'renters-payment-schedule':
        return { 
          data: rentersPaymentScheduleResult.data, 
          columns: rentersPaymentScheduleColumns, 
          title: 'Renters Payment Schedule',
          options: rentersPaymentScheduleResult.options
        }
      default:
        return { 
          data: bankTransactionsResult.data, 
          columns: bankTransactionColumns, 
          title: 'Bank Transactions',
          options: bankTransactionsResult.options
        }
    }
  }

  const { data, columns, title, options } = getDataForTab()

  // Debug: Log the data counts for troubleshooting
  console.log('Debug - Data counts:', {
    bankTransactions: bankTransactionsResult.data.length,
    renters: rentersResult.data.length,
    businessPartners: businessPartnersResult.data.length,
    bookingCategories: bookingCategoriesResult.data.length,
    rentersPaymentSchedule: rentersPaymentScheduleResult.data.length,
    activeTab,
    selectedData: data.length,
    tenantId,
    cookieValue: cookieStore.get('selectedTenantId')?.value,
    bookingCategoriesData: activeTab === 'booking-categories' ? bookingCategoriesResult.data.slice(0, 3) : 'not booking categories tab'
  })

  // Additional debug for client side
  const tenantIdForClient = tenantId || '00000000-0000-0000-0000-000000000001'

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
                      Data Table Overview
                    </p>
                  </div>

                  <SimpleDataGridWrapper
                    data={data}
                    columns={columns}
                    tableName={getTableNameForTab(activeTab)}
                    searchable={true}
                    paginated={true}
                    selectable={true}
                    pageSize={50}
                    options={options}
                    tenantId={tenantIdForClient}
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
