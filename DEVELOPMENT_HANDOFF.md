# Development Handoff

Generated: 2026-05-26

## 0. 2026-05-27 Backend Hardening Update

Implemented in the current session:

- Added backend request validation with Zod and route-level schemas for auth, books, borrows, reservations, fines, payments, dashboard settings, users, and notification test email.
- Added auth rate limiting with `express-rate-limit` and configured Express `trust proxy` in production for proxy deployments.
- Hardened error handling so validation, cast, duplicate-key, and JSON parse failures return appropriate `400`/`409` responses instead of generic `500`s.
- Hardened environment loading with production-required `CLIENT_URL`, `MONGO_URI`/`MONGODB_URI`, and strong `JWT_SECRET` checks.
- Added a real `server/.env.example` using safe placeholder values.
- Added backend auth endpoints for forgot password, reset password, change password, and logout.
- Added hashed password reset tokens, expiry timestamps, password change timestamps, and token-version JWT invalidation.
- Added duplicate active borrow and duplicate active reservation protection.
- Added reservation expiry processing and queue promotion logic.
- Hardened issue, renew, return, and book inventory update flows around copy counts and overdue renewal rules.
- Hardened Razorpay payment flow with unique gateway identifiers, open-order reuse, failed webhook handling, timing-safe signature comparisons, and retryable captured-payment reconciliation.

Verification completed:

- `npm run build` passed for client and server workspaces.
- `npm audit --workspace server --omit=dev` reported `0 vulnerabilities`.
- Backend import checks passed for route/service modules.
- Backend smoke checks passed for `/api/health` and expected validation failures on invalid auth/book/payment requests.
- `gitnexus_detect_changes({ scope: "all", repo: "library-management-system" })` reported MEDIUM risk with affected flows around payment order creation and issue-book logic.

Important follow-ups:

- Before deploying new unique indexes, audit/clean duplicate active borrows, active reservations, and payment gateway IDs in existing MongoDB data.
- Add automated backend tests for auth reset/change, borrow/return/reservation edge cases, and payment replay/webhook idempotency.
- Review frontend route/API additions for forgot/reset/change password if those screens should be user-accessible now.
- Review member notifications and profile update flows; they are still not fully API-backed.

## 1. Project Overview

This project is a MERN stack Library Management System built with:

- React + Vite
- TailwindCSS
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT authentication
- Razorpay for overdue fine payment
- Nodemailer/email service
- Netlify frontend deployment target
- Render backend deployment target
- MongoDB Atlas database

Project goal:

Build a real library web application where members can browse books, borrow or reserve books, track due dates, pay fines, and where librarians/admins can manage inventory, loans, returns, reviews, users, reports, and notifications.

## 2. Current Project Status

### Current Folder Structure

```txt
library-management-system/
├── .claude/
├── .git/
├── .gitnexus/
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── package.json
├── package-lock.json
├── client/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── public/
│   │   └── _redirects
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── utils/
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
└── server/
    ├── .env
    ├── .env.example.bak
    ├── package.json
    └── src/
        ├── config/
        ├── controllers/
        ├── middleware/
        ├── models/
        ├── routes/
        ├── services/
        ├── utils/
        └── server.js
```

### Frontend Routes That Currently Exist

Found in `client/src/App.jsx`:

```txt
/
/books
/books/:id
/login
/register
/unauthorized
/app
/app/catalog
/app/catalog/:id
/app/my-loans
/app/my-reservations
/app/my-fines
/app/profile
/app/notifications
/staff
/staff/books
/staff/members
/staff/loans
/staff/reservations
/staff/fines
/staff/reports
/admin
/admin/users
/admin/settings
/admin/audit
```

Notes:

- `/` renders `LandingPage`, which is currently a wrapper around `PublicCatalogPage` with `asHome` enabled.
- `/books` renders `CatalogPage`, which is currently a wrapper around `PublicCatalogPage`.
- `/app`, `/staff`, and `/admin` are protected routes.
- `/app` allows `member`, `librarian`, and `admin`.
- `/staff` allows `librarian` and `admin`.
- `/admin` allows `admin` only.

