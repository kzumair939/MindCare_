# MindCare — React + Spring Boot SPA

Modern React frontend + Spring Boot REST API architecture.

## Project Structure

```
mindcare-spa/
├── backend/          # Spring Boot REST API (port 8080)
│   └── src/main/java/com/example/mindcare/
│       ├── config/           SecurityConfig, CorsConfig, WebSocketConfig
│       ├── controller/       REST controllers (all @RestController, JSON only)
│       ├── security/         JwtUtils, JwtAuthFilter
│       ├── entity/           JPA entities (unchanged)
│       ├── service/          Business logic (unchanged)
│       ├── repository/       Spring Data repositories (unchanged)
│       ├── dto/              Request/Response DTOs
│       └── Enum/             Role, TherapyType, etc.
└── frontend/         # React + Vite SPA (port 5173)
    └── src/
        ├── api/              axios.js (JWT interceptors)
        ├── context/          AuthContext, ThemeContext
        ├── components/
        │   ├── common/       ProtectedRoute
        │   └── layout/       Nav, Footer, AppShell (cursor sparkle)
        ├── hooks/            useApi
        ├── pages/
        │   ├── auth/         Login, Signup, ForgotPassword, ResetPassword, OAuth2Callback
        │   ├── user/         Dashboard, BookSession, MySessions, Survey, Feedback, Settings, Payment
        │   ├── group/        GroupRooms, GroupChat (real-time polling + file/voice upload)
        │   ├── therapist/    TherapistDashboard, TherapistSessions, TherapistReport
        │   ├── admin/        AdminDashboard, AdminTherapists, AdminSessions, TherapistForm
        │   └── OnlineSession.jsx  (WebRTC video + STOMP chat + cam/mic toggle)
        ├── styles/           global.css (preserved design), theme.css (React additions)
        └── utils/            helpers.js
```

## Running Locally

### Backend
```bash
cd backend
./mvnw spring-boot:run
# Runs on http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
# Vite proxies /api, /ws, /uploads → http://localhost:8080
```

### Docker (full stack)
```bash
docker-compose up --build
# Frontend: http://localhost:5173
# Backend:  http://localhost:8080
```

## Authentication
- JWT stored in `localStorage` as `mc_token`
- Axios interceptor attaches `Authorization: Bearer <token>` to every request
- Auto-redirect to `/login` on 401
- Google OAuth2: `/oauth2/authorization/google` → Spring redirects to `/oauth2/callback?email=...` → frontend exchanges email for JWT

## API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Login → JWT |
| POST | `/api/auth/register` | Public | Register → JWT |
| GET  | `/api/auth/me` | Any | Current user info |
| GET  | `/api/session/my` | USER | User's sessions |
| POST | `/api/session/book` | USER | Book a session |
| GET  | `/api/session/therapist` | THERAPIST | Therapist's sessions |
| GET  | `/api/group/rooms` | USER/THERAPIST | List rooms |
| POST | `/api/group/create` | THERAPIST | Create room |
| POST | `/api/group/join` | USER | Join by code |
| POST | `/api/group/{id}/send` | USER/THERAPIST | Send chat message |
| POST | `/api/group/{id}/upload` | USER/THERAPIST | Upload file/voice |
| GET  | `/api/admin/stats` | ADMIN | Platform stats |
| GET  | `/api/therapist/all` | Any auth | Therapist list |

## Default Admin Credentials
- **Username:** `admin`
- **Password:** `admin123`
