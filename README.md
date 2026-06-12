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