### Backend API Routes That Currently Exist

Mounted under `/api` from `server/src/routes/index.js`:

```txt
GET    /api/health

POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/users
PATCH  /api/users/:id

GET    /api/books
GET    /api/books/:id
POST   /api/books
PATCH  /api/books/:id
DELETE /api/books/:id
POST   /api/books/:id/reviews

GET    /api/borrows
POST   /api/borrows
PATCH  /api/borrows/:id/renew
PATCH  /api/borrows/:id/return

GET    /api/reservations/me
GET    /api/reservations
POST   /api/reservations
PATCH  /api/reservations/:id/cancel

GET    /api/fines/me
GET    /api/fines
POST   /api/fines/:id/waive

POST   /api/payments/razorpay/webhook
GET    /api/payments/me
POST   /api/payments/razorpay/order
POST   /api/payments/razorpay/verify

GET    /api/dashboard/member
GET    /api/dashboard/staff
GET    /api/dashboard/admin
GET    /api/dashboard/reports
GET    /api/dashboard/settings
PATCH  /api/dashboard/settings

GET    /api/notifications/logs
POST   /api/notifications/test-email
```

### Existing Models

Found in `server/src/models/`:

- `User.js`
- `Book.js`
- `Borrow.js`
- `Reservation.js`
- `Fine.js`
- `Payment.js`
- `Review.js`
- `NotificationLog.js`
- `SystemSetting.js`

### Existing Controllers and Services

Controllers currently present in `server/src/controllers/`:

- `authController.js`
- `userController.js`
- `bookController.js`
- `borrowController.js`
- `reservationController.js`
- `fineController.js`
- `paymentController.js`
- `dashboardController.js`
- `notificationController.js`

Services currently present in `server/src/services/`:

- `authService.js`
- `bookService.js`
- `borrowService.js`
- `reservationService.js`
- `fineService.js`
- `paymentService.js`
- `notificationService.js`
- `reportService.js`
- `settingService.js`

### Existing UI Components

Found in `client/src/components/`:

- `BookCard.jsx`
- `DataTable.jsx`
- `FormFields.jsx`
- `LogoLockup.jsx`
- `PageHeader.jsx`
- `SectionCard.jsx`
- `SidebarNav.jsx`
- `StateViews.jsx`
- `StatCard.jsx`
- `StatusPill.jsx`
- `Topbar.jsx`

### Existing Layouts

Found in `client/src/layouts/`:

- `DashboardLayout.jsx`

### Existing Auth Implementation Status

Frontend:

- Auth state is managed in `client/src/context/AuthContext.jsx`.
- Auth is persisted in local storage under `library-management-system-auth`.
- On app boot, `AuthProvider` tries `/auth/me` when a stored token exists.
- `RequireAuth.jsx` protects authenticated routes.
- Role gating is enforced in `DashboardLayout.jsx` using `requiredRoles`.
- Login and register UI exist in `AuthPage.jsx`.
- Logout is client-side only. It clears local auth state and local storage.
- There is no backend logout endpoint.
- There is a visible `Forgot password` button in the login form, but it is not wired to a route or API.

Backend:

- Implemented auth endpoints: `register`, `login`, `me`.
- Missing auth endpoints: `logout`, `forgot password`, `reset password`, `change password`.
- `authMiddleware.js` verifies JWT, loads the user, blocks suspended accounts, and enforces role checks.

### Existing API Integration Status

Frontend API wrappers exist in `client/src/api/services.js` for:

- Auth
- Books
- Borrows
- Reservations
- Fines
- Payments
- Dashboards
- Users
- Notification logs/test email

Actual page integration status:

