import { useCountUp } from '@/shared/hooks/useCountUp'

type CountUpProps = {
  value: string
  className?: string
}

export function CountUp({ value, className }: CountUpProps) {
  const numeric = Number(value)
  const animated = useCountUp(Number.isFinite(numeric) ? numeric : 0, {
    enabled: Number.isFinite(numeric),
  })

  return (
    <span className={className}>{Number.isFinite(numeric) ? animated : value}</span>
  )
}
