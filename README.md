# Eventful-er

Eventful-er is an online ticketing and event management platform. It allows organizers (hosts) to publish events and manage attendees, and customers (attendees) to browse events, purchase entry tickets securely via Paystack, receive unique verification QR codes, and manage profiles.

---

## 🚀 Built Features & Requirements Status

Here is a breakdown of the requirements and what has been built:

| Requirement | Status | Implementation Details |
| :--- | :---: | :--- |
| **Authentication & Authorization** | **Completed** | Roles configured as `host` and `attendee`. Dynamic login/signup controls and middleware-protected view routes (dashboard, profile, events management). |
| **QR Code Generation** | **Completed** | Generates a unique, high-resolution QR code dynamically when an attendee successfully completes a Paystack transaction. QR codes contain ticket verification tokens. |
| **Shareability** | **In Progress** | Social media sharing metadata exists on individual event detail pages, but direct UI quick-share buttons (e.g., share to Twitter/Facebook) can be further integrated. |
| **Notifications** | **Completed (Mocked)** | A `node-cron` background worker runs hourly to schedule reminders 24 hours before events. Note: Actual email delivery is mocked in console logs because we lack a verified domain, which is a strict requirement for SMTP providers like Mailtrap. |
| **Analytics** | **Completed** | Built a visual analytics dashboard showing total all-time tickets sold, check-ins, and estimated revenue directly on the host's dashboard. |
| **Payment (Paystack)** | **Completed** | Built initialization and webhook handlers under `src/modules/payments/` with verified transaction state tracking. |
| **TypeScript Migration** | **Planned** | Currently built using robust vanilla ES6 JavaScript. Can be refactored to TypeScript using standard `tsconfig` and type definitions. |
| **Cache Layer** | **Planned** | Currently hits Postgres directly via Sequelize ORM. Need to add a Redis-based cache layer to improve performance for high-traffic event reads. |
| **Unit & Integration Tests** | **Completed** | Robust test coverage using Jest and Supertest, verifying endpoints, database hooks, and authentication logic. All 22 test cases pass. |
| **Rate Limiting** | **Completed** | Middleware configured using `express-rate-limit` to safeguard API endpoints. |
| **API Documentation** | **Completed** | Swagger setup in `src/config/swagger.config.js` with functional docs available at `/api-docs`. |

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (managed using Sequelize ORM)
- **View Engine**: EJS (with Tailwind-inspired responsive custom CSS)
- **Testing**: Jest, Supertest
- **Security**: JWT-based cookie session auth, bcrypt password hashing, Express Rate Limiter
- **Documentation**: Swagger OpenAPI 3.0 via `swagger-ui-express`

---

## 💻 Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL database

### Environment Variables
Configure your `.env` file using `.env.example`:
```env
PORT=3000
DB_URI=postgres://username:password@localhost:5432/eventful_db
DB_URI_TEST=postgres://username:password@localhost:5432/eventful_test_db
JWT_SECRET=your_jwt_secret
PAYSTACK_SECRET_KEY=your_paystack_secret
```

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Run database migrations and seeds:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
3. Run in development mode (with nodemon):
   ```bash
   npm run dev
   ```

### Running Tests
To run the Jest test suite:
```bash
npm test
```
*(On Windows systems where script execution is disabled, use `cmd.exe /c "npm test"`)*