- `PublicCatalogPage.jsx` is API-backed via `bookApi.list()`.
- `BookDetailsPage.jsx` is API-backed via `bookApi.get()` and `bookApi.review()`.
- `MemberDashboardPage.jsx` uses `dashboardApi.member()`.
- `MyLoansPage.jsx` uses `borrowApi.list()` and `borrowApi.renew()`.
- `MyReservationsPage.jsx` uses `reservationApi.mine()` and `reservationApi.cancel()`.
- `MyFinesPage.jsx` uses `fineApi.mine()`, `paymentApi.createOrder()`, and `paymentApi.verifyOrder()`.
- `StaffDashboardPage.jsx` uses `dashboardApi.staff()`.
- `StaffBooksPage.jsx` uses `bookApi.list()`, `bookApi.create()`, and `bookApi.archive()`.
- `StaffMembersPage.jsx` uses `userApi.list()` and `userApi.update()`.
- `StaffLoansPage.jsx` uses `borrowApi.list()`, `borrowApi.issue()`, `borrowApi.returnBook()`, `bookApi.list()`, and `userApi.list()`.
- `StaffReservationsPage.jsx` uses `reservationApi.list()` and `reservationApi.cancel()`.
- `StaffFinesPage.jsx` uses `fineApi.list()` and `fineApi.waive()`.
- `StaffReportsPage.jsx` uses `dashboardApi.reports()`.
- `AdminDashboardPage.jsx` uses `dashboardApi.admin()`.
- `AdminUsersPage.jsx` uses `userApi.list()` and `userApi.update()`.
- `AdminSettingsPage.jsx` uses `dashboardApi.settings()` and `dashboardApi.updateSettings()`.
- `AdminAuditPage.jsx` uses `notificationApi.logs()` and `notificationApi.sendTestEmail()`.

Not fully integrated:

- `NotificationsPage.jsx` is currently static UI content. It does not call an API.
- `ProfilePage.jsx` is currently read-only and uses auth context data. The `Request an update` button only sets a local message.
- `AuthPage.jsx` shows a `Forgot password` button, but there is no route or API behind it.

### Current Use of Fallback or Sample Data

Fallback sample data exists in `client/src/utils/sampleData.js`.

Current usage:

- `PublicCatalogPage.jsx` falls back to `sampleBooks` when the backend is unavailable.
- `BookDetailsPage.jsx` falls back to a sample book when the backend is unavailable.

Current behavior:

- Fallback data is only used when the frontend gets a connection error and the error message matches the backend-unavailable case.
- Fallback data is not used in dashboards, staff pages, admin pages, or auth.

### Backend/Frontend Connection Status

- `client/.env` currently points the frontend to `VITE_API_URL=http://localhost:5000/api`.
- A direct health check to `http://localhost:5000/api/health` returned `{"success":true,"message":"Library API is healthy"}`.
- Frontend and backend are wired together in code.
- Not every end-to-end flow was manually re-tested in this session.

### MongoDB Connection Status

- A direct DB connection check from the server workspace passed: `DB connection ok`.
- The current local backend environment is using `MONGODB_URI`.
- On this machine, a previous `mongodb+srv://...` Atlas URI failed due SRV lookup issues.
- The current working local setup uses a non-SRV Atlas connection string.
- Do not switch back to SRV format without re-testing DNS/SRV resolution locally.

### Razorpay Implementation Status

- Backend Razorpay support exists in `paymentService.js`.
- Implemented endpoints: order creation, signature verification, webhook reconciliation, payment listing.
- Frontend checkout loading exists in `MyFinesPage.jsx`.
- The frontend does not currently read `VITE_RAZORPAY_KEY_ID`; it gets the key from the backend order response.
- Live payment success was not re-tested in this session.

### Email Service Implementation Status

- Email support exists in `notificationService.js` using Nodemailer.
- Template emails are triggered from:
  - registration welcome
  - borrow confirmation
  - return confirmation
  - reservation ready notification
  - fine payment receipt
  - admin test email
- Email events are logged in `NotificationLog`.
- If SMTP is not configured, email sends are logged as `skipped` instead of crashing the underlying action.
- Live SMTP delivery was not re-tested in this session.

