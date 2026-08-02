import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  Briefcase,
  Camera,
  Check,
  CreditCard,
  Info,
  Key,
  Lock,
  Mail,
  Star,
  Upload,
  User,
} from 'lucide-react'
import type { Driver, DriverCreateInput, DriverUpdateInput } from '@/modules/drivers/types'
import { mapDriverStatusToApi } from '@/modules/drivers/utils/mapCompanyDriver'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'

const selectClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'

const AVAILABILITY_OPTIONS = ['Available', 'On Trip', 'Off Duty'] as const
const EDITABLE_AVAILABILITY_OPTIONS = ['Available', 'Off Duty'] as const

const VEHICLE_ASSIGN_OPTIONS = [
  'No Vehicle Assigned',
  'VH-001',
  'VH-002',
  'VH-003',
  'VH-004',
] as const

export type DriverFormMode = 'add' | 'edit'

export type DriverFormDialogProps = {
  open: boolean
  onClose: () => void
  mode: DriverFormMode
  /** When mode is `edit`, pass the driver to prefill the form and Quick Info */
  driver?: Driver | null
  pending?: boolean
  saveError?: string | null
  onCreate?: (input: DriverCreateInput) => Promise<void>
  onUpdate?: (id: number, input: DriverUpdateInput, profileId?: number) => Promise<void>
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 border-b border-surface-muted px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <CardTitle className="text-base font-semibold text-text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">{children}</CardContent>
    </Card>
  )
}

function vehicleSelectValue(raw: string | undefined): string {
  if (!raw) return VEHICLE_ASSIGN_OPTIONS[0]
  return VEHICLE_ASSIGN_OPTIONS.includes(raw as (typeof VEHICLE_ASSIGN_OPTIONS)[number])
    ? raw
    : VEHICLE_ASSIGN_OPTIONS[0]
}

