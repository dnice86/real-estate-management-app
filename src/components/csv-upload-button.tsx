"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { IconUpload } from "@tabler/icons-react"
import { CsvUploadDialog } from "./csv-upload-dialog"

interface CsvUploadButtonProps {
  tenantId: string
  onImportComplete?: () => void
}

export function CsvUploadButton({ tenantId, onImportComplete }: CsvUploadButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="h-8"
      >
        <IconUpload size={16} className="mr-2" />
        Import CSV
      </Button>

      <CsvUploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        tenantId={tenantId}
        onImportComplete={onImportComplete}
      />
    </>
  )
}
