# Coinbase Payout Adapter (Scaffold)

This file documents the expected Coinbase payout objects used by the future real adapter.
No secrets should be committed here.

## Required Configuration
- `COINBASE_API_KEY`
- `COINBASE_ACCOUNT_ID`
- `COINBASE_WEBHOOK_SECRET`

## Expected Objects
### Create Payout
- `amount` (string/number)
- `currency` (string, e.g. "USD")
- `destination` (recipient account, address, or wallet id)
- `idempotencyKey` (string)

### Webhook Event
- `eventId`
- `payoutId`
- `status` (PROCESSING | COMPLETED | FAILED)
- `occurredAt` (ISO timestamp)

## TODO
- Implement OAuth/auth flows if needed.
- Map Coinbase payout statuses to internal statuses.
- Validate webhook signatures using `COINBASE_WEBHOOK_SECRET`.