### Deployment Config Status

Deployment-related files currently present:

- `client/public/_redirects` for Netlify SPA routing
- `README.md` with deployment notes for Netlify, Render, and MongoDB Atlas
- `client/.env.example`
- `server/.env.example.bak`

Deployment files not currently present:

- `netlify.toml`
- `render.yaml`
- a real `server/.env.example`

## 3. Completed Work

### Frontend Completed

- Public catalog-first home page exists through `LandingPage.jsx` -> `PublicCatalogPage.jsx`.
- Public catalog page exists through `CatalogPage.jsx` -> `PublicCatalogPage.jsx`.
- Public book details page exists in `BookDetailsPage.jsx`.
- Login and register page exists in `AuthPage.jsx`.
- Member dashboard exists in `MemberDashboardPage.jsx` and is API-backed.
- Member loans page exists in `MyLoansPage.jsx` and is API-backed.
- Member reservations page exists in `MyReservationsPage.jsx` and is API-backed.
- Member fines page exists in `MyFinesPage.jsx` and is API-backed, including Razorpay checkout loading.
- Profile page exists in `ProfilePage.jsx`, but it is currently read-only.
- Notifications page exists in `NotificationsPage.jsx`, but it is currently static content.
- Staff dashboard exists in `StaffDashboardPage.jsx` and is API-backed.
- Staff books page exists in `StaffBooksPage.jsx` and is API-backed.
- Staff members page exists in `StaffMembersPage.jsx` and is API-backed.
- Staff loans page exists in `StaffLoansPage.jsx` and is API-backed.
- Staff reservations page exists in `StaffReservationsPage.jsx` and is API-backed.
- Staff fines page exists in `StaffFinesPage.jsx` and is API-backed.
- Staff reports page exists in `StaffReportsPage.jsx` and is API-backed.
- Admin dashboard exists in `AdminDashboardPage.jsx` and is API-backed.
- Admin users page exists in `AdminUsersPage.jsx` and is API-backed.
- Admin settings page exists in `AdminSettingsPage.jsx` and is API-backed.
- Admin audit page exists in `AdminAuditPage.jsx` and is API-backed.
- Shared layout system exists through `DashboardLayout.jsx`, `SidebarNav.jsx`, and `Topbar.jsx`.
- Shared reusable UI components exist for cards, tables, forms, status pills, and state views.
- `BookCard.jsx` was updated to show cover placeholder, title, author, genre/category, ISBN, availability, rating, shelf location, status, and softer action hierarchy.
- `StateViews.jsx` includes explicit backend-unavailable messaging with expected API URL.
- `sampleData.js` exists and is used only for backend-unavailable catalog/detail fallback.
- The member shell and member pages `/app`, `/app/profile`, and `/app/notifications` were recently cleaned up to remove the previously flagged internal/demo phrases.
- `DashboardLayout.jsx` member shell width is now aligned to `max-w-7xl`.

### Backend Completed

- Express server setup exists in `server/src/server.js`.
- Database connection setup exists in `server/src/config/db.js`.
- Environment loading exists in `server/src/config/env.js`.
- Global middleware exists for CORS, Helmet, JSON parsing, Morgan logging, not found handling, and error handling.
- Admin auto-seeding exists when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are present.
- JWT auth exists for register, login, and `me`.
- Role-based authorization middleware exists.
- User listing and user update endpoints exist.
- Book listing, details, create, update, and archive endpoints exist.
- Review upsert endpoint exists and stores one review per user per book.
- Borrow listing, issue, renew, and return endpoints exist.
- Reservation listing, create, cancel, and queue promotion logic exist.
- Fine listing, fine creation on overdue return, waive action, and user fine balance recomputation exist.
- Razorpay fine order creation, payment verification, webhook handling, and payment history endpoint exist.
- Nodemailer-backed email sending and notification logging exist.
- Dashboard, reports, and settings endpoints exist.

Important limitations that are still not complete:

