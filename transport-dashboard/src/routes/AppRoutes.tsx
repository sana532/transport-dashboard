import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { UserRole } from '@/modules/auth/types'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { CompanyLayout } from '@/layouts/CompanyLayout'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { CompaniesManagementPage } from '@/pages/admin/CompaniesManagementPage'
import { CreateCompanyPage } from '@/pages/admin/CreateCompanyPage'
import { CreateVehicleModelPage } from '@/pages/admin/CreateVehicleModelPage'
import { EditVehicleModelPage } from '@/pages/admin/EditVehicleModelPage'
import { CitiesManagementPage } from '@/pages/admin/CitiesManagementPage'
import { StationsManagementPage } from '@/pages/admin/StationsManagementPage'
import { VehicleModelsManagementPage } from '@/pages/admin/VehicleModelsManagementPage'
import { CompanyDetailsPage } from '@/pages/admin/CompanyDetailsPage'
import { UsersManagementPage } from '@/pages/admin/UsersManagementPage'
import { BookingDetailsPage } from '@/pages/company/BookingDetailsPage'
import { BookingsManagementPage } from '@/pages/company/BookingsManagementPage'
import { ComplaintDetailsPage } from '@/pages/company/ComplaintDetailsPage'
import { ComplaintsPage } from '@/pages/company/ComplaintsPage'
import { CompanySettingsPage } from '@/pages/company/CompanySettingsPage'
import { DashboardPage } from '@/pages/company/DashboardPage'
import { DriversManagementPage } from '@/pages/company/DriversManagementPage'
import { AddSubscriptionPackagePage } from '@/pages/company/AddSubscriptionPackagePage'
import { PackageSubscribersPage } from '@/pages/company/PackageSubscribersPage'
import { PromoCodeFormPage } from '@/pages/company/PromoCodeFormPage'
import { PromoCodesManagementPage } from '@/pages/company/PromoCodesManagementPage'
import { RoutesManagementPage } from '@/pages/company/RoutesManagementPage'
import { SubscriptionPackagesPage } from '@/pages/company/SubscriptionPackagesPage'
import { TripDetailsPage } from '@/pages/company/TripDetailsPage'
import { TripTrackingPage } from '@/pages/company/TripTrackingPage'
import { TripFormPage } from '@/pages/company/TripFormPage'
import { TripsArchivePage } from '@/pages/company/TripsArchivePage'
import { TripsManagementPage } from '@/pages/company/TripsManagementPage'
import { VehiclesManagementPage } from '@/pages/company/VehiclesManagementPage'
import { paths } from '@/routes/paths'
import { ProtectedRoute, RoleRoute } from '@/routes/ProtectedRoute'

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
            <Route path="users" element={<UsersManagementPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}
