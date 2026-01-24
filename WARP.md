# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Node.js Express API with authentication using Drizzle ORM and Neon (PostgreSQL). The application uses ES modules and includes path aliases for cleaner imports.

## Common Commands

### Development

```bash
npm run dev              # Start development server with hot-reload (--watch)
```

### Linting and Formatting

```bash
npm run lint             # Check code with ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without making changes
```

### Database Operations

```bash
npm run db:generate      # Generate Drizzle migration files from schema changes
npm run db:migrate       # Apply pending migrations to database
npm run db:studio        # Open Drizzle Studio (database GUI)
```

## Architecture

### Directory Structure

```
src/
├── config/          # Database connection, logger configuration
├── controllers/     # Request handlers (business logic entry points)
├── services/        # Core business logic and data operations
├── routes/          # Express route definitions
├── models/          # Drizzle ORM schema definitions (pgTable)
├── middleware/      # Express middleware (currently empty)
├── validations/     # Zod schemas for request validation
└── utils/           # Helper functions (JWT, cookies, formatting)
```

### Key Architectural Patterns

**Path Aliases**: The project uses Node.js imports mapping (package.json). Always use these aliases instead of relative paths:

- `#config/*` → `./src/config/*`
- `#controllers/*` → `./src/controllers/*`
- `#middleware/*` → `./src/middleware/*`
- `#models/*` → `./src/models/*`
- `#routes/*` → `./src/routes/*`
- `#services/*` → `./src/services/*`
- `#utils/*` → `./src/utils/*`
- `#validations/*` → `./src/validations/*`

**Layered Architecture**:

- Routes define endpoints and call controllers
- Controllers handle request/response, validation, and orchestration
- Services contain business logic and database operations
- Models define database schemas using Drizzle ORM

**Authentication Flow**:

- JWT tokens stored in HTTP-only cookies (configured in utils/cookies.js)
- Passwords hashed with bcrypt (10 rounds)
- User validation with Zod schemas
- Token expiry configured via JWT_EXPRESS_IN env var

### Database (Drizzle ORM + Neon PostgreSQL)

- Connection: Neon serverless driver (`@neondatabase/serverless`)
- ORM: Drizzle with HTTP adapter (`drizzle-orm/neon-http`)
- Schema: Defined in `src/models/*.js` using pgTable
- Migrations: Generated in `drizzle/` directory
- Configuration: `drizzle.config.js` at project root

When modifying database schema:

1. Update model files in `src/models/`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:migrate` to apply migration

### Logging

Winston logger configured in `config/logger.js`:

- Development: Console output (colorized) + file logging
- Production: File logging only (error.log and combined.log)
- Log level controlled by LOG_LEVEL env var
- HTTP requests logged via Morgan middleware

### Code Style

ESLint enforces:

- 2-space indentation
- Single quotes
- Semicolons required
- Arrow functions preferred
- const preferred over let
- Unix line endings (LF)

Prettier automatically formats:

- 80 character line width
- Trailing commas (ES5)
- No parentheses around single arrow function params

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
PORT=3000                    # Server port
NODE_ENV=development         # Environment (development/production)
LOG_LEVEL=info              # Winston log level
DATABASE_URL=               # Neon PostgreSQL connection string
JWT_SECRET=                 # Secret for JWT token signing
JWT_EXPRESS_IN=1d           # JWT expiration (e.g., 1d, 24h)
```

## API Endpoints

```
GET  /                      # Root endpoint
GET  /health               # Health check (status, uptime, timestamp)
GET  /api                  # API status
POST /api/auth/sign-up     # User registration (implemented)
POST /api/auth/sign-in     # User login (stub)
POST /api/auth/sign-out    # User logout (stub)
```

## Development Notes

### Adding New Routes

1. Define schema in `src/validations/` using Zod
2. Create service functions in `src/services/`
3. Implement controller in `src/controllers/`
4. Register route in `src/routes/`
5. Mount router in `src/app.js`

### Database Models

Models use Drizzle's pgTable syntax. Current user model includes:

- id (serial primary key)
- name, email, password (varchar)
- role (varchar with 'user' default)
- createdAt, updatedAt (timestamps)

### Error Handling

- Controllers use try/catch and pass errors to Express error handler via `next(e)`
- Validation errors formatted with `formatValidationError` utility
- Service layer throws errors that controllers catch and transform into HTTP responses
- Logger tracks all errors with stack traces