- Auth is only partially complete. Forgot/reset/change password are missing.
- Review moderation is not implemented.
- Review eligibility is not restricted to previously borrowed books.
- Duplicate active borrow prevention is not implemented.
- There is no scheduled overdue reminder or reservation expiry worker.
- There is no in-app notification system model/API separate from email logging.

## 4. Recent UI Direction and Design Rules

The recent UI correction is important and should be preserved.

The UI must not look like:

- a SaaS marketing landing page
- a student demo website
- a project requirement checklist
- a fake enterprise dashboard
- an artificial “production-grade” interface

Avoid copy like:

- Production-grade
- Product surface
- Operational view
- Platform capabilities
- Governance
- Policy control
- Service visibility
- Current operator
- Module
- Access protected
- Workspace
- Payment posture
- Reservation pipeline
- Fine ledger snapshot
- Communication coverage

Prefer real library/member-facing language such as:

- Search the library catalog
- Browse books
- Borrow books
- Reserve unavailable titles
- Track due dates
- View fines
- Pay overdue fines
- View reading history
- Manage inventory
- Record borrowing and returns
- Send reminders
- View reports

Current preferred UI direction:

- Public home should remain catalog-first.
- Public catalog and public book details should feel like a real library portal.
- Auth pages should remain compact and member-focused.
- Internal dashboards should remain separate from the public catalog.
- The app should feel like a real library catalog and member portal, not a pitch page.

## 5. Current UI Issues Still To Fix

These are still present in the current codebase and should be treated as real follow-up work:

- Some dashboard copy still sounds artificial, especially in staff pages.
- `client/src/pages/StaffDashboardPage.jsx` still contains phrases like `Circulation control`, `Queue-driven`, and `Staff workspace`.
- `client/src/pages/StaffLoansPage.jsx` still contains phrases like `Transactional circulation workspace` and `operational desk surface`.
- `client/src/pages/StaffBooksPage.jsx` still contains phrases like `catalog surface`, `operationally useful`, `Inventory aware`, and `Staff-facing maintenance`.
- `client/src/pages/StaffReportsPage.jsx` still uses `Operational analytics` wording.
- `client/src/pages/StaffFinesPage.jsx` still uses language that feels more internal than library-facing.
- Some pages are still too card-heavy, especially staff/admin dashboards and staff books.
- Some wide-screen layouts still leave a lot of empty space.
- `NotificationsPage.jsx` is static and does not yet represent real notification data.
- `ProfilePage.jsx` looks finished visually, but the update flow is not real.
- Fallback sample data is limited to books and may be incomplete for a realistic catalog demo.
- Some internal pages still do not match the newer library-portal tone used on the public side and member pages.
- Some pages still need stronger real-world empty states.
- Some buttons and labels still need tighter visual hierarchy.
- Mobile responsiveness has not been fully verified route-by-route.

## 6. Remaining Development Scope

### Priority 1: Core Backend Completion

- Confirm the server starts cleanly on an unused port.
- Current status: `npm start --workspace server` failed in this session because port `5000` was already in use, but an existing local server instance answered `/api/health` successfully.
- Confirm MongoDB Atlas or local MongoDB connection.
- Current status: direct DB connection check passed with the current `MONGODB_URI`.
- Audit and finalize the existing `User`, `Book`, `Borrow`, `Reservation`, `Review`, `Payment`, `NotificationLog`, and `SystemSetting` models.
- Finalize auth routes:
- `register` exists.
- `login` exists.
- `me` exists.
- `logout` is missing as a backend route.
- `forgot password` is missing.
- `reset password` is missing.
- `change password` is missing.
- Finalize role-based middleware and permissions.
- Current status: basic role middleware exists, but flows still need end-to-end verification.
- Seed admin and sample books.
- Current status: admin auto-seed exists, sample books are frontend-only fallback data, not backend seed data.
- Add stronger request validation and more explicit error handling where missing.

### Priority 2: Book Catalog and Inventory

