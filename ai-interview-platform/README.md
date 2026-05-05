# IntervAI – AI Interview Preparation Platform

A full-stack MERN AI Interview Platform with a modern, dark-themed React frontend.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your API URL

# 3. Start development server
npm start
```

## Project Structure

```
src/
├── App.jsx                          # Root router + providers
├── index.jsx                        # Entry point
├── index.css                        # Global styles + design tokens
│
├── context/
│   └── AuthContext.jsx              # JWT auth state (login/logout)
│
├── services/
│   └── api.jsx                      # Axios API layer
│
├── hooks/
│   └── useAuth.jsx                  # Auth hook alias
│
├── components/
│   ├── Navbar.jsx                   # Top navbar (search, notifs, user menu)
│   ├── Button.jsx                   # Reusable button (teal / outline / danger)
│   ├── InputField.jsx               # Input with label, error, show/hide password
│   ├── Card.jsx                     # Dark card wrapper
│   ├── Spinner.jsx                  # Loading spinner
│   ├── ProtectedRoute.jsx           # Auth guard HOC
│   └── PageWrapper.jsx              # Fade-up page transition
│
└── pages/
    ├── Landing.jsx                  # Marketing/hero landing page
    ├── Login.jsx                    # Split-panel login
    ├── Register.jsx                 # Split-panel registration
    ├── Dashboard.jsx                # Main dashboard with sidebar + KPI cards
    ├── Interview.jsx                # AI interview session (timer, Q&A)
    ├── ResumeUpload.jsx             # Drag & drop resume uploader
    ├── Analytics.jsx                # Score charts, heatmap, skill breakdown
    ├── QuestionBank.jsx             # Searchable/filterable question library
    ├── Leaderboard.jsx              # Rankings with podium
    ├── Profile.jsx                  # User profile + achievements
    └── Settings.jsx                 # Toggle preferences
```

## Tech Stack

- **React 18** + React Router v6
- **Tailwind CSS v3** for utility classes
- **Lucide React** for icons
- **Axios** for API calls
- **Custom CSS** – all design tokens in `index.css`

## Design System

| Token | Value |
|-------|-------|
| Primary bg | `#0d1117` |
| Card bg | `#141b24` |
| Teal accent | `#14b8a6` |
| Teal light | `#2dd4bf` |
| Teal dark | `#0d9488` |
| Text primary | `#f1f5f9` |
| Text muted | `#94a3b8` |
| Font display | Syne |
| Font body | DM Sans |
| Font mono | JetBrains Mono |

## Routes

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/` | Landing | No |
| `/login` | Login | No |
| `/register` | Register | No |
| `/dashboard` | Dashboard | Yes |
| `/interview` | Interview | Yes |
| `/upload-resume` | ResumeUpload | Yes |
| `/analytics` | Analytics | Yes |
| `/question-bank` | QuestionBank | Yes |
| `/leaderboard` | Leaderboard | Yes |
| `/profile` | Profile | Yes |
| `/settings` | Settings | Yes |

## Backend API Endpoints Expected

```
POST /api/auth/login
POST /api/auth/register
POST /api/resume/upload       (multipart/form-data, field: "resume")
POST /api/interview/start
POST /api/interview/answer    { questionIndex, question, answer }
GET  /api/interview/results
```

## Environment Variables

```env
REACT_APP_API_URL=http://localhost:5000/api
```
