# Katıl

An app for creating and joining spontaneous sports/social events around the Kadıköy/Bostancı area. See [Katıl-Vault](../Katıl-Vault/Home.md) for product/business decisions.

## Structure

```
apps/
  api/     # NestJS + Prisma + PostgreSQL
  mobile/  # Expo (React Native, TypeScript)
```

## Requirements

- Node.js 22+, pnpm (via corepack)
- Local PostgreSQL (`brew services start postgresql@14`)

## Setup

```bash
pnpm install

# apps/api/.env must define DATABASE_URL (a sample is already there)
cd apps/api
pnpm exec prisma migrate dev
```

## Development

```bash
pnpm api:dev       # NestJS dev server
pnpm mobile:start  # Expo dev server (pick iOS/Android/Web from the terminal)
```

## Soft launch

Production OTP delivery, EAS build profiles, operational metrics, and store/legal checklists are documented in [docs/SOFT_LAUNCH.md](docs/SOFT_LAUNCH.md).