- Book CRUD for librarian/admin exists in the backend.
- Public/member book listing exists.
- Public/member book details page exists.
- Search by title, author, genre, and ISBN currently works client-side after fetching all books.
- Server-side search support exists in `bookService.listBooks`, but the public UI is not currently sending search/filter query params.
- Filters for genre, availability, author, year, rating, and language exist client-side.
- Confirm `availableCopies` and `totalCopies` logic across create, update, borrow, return, and reservation edge cases.
- Add a real edit UI for books. The API supports update, but the current staff UI only creates and archives.
- Decide whether inventory management should remain only under `/staff/books` or also be exposed under an `/admin/books` route.

### Priority 3: Borrowing and Returns

- Borrow book flow exists.
- Borrow limit enforcement exists through system settings.
- Prevent duplicate active borrow is still missing.
- Due dates are set during issue.
- Return flow exists.
- Overdue fine calculation exists on return.
- `availableCopies` updates exist on issue and return.
- Member loan history page exists.
- Staff borrowing management page exists.
- Remaining work: test edge cases thoroughly and add duplicate-active-borrow prevention.

### Priority 4: Reservations

- Reserve unavailable book flow exists.
- Prevent duplicate reservation exists.
- Reservation queue exists.
- Notify next user when a book returns exists through `promoteNextReservation()` and email sending.
- Pickup expiry timestamp exists.
- Member reservations page exists.
- Staff reservation management page exists.
- Remaining work: add expiry processing for stale ready reservations and verify all queue edge cases.

### Priority 5: Reviews

- Review model exists.
- Review create/update flow exists.
- One review per user per book is enforced by a unique index.
- Missing: user can review only borrowed books.
- Missing: admin/librarian moderation workflow.
- Missing: approved-only review display logic.

### Priority 6: Notifications and Email

- Email sending exists.
- Notification logging exists.
- In-app notifications do not exist yet.
- Password reset email does not exist yet.
- Overdue reminder email flow does not exist yet.
- Reservation available email exists.
- Fine payment receipt email exists.
- System announcements do not exist yet.

### Priority 7: Razorpay Payment

- Razorpay test-mode style integration exists in code.
- Create order API exists.
- Verify payment signature API exists.
- Webhook support exists.
- Fine status update and user fine balance update exist.
- Payment history endpoint exists.
- Missing: dedicated payment history UI.
- Missing: explicit failed/cancelled payment state handling in the UI.
- Review whether `finePaid` on `Borrow` should be reconciled with `Fine` and `Payment` records or removed if not needed.

### Priority 8: Reports and Dashboards

- Admin dashboard counts exist.
- Borrowing statistics exist.
- Overdue report exists.
- Fine collection metric exists.
- Category-based borrowing report exists.
- Inventory status basics exist.
- Remaining work: verify metric accuracy, improve report depth, and continue tone cleanup in staff/admin pages.

### Priority 9: Deployment

- Prepare a real `server/.env.example`.
- Current status: only `server/.env.example.bak` exists.
- Prepare or update `.env.example` files with standardized names.
- README exists, but it references `server/.env.example`, which is currently missing.
- Deploy backend to Render.
- Deploy frontend to Netlify.
- Set MongoDB Atlas connection string.
- Set CORS for the Netlify URL.
- Set Razorpay environment variables.
- Test live frontend/backend URLs.
- Consider adding `netlify.toml` or `render.yaml` if deployment should be more reproducible.

## 7. Exact Routes To Verify

### Frontend Routes Found In The App

```txt
/
/books
/books/:id
/login
/register
/unauthorized
/app
/app/catalog
/app/catalog/:id
/app/my-loans
/app/my-reservations
/app/my-fines
/app/notifications
/app/profile
/staff
/staff/books
/staff/members
/staff/loans
/staff/reservations
/staff/fines
/staff/reports
/admin
/admin/users
/admin/settings
/admin/audit
```

### Requested Routes That Are Not Currently Present Or Use Different Names

