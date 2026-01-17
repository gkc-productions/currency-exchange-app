This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## UI structure

- AppShell lives in `app/[locale]/layout.tsx` and composes `components/Navbar.tsx` and `components/Footer.tsx`.
- The landing funnel and quote flow live in `app/[locale]/page.tsx` with reusable UI in `components/`.
- Transfer receipts remain in `app/[locale]/transfer/[id]/page.tsx`.

## Routes

- `/{locale}`: landing funnel + quote/recommendation flow
- `/{locale}/transfer/[id]`: transfer receipt page
- `/{locale}/about`, `/{locale}/security`, `/{locale}/fees`, `/{locale}/help`: placeholder brand pages
- `/status`: system diagnostics and health monitoring
- `/api/status`: JSON status endpoint for monitoring

## Trust & Reliability Architecture

ClariSend is built with production-grade reliability and transparency at its core:

### System Monitoring

**Live Status Dashboard** (`/status`)
- Real-time system health monitoring
- Database connectivity and response time tracking
- Rate cache performance metrics (hits/misses)
- Active corridor and rails visibility
- Automatic refresh every 10 seconds
- Green/yellow/red status indicators

**Status API** (`/api/status`)
- JSON endpoint for external monitoring
- Returns 503 on critical failures
- Includes version and build timestamp
- No sensitive data exposure

### Error Handling

**Global Error Boundaries**
- App Router compatible error boundaries at root and locale levels
- User-friendly error messages that never expose stack traces
- Automatic error logging for debugging
- Graceful degradation with recovery options

**User-Safe API Responses**
- All validation errors return clear, actionable messages
- No raw database errors or technical jargon exposed
- Consistent HTTP status codes (400, 404, 410, 503)
- Examples:
  - ✅ "We don't currently support sending from XYZ"
  - ✅ "This quote has expired. Please request a new quote"
  - ✅ "This route is temporarily unavailable"
  - ❌ Never: "Database connection failed" or "Internal server error"

### Smart Route Recommendations

**Deterministic Algorithm**
- Three distinct route suggestions guaranteed when possible
- Tie-breaking rules documented in code:
  - **Lowest Fee**: If fees equal, prefer faster route
  - **Fastest**: If ETA equal, prefer cheaper route
  - **Best Value**: Excludes previous winners, maximizes payout
- Clear labeling: "Lowest Fee", "Fastest", "Best Value"
- Transparent fee breakdown and exchange rate margin

### Production Operations

**Deployment**
- PM2 process management with auto-restart
- Nginx reverse proxy with HTTPS (Let's Encrypt)
- Environment variable configuration
- Database connection pooling via Prisma
- Build-time type checking with TypeScript strict mode

**Monitoring & Diagnostics**
- Request ID tracking via middleware
- Structured logging with context
- 30-second quote expiry enforcement
- Rate caching with 30-second TTL
- Idempotency key support for transfers

**Security**
- TLS 1.3 encryption
- No credentials stored in code
- Prisma parameterized queries (SQL injection prevention)
- CORS and security headers via Next.js
- Input validation on all API routes

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
