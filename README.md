# Library Management System

A production-style MERN web application for managing books, borrowing, reservations, overdue fines, notifications, and role-based library operations.

## Highlights

- Member, librarian, and admin role flows
- JWT authentication and route protection
- Book inventory and catalog browsing
- Borrowing, renewals, returns, and reservation queue management
- Overdue fine calculation and Razorpay fine payment flow
- Email notification service using SMTP via Nodemailer
- Analytics dashboards and reports for staff and administrators
- Responsive React + Tailwind academic dashboard UI
- Deployment-ready split architecture for Netlify, Render, and MongoDB Atlas

## Tech Stack

- Frontend: React, React Router, Vite, TailwindCSS, Axios
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Nodemailer, Razorpay
- Deployment: Netlify (frontend), Render (backend), MongoDB Atlas (database)

## Project Structure

```txt
library-management-system/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── README.md
├── .gitignore
└── package.json
```

## Core Features

### Members

- Register and log in
- Browse and search books
- Borrow available books
- Reserve unavailable books
- Track due dates and active loans
- Renew active loans when allowed
- View and pay fines
- Add reviews and ratings

### Librarians

- Add and archive books
- Manage copies and availability
- Issue books to members
- Process returns
- Review reservations and fines
- Access circulation reports

### Admins

- Manage users and roles
- Adjust system loan and fine settings
- Review notification activity
- Access institution-level dashboard analytics

## Backend Overview

The backend exposes REST APIs under `/api` and handles:

- Authentication with signed JWT tokens
- Role-based authorization
- Catalog and review management
- Borrow, renew, return, and reservation workflows
- Fine calculation and reconciliation
- Razorpay order creation and payment verification
- SMTP-backed email notifications
- Staff/admin dashboard reporting

Main backend modules:

- `models/`: Mongoose schemas for users, books, borrows, reservations, fines, payments, reviews, notifications, and settings
- `services/`: business logic for auth, books, borrows, reservations, fines, payments, settings, notifications, and reports
- `controllers/`: request/response layer
- `routes/`: API route definitions

## Frontend Overview

The frontend uses a Modern Academic Dashboard direction:

- White content canvas
- Deep navy sidebar
- Blue operational accents
- Soft cards and readable data tables
- Mobile-friendly responsive layout

Main frontend modules:

- `layouts/`: shared dashboard shell
- `pages/`: member, staff, and admin pages
- `components/`: reusable cards, tables, forms, headers, status pills, and empty/error/loading states
- `context/`: auth state management
- `api/`: Axios client and API wrappers

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create:

- `server/.env`
- `client/.env`

Use the provided example files as a starting point.

### 3. Start development servers

```bash
npm run dev
```

This starts:

- Backend on `http://localhost:5000`
- Frontend on `http://localhost:5173`

## Environment Variables

### Server

See `server/.env.example`.

Important values:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### Client

See `client/.env.example`.

Important value:

- `VITE_API_URL`

## API Surface

Main route groups:

- `/api/auth`
- `/api/books`
- `/api/borrows`
- `/api/reservations`
- `/api/fines`
- `/api/payments`
- `/api/users`
- `/api/dashboard`
- `/api/notifications`
- `/api/health`

## Razorpay Flow

1. Member opens fines page
2. Frontend requests `/api/payments/razorpay/order`
3. Backend creates Razorpay order using outstanding fine amount
4. Frontend opens Razorpay checkout
5. Backend verifies signature through `/api/payments/razorpay/verify`
6. Optional webhook endpoint `/api/payments/razorpay/webhook` supports deployment reconciliation
7. Fine status and user balance are updated only after server verification

### Razorpay Test Mode Setup

Use Razorpay **Test Mode** keys for local/staging testing. Do not commit real key values.

Server environment variables:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=replace-with-test-key-secret
RAZORPAY_WEBHOOK_SECRET=choose-a-separate-webhook-secret
```

The webhook secret is not the API key secret. Create a separate random secret in the Razorpay Dashboard and use the same value for `RAZORPAY_WEBHOOK_SECRET`.

Webhook URL:

```txt
https://your-backend-domain.com/api/payments/razorpay/webhook
```

For local testing, Razorpay cannot call `localhost` directly. Use a public HTTPS tunnel or the deployed Render backend URL.

Recommended test webhook events:

- `payment.captured`
- `payment.failed`
- `order.paid`

Dashboard path:

1. Open Razorpay Dashboard in **Test Mode**.
2. Go to **Accounts & Settings**.
3. Open **Webhooks** under **Website and app settings**.
4. Add the webhook URL above.
5. Enter the same secret configured as `RAZORPAY_WEBHOOK_SECRET`.
6. Select the recommended events.
7. Use OTP `754081` if Razorpay prompts during test-mode webhook setup.

## Email Flow

The backend uses Nodemailer with SMTP credentials.

Recommended providers:

- Brevo for production
- Mailtrap for testing
- Gmail app password for simple development setups

Email notifications are used for:

- Welcome messages
- Borrow confirmations
- Return confirmations
- Reservation ready alerts
- Fine payment receipts
- SMTP test dispatch from admin dashboard

## Deployment

### MongoDB Atlas

- Create an Atlas cluster
- Add a database user
- Copy the connection string into `MONGODB_URI`
- Allow access from Render networking or your preferred IP policy

### Render Backend

- Create a new Web Service for `server`
- Build command: `npm install`
- Start command: `npm run start --workspace server`
- Add all backend environment variables
- Set `CLIENT_URL` to your Netlify frontend URL

### Netlify Frontend

- Connect the repository and point the base directory to `library-management-system/client`
- Build command: `npm run build`
- Publish directory: `dist`
- Set `VITE_API_URL` to your Render API URL, for example `https://your-render-app.onrender.com/api`

### GitHub

- Push `library-management-system/` to your GitHub repository
- Connect GitHub to Render and Netlify for CI/CD deployments

## Seed Behavior

If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in the backend environment, the server seeds a default admin account on startup if it does not already exist.

To seed the backend catalog with a starter library collection:

```bash
npm run seed:books --workspace server
```

Useful checks:

```bash
npm run seed:books --workspace server -- --validate-only
npm run seed:books --workspace server -- --dry-run
```

The book seed is idempotent by ISBN. Existing books keep their current copy counts and circulation state; the script only refreshes metadata such as title, authors, category, publisher, and shelf location.

## Build Verification

Verified locally:

- `npm run build --workspace client`
- `npm run build --workspace server`
- `npm audit --omit=dev`

## Notes

- Payments are server-verified; the frontend does not trust payment success alone.
- Email failures are logged and do not block the underlying library action.
- The current implementation is API-first and structured for incremental extension such as audit logs, cron jobs, exports, and copy-level barcode tracking.