```txt
/forgot-password                    (not present)
/reset-password/:token             (not present)
/app/loans                         (actual route: /app/my-loans)
/app/reservations                  (actual route: /app/my-reservations)
/app/fines                         (actual route: /app/my-fines)
/admin/books                       (not present)
/admin/borrowings                  (not present)
/admin/reservations                (not present)
/admin/reviews                     (not present)
/admin/reports                     (not present)
```

### Backend API Routes Found In The Server

```txt
GET    /api/health
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /api/users
PATCH  /api/users/:id
GET    /api/books
GET    /api/books/:id
POST   /api/books
PATCH  /api/books/:id
DELETE /api/books/:id
POST   /api/books/:id/reviews
GET    /api/borrows
POST   /api/borrows
PATCH  /api/borrows/:id/renew
PATCH  /api/borrows/:id/return
GET    /api/reservations/me
GET    /api/reservations
POST   /api/reservations
PATCH  /api/reservations/:id/cancel
GET    /api/fines/me
GET    /api/fines
POST   /api/fines/:id/waive
POST   /api/payments/razorpay/webhook
GET    /api/payments/me
POST   /api/payments/razorpay/order
POST   /api/payments/razorpay/verify
GET    /api/dashboard/member
GET    /api/dashboard/staff
GET    /api/dashboard/admin
GET    /api/dashboard/reports
GET    /api/dashboard/settings
PATCH  /api/dashboard/settings
GET    /api/notifications/logs
POST   /api/notifications/test-email
```

## 8. Environment Variables

### Current Backend Env Names Used In Code

The backend currently reads these names from `server/src/config/env.js`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

### Current Frontend Env Names Used In Code

The frontend currently reads these names from `client/src/api/http.js`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Requested Standardization Target

Requested backend env target:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Requested frontend env target:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=
```

### Actual Mismatches To Fix

- Backend currently uses `MONGODB_URI`, not `MONGO_URI`.
- Backend currently uses `SMTP_FROM`, not `EMAIL_FROM`.
- Frontend currently uses `VITE_API_URL`, not `VITE_API_BASE_URL`.
- Frontend does not currently use `VITE_RAZORPAY_KEY_ID`.
- Current recommendation: standardize these names early in the next session and update examples plus README together.

Important local note:

- `server/.env` exists locally and contains real values.
- Do not print or commit those secrets.
- `server/.env.example` does not currently exist. Only `server/.env.example.bak` exists.

## 9. Known Commands

These match the current `package.json` files:

```bash
npm install
npm run dev
npm run build
npm start
npm run dev --workspace client
npm run build --workspace client
npm run preview --workspace client
npm run dev --workspace server
npm start --workspace server
npm run build --workspace server
```

Notes:

- There is no automated test script in the current package files.
- Root `npm run dev` starts both client and server with `concurrently`.

## 10. Testing Checklist For Next Session

```txt
[ ] Frontend builds successfully
[ ] Backend starts successfully
[ ] MongoDB connects
[ ] Register works
[ ] Login works
[ ] Protected routes work
[ ] Role-based routes work
[ ] Admin can add book
[ ] User can browse catalog
[ ] User can borrow available book
[ ] availableCopies decreases after borrow
[ ] User cannot exceed borrow limit
[ ] User cannot borrow same book twice
[ ] User can return book
[ ] Fine calculates if overdue
[ ] User can reserve unavailable book
[ ] Reservation notification triggers after return
[ ] User can review borrowed book
[ ] Admin can moderate review
[ ] Razorpay order creation works
[ ] Razorpay payment verification works
[ ] Email password reset works
[ ] Overdue email works
[ ] Dashboard data loads from backend
[ ] Fallback/sample data is not shown when real API works
[ ] Mobile layout works
[ ] Netlify build works
[ ] Render backend deploy works
```

## 11. Instructions for the Next Agent

- Start by reading this handoff.
- Run `git status`.
- Inspect current files before editing.
- Do not assume backend/frontend features are complete.
- Do not redesign UI from scratch.
- Continue from the existing design system.
- Remove remaining artificial/demo UI language.
- Prioritize making the backend functional before adding more frontend polish.
- Keep changes small and testable.
- Commit after each major milestone.
- Update this handoff after major changes.
- Do not print or commit secrets from local `.env` files.

## 12. Git Status and Branch Info

Command run:

```bash
git status
```

Output summary:

```txt
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

