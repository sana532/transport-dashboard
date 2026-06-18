import { useState } from 'react'
import type { Vehicle } from '@/modules/vehicles/types'

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(false)

  return { vehicles, isLoading, setVehicles, setIsLoading }
}
