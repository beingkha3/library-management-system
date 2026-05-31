import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './hooks/useAuth';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminAuditPage } from './pages/AdminAuditPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AuthPage } from './pages/AuthPage';
import { BookDetailsPage } from './pages/BookDetailsPage';
import { CatalogPage } from './pages/CatalogPage';
import { LandingPage } from './pages/LandingPage';
import { MemberDashboardPage } from './pages/MemberDashboardPage';
import { MyFinesPage } from './pages/MyFinesPage';
import { MyLoansPage } from './pages/MyLoansPage';
import { MyReservationsPage } from './pages/MyReservationsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { StaffBooksPage } from './pages/StaffBooksPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { StaffFinesPage } from './pages/StaffFinesPage';
import { StaffLoansPage } from './pages/StaffLoansPage';
import { StaffMembersPage } from './pages/StaffMembersPage';
import { StaffReportsPage } from './pages/StaffReportsPage';
import { StaffReservationsPage } from './pages/StaffReservationsPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { RequireAuth } from './routes/RequireAuth';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/books" element={<CatalogPage />} />
      <Route path="/books/:id" element={<BookDetailsPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/app" element={<DashboardLayout requiredRoles={['member', 'librarian', 'admin']} />}>
          <Route index element={<MemberDashboardPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="catalog/:id" element={<BookDetailsPage />} />
          <Route path="my-loans" element={<MyLoansPage />} />
          <Route path="my-reservations" element={<MyReservationsPage />} />
          <Route path="my-fines" element={<MyFinesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route path="/staff" element={<DashboardLayout requiredRoles={['librarian', 'admin']} />}>
          <Route index element={<StaffDashboardPage />} />
          <Route path="books" element={<StaffBooksPage />} />
          <Route path="members" element={<StaffMembersPage />} />
          <Route path="loans" element={<StaffLoansPage />} />
          <Route path="reservations" element={<StaffReservationsPage />} />
          <Route path="fines" element={<StaffFinesPage />} />
          <Route path="reports" element={<StaffReportsPage />} />
        </Route>

        <Route path="/admin" element={<DashboardLayout requiredRoles={['admin']} />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
