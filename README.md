# Habit Tracer

An industry-standard full-stack web application for tracking habits, monitoring consistency, and gamifying personal goals.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, React Router, Socket.io-client
- **Backend**: Node.js, Express, PostgreSQL, Socket.io
- **Tooling**: Prettier, ESLint, Husky, GitHub Actions, Docker Compose

## Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/en/) (v18+)
- [Docker](https://www.docker.com/) (optional, for local DB)
- PostgreSQL (if not using Docker)

### 2. Environment Variables
Copy the `.env.example` file in the `server` directory to `.env` and fill in the PostgreSQL connection details.
```bash
cp server/.env.example server/.env
```

### 3. Start Database (Optional)
If you have Docker installed, you can effortlessly spin up the PostgreSQL database:
```bash
docker-compose up -d
```
*Note: This will automatically seed the database using `server/schema.sql` on the first run.*

### 4. Install Dependencies
Run the following at the root of the project to install dependencies for both the client and server:
```bash
npm run install:all
```

### 5. Run the Application
Start both the React frontend and the Node backend concurrently:
```bash
npm run dev
```
- Client runs on: `http://localhost:5173`
- Server runs on: `http://localhost:8000`

## Workflow Commands
- `npm run dev`: Starts both client and server in development mode.
- `npm run build`: Builds the production-ready React client.
- `npm run lint`: Lints the frontend codebase.
- `npm run prepare`: Initializes Husky pre-commit hooks (runs automatically on install).

## Continuous Integration (CI)
This project uses GitHub Actions to automatically run linting and builds on Pull Requests and pushes to the `main` branch. See `.github/workflows/ci.yml` for details.
