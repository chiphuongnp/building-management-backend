# Building Management Backend (BME) — Project Documentation

## 1. Project Overview

**Building Management Backend** is the core backend service of the **Building Management Ecosystem (BME)**. It handles administrative, operational, and resident-facing services for multi-site building facilities (e.g., Tokyo site).

### Key Functional Domains:

- **Authentication & Authorization**: Role-based access control (RBAC), JWT authentication, user permissions.
- **Facility & Space Management**: Buildings, facilities, parking spaces, subscriptions, and reservations.
- **Transport & Bus Services**: Bus routes, buses, and bus subscription management.
- **Dining & Restaurant Services**: Restaurants, menus, dishes, and order management.
- **Events & Community**: Event bookings, user registrations, and information bulletin boards.
- **Payments**: Payment gateways integration (MoMo, VNPay).
- **AI & Assistance**: Intelligent chatbot integration using Groq SDK.
- **Scheduled Tasks**: Background cron jobs for automated system maintenance and status updates.

---

## 2. Tech Stack

- **Runtime & Language**: Node.js (v22), TypeScript (v5.9)
- **Web Framework**: Express.js (v5.1)
- **Database & Cloud Services**: Firebase Admin SDK (v13.5), Firestore, Firebase Functions (v6.6)
- **Scheduled Jobs**: `node-cron` (v4.2)
- **Validation**: Joi (v18.0)
- **Logging**: Winston (v3.18)
- **Authentication & Security**: JWT (`jsonwebtoken`), `bcrypt`/`bcryptjs`, CORS (`cors`), Express Rate Limit (`express-rate-limit`)
- **File Uploads**: Multer (v2.0)
- **Testing**: Jest (v30.2), `ts-jest`, Supertest (v7.2)
- **Formatting**: Prettier (v3.6)
- **External Integrations**: Groq AI SDK (`groq-sdk`), Nodemailer (`nodemailer`), MoMo & VNPay Payment Gateways

---

## 3. Project Structure & Organization

```
building-management-backend/
├── app.ts                 # Express application setup & route mounting
├── emulator.ts            # Local Firebase emulator entry point
├── configs/               # Environment & service configurations (Firebase, Groq, MoMo, Mailer)
├── constants/             # Enums & constants (Collection names, Site names, Statuses)
├── interfaces/            # TypeScript interface definitions for domain entities
├── middlewares/           # Express middlewares (Auth, Permission, Multer, Pagination)
├── routes/                # API Route handlers organized by entity/domain
├── services/              # Business logic layer
├── schedules/             # Background cron jobs powered by node-cron
├── triggers/              # Firebase Cloud Functions Firestore triggers
├── utils/                 # Utility functions & helpers (firebaseHelper, logger, JWT, date)
├── validations/           # Joi validation schemas
├── tests/                 # Unit and integration test suites
└── openspec/              # OpenSpec configuration, main specs, and changes
```

---

## 4. Development Conventions & Guidelines

### API & Routing Conventions

- All routes are prefixed by site name and collection name: `/:site/:collection` (e.g., `/tokyo/users`, `/tokyo/orders`).
- Use standard HTTP verbs: `GET` (fetch), `POST` (create), `PUT`/`PATCH` (update), `DELETE` (remove).
- Validate incoming request payloads using **Joi** schemas located in `validations/`.

### Database Pattern

- Database access is abstracted via **`firebaseHelper`** in `utils/firebaseHelper.ts`.
- Firestore collections are scoped by site prefix: `${site}/${Collection.NAME}`.

### Scheduled Jobs Pattern

- Background jobs are placed in `schedules/` (e.g., `eventCron.ts`, `parkingCron.ts`).
- All cron schedules are initialized together via `initSchedules(site)` in `schedules/index.ts` during server startup.

### Logging & Error Handling

- Use the central **Winston logger** from `utils/logger.ts` (`logger.info()`, `logger.error()`).
- Avoid `console.log` in production code.

### Testing Conventions

- Run tests using `npm test` (`jest --runInBand`).
- Unit and integration tests reside under `tests/` using Supertest for endpoint verification.
