"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  className?: string
  minDate?: Date
  maxDate?: Date
  defaultMonth?: Date
}

export function DatePicker({
  selected,
  onSelect,
  placeholder = "Seleccionar fecha",
  disabled,
  className,
  minDate,
  maxDate,
  defaultMonth,
}: DatePickerProps) {
  // Combinar disabled con minDate/maxDate
  const isDateDisabled = React.useCallback(
    (date: Date) => {
      if (disabled && disabled(date)) return true
      if (minDate && date < minDate) return true
      if (maxDate && date > maxDate) return true
      // Prevenir fechas muy antiguas por defecto
      if (date < new Date('1900-01-01')) return true
      return false
    },
    [disabled, minDate, maxDate]
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? (
            format(selected, "PPP", { locale: undefined })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          defaultMonth={defaultMonth || selected}
          selected={selected}
          onSelect={onSelect}
          disabled={isDateDisabled}
          captionLayout="dropdown"
          className="rounded-lg border shadow-sm"
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
