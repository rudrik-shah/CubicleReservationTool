# Office Seat Booking Application

## Overview

This repository contains a modern web application for office seat booking. The system allows users to reserve office seats for specific dates, view their booking history, and provides administrative capabilities to monitor overall seat utilization.

The application is built as a full-stack application with:
- React frontend with modern UI components using shadcn/ui
- Express backend API
- Drizzle ORM for database access
- PostgreSQL database (to be configured)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The application follows a modern React architecture with the following key components:

1. **Component Structure**:
   - UI components from shadcn/ui library
   - Page components that implement specific views
   - Shared hooks for common functionality
   - TanStack Query for data fetching and state management

2. **Routing**:
   - Uses wouter for lightweight routing
   - Main routes: Dashboard, My Bookings, Admin

3. **State Management**:
   - React Query for server state
   - Local state for UI components
   - Storage of user preferences in local storage

### Backend Architecture

The backend is built with Express.js and uses a service-oriented approach:

1. **API Layer**:
   - RESTful API endpoints for seat management, bookings, and user operations
   - Express middleware for request processing and error handling

2. **Data Access Layer**:
   - Drizzle ORM for database interactions
   - Schema definitions for users, seats, and bookings
   - In-memory storage implementation for development/testing

3. **Services**:
   - Booking management service
   - User authentication service
   - Scheduled jobs for booking expiration

### Database Schema

The application uses a relational database model with the following tables:

1. **Users**:
   - id (primary key)
   - username
   - password
   - cecId (Company Employee Code ID)

2. **Seats**:
   - id (primary key)
   - seatId (e.g., "1A", "2B")
   - row (numeric)
   - column (text)

3. **Bookings**:
   - id (primary key)
   - userId (foreign key)
   - seatId (references seats)
   - date (ISO format)
   - status (active, cancelled, expired)
   - createdAt (timestamp)
   - notes (optional)

## Key Components

### Frontend Components

1. **Page Components**:
   - Dashboard: Main seat selection and reservation interface
   - MyBookings: View and manage user bookings
   - Admin: Administrative view for seat utilization

2. **UI Components**:
   - SeatMap: Visual representation of office seats
   - ReservationForm: Form for creating new bookings
   - DateSelector: Date selection control
   - RecentBookings: Display of user's bookings
   - ConfirmationDialog: Booking confirmation

3. **Shared Components**:
   - Layout components (Header, Sidebar)
   - shadcn/ui component library

### Backend Components

1. **API Routes**:
   - `/api/seats`: Endpoints for seat data and availability
   - `/api/bookings`: Endpoints for booking management
   - `/api/users`: User management

2. **Services**:
   - Storage service for data persistence
   - Authentication and authorization service
   - Scheduled jobs for maintenance

3. **Middleware**:
   - Error handling
   - Request logging
   - CORS and security

## Data Flow

1. **Seat Reservation Process**:
   - User selects a date on the Dashboard
   - System fetches available seats for the selected date
   - User selects a seat and enters their CEC ID
   - System validates the request and creates a booking
   - User receives confirmation and booking details

2. **Booking Management**:
   - User views their bookings on the MyBookings page
   - User can cancel existing bookings
   - System automatically expires old bookings at the end of the day

3. **Administrative View**:
   - Admins can view seat utilization stats
   - System provides occupancy rates and booking trends

## External Dependencies

### Frontend Dependencies

1. **UI Framework**:
   - React with shadcn/ui components
   - TailwindCSS for styling

2. **State Management**:
   - TanStack Query (React Query) for server state
   - React hooks for local state

3. **Utility Libraries**:
   - date-fns for date manipulation
   - clsx and tailwind-merge for class name handling
   - zod for form validation

### Backend Dependencies

1. **Web Framework**:
   - Express.js

2. **Database**:
   - Drizzle ORM for database access
   - PostgreSQL (to be configured)

3. **Utility Libraries**:
   - node-schedule for task scheduling
   - zod for validation

## Deployment Strategy

The application is configured for deployment on Replit with the following approach:

1. **Development**:
   - `npm run dev` for local development
   - Vite dev server with HMR for React
   - Express backend with auto-reload

2. **Build**:
   - Frontend: Vite build process
   - Backend: ESBuild bundling

3. **Production**:
   - `npm run start` for production deployment
   - Static serving of built frontend assets
   - Node.js process for the Express backend

4. **Database**:
   - Currently using in-memory storage
   - Configured to work with PostgreSQL (needs to be provisioned)
   - Connection via environment variables

## Getting Started

1. Configure the PostgreSQL database:
   - Ensure the `DATABASE_URL` environment variable is set
   - Run `npm run db:push` to set up the database schema

2. Start the development server:
   - Run `npm run dev` to start both frontend and backend

3. Build for production:
   - Run `npm run build` to create production-ready assets
   - Run `npm run start` to start the production server

# Manual Run Instructions

## 1. Set up PostgreSQL locally
- Install PostgreSQL (e.g., with Homebrew: `brew install postgresql`)
- Start PostgreSQL: `brew services start postgresql`
- Create a database and user:
  ```sh
  psql postgres
  CREATE USER officebooker WITH PASSWORD 'officebookerpass';
  CREATE DATABASE officecubicle OWNER officebooker;
  GRANT ALL PRIVILEGES ON DATABASE officecubicle TO officebooker;
  \q
  ```

## 2. Configure environment variables
- Copy `.env.example` to `.env` and adjust if needed:
  ```sh
  cp .env.example .env
  ```

## 3. Install dependencies
```sh
npm install
```

## 4. Run database migrations
```sh
npx drizzle-kit push
```

## 5. Build and start the app
```sh
npm run build
npm start
```

- The app will be available at http://localhost:3000

---

## Alternative: Run with Docker
```sh
docker-compose up --build
```