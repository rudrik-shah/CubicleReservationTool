# OfficeCubicleBooker Linux Installation Guide

This guide will help you set up and run OfficeCubicleBooker on a fresh Linux server (Ubuntu/Debian recommended). It covers both Docker and manual (bare metal) installation.

---

## 1. Prerequisites
- Node.js (v20 or later recommended)
- npm (v9 or later)
- PostgreSQL (v14 or later)
- git
- (Optional) Docker & Docker Compose

Install dependencies (Ubuntu example):
```sh
sudo apt update
sudo apt install -y git curl postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
# (Optional) Docker
sudo apt install -y docker.io docker-compose
```

---

## 2. Clone the Repository
```sh
git clone <your-repo-url> OfficeCubicleBooker
cd OfficeCubicleBooker
```

---

## 3. Database Setup

### Option A: Docker (Recommended)
Run everything (Postgres + app) in containers:
```sh
docker-compose up --build
```
- The app will be available at http://localhost:3000

### Option B: Manual Postgres Setup
1. Start PostgreSQL:
   ```sh
   sudo service postgresql start
   ```
2. Create user and database:
   ```sh
   sudo -u postgres psql
   CREATE USER officebooker WITH PASSWORD 'officebookerpass';
   CREATE DATABASE officecubicle OWNER officebooker;
   GRANT ALL PRIVILEGES ON DATABASE officecubicle TO officebooker;
   \q
   ```
3. Copy `.env.example` to `.env` and edit if needed:
   ```sh
   cp .env.example .env
   # Ensure DATABASE_URL is:
   # DATABASE_URL=postgres://officebooker:officebookerpass@localhost:5432/officecubicle?sslmode=disable
   ```

---

## 4. Install Node.js Dependencies
```sh
npm install
```

---

## 5. Run Database Migrations
```sh
npx drizzle-kit push
```

---

## 6. Build and Start the App
```sh
npm run build
npm start
```
- The app will be available at http://localhost:3000

---

## Troubleshooting
- If you see SSL errors with Postgres, ensure `?sslmode=disable` is in your `DATABASE_URL`.
- If you see port errors, make sure port 3000 is open and not in use.
- For Docker, ensure your user is in the `docker` group or use `sudo`.

---

## Updating
To update the app:
```sh
git pull
npm install
npx drizzle-kit push
npm run build
npm start
```

---

## Support
For issues, open a GitHub issue or contact your system administrator.
