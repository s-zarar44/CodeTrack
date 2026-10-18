# CodeTrack

CodeTrack is a full-stack competitive programming analytics platform that brings coding activity, problem-solving statistics, and performance insights from competitive programming platforms into a unified dashboard.

## 🚀 Features

- **User Authentication**
  - User registration and login
  - Password hashing for secure credential storage
  - JWT-based authentication and protected API routes
  - Google Sign-In
  - Email verification using Resend

- **Competitive Programming Integration**
  - Connect and validate LeetCode accounts
  - Fetch problem-solving statistics through the LeetCode GraphQL API
  - Support for Codeforces account statistics and rating synchronization
  - Track performance data across supported platforms

- **Analytics Dashboard**
  - Total problems solved
  - Easy, Medium, and Hard problem distribution
  - Submission and accepted-submission statistics
  - Daily coding activity and progress tracking
  - Coding streaks and activity history visualization
  - Contest rating and performance information where available

- **Data Persistence**
  - Store connected platform accounts and coding statistics in PostgreSQL
  - Maintain daily activity snapshots
  - Update existing daily statistics when data is synchronized again

- **REST API**
  - Express.js backend with RESTful endpoints
  - Authentication middleware for protected resources
  - Database-backed user and platform statistics management

## 🛠️ Tech Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Database Access | `pg` and SQL queries |
| Authentication | JWT, bcryptjs, Google OAuth |
| Email Verification | Resend |
| External APIs | LeetCode GraphQL API, Codeforces API |
| API Architecture | REST |
| Version Control | Git, GitHub |

## 📂 Project Structure

```text
CodeTrack/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── dashboard.js
│   │   │   └── platform.js
│   │   ├── services/
│   │   │   └── codeforces.js
│   │   └── server.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/s-zarar44/CodeTrack.git
cd CodeTrack
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Configure the backend environment variables in `backend/.env`:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=CodeTrack <onboarding@resend.dev>
```

Ensure your PostgreSQL database is running and the required tables, columns, and indexes have been created using the project's SQL scripts.

Start the backend:

```bash
npm run dev
```

### 3. Set Up the Frontend

Open a new terminal:

```bash
cd frontend
npm install
```

Configure `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

> **Security:** Never commit `.env` files, API keys, database credentials, or JWT secrets to GitHub. Configure production environment variables separately when deploying.

## 📊 How It Works

1. A user registers or signs in to CodeTrack.
2. The backend authenticates the user and issues a JWT.
3. The user connects a supported competitive programming account.
4. CodeTrack retrieves available statistics from the relevant platform APIs.
5. The backend processes the data and stores account information and daily statistics in PostgreSQL.
6. The dashboard displays coding activity, difficulty distribution, progress, streaks, and available performance metrics.

## 🗺️ Roadmap

- Expand competitive programming platform integrations.
- Improve contest history and rating analytics.
- Introduce more detailed progress comparisons and performance insights.
- Enhance dashboard visualizations and historical reporting.
- Complete production deployment and validate the application in a hosted environment.

## 📌 Project Status

**Active Development**

CodeTrack is being developed as a full-stack application focused on competitive programming analytics, secure authentication, relational database design, external API integration, and an interactive dashboard.

## 🎯 Goal

CodeTrack aims to help competitive programmers centralize their coding statistics, monitor consistency, analyze their problem-solving progress, and gain a clearer understanding of their performance across supported platforms.