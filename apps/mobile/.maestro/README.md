# Maestro E2E Flows

End-to-end flows that drive the real app on a simulator/emulator, the same way a user would.

## Prerequisites

1. Maestro CLI installed (`curl -fsSL "https://get.maestro.mobile.dev" | bash`).
2. API running against the **test** database with debug endpoints enabled:
   ```bash
   cd apps/api
   pnpm run start:test
   ```
   This loads `.env.test` (`join_app_test` DB, `ENABLE_TEST_ENDPOINTS=true`) — flows read the simulated OTP code via `GET /auth/otp/debug`, which only exists in this mode (see `TestEndpointsGuard`).
3. A dev build of the app installed on a booted simulator/emulator:
   ```bash
   cd apps/mobile
   npx expo run:ios   # or: npx expo run:android
   ```
   Maestro drives an installed app binary — it cannot drive the Metro JS bundle directly.

## Running

```bash
maestro test apps/mobile/.maestro/register-and-login.yaml
maestro test apps/mobile/.maestro/create-event.yaml
```

## Flows

- `register-and-login.yaml` — registers a unique user, reads the OTP via the debug endpoint, verifies, and lands on the event list.
- `create-event.yaml` — runs the login flow, then creates an event using the device's (simulated) current location.

## Notes

- Each run generates a unique email/phone (`scripts/generate-test-user.js`) so re-running never collides with `join_app_dev` or previous test runs.
- Never run these flows against `.env` (the real dev/prod config) — the debug OTP endpoint is intentionally 404 there.
