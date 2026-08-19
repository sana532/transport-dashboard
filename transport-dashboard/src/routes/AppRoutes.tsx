import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { UserRole } from '@/modules/auth/types'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { CompanyLayout } from '@/layouts/CompanyLayout'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { PageSkeleton } from '@/shared/ui/Skeleton'
import { paths } from '@/routes/paths'
import { ProtectedRoute, RoleRoute } from '@/routes/ProtectedRoute'

// Admin pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })))
const CompaniesManagementPage = lazy(() => import('@/pages/admin/CompaniesManagementPage').then(m => ({ default: m.CompaniesManagementPage })))
const CreateCompanyPage = lazy(() => import('@/pages/admin/CreateCompanyPage').then(m => ({ default: m.CreateCompanyPage })))
const CreateVehicleModelPage = lazy(() => import('@/pages/admin/CreateVehicleModelPage').then(m => ({ default: m.CreateVehicleModelPage })))
const EditVehicleModelPage = lazy(() => import('@/pages/admin/EditVehicleModelPage').then(m => ({ default: m.EditVehicleModelPage })))
const CitiesManagementPage = lazy(() => import('@/pages/admin/CitiesManagementPage').then(m => ({ default: m.CitiesManagementPage })))
const PlatformComplaintCategoriesPage = lazy(() => import('@/pages/admin/PlatformComplaintCategoriesPage').then(m => ({ default: m.PlatformComplaintCategoriesPage })))
const PlatformComplaintDetailsPage = lazy(() => import('@/pages/admin/PlatformComplaintDetailsPage').then(m => ({ default: m.PlatformComplaintDetailsPage })))
const PlatformComplaintsPage = lazy(() => import('@/pages/admin/PlatformComplaintsPage').then(m => ({ default: m.PlatformComplaintsPage })))
const PlatformPlansPage = lazy(() => import('@/pages/admin/PlatformPlansPage').then(m => ({ default: m.PlatformPlansPage })))
const PlatformPromoCodeFormPage = lazy(() => import('@/pages/admin/PlatformPromoCodeFormPage').then(m => ({ default: m.PlatformPromoCodeFormPage })))
const PlatformPromoCodesPage = lazy(() => import('@/pages/admin/PlatformPromoCodesPage').then(m => ({ default: m.PlatformPromoCodesPage })))
const RestAreasManagementPage = lazy(() => import('@/pages/admin/RestAreasManagementPage').then(m => ({ default: m.RestAreasManagementPage })))
const StationsManagementPage = lazy(() => import('@/pages/admin/StationsManagementPage').then(m => ({ default: m.StationsManagementPage })))
const VehicleModelsManagementPage = lazy(() => import('@/pages/admin/VehicleModelsManagementPage').then(m => ({ default: m.VehicleModelsManagementPage })))
const CompanyDetailsPage = lazy(() => import('@/pages/admin/CompanyDetailsPage').then(m => ({ default: m.CompanyDetailsPage })))
const UsersManagementPage = lazy(() => import('@/pages/admin/UsersManagementPage').then(m => ({ default: m.UsersManagementPage })))
const UserDetailsPage = lazy(() => import('@/pages/admin/UserDetailsPage').then(m => ({ default: m.UserDetailsPage })))