Command run:

```bash
git branch --show-current
```

Output:

```txt
main
```

Command run:

```bash
git log --oneline -5
```

Output:

```txt
61567f5 feat: initial library management system setup
```

## 13. Build/Test Status

### Command Status

- `npm run build --workspace client`
- Result: passed
- Notes: Vite production build completed successfully.

- `npm run build --workspace server`
- Result: passed
- Notes: this is currently a placeholder build that prints `Server build step not required`.

- `node --input-type=module -e "import './src/config/env.js'; import { connectDatabase } from './src/config/db.js'; await connectDatabase(); console.log('DB connection ok'); process.exit(0);"`
- Workdir: `server/`
- Result: passed
- Notes: direct MongoDB connection check succeeded.

- `npm start --workspace server`
- Result: failed in this session
- Error: `EADDRINUSE: address already in use :::5000`
- Notes: another local process was already bound to port `5000`.

- `GET http://localhost:5000/api/health`
- Result: passed
- Response: `{"success":true,"message":"Library API is healthy"}`
- Notes: a backend instance was already running locally when the startup check was attempted.

### Files Needing Attention Based On Current Status

- `client/src/pages/StaffDashboardPage.jsx`
- `client/src/pages/StaffLoansPage.jsx`
- `client/src/pages/StaffBooksPage.jsx`
- `client/src/pages/StaffFinesPage.jsx`
- `client/src/pages/StaffReportsPage.jsx`
- `client/src/pages/NotificationsPage.jsx`
- `client/src/pages/ProfilePage.jsx`
- `client/src/api/http.js`
- `client/.env.example`
- `server/src/config/env.js`
- `server/.env.example.bak`
- `README.md`

## 14. Agent Infrastructure and Tooling Instructions

### Use GitNexus / Codebase Intelligence

The next agent should use GitNexus or any available codebase intelligence or MCP tools to understand the project before editing.

The next agent should use GitNexus to:

- Map the project structure
- Understand frontend/backend dependencies
- Find related files before modifying code
- Trace route/component/model/controller relationships
- Detect duplicate or unused components
- Identify incomplete backend/frontend integration points
- Locate inconsistent env variable names
- Review current architecture before proposing changes

The agent must not blindly edit files without first inspecting related files and understanding the dependency chain.

Recommended GitNexus or codebase-intelligence queries:

```txt
Map the frontend route structure and identify which pages are connected to protected routes.
Map backend API routes, controllers, models, and middleware.
Find all places where VITE_API_URL or VITE_API_BASE_URL is used.
Find all UI copy that sounds demo-like, artificial, or non-user-facing.
Find all sample/fallback data usage and where it should later be replaced by API data.
Find incomplete Razorpay integration points.
Find incomplete Nodemailer/email integration points.
Find incomplete borrow, return, reservation, and fine calculation logic.
```

Recommended GitNexus workflow in an agent environment:

- If multiple repos are indexed, start with `gitnexus_list_repos` and target this repo explicitly.
- Use `gitnexus_query` for route/process discovery before editing.
- Use `gitnexus_context` on symbols you plan to change.
- Use `gitnexus_api_impact` before modifying API route handlers.
- Use `gitnexus_impact` for shared services or auth changes.
- Use `gitnexus_detect_changes` before wrapping up a milestone.

## Highest-Priority Next Task

Highest priority for the next session:

- Finish core backend auth and validation work before more UI polish.
- The most concrete next step is to add the missing auth flows (`forgot password`, `reset password`, `change password`, and a real logout strategy if needed), then standardize env names and request validation around those routes.
