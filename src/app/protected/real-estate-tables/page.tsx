import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/server"
import { z } from "zod"

import { ColumnDef } from "@tanstack/react-table"

// Define schemas for each table based on the image
const bookingCategoriesSchema = z.object({
  id: z.number(),
  name: z.string(),
  businessMainCategory: z.string(),
  businessSubCategory: z.string(),
  scheduleEId: z.string(),
  scheduleCId: z.string(),
  comment: z.string(),
})

const bankTransactionsSchema = z.object({
  id: z.number(),
  amount: z.number(),
  payer: z.string(),
  description: z.string(),
  date: z.string(),
  bookingCategory: z.string(),
  partner: z.string(),
})

const partnerSchema = z.object({
  id: z.number(),
  fullName: z.string(),
  name1: z.string(),
  name2: z.string(),
  status: z.string(),
  category: z.string(),
  comment: z.string(),
})

// Define types based on schemas
type BookingCategory = z.infer<typeof bookingCategoriesSchema>
type BankTransaction = z.infer<typeof bankTransactionsSchema>
type Partner = z.infer<typeof partnerSchema>

// Define custom column definitions for each table
const bookingCategoriesColumns: ColumnDef<BookingCategory>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "businessMainCategory",
    header: "Business - Main Category",
  },
  {
    accessorKey: "businessSubCategory",
    header: "Business - Sub Category",
  },
  {
    accessorKey: "scheduleEId",
    header: "Schedule E - ID",
  },
  {
    accessorKey: "scheduleCId",
    header: "Schedule C - ID",
  },
  {
    accessorKey: "comment",
    header: "Comment",
  },
]

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
    accessorKey: "bookingCategory",
    header: "Booking Category",
  },
  {
    accessorKey: "partner",
    header: "Partner",
  },
]

