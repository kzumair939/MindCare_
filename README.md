# 🧠 MindCare — Telehealth & AI-Powered Mental Health Platform

<p align="center">
  <a href="https://github.com/kzumair939/MindCare_">
    <img src="https://img.shields.io/badge/Status-Live%20in%20Production-00c853.svg?style=for-the-badge&logo=render&logoColor=white" alt="Live Status" />
  </a>
  <img src="https://img.shields.io/badge/Java-17-ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 17" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.x-6DB33F.svg?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/WebRTC-Realtime%20Video-333333.svg?style=for-the-badge&logo=webrtc&logoColor=white" alt="WebRTC" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI%20Assistant-4285F4.svg?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
</p>

---

## 🌐 Live Application & Links

* 🚀 **Live Production Website**: [https://mindcare-frontend-xouk.onrender.com](https://mindcare-frontend-xouk.onrender.com) *(Hosted on Render)*
* 📂 **Source Repository**: [https://github.com/kzumair939/MindCare_](https://github.com/kzumair939/MindCare_)


---

## 📌 Executive Summary

**MindCare** is a modern, enterprise-ready full-stack telehealth platform engineered specifically for mental health providers, licensed therapists, and patients. It provides a confidential, end-to-end digital therapy environment supporting **real-time WebRTC peer-to-peer video sessions**, **AI-assisted diagnostic and wellness insights**, **STOMP/WebSocket group therapy rooms**, **clinical assessments and wellbeing surveys**, **automated therapist booking workflows**, and **role-based portals** (Patient, Therapist, Administrator).

Engineered with a high-performance **Java 17 / Spring Boot 3** REST API backend and a responsive, glassmorphic **React 18 + Vite** Single Page Application (SPA).

---

## ✨ Key Platform Highlights & Recent Updates

### 🤖 1. AI-Driven Diagnostic & Wellness Insights
* Powered by Google Gemini AI to assist users with personalized mental health reflections and coping strategies.
* Real-time conversational guidance and symptom triaging before connecting with licensed therapists.

### 📹 2. Secure WebRTC Telehealth Consultations
* High-definition, low-latency, encrypted peer-to-peer audio/video consultations.
* Custom signaling infrastructure built over WebSockets with media controls (mute, camera toggle, screen sharing).

### 💬 3. Interactive Group Therapy & Real-time Messaging
* Real-time STOMP over SockJS WebSocket communication for group support sessions and community rooms.
* Live participant rosters, active presence tracking, and secure chat history.

### 📋 4. Clinical Assessments & Wellbeing Trackers
* Standardized psychological self-assessments with instant algorithmic scoring.
* Visual analytics tracking mental health progress over time with therapist visibility.

### 🌓 5. Adaptive Dual-Theme UI System
* Seamless toggle between **Midnight Dark Mode** and **Crisp Light Mode**.
* Mobile-first responsive layout with glassmorphic cards, fluid micro-interactions, and accessible typography.

### 🔐 6. Enterprise-Grade Security & Authentication
* **Dual-Token System**: Stateless JWT access tokens paired with secure refresh token rotation.
* **Google OAuth2**: Single sign-on (SSO) integration for frictionless onboarding.
* **OTP Verification via SSL Mail**: Automated 6-digit email verification powered by JavaMailSender on secure Port 465.
* **Role-Based Access Control (RBAC)**: Strict separation of concerns between `ROLE_USER`, `ROLE_THERAPIST`, and `ROLE_ADMIN`.

---

## 👥 Role-Based Portals

```
                  ┌──────────────────────────────────────────────┐
                  │               MindCare Platform              │
                  └───────┬──────────────┬──────────────┬────────┘
                          │              │              │
           ┌──────────────▼───┐   ┌──────▼──────┐   ┌───▼──────────────┐
           │  Patient Portal  │   │  Therapist  │   │   Admin Portal   │
           └──────────────────┘   └─────────────┘   └──────────────────┘
```

| Portal | Core Capabilities |
| :--- | :--- |
| **👤 Patient Portal** | Browse certified therapists, schedule appointments, conduct WebRTC video calls, participate in moderated group rooms, complete wellbeing surveys, and monitor health metrics. |
| **🩺 Therapist Portal** | Manage appointment schedules, review patient case summaries and survey scores, host interactive group rooms, write clinical progress notes, and conduct live consultations. |
| **🛡️ Admin Portal** | System-wide analytics & KPI dashboards, therapist credential verification & onboarding, user account management, session audit logs, and security governance. |

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          React 18 + Vite Frontend SPA                       │
│      (Glassmorphic UI, AuthContext, WebRTC Engine, STOMP/SockJS Client)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / WSS / REST
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Spring Boot 3.x REST & WS API                         │
│  ┌────────────────────┬──────────────────────┬───────────────────────────┐  │
│  │  Spring Security 6 │ JWT & Refresh Filter │ Google OAuth2 Client      │  │
│  ├────────────────────┼──────────────────────┼───────────────────────────┤  │
│  │ WebSocket / STOMP  │ WebRTC Signaling Hub │ JavaMailSender (SSL 465)  │  │
│  ├────────────────────┼──────────────────────┼───────────────────────────┤  │
│  │ Gemini AI Service  │ Spring Data JPA      │ Hibernate ORM / Flyway    │  │
│  └────────────────────┴──────────────────────┴───────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ JDBC / TLS
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MySQL 8.0 Relational Database                       │
│           (Users, Sessions, Surveys, Group Rooms, Audit Logs)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Domain | Technology / Library | Description |
| :--- | :--- | :--- |
| **Frontend Core** | React 18, Vite 5, React Router v6 | High-performance Single Page Application |
| **Styling & UI** | Vanilla CSS Design System, Bootstrap Icons | Glassmorphic dual-theme responsive styling |
| **Real-Time Client** | WebRTC API, `@stomp/stompjs`, `sockjs-client` | Live P2P video & real-time messaging |
| **Backend Framework** | Java 17, Spring Boot 3.x | Enterprise RESTful web microservices |
| **Security & Auth** | Spring Security 6, JJWT (0.11.5), OAuth2 Client | Stateless JWT authentication & Google SSO |
| **AI Integration** | Google Gemini API Client | Diagnostic suggestions & wellness analysis |
| **Email Service** | Spring Mail (`JavaMailSender`), SMTP SSL (Port 465) | Automated OTP and session reminder delivery |
| **Database & ORM** | MySQL 8.0, Spring Data JPA, Hibernate | Relational data persistence & indexing |
| **Container & Cloud** | Docker, Docker Compose, Nginx, Render | Multi-container cloud deployment & SPA routing |

---

## 📁 Repository Directory Structure

```text
mindcare-platform/
├── backend/                              # Spring Boot Java 17 Application
│   ├── src/main/java/com/example/mindcare/
│   │   ├── config/                       # WebSecurity, CORS, WebSocket, MailConfig
│   │   ├── controller/                   # REST API Controllers (Auth, Session, Admin, Group)
│   │   ├── dto/                          # Request & Response Data Transfer Objects
│   │   ├── entity/                       # JPA Database Domain Entities
│   │   ├── repository/                   # Spring Data Repositories
│   │   ├── security/                     # JWT Authentication Filters & Providers
│   │   └── service/                      # Core Business Logic & AI Integration
│   └── src/main/resources/
│       └── application.properties        # Application Properties & Secrets
├── frontend/                             # React 18 + Vite SPA
│   ├── public/
│   │   └── _redirects                    # Cloud SPA client-side routing rules
│   ├── src/
│   │   ├── api/                          # Axios Client, Auth Interceptors & WS helper
│   │   ├── components/                   # Navbar, Footer, Cards, Modals, ProtectedRoute
│   │   ├── context/                      # AuthContext & ThemeContext
│   │   ├── hooks/                        # Custom Hooks (useCache, useDebounce, etc.)
│   │   ├── pages/                        # Patient, Therapist, Admin, and Auth views
│   │   └── styles/                       # CSS tokens, theme variables, and keyframe animations
│   ├── index.html                        # HTML5 Entry point
│   └── vite.config.js                    # Vite configuration & proxy settings
├── docker-compose.yml                    # Multi-container container orchestration
├── .env.example                          # Environment variable template
└── README.md                             # Project Documentation
```

---

## 🔑 Environment Configuration

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `DB_URL` | Yes | MySQL JDBC Connection URL | `jdbc:mysql://localhost:3306/mindcare_db?createDatabaseIfNotExist=true` |
| `DB_USERNAME` | Yes | MySQL Database Username | `root` |
| `DB_PASSWORD` | Yes | MySQL Database Password | `your_mysql_password` |
| `JWT_SECRET` | Yes | Cryptographic HMAC secret key (>= 32 chars) | `your_secure_256_bit_jwt_secret_key_here` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth2 Client ID | `your_client_id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth2 Client Secret | `GOCSPX-your_google_secret` |
| `EMAIL_USERNAME` | Yes | SMTP Email Address for OTP delivery | `your_email@gmail.com` |
| `EMAIL_PASSWORD` | Yes | SMTP Application Password | `your_google_app_password` |
| `GEMINI_API_KEY` | Optional | Google Gemini AI API key | `AIzaSy...` |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-delimited list of allowed frontends | `http://localhost:5173,https://mindcare-frontend-xouk.onrender.com` |

---

## 🚀 Getting Started & Local Setup

### Prerequisites
* **Java 17 JDK** (e.g. OpenJDK, Eclipse Temurin)
* **Node.js 18+** & **npm**
* **MySQL 8.0+**
* **Maven 3.8+**
* **Docker & Docker Compose** (Optional for containerized execution)

---

### Option A: Running with Docker Compose (Recommended)

Spin up the frontend, backend, and MySQL database with one command:

```bash
# 1. Clone repository
git clone https://github.com/kzumair939/MindCare_.git
cd MindCare_

# 2. Configure environment
cp .env.example .env

# 3. Build and launch services
docker-compose up --build -d
```

* **Frontend**: `http://localhost:8080` (or `http://localhost:5173`)
* **Backend REST API**: `http://localhost:8080/api`
* **MySQL Database**: `localhost:3306`

---

### Option B: Manual Local Development

#### 1. Start the Backend (Spring Boot)

```bash
cd backend

# Compile and package application
mvn clean install -DskipTests

# Run Spring Boot service
mvn spring-boot:run
```
* Backend server boots on `http://localhost:8080`.

#### 2. Start the Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
* Frontend client launches on `http://localhost:5173`.

---

## 📡 REST API Reference Summary

### Authentication Endpoints (`/api/auth`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new patient account |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT + Refresh token |
| `POST` | `/api/auth/verify-otp` | Public | Verify 6-digit email OTP |
| `POST` | `/api/auth/resend-otp` | Public | Resend OTP code to user's email |
| `POST` | `/api/auth/refresh` | Public | Refresh expired access token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile |

### Session & Booking Endpoints (`/api/session`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/session/book` | Patient | Book consultation with therapist |
| `GET` | `/api/session/my` | Patient | Retrieve patient's appointments |
| `GET` | `/api/session/therapist` | Therapist | List therapist's upcoming bookings |
| `PATCH`| `/api/session/{id}/status`| Therapist/Admin | Update consultation status (Confirmed/Completed) |

### Group Therapy & Chat (`/api/group`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/group/rooms` | Authenticated | List all active group therapy rooms |
| `POST` | `/api/group/create` | Therapist | Create a new moderated therapy room |
| `POST` | `/api/group/{id}/send` | Authenticated | Broadcast message to room members |

### Administration Endpoints (`/api/admin`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin | Aggregate platform metrics & analytics |
| `GET` | `/api/admin/therapists` | Admin | List all registered therapist accounts |
| `POST` | `/api/admin/therapists` | Admin | Provision and approve a therapist account |
| `DELETE`| `/api/admin/users/{id}` | Admin | Deactivate/remove a user account |

---

## 🧪 Demo User Accounts

For testing and grading the live application, the following accounts are pre-configured:

| Role | Username / Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` / `admin@mindcare.com` | `admin123` | Full analytics, user moderation, therapist provisioning |
| **Therapist** | `dr_sarah` / `sarah@mindcare.com` | `therapist123` | Schedule management, group rooms, clinical notes |
| **Patient** | `user` / `patient@mindcare.com` | `user123` | Session booking, assessments, video calls |

---

## 🛡️ Security & Reliability Architecture

* **Stateless Security**: REST endpoints secured via Spring Security filters and BCrypt password hashing.
* **Token Rotation**: Automatic JWT renewal via interceptors without user workflow interruption.
* **CORS & Origin Hardening**: Explicit origin validation protecting all API & WebSocket transports.
* **Zero Hardcoded Secrets**: Strictly parameterized credentials and API keys via environment variables.

---

## 👨‍💻 Author & Contact

**Muhammad Umair Khan**
* 🌐 **GitHub**: [@kzumair939](https://github.com/kzumair939)
* 💼 **LinkedIn**: [Umair Khan](https://www.linkedin.com/in/umairkhan28/)
* 📧 **Email**: [kzumair939@gmail.com](mailto:kzumair939@gmail.com)
* 📱 **Phone**: `+92 314 2712220`

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
