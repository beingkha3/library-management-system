# Library Management System

A production-style MERN web application for managing books, borrowing, reservations, overdue fines, and role-based library operations. Built for academic library workflows with member, librarian, and admin portals.

## Highlights

- Member, librarian, and admin role flows
- JWT authentication and route protection
- Book inventory and catalog browsing with search
- Borrowing, renewals, returns, and reservation queue management
- Overdue fine calculation and tracking
- Analytics dashboards and reports for staff and administrators
- Responsive React + Tailwind UI
- Deployed on Netlify (frontend), Render (backend), MongoDB Atlas (database)

## Tech Stack

- **Frontend:** React, React Router, Vite, TailwindCSS, Axios
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT
- **Deployment:** Netlify (frontend), Render (backend), MongoDB Atlas (database)

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
- Browse and search the book catalog
- Borrow available books
- Reserve books currently on loan
- Track due dates and active loans
- Renew active loans when eligible
- View outstanding fines
- Add reviews and ratings

### Librarians

- Add, update, and archive books
- Manage copies and availability
- Issue books to members
- Process returns
- Review reservations and fines
- Access circulation reports

### Admins

- Manage users and roles
- Configure system loan and fine settings
- Review notification activity
- Access institution-level dashboard analytics

## Backend Overview

The backend exposes REST APIs under `/api` and handles:

- Authentication with signed JWT tokens
- Role-based authorization
- Catalog and review management
- Borrow, renew, return, and reservation workflows
- Fine calculation and tracking
- Staff/admin dashboard reporting

Main backend modules:

- `models/`: Mongoose schemas for users, books, borrows, reservations, fines, reviews, and settings
- `services/`: business logic for auth, books, borrows, reservations, fines, settings, and reports
- `controllers/`: request/response layer
- `routes/`: API route definitions

## Upcoming Features

- **Fine payments** via Razorpay integration
- **Email notifications** via SMTP (borrow confirmations, reservation alerts, etc.)
- Input validation using Zod schemas

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

- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — secret key for signing tokens (minimum 32 characters)
- `CLIENT_URL` — frontend URL(s) for CORS (comma-separated for multiple origins)
- `ADMIN_EMAIL` — auto-seeded admin account email
- `ADMIN_PASSWORD` — auto-seeded admin account password

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

- The book seed script is idempotent by ISBN — it updates metadata without resetting circulation state.
- The codebase is structured for incremental extension (audit logs, cron jobs, exports, barcode tracking).
- Payment and email integrations are planned and will be added next.
