import { AppSidebar } from "@/components/app-sidebar"
import { ColumnConfig, CellConfig } from "@/components/data-table"
import { CompanyProvider } from "@/components/company-context"
import { EditableDataTable } from "@/components/editable-data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/server"
import { z } from "zod"

// Define interfaces for each table based on the actual schema
interface BankTransaction {
  id: string;
  amount: number;
  payer: string;
  description: string;
  date: string;
  booking_category: string;
  partner: string;
}

interface BookingCategory {
  id: string;
  Name: string;
  "Business - Main Category": string;
  "Business - Sub Category": string;
  "Schedule E - ID": string;
  "Schedule C - ID": string;
  Comment: string;
}

interface Tenant {
  id: string;
  name_1: string;
  name_2: string;
  full_name: string;
  status: string;
  lease_start_date: string;
  lease_end_date: string;
  email: string;
  phone: string;
  cold_rent: number;
  total_rent: number;
}

interface BusinessPartner {
  id: string;
  name_1: string;
  name_2: string;
  full_name: string;
  status: string;
  business_type: string;
  contact_email: string;
  contact_phone: string;
  comment: string;
}

// Create column definitions for each table type
const createBankTransactionColumns = (
  bookingCategories: BookingCategory[], 
  tenants: Tenant[],
  businessPartners: BusinessPartner[]
): ColumnConfig<BankTransaction>[] => [
  {
    accessorKey: "description",
    header: "Description",
    cellConfig: {
      type: 'link',
      options: {
        titleField: 'description'
      }
    }
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cellConfig: {
      type: 'currency',
      options: {
        currency: 'USD'
      }
    }
  },
  {
    accessorKey: "payer",
    header: "Payer",
    cellConfig: {
      type: 'text',
      editable: true
    }
  },
  {
    accessorKey: "date",
    header: "Date",
    cellConfig: {
      type: 'date'
    }
  },
  {
    accessorKey: "booking_category",
    header: "Booking Category",
    cellConfig: {
      type: 'dropdown',
      editable: true,
      options: {
        items: bookingCategories.map(category => ({
          label: category.Name,
          value: category.Name
        }))
      }
    }
  },
  {
    accessorKey: "partner",
    header: "Partner",
    cellConfig: {
      type: 'dropdown',
      editable: true,
      options: {
        items: [
          ...tenants.map(tenant => ({
            label: `${tenant.full_name} (Tenant)`,
            value: tenant.full_name
          })),
          ...businessPartners.map(partner => ({
            label: `${partner.full_name} (Business)`,
            value: partner.full_name
          }))
        ]
      }
    }
  },
];

const createBookingCategoryColumns = (): ColumnConfig<BookingCategory>[] => [
  {
    accessorKey: "Name",
    header: "Name",
    cellConfig: {
      type: 'link',
      options: {
        titleField: 'Name'
      }
    }
  },
  {
    accessorKey: "Business - Main Category",
    header: "Main Category",
    cellConfig: {
      type: 'text',
      editable: true
    }
  },
  {
    accessorKey: "Business - Sub Category",
    header: "Sub Category",
    cellConfig: {
      type: 'text',
      editable: true
    }
  },
  {
    accessorKey: "Schedule E - ID",
    header: "Schedule E ID",
    cellConfig: {
      type: 'text'
    }
  },
  {
    accessorKey: "Schedule C - ID",
    header: "Schedule C ID",
    cellConfig: {
      type: 'text'
    }
  },
  {
    accessorKey: "Comment",
    header: "Comment",
    cellConfig: {
      type: 'text',
      editable: true
    }
  },
];

