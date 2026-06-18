import { useState } from 'react'
import type { Driver } from '@/modules/drivers/types'

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(false)

  return { drivers, isLoading, setDrivers, setIsLoading }
}
