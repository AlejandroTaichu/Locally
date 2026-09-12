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
4. A simulated location **inside a supported city** (İstanbul/İzmir/Antalya/Ankara) — the app now gates on this at launch (region access gate, see Katıl-Vault ADR 0014), regardless of login state. Without it every flow gets stuck on the "Henüz burada değiliz" screen before reaching Login:
   ```bash
   xcrun simctl location booted set 40.9789,29.0369   # Moda, Kadıköy — İstanbul
   ```
   This persists across app relaunches until cleared (`xcrun simctl location booted clear`) or the simulator resets.

## Running

```bash
maestro test apps/mobile/.maestro/register-and-login.yaml
maestro test apps/mobile/.maestro/login-existing-user.yaml
maestro test apps/mobile/.maestro/delete-account.yaml
maestro test apps/mobile/.maestro/create-event.yaml
maestro test apps/mobile/.maestro/participation-lifecycle.yaml
maestro test apps/mobile/.maestro/verify-event-screens.yaml
```

## Flows

- `register-and-login.yaml` — registers a unique user, reads the OTP via the debug endpoint, verifies, and lands on the event list.
- `login-existing-user.yaml` — registers, logs out, then logs back in with the same account; verifies the keyboard-safe login submit path.
- `delete-account.yaml` — registers a user, deletes the account from Profile, and verifies the session returns to Login.
- `create-event.yaml` — runs the login flow, then creates an event using the device's (simulated) current location.
- `participation-lifecycle.yaml` — creates organizer and participant accounts, publishes an approval event, requests and approves participation, then verifies the participant's approved status.
- `verify-event-screens.yaml` — creates an event, opens its detail, visits My Events, and captures all three flat-design screens.

## Notes

- Each run generates a unique email/phone (`scripts/generate-test-user.js`) so re-running never collides with `join_app_dev` or previous test runs.
- Never run these flows against `.env` (the real dev/prod config) — the debug OTP endpoint is intentionally 404 there.
