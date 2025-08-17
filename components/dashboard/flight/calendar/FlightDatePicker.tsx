"use client"

import * as React from "react"
import { format } from "date-fns"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface FlightDatePickerProps {
  label: string
  selectedDate: Date | undefined
  onDateChange: (date: Date | undefined) => void
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function FlightDatePicker({
  label,
  selectedDate,
  onDateChange,
  minDate,
  maxDate,
  disabled = false,
  placeholder = "Select date",
  className,
}: FlightDatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div
      className={cn(
        "bg-muted border border-border rounded-lg p-2 md:p-4 flex flex-col justify-center min-h-[80px]",
        className,
        disabled && "opacity-50",
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            disabled={disabled}
            className="w-full h-full text-left p-0 justify-start font-normal hover:bg-transparent"
          >
            <div className="flex flex-col w-full">
              <span className="text-sm font-medium text-foreground mb-1">{label}</span>

              <div className={cn("text-lg font-bold", selectedDate ? "text-foreground" : "text-muted-foreground")}>
                {selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder}
              </div>

              {selectedDate && <span className="text-xs text-muted-foreground">{format(selectedDate, "EEEE")}</span>}
            </div>

            <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-0"
          align="center"
          side="right"
          sideOffset={-150}
          alignOffset={0}
          avoidCollisions={true}
          collisionPadding={16}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              onDateChange(date)
              setOpen(false)
            }}
            disabled={(date) => {
              if (disabled) return true
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            initialFocus
            className="rounded-md border-0"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
