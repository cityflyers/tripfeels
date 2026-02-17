'use client'

import { Pencil, UserRoundPlus, X } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { type TravellerFormData } from '@/lib/utils/validation'

import { TravellerForm } from './TravellerForm'
import { type Traveller } from './TravellersList'

interface TravellerFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TravellerFormData) => void
  initialData?: Traveller | null
  isEditing?: boolean
}

export function TravellerFormModal({
  open,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
}: TravellerFormModalProps) {
  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const title = isEditing ? 'Edit Traveller' : 'Add Traveller'

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm p-3 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <div className="h-full w-full flex items-center justify-center">
        <div
          className="w-full max-w-5xl max-h-[90vh] rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-component-bg)] shadow-2xl overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="sticky top-0 z-10 border-b border-[var(--tf-border)] bg-[var(--tf-component-bg)] backdrop-blur-sm px-4 md:px-6 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  {isEditing ? <Pencil className="h-4 w-4" /> : <UserRoundPlus className="h-4 w-4" />}
                </span>
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-[var(--tf-text-primary)]">
                    {title}
                  </h2>
                  <p className="text-xs text-[var(--tf-text-secondary)]">
                    Fill traveller details clearly before saving.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-[var(--tf-text-secondary)] hover:text-[var(--tf-text-primary)]"
                aria-label="Close traveller form"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-72px)]">
            <TravellerForm
              onSubmit={onSubmit}
              onCancel={onClose}
              initialData={initialData}
              isEditing={isEditing}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
