import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import { PromoLifecycleBadge } from '@/modules/promo-codes/components/PromoLifecycleBadge'
import { usePlatformPromoCodes } from '@/modules/promo-codes/hooks/usePlatformPromoCodes'
import { promoDisplayName } from '@/modules/promo-codes/utils/mapCompanyPromoCode'
import { formatPromoDate } from '@/modules/promo-codes/utils/promoCodeDates'
import { paths } from '@/routes/paths'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { cn } from '@/shared/utils/cn'

const createBtnClass = cn(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold',
  'bg-[#2F3E1F] text-white shadow-sm hover:bg-[#243217]',
)

const iconBtnClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary'

export function PlatformPromoCodesPage() {
  const { t, locale } = useTranslation()
  const { data, isLoading, error, reload, deletePromoCode } = usePlatformPromoCodes()
  const [actionError, setActionError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const list = data?.promoCodes ?? []
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((promo) =>
      [promo.code, promo.nameEn, promo.nameAr].some((v) => v.toLowerCase().includes(q)),
    )
  }, [data, query])

  async function handleDelete(id: number, code: string) {
    if (!window.confirm(t('admin.promoCodes.confirmDelete', { code }))) return
    setActionError(null)
    try {
      await deletePromoCode(id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('admin.promoCodes.errorDelete'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t('admin.nav.offers')}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--title-h1)]">
            {t('admin.sidebar.promoCodes')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            {t('admin.promoCodes.subtitle')}
          </p>
        </div>
        <Link to={paths.admin.promoCodeNew} className={createBtnClass}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('admin.promoCodes.add')}
        </Link>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      {error ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
            <Button
              type="button"
              onClick={() => void reload()}
              className="bg-[#2F3E1F] text-white hover:bg-[#243217]"
            >
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2F3E1F]/10 text-[#2F3E1F]">
                <Tag className="h-5 w-5" aria-hidden />
              </span>
              <CardTitle className="text-lg">{t('admin.promoCodes.listTitle')}</CardTitle>
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('promoCodes.searchPlaceholder')}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm sm:max-w-xs"
            />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-text-muted">{t('common.loading')}</p>
            ) : rows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
                <p className="text-sm text-text-muted">{t('admin.promoCodes.empty')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="app-table w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/50 text-xs uppercase tracking-wide text-text-muted">
                      <th className="px-4 py-3 text-start font-semibold">{t('promoCodes.col.code')}</th>
                      <th className="px-3 py-3 text-start font-semibold">{t('promoCodes.col.name')}</th>
                      <th className="px-3 py-3 text-start font-semibold">{t('admin.promoCodes.colValue')}</th>
                      <th className="px-3 py-3 text-start font-semibold">{t('admin.promoCodes.colValidTo')}</th>
                      <th className="px-3 py-3 text-start font-semibold">{t('common.status')}</th>
                      <th className="px-3 py-3 text-end font-semibold">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((promo) => (
                      <tr key={promo.id} className="border-b border-surface-muted last:border-0">
                        <td className="px-4 py-3 font-mono text-xs font-medium">{promo.code}</td>
                        <td className="px-3 py-3">{promoDisplayName(promo, locale)}</td>
                        <td className="px-3 py-3 text-text-secondary">
                          {promo.type === 'percentage' || promo.type === 'percent'
                            ? `${promo.value}%`
                            : String(promo.value)}
                        </td>
                        <td className="px-3 py-3 text-text-secondary">
                          {formatPromoDate(promo.validTo, locale === 'ar' ? 'ar-SY' : 'en-US')}
                        </td>
                        <td className="px-3 py-3">
                          <PromoLifecycleBadge promo={promo} />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={paths.admin.promoCodeEdit(String(promo.id))}
                              className={iconBtnClass}
                              title={t('common.edit')}
                              aria-label={t('promoCodes.aria.edit', { code: promo.code })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              className={cn(iconBtnClass, 'hover:border-red-200 hover:text-red-700')}
                              title={t('common.delete')}
                              aria-label={t('promoCodes.aria.delete', { code: promo.code })}
                              onClick={() => void handleDelete(promo.id, promo.code)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