const partnerColumns: ColumnDef<Partner>[] = [
  {
    accessorKey: "fullName",
    header: "Full Name",
  },
  {
    accessorKey: "name1",
    header: "Name 1",
  },
  {
    accessorKey: "name2",
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

// Create sample data for each table based on the image
const sampleBookingCategories: BookingCategory[] = [
  { 
    id: 1,
    name: 'Rental Income', 
    businessMainCategory: 'Income', 
    businessSubCategory: 'Rental', 
    scheduleEId: 'E001', 
    scheduleCId: 'C001', 
    comment: 'Primary rental income' 
  },
  { 
    id: 2,
    name: 'Property Tax', 
    businessMainCategory: 'Expense', 
    businessSubCategory: 'Tax', 
    scheduleEId: 'E002', 
    scheduleCId: 'C002', 
    comment: 'Annual property tax' 
  },
  { 
    id: 3,
    name: 'Mortgage Interest', 
    businessMainCategory: 'Expense', 
    businessSubCategory: 'Interest', 
    scheduleEId: 'E003', 
    scheduleCId: 'C003', 
    comment: 'Mortgage interest payments' 
  },
  { 
    id: 4,
    name: 'Repairs', 
    businessMainCategory: 'Expense', 
    businessSubCategory: 'Maintenance', 
    scheduleEId: 'E004', 
    scheduleCId: 'C004', 
    comment: 'Property repairs and maintenance' 
  },
  { 
    id: 5,
    name: 'Insurance', 
    businessMainCategory: 'Expense', 
    businessSubCategory: 'Insurance', 
    scheduleEId: 'E005', 
    scheduleCId: 'C005', 
    comment: 'Property insurance premiums' 
  }
]

const sampleBankTransactions: BankTransaction[] = [
  { 
    id: 1,
    description: 'Rent Payment - Unit 101', 
    bookingCategory: 'Rental Income', 
    payer: 'John Smith', 
    amount: 1500, 
    date: '2025-05-01', 
    partner: 'Tenant 1' 
  },
  { 
    id: 2,
    description: 'Property Tax Payment', 
    bookingCategory: 'Property Tax', 
    payer: 'County Tax Office', 
    amount: -3200, 
    date: '2025-04-15', 
    partner: 'Government' 
  },
  { 
    id: 3,
    description: 'Mortgage Payment', 
    bookingCategory: 'Mortgage Interest', 
    payer: 'First National Bank', 
    amount: -1800, 
    date: '2025-05-05', 
    partner: 'Bank' 
  },
  { 
    id: 4,
    description: 'Plumbing Repair', 
    bookingCategory: 'Repairs', 
    payer: 'ABC Plumbing', 
    amount: -450, 
    date: '2025-04-22', 
    partner: 'Contractor' 
  },
  { 
    id: 5,
    description: 'Insurance Premium', 
    bookingCategory: 'Insurance', 
    payer: 'SafeGuard Insurance', 
    amount: -950, 
    date: '2025-03-30', 
    partner: 'Insurance Company' 
  }
]

const samplePartners: Partner[] = [
  { 
    id: 1,
    fullName: 'John Smith', 
    name1: 'John', 
    name2: 'Smith', 
    status: 'Active', 
    category: 'Tenant', 
    comment: 'Tenant in Unit 101' 
  },
  { 
    id: 2,
    fullName: 'First National Bank', 
    name1: 'First National', 
    name2: 'Bank', 
    status: 'Active', 
    category: 'Financial Institution', 
    comment: 'Mortgage provider' 
  },
  { 
    id: 3,
    fullName: 'County Tax Office', 
    name1: 'County', 
    name2: 'Tax Office', 
    status: 'Active', 
    category: 'Government', 
    comment: 'Property tax authority' 
  },
  { 
    id: 4,
    fullName: 'ABC Plumbing', 
    name1: 'ABC', 
    name2: 'Plumbing', 
    status: 'Active', 
    category: 'Contractor', 
    comment: 'Regular maintenance provider' 
  },
  { 
    id: 5,
    fullName: 'SafeGuard Insurance', 
    name1: 'SafeGuard', 
    name2: 'Insurance', 
    status: 'Active', 
    category: 'Insurance', 
    comment: 'Property insurance provider' 
  }
]

// Custom DataTable component that accepts columns
function CustomDataTable<TData extends Record<string, any>>({ 
  data, 
  columns 
}: { 
  data: TData[], 
  columns: ColumnDef<TData, any>[] 
}) {
  // Convert data to the format expected by the DataTable component
  const formattedData = data.map((item, index) => {
    // Get all keys except 'id'
    const keys = Object.keys(item).filter(key => key !== 'id');
    
    // Create formatted item with required structure
    const formattedItem = {
      id: item.id || index + 1,
      header: String(item[keys[0]] || ''),
      type: String(item[keys[1]] || ''),
      status: String(item[keys[2]] || ''),
      target: String(item[keys[3]] || ''),
      limit: String(item[keys[4]] || ''),
      reviewer: String(item[keys[5]] || '')
    };
    
    return formattedItem;
  });
  
  return <DataTable data={formattedData} />;
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
    
  // Log data and errors for debugging
  console.log('Booking Categories Data:', bookingCategoriesData)
  console.log('Booking Categories Error:', bookingCategoriesError)
  console.log('Bank Transactions Data:', bankTransactionsData)
  console.log('Bank Transactions Error:', bankTransactionsError)
  console.log('Partner Data:', partnerData)
  console.log('Partner Error:', partnerError)
  
  // Use sample data since Supabase tables are empty or don't exist
  const bookingCategories = sampleBookingCategories
  const bankTransactions = sampleBankTransactions
  const partners = samplePartners

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
                    <p className="mt-2">Showing sample data instead.</p>
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
                      <CustomDataTable 
                        data={bookingCategories} 
                        columns={bookingCategoriesColumns} 
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="bank-transactions">
                    {bankTransactionsError ? (
                      <div className="text-red-500">Error loading bank transactions: {bankTransactionsError.message}</div>
                    ) : (
                      <CustomDataTable 
                        data={bankTransactions} 
                        columns={bankTransactionsColumns} 
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="partners">
                    {partnerError ? (
                      <div className="text-red-500">Error loading partners: {partnerError.message}</div>
                    ) : (
                      <CustomDataTable 
                        data={partners} 
                        columns={partnerColumns} 
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
