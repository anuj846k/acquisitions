# Docker Setup Guide

This guide covers running the application in both **development** (with Neon Local) and **production** (with Neon Cloud) environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup (Neon Local)](#development-setup-neon-local)
- [Production Deployment (Neon Cloud)](#production-deployment-neon-cloud)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- Docker Desktop (Mac/Windows) or Docker Engine (Linux)
- Docker Compose v2.0 or higher
- Neon account: [https://console.neon.tech](https://console.neon.tech)

### Neon Configuration

Get the following from your [Neon Console](https://console.neon.tech):

1. **NEON_API_KEY**: Create an API key under Account Settings → API Keys
2. **NEON_PROJECT_ID**: Found under Project Settings → General
3. **DATABASE_URL** (production): Connection string from your production branch

---

## Development Setup (Neon Local)

Neon Local creates ephemeral database branches automatically, giving you a fresh database for each development session without manual cleanup.

### 1. Configure Environment

Copy and configure the development environment file:

```bash
cp .env.development .env
```

Edit `.env` and set your Neon credentials:

```bash
# Required for Neon Local
NEON_API_KEY=your_neon_api_key_here
NEON_PROJECT_ID=your_neon_project_id_here
PARENT_BRANCH_ID=main

# Optional: Change database name (default: neondb)
DATABASE_NAME=neondb

# JWT and other secrets
JWT_SECRET=your_dev_jwt_secret
ARCJET_KEY=your_arcjet_key
```

### 2. Start Development Environment

```bash
docker-compose -f docker-compose.dev.yml up --build
```

This will:

- Start the **Neon Local** proxy container
- Create an **ephemeral branch** from your parent branch (default: main)
- Start your application connected to the ephemeral database
- Enable **hot-reload** for code changes (mounted volumes)

### 3. Access Your Application

- **Application**: http://localhost:3000
- **Health check**: http://localhost:3000/health
- **Neon Local Postgres**: localhost:5432

### 4. Connect to Database (Optional)

If you need to inspect the database directly:

```bash
# Using psql
psql "postgres://neon:npg@localhost:5432/neondb?sslmode=require"

# Or use Drizzle Studio
npm run db:studio
```

### 5. Stop Development Environment

```bash
docker-compose -f docker-compose.dev.yml down
```

**Note**: With `DELETE_BRANCH=false` configured, the ephemeral branch persists per Git branch. Change to `DELETE_BRANCH=true` in `docker-compose.dev.yml` if you want branches deleted on shutdown.

### Development Features

✅ **Ephemeral Branches**: Fresh database per Git branch  
✅ **Hot Reload**: Code changes reflect immediately  
✅ **Branch Persistence**: Database state persists per Git branch  
✅ **No Connection String Changes**: Always connect to localhost:5432

---

## Production Deployment (Neon Cloud)

Production connects directly to your Neon Cloud database (serverless Postgres) without the local proxy.

### 1. Configure Environment

Create and configure the production environment file:

```bash
cp .env.production .env
```

Edit `.env` with production values:

```bash
NODE_ENV=production
LOG_LEVEL=info

# Production Neon Cloud connection string
DATABASE_URL=postgres://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require

# Strong production secrets
JWT_SECRET=your_strong_production_secret
JWT_EXPRESS_IN=7d

ARCJET_KEY=your_production_arcjet_key
```

### 2. Run Database Migrations

**Important**: Run migrations before deploying:

```bash
# If running migrations from your local machine
npm run db:migrate

# Or run migrations in the container after it starts
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### 3. Start Production Environment

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

This will:

- Build a production-optimized Docker image
- Connect directly to **Neon Cloud** (no local proxy)
- Run as a non-root user for security
- Enable automatic restarts on failure

### 4. Verify Deployment

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f app

# Test health endpoint
curl http://localhost:3000/health
```

### 5. Stop Production Environment

```bash
docker-compose -f docker-compose.prod.yml down
```

---

## Environment Variables

### Development Variables (Neon Local)

| Variable           | Description               | Default       |
| ------------------ | ------------------------- | ------------- |
| `NEON_API_KEY`     | Your Neon API key         | Required      |
| `NEON_PROJECT_ID`  | Your Neon project ID      | Required      |
| `PARENT_BRANCH_ID` | Branch to fork from       | `main`        |
| `DATABASE_NAME`    | Database name             | `neondb`      |
| `DELETE_BRANCH`    | Delete branch on shutdown | `false`       |
| `NODE_ENV`         | Environment               | `development` |
| `LOG_LEVEL`        | Winston log level         | `debug`       |
| `JWT_SECRET`       | JWT signing secret        | Required      |
| `JWT_EXPRESS_IN`   | Token expiry              | `1d`          |

### Production Variables (Neon Cloud)

| Variable         | Description                  | Example                       |
| ---------------- | ---------------------------- | ----------------------------- |
| `DATABASE_URL`   | Neon Cloud connection string | `postgres://...neon.tech/...` |
| `NODE_ENV`       | Environment                  | `production`                  |
| `LOG_LEVEL`      | Winston log level            | `info`                        |
| `JWT_SECRET`     | Strong production secret     | Required                      |
| `JWT_EXPRESS_IN` | Token expiry                 | `7d`                          |

---

## Database Migrations

### In Development

Migrations run against your ephemeral Neon Local branch:

```bash
# Generate migration from schema changes
docker-compose -f docker-compose.dev.yml exec app npm run db:generate

# Apply migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

### In Production

```bash
# Apply migrations to production database
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate
```

**Best Practice**: Run migrations as part of your CI/CD pipeline before deploying new code.

---

## Troubleshooting

### Neon Local Connection Issues

**Problem**: App can't connect to Neon Local

```bash
# Check Neon Local container logs
docker-compose -f docker-compose.dev.yml logs neon-local

# Verify API credentials are correct
echo $NEON_API_KEY
echo $NEON_PROJECT_ID

# Restart containers
docker-compose -f docker-compose.dev.yml restart
```

### Branch Detection on macOS

**Problem**: Git branch detection not working in Docker Desktop for Mac

**Solution**: In Docker Desktop settings, use **gRPC FUSE** instead of VirtioFS:

- Open Docker Desktop → Settings → General
- Change "Virtual Machine Manager" to use gRPC FUSE
- Restart Docker Desktop

### Port Already in Use

**Problem**: `Error: Port 3000 already in use`

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use a different port in .env
PORT=3001
```

### Database Connection Refused

**Problem**: `ECONNREFUSED` errors

```bash
# Wait for database to be ready
docker-compose -f docker-compose.dev.yml logs neon-local

# Check if health check passed
docker-compose -f docker-compose.dev.yml ps

# Manually test connection
docker-compose -f docker-compose.dev.yml exec neon-local pg_isready
```

### Neon Local Metadata Directory

The `.neon_local/` directory stores branch metadata. Add to `.gitignore`:

```bash
echo ".neon_local/" >> .gitignore
```

### Production Database Migration Failures

**Problem**: Migrations fail in production

```bash
# Check current migration status
docker-compose -f docker-compose.prod.yml exec app npm run db:studio

# Verify DATABASE_URL is correct
docker-compose -f docker-compose.prod.yml exec app printenv DATABASE_URL

# Check application logs
docker-compose -f docker-compose.prod.yml logs app
```

---

## Additional Resources

- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Neon Console](https://console.neon.tech)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Docker Compose Reference](https://docs.docker.com/compose/)

---

## Quick Reference

```bash
# Development
docker-compose -f docker-compose.dev.yml up --build     # Start dev environment
docker-compose -f docker-compose.dev.yml down           # Stop dev environment
docker-compose -f docker-compose.dev.yml logs -f        # View logs

# Production
docker-compose -f docker-compose.prod.yml up -d --build # Start prod (detached)
docker-compose -f docker-compose.prod.yml down          # Stop prod environment
docker-compose -f docker-compose.prod.yml logs -f app   # View app logs

# Database
npm run db:generate                                      # Generate migrations
npm run db:migrate                                       # Apply migrations
npm run db:studio                                        # Open Drizzle Studio

# Cleanup
docker-compose -f docker-compose.dev.yml down -v        # Remove volumes
docker system prune -a                                   # Clean up Docker
```
