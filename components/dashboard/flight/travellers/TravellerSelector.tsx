"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TravellerSelectorProps {
  onDone: (data: TravellerData) => void
  initialData?: TravellerData
}

export interface TravellerData {
  adults: number
  kids: number
  children: number
  infants: number
  travelClass: "Economy" | "Business" | "First Class"
}

const defaultTravellerData: TravellerData = {
  adults: 1,
  kids: 0,
  children: 0,
  infants: 0,
  travelClass: "Economy",
}

const MAX_TOTAL_TRAVELLERS = 9

const NumberSelector: React.FC<{
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  options?: number[]
  ageRange?: string
}> = ({ label, value, onChange, min, max, options, ageRange }) => {
  const numbers = options || Array.from({ length: max - min + 1 }, (_, i) => min + i)
  return (
    <div className="mb-2">
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
        {ageRange && <span className="text-xs text-muted-foreground ml-1">({ageRange})</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {numbers.map((num) => (
          <Button
            key={num}
            variant={value === num ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(num)}
            className="w-9 h-9 p-0 rounded-md"
          >
            {num}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function TravellerSelector({ onDone, initialData = defaultTravellerData }: TravellerSelectorProps) {
  const [data, setData] = React.useState<TravellerData>(initialData)
  const [open, setOpen] = React.useState(false)

  const handleNumberChange = (
    fieldToUpdate: keyof Pick<TravellerData, "adults" | "kids" | "children" | "infants">,
    valueFromSelector: number,
  ) => {
    setData((currentData) => {
      const proposedData = { ...currentData, [fieldToUpdate]: valueFromSelector }
      const totalPassengers = proposedData.adults + proposedData.kids + proposedData.children + proposedData.infants

      if (totalPassengers > MAX_TOTAL_TRAVELLERS) {
        let excess = totalPassengers - MAX_TOTAL_TRAVELLERS
        const reductionPriority: (keyof Pick<TravellerData, "adults" | "kids" | "children" | "infants">)[] = [
          "infants",
          "kids",
          "children",
          "adults",
        ]

        for (const field of reductionPriority) {
          if (excess === 0) break
          if (field === fieldToUpdate) continue

          const currentValueForField = proposedData[field]
          const amountCanReduce = Math.min(currentValueForField, excess)

          if (amountCanReduce > 0) {
            proposedData[field] -= amountCanReduce
            excess -= amountCanReduce
          }
        }

        if (excess > 0) {
          proposedData[fieldToUpdate] -= excess
          if (proposedData[fieldToUpdate] < 0) {
            proposedData[fieldToUpdate] = 0
          }
        }
      }
      return proposedData
    })
  }

  const handleClassChange = (val: TravellerData["travelClass"]) => {
    setData((prev) => ({ ...prev, travelClass: val }))
  }

  const { adults, kids, children, infants } = data

  const calculateOptions = (
    currentValueForField: number,
    individualMax: number,
    sumOfOthers: number,
    isAdult: boolean,
  ) => {
    const maxAllowedByTotal = MAX_TOTAL_TRAVELLERS - sumOfOthers
    const actualMaxForSelector = Math.min(individualMax, maxAllowedByTotal)

    if (actualMaxForSelector < (isAdult ? 0 : 1) && currentValueForField > 0) {
      return []
    }

    const startNum = isAdult ? 0 : 1
    const length = Math.max(0, actualMaxForSelector - startNum + 1)

    if (actualMaxForSelector < startNum && !isAdult) return []

    return Array.from({ length }, (_, i) => startNum + i)
  }

  const adultOptions = calculateOptions(adults, 9, children + kids + infants, true)
  const childrenOptions = calculateOptions(children, 5, adults + kids + infants, false)
  const kidsOptions = calculateOptions(kids, 5, adults + children + infants, false)
  // Infants cannot exceed adults, cannot exceed 3, and total passengers cannot exceed 9
  const totalNonInfant = adults + children;
  const maxInfants = Math.min(3, adults, 9 - totalNonInfant);
  const infantOptions = Array.from({ length: Math.max(0, maxInfants) + 1 }, (_, i) => i);

  const handleReset = () => {
    setData(defaultTravellerData)
  }

  const totalTravellers = data.adults + data.kids + data.children + data.infants

  return (
    <div className="bg-background text-foreground">
      <NumberSelector
        label="Adults"
        ageRange="12+ Years or above"
        value={data.adults}
        onChange={(val) => handleNumberChange("adults", val)}
        min={0}
        max={9}
        options={adultOptions}
      />
      <NumberSelector
        label="Children"
        ageRange="2-11 Years"
        value={data.children}
        onChange={(val) => handleNumberChange("children", val)}
        min={0}
        max={5}
        options={childrenOptions}
      />
      <NumberSelector
        label="Infants"
        ageRange="0-2 Years"
        value={data.infants}
        onChange={(val) => handleNumberChange("infants", val)}
        min={0}
        max={maxInfants}
        options={infantOptions}
      />

      <div className="mb-3">
        <label className="block text-sm font-medium text-foreground mb-2">Travel Class</label>
        <div className="flex gap-2">
          {(["Economy", "Business", "First Class"] as TravellerData["travelClass"][]).map((tc) => (
            <Button
              key={tc}
              variant={data.travelClass === tc ? "default" : "outline"}
              size="sm"
              onClick={() => handleClassChange(tc)}
              className="flex-1"
            >
              {tc}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={() => onDone(data)}>Done</Button>
      </div>
    </div>
  )
}