# Rockyca v2 — Next.js 16 + NestJS 12 Full-Stack Rewrite

Modern full-stack rewrite of **Rocky Trading Co.** featuring:
- **Frontend & Admin Panel (`apps/web`)**: Next.js `16.4.6` (App Router) + Tailwind CSS `4.3` + HeroUI `3.2.8`
- **Backend API (`apps/api`)**: NestJS `12` + Prisma + PostgreSQL 16 + AWS S3 (`@aws-sdk/client-s3`)
- **Business Changes**:
  - Removed ATV category completely (focused on **Vehicles** and **Loading Ramps**).
  - **AWS S3 Presigned Direct Upload** for vehicle/ramp images and Carfax PDFs.
  - **Automatic Sold-Out Removal & S3 Cleanup**: Marking a vehicle (or ramp) as `sold_out` immediately hides it from the website (detail URLs return `404`) and **permanently deletes** all associated S3 images and Carfax PDF files while preserving the archived text record in `/admin`.
  - **4-Layer Free Contact Form Anti-Spam**: Cloudflare Turnstile (free unlimited tier) + Honeypot + Fill-Time Check + `@nestjs/throttler` IP Rate Limiting + Gibberish/Link Content Filter + PostgreSQL inquiry archiving.

---

## Quick Start (Local Development)

### 1. Start PostgreSQL + Docker S3 (`pgsty/silo`)
```bash
docker compose up -d
```
When `npm run dev:api` starts with `S3_ENDPOINT` set, the API automatically creates the `rockyca-inventory-media` bucket and configures public-read policy (`vehicles/*` and `carfax/*`). CORS for `http://localhost:3000` is pre-enabled in Docker Compose.
- Local S3 API: `http://localhost:9000`
- Local S3 Web Console: `http://localhost:9001` (`minioadmin` / `minioadmin_password`)

### 2. Environment Variables (Pre-configured for Local Docker S3)
`apps/api/.env` and `apps/web/.env.local` are pre-configured to use the local Docker PostgreSQL + MinIO S3 out of the box (copy from `.env.example` if recreating).
For production, switch the S3 block in `apps/api/.env` to your AWS S3 credentials and remove `S3_ENDPOINT`.

### 3. Run Database Migrations & Seed Initial Admin
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```
Default seeded admin (override via `ADMIN_SEED_*` env vars):
- Email: `admin@rockyca.com`
- Password: `ChangeMe123!`

### 4. Start API & Web Dev Servers
```bash
# Terminal 1 — NestJS API on http://localhost:4000/api
npm run dev:api

# Terminal 2 — Next.js Web on http://localhost:3000 (Admin at /admin)
npm run dev:web
```

---

## AWS S3 Bucket Configuration

### Required S3 CORS Policy (for direct browser PUT uploads)
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://rockyca.com",
      "https://www.rockyca.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### Recommended Public Read Policy (or serve via CloudFront OAC)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadInventoryMedia",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME/vehicles/*",
        "arn:aws:s3:::YOUR-BUCKET-NAME/carfax/*"
      ]
    }
  ]
}
```
If using CloudFront, set `S3_PUBLIC_BASE_URL="https://your-cdn.example.com"` in `apps/api/.env` and `NEXT_PUBLIC_MEDIA_HOSTNAME="your-cdn.example.com"` in `apps/web/.env.local`.

---

## Cloudflare Turnstile Setup (Free Tier)
1. Sign up for a free Cloudflare account (no DNS migration required).
2. Go to **Turnstile → Add Widget**, add `rockyca.com`, `www.rockyca.com`, and `localhost`.
3. Copy the **Site Key** into `apps/web/.env.local` (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) and the **Secret Key** into `apps/api/.env` (`TURNSTILE_SECRET_KEY`).