// Company pages
const DashboardPage = lazy(() => import('@/pages/company/DashboardPage').then(m => ({ default: m.DashboardPage })))
const TripsManagementPage = lazy(() => import('@/pages/company/TripsManagementPage').then(m => ({ default: m.TripsManagementPage })))
const TripsArchivePage = lazy(() => import('@/pages/company/TripsArchivePage').then(m => ({ default: m.TripsArchivePage })))
const TripSchedulesPage = lazy(() => import('@/pages/company/TripSchedulesPage').then(m => ({ default: m.TripSchedulesPage })))
const TripDetailsPage = lazy(() => import('@/pages/company/TripDetailsPage').then(m => ({ default: m.TripDetailsPage })))
const TripTrackingPage = lazy(() => import('@/pages/company/TripTrackingPage').then(m => ({ default: m.TripTrackingPage })))
const TripFormPage = lazy(() => import('@/pages/company/TripFormPage').then(m => ({ default: m.TripFormPage })))
const RoutesManagementPage = lazy(() => import('@/pages/company/RoutesManagementPage').then(m => ({ default: m.RoutesManagementPage })))
const BookingDetailsPage = lazy(() => import('@/pages/company/BookingDetailsPage').then(m => ({ default: m.BookingDetailsPage })))
const BookingsManagementPage = lazy(() => import('@/pages/company/BookingsManagementPage').then(m => ({ default: m.BookingsManagementPage })))
const VehiclesManagementPage = lazy(() => import('@/pages/company/VehiclesManagementPage').then(m => ({ default: m.VehiclesManagementPage })))
const DriversManagementPage = lazy(() => import('@/pages/company/DriversManagementPage').then(m => ({ default: m.DriversManagementPage })))
const SubscriptionPackagesPage = lazy(() => import('@/pages/company/SubscriptionPackagesPage').then(m => ({ default: m.SubscriptionPackagesPage })))
const AddSubscriptionPackagePage = lazy(() => import('@/pages/company/AddSubscriptionPackagePage').then(m => ({ default: m.AddSubscriptionPackagePage })))
const PackageSubscribersPage = lazy(() => import('@/pages/company/PackageSubscribersPage').then(m => ({ default: m.PackageSubscribersPage })))
const PromoCodeFormPage = lazy(() => import('@/pages/company/PromoCodeFormPage').then(m => ({ default: m.PromoCodeFormPage })))
const PromoCodesManagementPage = lazy(() => import('@/pages/company/PromoCodesManagementPage').then(m => ({ default: m.PromoCodesManagementPage })))
const ComplaintDetailsPage = lazy(() => import('@/pages/company/ComplaintDetailsPage').then(m => ({ default: m.ComplaintDetailsPage })))
const ComplaintsPage = lazy(() => import('@/pages/company/ComplaintsPage').then(m => ({ default: m.ComplaintsPage })))
const ReportsPage = lazy(() => import('@/pages/company/ReportsPage').then(m => ({ default: m.ReportsPage })))
const NotificationsPage = lazy(() => import('@/pages/company/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const CompanySettingsPage = lazy(() => import('@/pages/company/CompanySettingsPage').then(m => ({ default: m.CompanySettingsPage })))

function homeForRole(role: UserRole): string {
  return role === 'admin' ? paths.admin.root : paths.company.root
}

function RootRedirect() {
  const { isAuthenticated, role } = useAuth()
  if (!isAuthenticated) return <Navigate to={paths.login} replace />
  if (!role) return <Navigate to={paths.login} replace />
  return <Navigate to={homeForRole(role)} replace />
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
    <Routes>
      <Route path={paths.login} element={<AuthLayout />}>
        <Route index element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allow={['company']} />}>
          <Route path="/company" element={<CompanyLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="trips" element={<TripsManagementPage />} />
            <Route path="trips/archive" element={<TripsArchivePage />} />
            <Route path="trips/schedules" element={<TripSchedulesPage />} />
            <Route path="routes" element={<RoutesManagementPage />} />
            <Route path="trips/new" element={<TripFormPage />} />
            <Route path="trips/:tripId/edit" element={<TripFormPage />} />
            <Route path="trips/:tripId/tracking" element={<TripTrackingPage />} />
            <Route path="trips/:tripId" element={<TripDetailsPage />} />
            <Route path="bookings/:bookingId" element={<BookingDetailsPage />} />
            <Route path="bookings" element={<BookingsManagementPage />} />
            <Route path="vehicles" element={<VehiclesManagementPage />} />
            <Route path="drivers" element={<DriversManagementPage />} />
            <Route
              path="subscription-packages"
              element={<SubscriptionPackagesPage />}
            />
            <Route
              path="subscription-packages/new"
              element={<AddSubscriptionPackagePage />}
            />
            <Route
              path="subscription-packages/:packageId/edit"
              element={<AddSubscriptionPackagePage />}
            />
            <Route
              path="subscription-packages/:packageId/subscribers"
              element={<PackageSubscribersPage />}
            />
            <Route path="promo-codes/new" element={<PromoCodeFormPage />} />
            <Route path="promo-codes/:promoId/edit" element={<PromoCodeFormPage />} />
            <Route path="promo-codes" element={<PromoCodesManagementPage />} />
            <Route path="complaints/:complaintId" element={<ComplaintDetailsPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<CompanySettingsPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allow={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="companies" element={<CompaniesManagementPage />} />
            <Route path="companies/new" element={<CreateCompanyPage />} />
            <Route
              path="companies/:companyId"
              element={<CompanyDetailsPage />}
            />
            <Route path="vehicle-models" element={<VehicleModelsManagementPage />} />
            <Route path="vehicle-models/new" element={<CreateVehicleModelPage />} />
            <Route path="vehicle-models/:modelId/edit" element={<EditVehicleModelPage />} />
            <Route path="cities" element={<CitiesManagementPage />} />
            <Route path="stations" element={<StationsManagementPage />} />
            <Route path="rest-areas" element={<RestAreasManagementPage />} />
            <Route path="promo-codes" element={<PlatformPromoCodesPage />} />
            <Route path="promo-codes/new" element={<PlatformPromoCodeFormPage />} />
            <Route path="promo-codes/:promoId/edit" element={<PlatformPromoCodeFormPage />} />
            <Route path="platform-plans" element={<PlatformPlansPage />} />
            <Route path="complaints/:complaintId" element={<PlatformComplaintDetailsPage />} />
            <Route path="complaints" element={<PlatformComplaintsPage />} />
            <Route path="complaint-categories" element={<PlatformComplaintCategoriesPage />} />
            <Route path="users" element={<UsersManagementPage />} />
            <Route path="users/:userId" element={<UserDetailsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
    </Suspense>
  )
}
