# AI Expense & Saving Coach

An intelligent full-stack application that helps users track expenses, stick to a budget, and receive AI-driven insights and saving advice. 

The application is built with a **React (Vite)** frontend and a **FastAPI** backend that utilizes a machine learning engine for predictive analytics and automated expense categorization.

## Features

- **Expense Tracking:** Log expenses with automatic category tagging.
- **Budgeting Engine:** Set a monthly budget target. The app automatically calculates overages and deducts them from your next month's allowance.
- **AI Insights:** Uses `scikit-learn` to forecast your monthly spending trends.
- **Actionable Advice:** Personalized saving advice based on your spending habits.
- **Mobile-Ready:** Contains configurations for `@capacitor/ios` and `@capacitor/android` for deploying to mobile devices.

## Tech Stack

- **Frontend:** React, Vite, Recharts, Lucide React, Tailwind / Custom CSS
- **Backend:** FastAPI, Python, SQLite
- **Machine Learning:** `scikit-learn`, `pandas`, `numpy`

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.8+)

### 1. Start the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

The backend server will run at `http://localhost:8000`.

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend server will run at `http://localhost:5173`. Open this URL in your browser to start using the app.

## Project Structure

- `/backend` - FastAPI server, SQLite database functions, and AI engine scripts.
- `/frontend` - React single-page application built with Vite.

## Deployment

The application is containerized with Docker and ready for local or production deployments.

### 1. Docker Compose (Self-Hosted / VPS)

To deploy both the frontend and backend locally or to a single Virtual Private Server (VPS), run:

```bash
docker-compose up --build -d
```

- **Frontend**: Accessible at `http://localhost:8080` (served via Nginx).
- **Backend API**: Running at `http://localhost:8000`.
- **Database Persistence**: The SQLite database (`expenses.db`) is mapped to `/backend/expenses.db` on the host to ensure persistence.
- **Environment Variables**: Configure your `OPENAI_API_KEY` in `backend/.env`.

### 2. Multi-Platform Cloud Deployment

- **Frontend (Vercel / Netlify)**:
  - Deploy the `/frontend` subdirectory.
  - Set the Environment Variable `VITE_API_URL` to your backend's deployed domain URL.
- **Backend (Render / Fly.io / Railway)**:
  - Deploy the `/backend` subdirectory using the provided `Dockerfile`.
  - Expose port `8000` (or set the port automatically via `$PORT`).
  - Configure `OPENAI_API_KEY` in the service's environment variables.
  - Set up a Persistent Disk Volume mapped to `/app` (or change SQLite storage to PostgreSQL if desired) to ensure database persistence.

### 3. Mobile Deployment (Capacitor)

To compile and sync the React web app into native iOS or Android apps:

```bash
cd frontend
# Build the production bundle
npm run build
# Sync assets with native Capacitor containers
npx cap sync
# Open in Xcode or Android Studio
npx cap open ios
npx cap open android
```

