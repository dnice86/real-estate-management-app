"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname, useSearchParams } from "next/navigation"
import { Upload } from "lucide-react"
import { useState } from "react"
import { CsvUploadBankTransactions } from "@/components/csv-upload-bank-transactions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function SiteHeader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  
  // Determine the page title based on the current route
  const getPageTitle = () => {
    if (pathname.includes('/protected/simple-tables')) {
      switch (currentTab) {
        case 'booking-categories':
          return 'Booking Categories'
        case 'bank-transactions':
          return 'Bank Transactions'
        case 'partners':
          return 'Partners'
        default:
          return 'Real Estate Management'
      }
    }
    return 'Documents'
  }

  // Check if we should show the Import CSV button
  const showImportButton = pathname.includes('/protected/simple-tables') && currentTab === 'bank-transactions'

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{getPageTitle()}</h1>
        <div className="ml-auto flex items-center gap-2">
          {showImportButton && (
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Import Bank Transactions</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to import bank transactions into your database.
                  </DialogDescription>
                </DialogHeader>
                <CsvUploadBankTransactions />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  )
}
