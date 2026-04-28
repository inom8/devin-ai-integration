# Autora — Auto Services Platform for Uzbekistan

Autora connects car owners with auto service providers and towing services across Uzbekistan. Built with a Node.js backend, React Native mobile app, and React admin panel.

## Architecture

```
autora/
├── backend/          # Node.js + Express + TypeScript API
├── mobile/           # React Native (Expo) mobile app
├── admin/            # React + Vite admin dashboard
├── docs/             # Architecture docs, roadmap
├── docker-compose.yml
└── README.md
```

## Features

- **Service Discovery** — Find nearby auto service providers (oil change, diagnostics, tire repair, etc.) with ratings and reviews
- **Booking System** — Book services with date/time selection and status tracking
- **Towing SOS** — Request towing with real-time GPS tracking via Socket.IO
- **Multi-role** — Drivers, service providers, and towing providers each have dedicated interfaces
- **Admin Panel** — Full management dashboard for providers, users, bookings, reviews, and categories
- **Payments** — Integration with Payme and Click (Uzbekistan payment systems)
- **Real-time** — Socket.IO for live towing truck location updates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, TypeScript, Prisma, PostgreSQL, Socket.IO |
| Mobile | React Native (Expo), React Navigation |
| Admin | React, Vite, React Router |
| Database | PostgreSQL, Redis |
| Auth | JWT + OTP via SMS (Eskiz.uz) |
| Payments | Payme, Click |
| Push | Firebase Cloud Messaging |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)

### 1. Start Infrastructure

```bash
cd autora
docker-compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

API runs on `http://localhost:4000`.

### 3. Mobile App

```bash
cd mobile
npm install
npx expo start
```

### 4. Admin Panel

```bash
cd admin
npm install
npm run dev
```

Admin panel runs on `http://localhost:5173`.

## API Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | `POST /api/auth/send-otp` | Send SMS OTP |
| Auth | `POST /api/auth/verify-otp` | Verify OTP, get JWT |
| Auth | `POST /api/auth/register` | Complete registration |
| Auth | `GET /api/auth/me` | Current user profile |
| Providers | `GET /api/providers` | List providers |
| Providers | `GET /api/providers/nearby` | Find nearby providers |
| Providers | `GET /api/providers/:id` | Provider detail |
| Bookings | `POST /api/bookings` | Create booking |
| Bookings | `GET /api/bookings` | List bookings |
| Bookings | `PATCH /api/bookings/:id/status` | Update status |
| Towing | `POST /api/towing/request` | Request towing |
| Towing | `GET /api/towing/nearby` | Find nearby trucks |
| Towing | `PATCH /api/towing/:id/accept` | Accept request |
| Reviews | `POST /api/reviews` | Submit review |
| Reviews | `GET /api/reviews` | List reviews |
| Payments | `POST /api/payments/create` | Initiate payment |
| Payments | `POST /api/payments/webhook` | Payment callback |

## Database Schema

Models: User, ServiceProvider, ServiceCategory, ProviderService, TowingProvider, Booking, TowingRequest, Review, Notification, Payment

See `backend/prisma/schema.prisma` for the full schema.

## License

MIT