const createTenantsColumns = (): ColumnConfig<Tenant>[] => [
  {
    accessorKey: "full_name",
    header: "Full Name",
    cellConfig: {
      type: 'link',
      options: {
        titleField: 'full_name'
      }
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cellConfig: {
      type: 'text',
      editable: true
    }
  },
  {
    accessorKey: "email",
    header: "Email",
    cellConfig: {
      type: 'text',
      editable: true
    }
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cellConfig: {
      type: 'text',
      editable: true
    }
  },
  {
    accessorKey: "cold_rent",
    header: "Cold Rent",
    cellConfig: {
      type: 'currency',
      options: {
        currency: 'USD'
      }
    }
  },
  {
    accessorKey: "total_rent",
    header: "Total Rent",
    cellConfig: {
      type: 'currency',
      options: {
        currency: 'USD'
      }
    }
  },
  {
    accessorKey: "lease_start_date",
    header: "Lease Start",
    cellConfig: {
      type: 'date'
    }
  },
  {
    accessorKey: "lease_end_date",
    header: "Lease End",
    cellConfig: {
      type: 'date'
    }
  },
];

const createBusinessPartnersColumns = (): ColumnConfig<BusinessPartner>[] => [
  {
    accessorKey: "full_name",
    header: "Company Name",
    cellConfig: {
      type: 'link',
      options: {
        titleField: 'full_name'
      }
    }
  },
  {
    accessorKey: "business_type",
    header: "Business Type",
    cellConfig: {
      type: 'text',
      editable: true
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cellConfig: {
      type: 'text',
      editable: true
    }
  },
  {
    accessorKey: "contact_email",
    header: "Contact Email",
    cellConfig: {
      type: 'text',
      editable: true
    }
  },
  {
    accessorKey: "contact_phone",
    header: "Contact Phone",
    cellConfig: {
      type: 'text',
      editable: true
    }
  },
  {
    accessorKey: "comment",
    header: "Comment",
    cellConfig: {
      type: 'text',
      editable: true
    }
  },
];

// Helper function to ensure each item has a string ID
function ensureStringId<T extends Record<string, any>>(data: T[], idField: string = 'id'): (T & { id: string })[] {
  return data.map((item, index) => ({
    ...item,
    id: item[idField]?.toString() || (index + 1).toString()
  }));
}

export default async function RealEstateTables({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  // Await the searchParams
  const resolvedSearchParams = await searchParams
  // Create Supabase client
  const supabase = await createClient()
  
  // Get the active tab from URL parameters, default to 'booking-categories'
  const activeTab = resolvedSearchParams.tab || 'booking-categories'
  
  // Fetch data from Supabase tables
  const { data: bookingCategoriesData, error: bookingCategoriesError } = await supabase
    .from('booking_categories')
    .select('*')
    .limit(100)
  
  const { data: bankTransactionsData, error: bankTransactionsError } = await supabase
    .from('bank_transactions')
    .select('*')
    .limit(100)
  
  const { data: tenantsData, error: tenantsError } = await supabase
    .from('tenants')
    .select('*')
    .limit(100)
    
  const { data: businessPartnersData, error: businessPartnersError } = await supabase
    .from('business_partners')
    .select('*')
    .limit(100)
  
  // Prepare data for the DataTable component
  const processedBookingCategories = bookingCategoriesData 
    ? ensureStringId(bookingCategoriesData) 
    : [];
    
  const processedBankTransactions = bankTransactionsData 
    ? ensureStringId(bankTransactionsData) 
    : [];
    
  const processedTenants = tenantsData 
    ? ensureStringId(tenantsData) 
    : [];
    
  const processedBusinessPartners = businessPartnersData 
    ? ensureStringId(businessPartnersData) 
    : [];

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
                  {/* Display any errors at the top level */}
                  {(bookingCategoriesError || bankTransactionsError || tenantsError || businessPartnersError) && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                      <p className="font-bold">There were errors fetching data:</p>
                      <ul className="list-disc pl-5">
                        {bookingCategoriesError && <li>Booking Categories: {bookingCategoriesError.message}</li>}
                        {bankTransactionsError && <li>Bank Transactions: {bankTransactionsError.message}</li>}
                        {tenantsError && <li>Tenants: {tenantsError.message}</li>}
                        {businessPartnersError && <li>Business Partners: {businessPartnersError.message}</li>}
                      </ul>
                    </div>
                  )}
                  
                  {/* Conditional rendering based on active tab */}
                  {activeTab === 'booking-categories' && (
                    <div>
                      {bookingCategoriesError ? (
                        <div className="text-red-500">Error loading booking categories: {bookingCategoriesError.message}</div>
                      ) : (
                        <EditableDataTable 
                          data={processedBookingCategories} 
                          columns={createBookingCategoryColumns()}
                          tableName="booking_categories"
                          bookingCategories={processedBookingCategories}
                          partners={[...processedTenants, ...processedBusinessPartners]}
                        />
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'bank-transactions' && (
                    <div>
                      {bankTransactionsError ? (
                        <div className="text-red-500">Error loading bank transactions: {bankTransactionsError.message}</div>
                      ) : (
                        <EditableDataTable 
                          data={processedBankTransactions} 
                          columns={createBankTransactionColumns(processedBookingCategories, processedTenants, processedBusinessPartners)}
                          tableName="bank_transactions"
                          bookingCategories={processedBookingCategories}
                          partners={[...processedTenants, ...processedBusinessPartners]}
                        />
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'tenants' && (
                    <div>
                      {tenantsError ? (
                        <div className="text-red-500">Error loading tenants: {tenantsError.message}</div>
                      ) : (
                        <EditableDataTable 
                          data={processedTenants} 
                          columns={createTenantsColumns()}
                          tableName="tenants"
                          bookingCategories={processedBookingCategories}
                          partners={[...processedTenants, ...processedBusinessPartners]}
                        />
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'business-partners' && (
                    <div>
                      {businessPartnersError ? (
                        <div className="text-red-500">Error loading business partners: {businessPartnersError.message}</div>
                      ) : (
                        <EditableDataTable 
                          data={processedBusinessPartners} 
                          columns={createBusinessPartnersColumns()}
                          tableName="business_partners"
                          bookingCategories={processedBookingCategories}
                          partners={[...processedTenants, ...processedBusinessPartners]}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </CompanyProvider>
  )
}
