import { useNavigate } from 'react-router-dom'
import { paths } from '@/routes/paths'
import { Button } from '@/shared/ui/Button'

export function TripsToolbar() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Manage scheduled and active trips.
      </p>
      <Button type="button" onClick={() => navigate(paths.company.tripNew)}>
        Add trip
      </Button>
    </div>
  )
}
