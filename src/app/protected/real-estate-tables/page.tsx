import { AppSidebar } from "@/components/app-sidebar"
import { DataTable, schema } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/server"
import { ColumnDef } from "@tanstack/react-table"
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

// Define column definitions for each table
const bankTransactionsColumns: ColumnDef<BankTransaction>[] = [
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "payer",
    header: "Payer",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "booking_category",
    header: "Booking Category",
  },
  {
    accessorKey: "partner",
    header: "Partner",
  },
]

const bookingCategoriesColumns: ColumnDef<BookingCategory>[] = [
  {
    accessorKey: "Name",
    header: "Name",
  },
  {
    accessorKey: "Business - Main Category",
    header: "Business - Main Category",
  },
  {
    accessorKey: "Business - Sub Category",
    header: "Business - Sub Category",
  },
  {
    accessorKey: "Schedule E - ID",
    header: "Schedule E - ID",
  },
  {
    accessorKey: "Schedule C - ID",
    header: "Schedule C - ID",
  },
  {
    accessorKey: "Comment",
    header: "Comment",
  },
]

const partnerColumns: ColumnDef<Partner>[] = [
  {
    accessorKey: "full_name",
    header: "Full Name",
  },
  {
    accessorKey: "name_1",
    header: "Name 1",
  },
  {
    accessorKey: "name_2",
    header: "Name 2",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "comment",
    header: "Comment",
  },
]


// Type for the expected DataTable row structure
type DataTableRow = z.infer<typeof schema>

// Function to format booking categories data for the DataTable component
function formatBookingCategoriesForTable(data: BookingCategory[]): DataTableRow[] {
  return data.map((item, index) => ({
    id: index + 1,
    header: item.Name || '',
    type: item["Business - Main Category"] || '',
    status: item["Business - Sub Category"] || '',
    target: item["Schedule E - ID"] || '',
    limit: item["Schedule C - ID"] || '',
    reviewer: item.Comment || ''
  }));
}

// Function to format bank transactions data for the DataTable component
function formatBankTransactionsForTable(data: BankTransaction[]): DataTableRow[] {
  return data.map((item, index) => ({
    id: index + 1,
    header: item.description || '',
    type: item.booking_category || '',
    status: item.payer || '',
    target: item.amount?.toString() || '',
    limit: item.date || '',
    reviewer: item.partner || ''
  }));
}

// Function to format partner data for the DataTable component
function formatPartnersForTable(data: Partner[]): DataTableRow[] {
  return data.map((item, index) => ({
    id: index + 1,
    header: item.full_name || '',
    type: item.category || '',
    status: item.status || '',
    target: item.name_1 || '',
    limit: item.name_2 || '',
    reviewer: item.comment || ''
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
  
  // Format data for the DataTable component
  const formattedBookingCategories = bookingCategoriesData 
    ? formatBookingCategoriesForTable(bookingCategoriesData) 
    : [];
    
  const formattedBankTransactions = bankTransactionsData 
    ? formatBankTransactionsForTable(bankTransactionsData) 
    : [];
    
  const formattedPartners = partnerData 
    ? formatPartnersForTable(partnerData) 
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
                      <DataTable data={formattedBookingCategories} />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="bank-transactions">
                    {bankTransactionsError ? (
                      <div className="text-red-500">Error loading bank transactions: {bankTransactionsError.message}</div>
                    ) : (
                      <DataTable data={formattedBankTransactions} />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="partners">
                    {partnerError ? (
                      <div className="text-red-500">Error loading partners: {partnerError.message}</div>
                    ) : (
                      <DataTable data={formattedPartners} />
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