export function DriverFormDialog({
  open,
  onClose,
  mode,
  driver,
  pending = false,
  saveError = null,
  onCreate,
  onUpdate,
}: DriverFormDialogProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const descId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseExpiry, setLicenseExpiry] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [availability, setAvailability] = useState<string>(AVAILABILITY_OPTIONS[0])
  const [initialAvailability, setInitialAvailability] = useState<Driver['status']>('Available')
  const [initialPhone, setInitialPhone] = useState('')
  const [assignedVehicle, setAssignedVehicle] = useState<string>(VEHICLE_ASSIGN_OPTIONS[0])
  const [username, setUsername] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const isEdit = mode === 'edit'

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  const clearForm = () => {
    setPhotoPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return null
    })
    setFullName('')
    setPhone('')
    setEmail('')
    setLicenseNumber('')
    setLicenseExpiry('')
    setExperienceYears('')
    setAvailability(AVAILABILITY_OPTIONS[0])
    setInitialAvailability('Available')
    setInitialPhone('')
    setAssignedVehicle(VEHICLE_ASSIGN_OPTIONS[0])
    setUsername('')
    setPassword('')
    setPasswordConfirmation('')
    setLocalError(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const applyDriver = (d: Driver) => {
    setPhotoPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return d.avatarUrl ?? null
    })
    setFullName(d.name)
    setPhone(d.phone)
    setInitialPhone(d.phone)
    setEmail(d.email ?? '')
    setLicenseNumber(d.licenseNumber === '—' ? '' : d.licenseNumber)
    setLicenseExpiry(d.licenseExpiry ?? '')
    setExperienceYears(d.experienceYears ? String(d.experienceYears) : '')
    setAvailability(d.status)
    setInitialAvailability(d.status)
    setAssignedVehicle(vehicleSelectValue(d.assignedVehicle))
    setUsername(d.username ?? '')
    setPhotoFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    if (!open) return
    if (isEdit && driver) {
      applyDriver(driver)
    } else {
      clearForm()
    }
  }, [open, mode, driver?.id])

  const handleClose = () => {
    clearForm()
    onClose()
  }

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    const name = fullName.trim()
    const phone_number = phone.trim()
    const license_number = licenseNumber.trim() || undefined
    const license_expiration_date = licenseExpiry.trim() || undefined
    const status =
      availability === 'On Trip'
        ? undefined
        : isEdit && availability === initialAvailability
          ? undefined
          : mapDriverStatusToApi(availability as Driver['status'])
    if (!name || !phone_number) {
      setLocalError(t('drivers.form.validation'))
      return
    }

    try {
      if (isEdit && driver) {
        const id = Number(driver.id)
        if (!Number.isFinite(id)) {
          setLocalError(t('drivers.form.saveFailed'))
          return
        }
        await onUpdate?.(
          id,
          {
            name,
            phone_number: phone_number !== initialPhone ? phone_number : undefined,
            license_number,
            license_expiration_date,
            status,
            avatar: photoFile ?? undefined,
          },
          driver.profileId ? Number(driver.profileId) : undefined,
        )
      } else {
        if (!password.trim()) {
          setLocalError(t('drivers.form.passwordRequired'))
          return
        }
        if (password !== passwordConfirmation) {
          setLocalError(t('drivers.form.passwordMismatch'))
          return
        }
        await onCreate?.({
          name,
          phone_number,
          password,
          password_confirmation: passwordConfirmation,
          license_number,
          license_expiration_date,
          years_of_experience: experienceYears.trim()
            ? Number(experienceYears)
            : undefined,
          status,
          avatar: photoFile ?? undefined,
        })
      }
      handleClose()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('drivers.form.saveFailed'))
    }
  }

  const displayError = localError ?? saveError

  const quickDriverId = isEdit && driver?.driverCode ? driver.driverCode : '—'
  const quickJoin = isEdit && driver?.joinDateLabel ? driver.joinDateLabel : '—'
  const quickTrips = !isEdit ? '0' : String(driver?.totalTrips ?? 0)

  const heading = isEdit ? t('drivers.form.editTitle') : t('drivers.form.addTitle')
  const passwordActionLabel = isEdit ? 'Reset Password' : 'Set Password'
  const infoText = isEdit
    ? 'You can resend login details or trigger a password reset email to the driver’s registered email at any time.'
    : 'After creating the driver account, the system will automatically send login credentials to the driver’s registered email address.'
  const submitLabel = isEdit ? 'Save Changes' : 'Create Driver'

  const availabilityOptions =
    isEdit && driver?.status === 'On Trip'
      ? (['On Trip', 'Off Duty'] as const)
      : EDITABLE_AVAILABILITY_OPTIONS

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className="max-h-[min(94vh,960px)] max-w-6xl overflow-y-auto"
    >
      <form onSubmit={handleSubmit} aria-labelledby={titleId} aria-describedby={descId}>
        <div className="border-b border-surface-muted px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={handleClose}
            className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to Drivers Management
          </button>
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight text-[var(--title-h2)]">
            {heading}
          </h2>
          <p id={descId} className="mt-1 text-sm text-text-muted">
            {t('drivers.form.hint')}
          </p>
        </div>

        {displayError ? (
          <p className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-6" role="alert">
            {displayError}
          </p>
        ) : null}

        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_min(280px,32%)] lg:items-start sm:p-6">
          <div className="min-w-0 space-y-5">
            <FormSection icon={User} title="Personal Information">
              <Input
                name="fullName"
                label={t('drivers.form.name')}
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="phone"
                  label={t('drivers.form.phone')}
                  placeholder="0946431593"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <Input
                  name="email"
                  type="email"
                  label="Email Address"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isEdit}
                />
              </div>
              {!isEdit ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    name="password"
                    type="password"
                    label={t('drivers.form.password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <Input
                    name="password_confirmation"
                    type="password"
                    label={t('drivers.form.passwordConfirm')}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              ) : null}
            </FormSection>

            <FormSection icon={CreditCard} title="License Information">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="licenseNumber"
                  label="License Number"
                  placeholder="e.g. DL-789456123"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
                <Input
                  name="licenseExpiry"
                  type="date"
                  label="License Expiration Date"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                />
                <div className="sm:col-span-2 sm:max-w-xs">
                  <Input
                    name="experienceYears"
                    label="Years of Driving Experience"
                    placeholder="e.g. 12"
                    inputMode="numeric"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    readOnly={isEdit}
                    disabled={isEdit}
                    title={isEdit ? 'Calculated by the system from driving history' : undefined}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection icon={Briefcase} title="Work Status">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="availability" className="text-sm font-medium text-text-secondary">
                    Availability Status
                  </label>
                  {isEdit && driver?.status === 'On Trip' ? (
                    <p className="text-xs text-text-muted">{t('drivers.form.onTripHint')}</p>
                  ) : null}
                  <select
                    id="availability"
                    name="availability"
                    className={selectClass}
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                  >
                    {availabilityOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="assignedVehicle" className="text-sm font-medium text-text-secondary">
                    Assigned Vehicle
                  </label>
                  <select
                    id="assignedVehicle"
                    name="assignedVehicle"
                    className={selectClass}
                    value={assignedVehicle}
                    onChange={(e) => setAssignedVehicle(e.target.value)}
                  >
                    {VEHICLE_ASSIGN_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </FormSection>

            <FormSection icon={Lock} title="Account Settings">
              <Input
                name="username"
                label={t('drivers.form.usernameReadonly')}
                placeholder="e.g. mthompson"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                readOnly
                disabled
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-border bg-surface text-text-secondary"
                  onClick={() => {
                    // TODO: reset / set password flow
                  }}
                >
                  <Key className="h-4 w-4" aria-hidden />
                  {passwordActionLabel}
                </Button>
                <Button
                  type="button"
                  className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)]"
                  onClick={() => {
                    // TODO: POST send login email
                  }}
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  Send Login Details
                </Button>
              </div>
              <div
                className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm leading-snug text-blue-950"
                role="note"
              >
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden />
                <p>{infoText}</p>
              </div>
            </FormSection>
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-0">
            <Card className="border border-border shadow-sm">
              <CardHeader className="border-b border-surface-muted px-4 py-3">
                <CardTitle className="text-base font-semibold text-text-primary">Driver Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-xl bg-surface-muted ring-1 ring-black/5">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Driver preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-4 text-center text-xs text-text-muted">
                      <User className="h-10 w-10 opacity-40" aria-hidden />
                      <span>No photo selected</span>
                    </div>
                  )}
                  <span
                    className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-text-secondary shadow-md ring-1 ring-black/10"
                    aria-hidden
                  >
                    <Camera className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-center text-xs text-text-muted">
                  Upload a professional photo of the driver.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={handlePhotoChange}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full bg-surface-muted text-text-primary hover:bg-border"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  Change Photo
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardHeader className="border-b border-surface-muted px-4 py-3">
                <CardTitle className="text-base font-semibold text-text-primary">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 text-sm">
                <div className="flex justify-between gap-2 border-b border-surface-muted pb-2">
                  <span className="text-text-muted">Driver ID</span>
                  <span className="font-mono font-medium text-text-primary">{quickDriverId}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-surface-muted pb-2">
                  <span className="text-text-muted">Join Date</span>
                  <span className="font-medium text-text-primary">{quickJoin}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-surface-muted pb-2">
                  <span className="text-text-muted">Total Trips</span>
                  <span className="font-medium text-text-primary">{quickTrips}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-text-muted">Rating</span>
                  <span className="inline-flex items-center gap-1 font-medium text-text-primary">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                    {isEdit && driver?.rating != null ? driver.rating : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        <div className="flex flex-col gap-2 border-t border-surface-muted px-5 py-4 sm:flex-row sm:justify-start sm:gap-3 sm:px-6">
          <Button
            type="submit"
            disabled={pending}
            className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)]"
          >
            <Check className="h-4 w-4" aria-hidden />
            {pending ? '…' : submitLabel}
          </Button>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
