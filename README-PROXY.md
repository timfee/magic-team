# Cloud SQL Proxy Setup

This project includes a cross-platform Cloud SQL Proxy setup for connecting to GCP Cloud SQL databases during local development.

## Prerequisites

1. A Google Cloud SQL PostgreSQL instance
2. Appropriate GCP credentials (via `gcloud auth login`)

## Setup

1. **Add environment variables to `.env`:**

```bash
# Your GCP Cloud SQL instance connection string
CLOUD_SQL_INSTANCE="your-project:your-region:your-instance"

# Update DATABASE_URL to use localhost (proxy connects locally)
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

2. **The Cloud SQL Proxy binary is automatically downloaded** when you run `npm install` (via postinstall hook)

## Usage

### Start the proxy

In a **separate terminal**, run:

```bash
npm run db:proxy
```

Keep this terminal open while developing. The proxy will connect to your Cloud SQL instance and make it available at `localhost:5432`.

### Run database migrations

With the proxy running, in your main terminal:

```bash
npm run db:push
```

### Start the dev server

```bash
npm run dev
```

## Commands

- `npm run db:setup-proxy` - Download/update the Cloud SQL Proxy binary
- `npm run db:proxy` - Start the Cloud SQL Proxy (keep running)
- `npm run db:push` - Push schema changes to the database
- `npm run db:generate` - Generate migration files
- `npm run db:studio` - Open Drizzle Studio

## Cross-Platform Support

The proxy setup automatically detects your platform and downloads the correct binary:

- **macOS**: ARM64 and Intel (x64)
- **Linux**: ARM64 and x64
- **Windows**: x64

The binary is downloaded to `bin/cloud-sql-proxy` (gitignored).

## Troubleshooting

### "CLOUD_SQL_INSTANCE environment variable is not set"

Add `CLOUD_SQL_INSTANCE` to your `.env` file in the format: `PROJECT_ID:REGION:INSTANCE_NAME`

### "Cloud SQL Proxy binary not found"

Run `npm run db:setup-proxy` to download the binary.

### Authentication errors

Make sure you're authenticated with GCP:

```bash
gcloud auth application-default login
```

### Connection timeout

Check that:
1. Your Cloud SQL instance is running
2. You have the correct instance connection string
3. Your GCP credentials are valid
