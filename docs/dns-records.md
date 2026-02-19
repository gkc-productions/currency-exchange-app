# DNS Records Notes

Date: 2026-02-19

Decision:
- `api.clarisend.co` A record removed (no A record present / NXDOMAIN).

Reason:
- `0.0.0.0` is not a valid destination for a production API host.
- Keeping it causes confusion and can break tooling or health checks.

Future rule:
- If `api.clarisend.co` is added later, it must point to a real backend ingress.
- It must be covered by valid TLS/certificate and explicit routing.
