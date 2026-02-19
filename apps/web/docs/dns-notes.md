# DNS Notes

Date: 2026-02-19

## Intended host setup

- `clarisend.co` (apex): primary canonical host.
- `www.clarisend.co`: points to apex and is redirected to apex by app middleware.
- `app.clarisend.co` (optional): only if explicitly routed to the same app ingress.
- `api.clarisend.co`: must never be a placeholder (`0.0.0.0`).
  - Either remove it entirely when unused, or
  - point it to a real backend ingress with valid TLS and routing.

## Do not

- Do not set `A api.clarisend.co -> 0.0.0.0`.
- Do not leave placeholder DNS records in production.

## Verify

```bash
dig +short clarisend.co
dig +short www.clarisend.co
dig +short api.clarisend.co
```

If any resolved IP equals `0.0.0.0`, treat as invalid and fix DNS immediately.
