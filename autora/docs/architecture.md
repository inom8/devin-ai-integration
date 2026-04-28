# Autora — Architecture Overview

## System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Mobile App    │────▶│   Backend API    │◀────│   Admin Panel    │
│  (React Native) │     │ (Express + TS)   │     │  (React + Vite)  │
└────────┬────────┘     └──────┬───────────┘     └──────────────────┘
         │                      │
         │  Socket.IO           │
         │◀────────────────────▶│
         │                      │
                          ┌─────┴─────┐
                          │           │
                    ┌─────▼───┐ ┌─────▼───┐
                    │PostgreSQL│ │  Redis   │
                    └─────────┘ └─────────┘
```

## Backend Architecture

- **Express.js** with TypeScript for type safety
- **Prisma ORM** for database access and migrations
- **Zod** for request validation
- **JWT** for authentication
- **Socket.IO** for real-time towing tracking
- **Firebase Admin** for push notifications

### Module Structure

```
backend/src/
├── index.ts          # Server entry point
├── socket.ts         # Socket.IO setup
├── middleware/
│   └── auth.ts       # JWT auth middleware
├── routes/
│   ├── auth.ts       # Authentication
│   ├── providers.ts  # Service providers
│   ├── bookings.ts   # Booking management
│   ├── towing.ts     # Towing requests
│   ├── reviews.ts    # Reviews and ratings
│   ├── notifications.ts  # Notification management
│   └── payments.ts   # Payment integration
├── services/
│   └── notification.ts   # Push notification service
└── utils/
    └── prisma.ts     # Prisma client singleton
```

## Database Design

The database uses PostgreSQL with the following key relationships:

- A **User** can be a Driver, Service Provider, Towing Provider, or Admin
- A **ServiceProvider** belongs to a User and has many **ProviderServices**
- Each **ProviderService** belongs to a **ServiceCategory**
- A **Booking** connects a User to a ServiceProvider and ProviderService
- A **TowingRequest** connects a User to a TowingProvider
- **Reviews** use a polymorphic pattern (targetType + targetId)
- **Payments** can be linked to either a Booking or TowingRequest

## Authentication Flow

1. User enters phone number
2. Backend sends OTP via Eskiz.uz SMS API
3. User enters OTP code
4. Backend verifies OTP, creates/finds user, returns JWT
5. If new user, redirect to registration to complete profile

## Real-time Towing Flow

1. Driver requests towing from mobile app
2. Backend creates TowingRequest with REQUESTED status
3. Nearby towing providers see the request
4. Provider accepts → status becomes ACCEPTED
5. Provider's app starts emitting GPS coordinates every 5 seconds via Socket.IO
6. Driver's app receives real-time location updates
7. Status progresses: EN_ROUTE → ARRIVED → COMPLETED

## Payment Flow

1. User creates payment for booking/towing
2. Backend initiates payment with Payme/Click API
3. User completes payment in the payment provider's interface
4. Payment provider sends webhook to confirm payment
5. Backend updates payment status
