# Soft Launch Runbook

This runbook prepares Katıl for an internal Android APK and an iOS TestFlight build. Commands are run from `apps/mobile` unless noted otherwise.

## 1. Production prerequisites

- A public HTTPS API base URL.
- An Expo account and an EAS project linked with `pnpm dlx eas-cli init`.
- Apple Developer/App Store Connect access for TestFlight.
- Google Play Console access if the APK later moves beyond direct internal distribution.
- Final legal operator name, postal address, contact email, effective date, and public URLs for the privacy policy, terms, and web account-deletion path.

## 2. API environment

Set these as secrets in the API host. Never commit their values:

```text
NODE_ENV=production
DATABASE_URL=...
JWT_SECRET=...
OTP_DELIVERY_MODE=providers
RESEND_API_KEY=...
OTP_FROM_EMAIL=Katıl <giris@your-verified-domain.example>
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=...
```

`TWILIO_MESSAGING_SERVICE_SID` may replace `TWILIO_FROM_NUMBER`. Production startup intentionally fails if OTP delivery is left in console mode. Resend must have a verified sender domain and Twilio must be allowed to send to the target country.

## 3. EAS environments

Create `preview` and `production` environments in the Expo dashboard. At minimum, set:

```text
EXPO_PUBLIC_API_URL=https://api.your-domain.example
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://your-domain.example/gizlilik
EXPO_PUBLIC_TERMS_URL=https://your-domain.example/kullanim-kosullari
EXPO_PUBLIC_ACCOUNT_DELETION_URL=https://your-domain.example/hesap-silme
```

The committed `eas.json` creates an internal Android APK with `preview` and store-ready artifacts with `production`. Production build numbers are managed remotely and auto-incremented.

## 4. Build and submit

```bash
pnpm dlx eas-cli login
pnpm dlx eas-cli init
pnpm run build:android:preview
pnpm run build:ios:production
pnpm run submit:ios
```

`eas init` writes the EAS project ID into Expo configuration. Review and commit that change before producing the release candidate. The iOS submission step still requires the real App Store Connect app and Apple credentials.

## 5. Operational checks

The API exposes `GET /health`, including a database readiness check, and emits one structured JSON log per request with a request ID, method, path, status, and duration. Configure the hosting provider to probe `/health`, retain stdout/stderr, and alert on sustained 5xx responses. Do not add query strings or request bodies to logs because authentication targets and user data may be present there.

Run the aggregate validation report from `apps/api` against the intended database:

```bash
pnpm run metrics
```

It reports weekly event count, event fill rate, 30-day returning-participant rate, and premium-trial interest. Referral rate remains unavailable until a referral source is stored.

## 6. Release gate

- API unit, lint, build, and E2E checks pass.
- Mobile TypeScript and Expo Doctor checks pass.
- Registration, existing-user login, event creation, event detail, and My Events Maestro flows pass on a release-like build.
- Account deletion succeeds from Profile and the external deletion page is live.
- Legal placeholders are replaced and reviewed by qualified counsel.
- App Store privacy answers and Google Play Data safety answers match the actual code and enabled providers.
