import { useState, type FormEvent } from 'react'
import { FolderTree, ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import type { ComplaintCategory } from '@/modules/complaints/types'
import type { PlatformComplaintCategoryInput } from '@/modules/complaints/services/platformComplaintsService'
import { usePlatformComplaintCategories } from '@/modules/complaints/hooks/usePlatformComplaintCategories'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { cn } from '@/shared/utils/cn'
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl'

const createBtnClass = cn(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold',
  'bg-[#2F3E1F] text-white shadow-sm hover:bg-[#243217]',
)

const iconBtnClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

const VISIBILITY_SCOPES = ['company_and_platform', 'platform_only'] as const

type CategoryFormState = {
  nameEn: string
  nameAr: string
  iconUrl: string
  visibilityScope: string
  isActive: boolean
}

const emptyForm: CategoryFormState = {
  nameEn: '',
  nameAr: '',
  iconUrl: '',
  visibilityScope: 'company_and_platform',
  isActive: true,
}

function categoryToForm(category: ComplaintCategory): CategoryFormState {
  return {
    nameEn: category.nameEn,
    nameAr: category.nameAr,
    iconUrl: category.iconUrl ?? '',
    visibilityScope: category.visibilityScope || 'company_and_platform',
    isActive: category.isActive !== false,
  }
}

function formToInput(form: CategoryFormState): PlatformComplaintCategoryInput {
  return {
    name_en: form.nameEn.trim(),
    name_ar: form.nameAr.trim(),
    icon_url: form.iconUrl.trim() || null,
    visibility_scope: form.visibilityScope,
    is_active: form.isActive,
  }
}

export function PlatformComplaintCategoriesPage() {
  const { t } = useTranslation()
  const confirm = useConfirmDialog()
  const {
    categories,
    isLoading,
    error,
    reload,
    createCategory,
    updateCategory,
    deleteCategory,
  } = usePlatformComplaintCategories()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CategoryFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const isEditing = editingId !== null

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(category: ComplaintCategory) {
    setEditingId(category.id)
    setForm(categoryToForm(category))
    setFormError(null)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (!form.nameEn.trim() || !form.nameAr.trim()) {
      setFormError(t('admin.complaintCategories.form.requiredNames'))
      return
    }

    setPending(true)
    try {
      const input = formToInput(form)
      if (isEditing && editingId !== null) {
        await updateCategory(editingId, input)
      } else {
        await createCategory(input)
      }
      closeDialog()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('admin.complaintCategories.errorSave'))
    } finally {
      setPending(false)
    }
  }

  async function handleDelete(category: ComplaintCategory) {
    await confirm({
      title: t('common.confirmDeleteTitle'),
      description: t('admin.complaintCategories.confirmDelete', { name: category.label }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
      action: async () => {
        setActionError(null)
        await deleteCategory(category.id)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t('admin.nav.support')}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--title-h1)]">
            {t('admin.sidebar.complaintCategories')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            {t('admin.complaintCategories.subtitle')}
          </p>
        </div>
        <button type="button" className={createBtnClass} onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('admin.complaintCategories.add')}
        </button>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      <Modal open={dialogOpen} onClose={closeDialog} className="max-w-lg p-0">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-surface-muted px-6 py-4">
            <h2 className="section-title text-lg font-semibold text-[var(--title-h2)]">
              {isEditing
                ? t('admin.complaintCategories.editTitle')
                : t('admin.complaintCategories.addTitle')}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {t('admin.complaintCategories.formHint')}
            </p>
          </div>
          <div className="grid gap-4 p-6">
            <Input
              label={t('admin.complaintCategories.form.nameEn')}
              name="name_en"
              value={form.nameEn}
              onChange={(e) => setForm((prev) => ({ ...prev, nameEn: e.target.value }))}
              placeholder={t('admin.complaintCategories.form.nameEnPlaceholder')}
              required
            />
            <Input
              label={t('admin.complaintCategories.form.nameAr')}
              name="name_ar"
              value={form.nameAr}
              onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
              placeholder={t('admin.complaintCategories.form.nameArPlaceholder')}
              required
            />
            <div className="grid gap-2">
              <Input
                label={t('admin.complaintCategories.form.iconUrl')}
                name="icon_url"
                value={form.iconUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, iconUrl: e.target.value }))}
                placeholder="https://…"
                dir="ltr"
              />
              <p className="text-xs text-text-muted">{t('admin.complaintCategories.form.iconHint')}</p>
              {resolveMediaUrl(form.iconUrl) ? (
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-muted">
                  <img
                    src={resolveMediaUrl(form.iconUrl)}
                    alt={t('admin.complaintCategories.form.iconAlt')}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="category_visibility" className="text-sm font-medium text-text-secondary">
                {t('admin.complaintCategories.form.visibility')}
              </label>
              <select
                id="category_visibility"
                name="visibility_scope"
                className={selectClass}
                value={form.visibilityScope}
                onChange={(e) => setForm((prev) => ({ ...prev, visibilityScope: e.target.value }))}
              >
                {VISIBILITY_SCOPES.map((scope) => (
                  <option key={scope} value={scope}>
                    {t(`admin.complaintCategories.scope.${scope}`)}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-[#2F3E1F] focus:ring-[#2F3E1F]/30"
              />
              {t('admin.complaintCategories.form.active')}
            </label>
            {formError ? (
              <p className="text-sm text-red-700" role="alert">
                {formError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-surface-muted px-6 py-4">
            <Button
              type="submit"
              disabled={pending}
              className="bg-[#2F3E1F] px-6 text-white hover:bg-[#243217] disabled:opacity-70"
            >
              {pending
                ? t('admin.complaintCategories.saving')
                : isEditing
                  ? t('admin.complaintCategories.save')
                  : t('admin.complaintCategories.create')}
            </Button>
            <Button type="button" variant="outline" onClick={closeDialog}>
              {t('admin.complaintCategories.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

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
              {t('admin.complaintCategories.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2F3E1F]/10 text-[#2F3E1F]">
              <FolderTree className="h-5 w-5" aria-hidden />
            </span>
            <CardTitle className="text-lg">{t('admin.complaintCategories.listTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-text-muted">{t('admin.complaintCategories.loading')}</p>
            ) : categories.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
                <p className="text-sm text-text-muted">{t('admin.complaintCategories.empty')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="app-table w-full min-w-[720px] table-fixed border-collapse text-sm">
                  <colgroup>
                    <col className="w-[4.5rem]" />
                    <col className="w-[20%]" />
                    <col className="w-[20%]" />
                    <col className="w-[22%]" />
                    <col className="w-[14%]" />
                    <col className="w-[6rem]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/50 text-xs uppercase tracking-wide text-text-muted">
                      <th className="py-3 ps-4 pe-2 text-start font-semibold">
                        {t('admin.complaintCategories.col.icon')}
                      </th>
                      <th className="px-2 py-3 text-start font-semibold">
                        {t('admin.complaintCategories.col.nameEn')}
                      </th>
                      <th className="px-2 py-3 text-start font-semibold">
                        {t('admin.complaintCategories.col.nameAr')}
                      </th>
                      <th className="px-2 py-3 text-start font-semibold">
                        {t('admin.complaintCategories.col.visibility')}
                      </th>
                      <th className="px-2 py-3 text-start font-semibold">
                        {t('admin.complaintCategories.col.status')}
                      </th>
                      <th className="px-2 py-3 text-end font-semibold">
                        {t('admin.complaintCategories.col.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => {
                      const scopeKey = category.visibilityScope || 'company_and_platform'
                      const scopeLabel = t(`admin.complaintCategories.scope.${scopeKey}`, {
                        defaultValue: scopeKey,
                      })
                      const iconSrc = resolveMediaUrl(category.iconUrl)
                      return (
                        <tr
                          key={category.id}
                          className="border-b border-surface-muted transition-colors last:border-0 hover:bg-surface-muted/40"
                        >
                          <td className="py-3 ps-4 pe-2 align-middle">
                            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-muted">
                              {iconSrc ? (
                                <img
                                  src={iconSrc}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-text-muted" aria-hidden />
                              )}
                            </span>
                          </td>
                          <td className="px-2 py-3 align-middle text-start font-medium text-text-primary">
                            <span className="block truncate" title={category.nameEn}>
                              {category.nameEn || '—'}
                            </span>
                          </td>
                          <td className="px-2 py-3 align-middle text-start text-text-secondary">
                            <span className="block truncate" title={category.nameAr}>
                              {category.nameAr || '—'}
                            </span>
                          </td>
                          <td className="px-2 py-3 align-middle text-start text-text-secondary">
                            <span className="block truncate" title={scopeLabel}>
                              {scopeLabel}
                            </span>
                          </td>
                          <td className="px-2 py-3 align-middle text-start">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                                category.isActive === false
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-green-100 text-green-800',
                              )}
                            >
                              {category.isActive === false
                                ? t('admin.complaintCategories.status.inactive')
                                : t('admin.complaintCategories.status.active')}
                            </span>
                          </td>
                          <td className="px-2 py-3 align-middle">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                className={iconBtnClass}
                                title={t('admin.complaintCategories.edit')}
                                aria-label={t('admin.complaintCategories.ariaEdit', {
                                  name: category.label,
                                })}
                                onClick={() => openEdit(category)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className={cn(iconBtnClass, 'hover:border-red-200 hover:text-red-700')}
                                title={t('admin.complaintCategories.delete')}
                                aria-label={t('admin.complaintCategories.ariaDelete', {
                                  name: category.label,
                                })}
                                onClick={() => void handleDelete(category)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
