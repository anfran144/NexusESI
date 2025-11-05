"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DateRangePickerProps = {
  range?: DateRange
  onSelect?: (range: DateRange | undefined) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  className?: string
  minDate?: Date
  maxDate?: Date
}

export function DateRangePicker({
  range,
  onSelect,
  placeholder = "Seleccionar rango de fechas",
  disabled,
  minDate,
  maxDate,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Combinar disabled con minDate/maxDate solo si se proporcionan
  const isDateDisabled = React.useCallback(
    (date: Date) => {
      if (disabled && disabled(date)) return true
      if (minDate) {
        const min = new Date(minDate)
        min.setHours(0, 0, 0, 0)
        const dateToCheck = new Date(date)
        dateToCheck.setHours(0, 0, 0, 0)
        if (dateToCheck < min) return true
      }
      if (maxDate) {
        const max = new Date(maxDate)
        max.setHours(23, 59, 59, 999)
        const dateToCheck = new Date(date)
        dateToCheck.setHours(0, 0, 0, 0)
        if (dateToCheck > max) return true
      }
      return false
    },
    [disabled, minDate, maxDate]
  )

  // Manejar selección de rango
  const handleSelect = React.useCallback(
    (newRange: DateRange | undefined) => {
      if (onSelect) {
        onSelect(newRange)
      }
      // Cerrar el popover cuando se selecciona un rango completo
      if (newRange?.from && newRange?.to) {
        setIsOpen(false)
      }
    },
    [onSelect]
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !range?.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {range?.from ? (
            range.to ? (
              <>
                {format(range.from, "PPP", { locale: undefined })} -{" "}
                {format(range.to, "PPP", { locale: undefined })}
              </>
            ) : (
              format(range.from, "PPP", { locale: undefined })
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={range?.from}
          selected={range}
          onSelect={handleSelect}
          disabled={disabled && !minDate && !maxDate ? disabled : isDateDisabled}
          numberOfMonths={2}
          className="rounded-lg border shadow-sm"
        />
      </PopoverContent>
    </Popover>
  )
}
