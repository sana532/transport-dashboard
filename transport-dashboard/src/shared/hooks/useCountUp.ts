import { useEffect, useState } from 'react'

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

type UseCountUpOptions = {
  duration?: number
  enabled?: boolean
}

export function useCountUp(target: number, options?: UseCountUpOptions): number {
  const { duration = 900, enabled = true } = options ?? {}
  const [value, setValue] = useState(enabled ? 0 : target)

  useEffect(() => {
    if (!enabled || !Number.isFinite(target)) {
      setValue(target)
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }

    let frame = 0
    let start: number | null = null

    const tick = (timestamp: number) => {
      if (start == null) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      setValue(Math.round(target * easeOutCubic(progress)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    setValue(0)
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, enabled])

  return value
}
