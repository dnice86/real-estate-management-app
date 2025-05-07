import { AppSidebar } from "@/components/app-sidebar"
import { ColumnConfig, CellConfig } from "@/components/data-table"
import { EditableDataTable } from "@/components/editable-data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

interface Partner {
  id: string;
  name_1: string;
  name_2: string;
  status: string;
  category: string;
  full_name: string;
  comment: string;
}


// Create column definitions for each table type
const createBankTransactionColumns = (): ColumnConfig<BankTransaction>[] => [
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
      type: 'text',
      editable: true
    }
  },
  {
    accessorKey: "partner",
    header: "Partner",
    cellConfig: {
      type: 'text',
      editable: true
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

const createPartnerColumns = (): ColumnConfig<Partner>[] => [
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
    accessorKey: "name_1",
    header: "Name 1",
    cellConfig: {
      type: 'text',
      editable: true
    }
  },
  {
    accessorKey: "name_2",
    header: "Name 2",
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
    accessorKey: "category",
    header: "Category",
    cellConfig: {
      type: 'text'
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


export default async function RealEstateTables() {
  // Create Supabase client
  const supabase = await createClient()
  
  // Fetch data from Supabase tables
  const { data: bookingCategoriesData, error: bookingCategoriesError } = await supabase
    .from('booking_categories')
    .select('*')
    .limit(100)
  
  const { data: bankTransactionsData, error: bankTransactionsError } = await supabase
    .from('bank_transactions')
    .select('*')
    .limit(100)
  
  const { data: partnerData, error: partnerError } = await supabase
    .from('partner')
    .select('*')
    .limit(100)
  
  // Prepare data for the DataTable component
  const processedBookingCategories = bookingCategoriesData 
    ? ensureStringId(bookingCategoriesData) 
    : [];
    
  const processedBankTransactions = bankTransactionsData 
    ? ensureStringId(bankTransactionsData) 
    : [];
    
  const processedPartners = partnerData 
    ? ensureStringId(partnerData) 
    : [];

  return (
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
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-bold mb-4">Real Estate Management</h1>
                
                
                {/* Display any errors at the top level */}
                {(bookingCategoriesError || bankTransactionsError || partnerError) && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    <p className="font-bold">There were errors fetching data:</p>
                    <ul className="list-disc pl-5">
                      {bookingCategoriesError && <li>Booking Categories: {bookingCategoriesError.message}</li>}
                      {bankTransactionsError && <li>Bank Transactions: {bankTransactionsError.message}</li>}
                      {partnerError && <li>Partners: {partnerError.message}</li>}
                    </ul>
                  </div>
                )}
                
                <Tabs defaultValue="booking-categories" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="booking-categories">Booking Categories</TabsTrigger>
                    <TabsTrigger value="bank-transactions">Bank Transactions</TabsTrigger>
                    <TabsTrigger value="partners">Partners</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="booking-categories">
                    {bookingCategoriesError ? (
                      <div className="text-red-500">Error loading booking categories: {bookingCategoriesError.message}</div>
                    ) : (
                      <EditableDataTable 
                        data={processedBookingCategories} 
                        columns={createBookingCategoryColumns()}
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="bank-transactions">
                    {bankTransactionsError ? (
                      <div className="text-red-500">Error loading bank transactions: {bankTransactionsError.message}</div>
                    ) : (
                      <EditableDataTable 
                        data={processedBankTransactions} 
                        columns={createBankTransactionColumns()}
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="partners">
                    {partnerError ? (
                      <div className="text-red-500">Error loading partners: {partnerError.message}</div>
                    ) : (
                      <EditableDataTable 
                        data={processedPartners} 
                        columns={createPartnerColumns()}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
