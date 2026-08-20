import { useTranslation } from '@/shared/i18n/useTranslation'

const selectClass =
  'h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted'

export type TripResourceSelectOption = {
  id: string
  label: string
  hint?: string
}

type TripResourceSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  available: TripResourceSelectOption[]
  unavailable: TripResourceSelectOption[]
  disabled?: boolean
  loading?: boolean
  hint?: string
  error?: string
  emptyAvailableHint?: string
}

export function TripResourceSelect({
  label,
  value,
  onChange,
  placeholder,
  available,
  unavailable,
  disabled = false,
  loading = false,
  hint,
  error,
  emptyAvailableHint,
}: TripResourceSelectProps) {
  const { t } = useTranslation()
  const showGroups = unavailable.length > 0

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      <select
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={disabled}
        aria-busy={loading || undefined}
        aria-invalid={error ? true : undefined}
      >
        <option value="">{placeholder}</option>
        {showGroups ? (
          <>
            <optgroup label={t('tripForm.availability.availableGroup')}>
              {available.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </optgroup>
            <optgroup label={t('tripForm.availability.unavailableGroup')}>
              {unavailable.map((item) => (
                <option key={item.id} value={item.id} disabled title={item.hint}>
                  {item.hint ? `${item.label} — ${item.hint}` : item.label}
                </option>
              ))}
            </optgroup>
          </>
        ) : (
          available.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))
        )}
      </select>
      {loading ? (
        <p className="text-xs text-text-muted">{t('tripForm.availability.checking')}</p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
      {!loading && available.length === 0 && emptyAvailableHint ? (
        <p className="text-xs text-amber-800">{emptyAvailableHint}</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
