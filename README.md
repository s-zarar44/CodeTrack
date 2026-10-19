# CodeTrack

**CodeTrack** is a full-stack competitive programming analytics platform that unifies coding statistics, daily activity, and performance insights in one dashboard.

**Live Demo:** [CodeTrack](https://code-track-weld.vercel.app/)  
**Backend API:** [CodeTrack API](https://codetrack-api-q25e.onrender.com/)  
**Repository:** [GitHub](https://github.com/s-zarar44/CodeTrack)

## Features

- **Authentication:** Google Sign-In, password hashing, JWT-based authentication, protected routes, and email verification.
- **LeetCode Integration:** Connect accounts and retrieve problem-solving statistics using the LeetCode GraphQL API.
- **Codeforces Integration:** Connect accounts and synchronize coding statistics and rating information.
- **Analytics Dashboard:** View total problems solved, difficulty-wise breakdowns, submission statistics, daily activity, coding streaks, and available contest metrics.
- **Data Persistence:** Store user accounts, platform connections, and daily statistics in PostgreSQL.
- **Account Management:** Unlink connected platforms and delete your CodeTrack account.

## Tech Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, `pg`, SQL |
| Authentication | JWT, bcryptjs, Google OAuth |
| Email | Resend |
| External APIs | LeetCode GraphQL API, Codeforces API |
| Deployment | Vercel, Render, Neon PostgreSQL |

## Getting Started

### Prerequisites
- Node.js and npm
- PostgreSQL database
- Git

### 1. Clone the repository

```bash
git clone https://github.com/s-zarar44/CodeTrack.git
cd CodeTrack
```

### 2. Configure and run the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=CodeTrack <onboarding@resend.dev>
```

Set up the database using the project's SQL scripts, then run:

```bash
npm run dev
```

### 3. Configure and run the frontend

In a separate terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend:

```bash
npm run dev
```

Open the local URL provided by Vite, usually `http://localhost:5173`.

**Security:** Never commit environment files, credentials, API keys, or JWT secrets to GitHub.

## Current Limitations

- **Email authentication:** Registration and verification work in the current testing setup, but Resend's testing restrictions limit email delivery to the verified recipient until a sending domain is verified. Google Sign-In is the recommended option for general testing.
- **Platform coverage:** Only LeetCode and Codeforces are currently integrated. GeeksforGeeks, CodeChef, AtCoder, and other platforms are not yet supported.
- **Embedded browsers:** Google Sign-In may not work in some in-app browsers, including Telegram's browser. Opening CodeTrack in Chrome or another full browser is recommended.

## Roadmap

- Integrate more competitive programming platforms.
- Expand contest and rating analytics.
- Improve historical progress tracking and dashboard visualizations.
- Enhance mobile and in-app browser compatibility.

## Project Status

**Actively developed and deployed.** CodeTrack combines authentication, external API integration, relational database management, and interactive analytics to help competitive programmers track their progress and consistency.