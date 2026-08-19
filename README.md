# 🧠 MindCare — Telehealth & Mental Health Support Platform

<p align="center">
  <img src="https://img.shields.io/badge/Java-17-orange.svg?style=for-the-badge&logo=openjdk" alt="Java 17" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.x-6DB33F.svg?style=for-the-badge&logo=springboot" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB.svg?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF.svg?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1.svg?style=for-the-badge&logo=mysql" alt="MySQL" />
  <img src="https://img.shields.io/badge/Docker-Enabled-2496ED.svg?style=for-the-badge&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/WebRTC-Realtime-333333.svg?style=for-the-badge&logo=webrtc" alt="WebRTC" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
</p>

---

## 📌 Overview

**MindCare** is an enterprise-grade full-stack telehealth platform engineered for mental health providers, therapists, and patients. It provides a secure, end-to-end digital therapy environment supporting **real-time WebRTC video calls**, **interactive STOMP/WebSocket group therapy rooms**, **mental health assessments & surveys**, **therapist session booking**, and **role-based portal access** (User, Therapist, Admin).

Built with a modern architecture featuring a **Java 17 / Spring Boot** backend REST API and a high-performance **React + Vite SPA** frontend.

---

## ✨ Key Features

### 👤 Patient Portal
* **Session Booking & Management**: Browse therapists, select available slots, and manage upcoming/past appointments.
* **Secure Video Consultation**: High-definition peer-to-peer video sessions powered by WebRTC.
* **Group Therapy Rooms**: Join moderated group support channels with real-time WebSocket messaging and file attachments.
* **Mental Health Surveys & Trackers**: Complete clinical surveys with immediate visual score reporting.
* **Flexible Authentication**: Secure login via JWT or Google OAuth2 integration.

### 🩺 Therapist Portal
* **Therapist Dashboard**: Track client sessions, daily schedules, and client feedback.
* **Group Room Creation**: Create and moderate specialized therapy rooms.
* **Clinical Reporting**: Draft and maintain progress notes and therapy session summaries.
* **Interactive Messaging**: Real-time direct chat and voice message sharing.

### 🛡️ Admin Portal
* **Platform Analytics**: Comprehensive dashboard for platform usage, active sessions, and client retention.
* **Therapist Onboarding & Audit**: Provision therapist accounts, manage credentials, and audit session compliance.
* **System Governance**: Manage user accounts, survey templates, and security policies.

---

## 🏗️ Architecture & System Topology

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          React 18 + Vite SPA                            │
│                 (AppShell, Auth, WebRTC, WebSocket UI)                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / WSS / REST
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Spring Boot 3.x REST API                            │
│  ┌──────────────────┬────────────────────┬───────────────────────────┐  │
│  │ Spring Security  │  JWT Token Filter  │ Google OAuth2 Integration │  │
│  ├──────────────────┼────────────────────┼───────────────────────────┤  │
│  │  WebSocket Controller │ WebRTC Signalling │ Spring Data JPA Repos   │  │
│  └──────────────────┴────────────────────┴───────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ JDBC / SQL
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         MySQL 8.0 Database                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Backend** | Java 17, Spring Boot 3.x, Spring Security, Spring Data JPA, Hibernate, Maven |
| **Frontend** | React 18, Vite, React Router v6, Axios, Context API, Bootstrap / Custom CSS |
| **Real-Time Communication** | WebRTC (Peer Connection & Media Streams), STOMP over SockJS / WebSockets |
| **Authentication** | JSON Web Tokens (JWT), Google OAuth2 |
| **Database** | MySQL 8.0, Relational Schema with Indexing & JPA Entities |
| **DevOps & Containerization** | Docker, Docker Compose, Nginx Reverse Proxy |

---

## 📁 Repository Structure

```text
mindcare-platform/
├── backend/                        # Spring Boot Microservice Source
│   ├── src/main/java/com/example/mindcare/
│   │   ├── config/                 # WebSecurity, CORS, WebSocket Config
│   │   ├── controller/             # REST Endpoints (Auth, Session, Admin, Group)
│   │   ├── dto/                    # Data Transfer Objects
│   │   ├── entity/                 # JPA Domain Entities
│   │   ├── repository/             # Spring Data Repositories
│   │   ├── security/               # JWT Utilities & Authentication Providers
│   │   └── service/                # Business Logic Implementation
│   └── src/main/resources/
│       └── application.properties  # Application Configuration
├── frontend/                       # React + Vite Single Page Application
│   ├── src/
│   │   ├── api/                    # Axios Client & Interceptors
│   │   ├── components/             # Reusable UI Components & Layouts
│   │   ├── context/                # Auth & Theme State Providers
│   │   ├── hooks/                  # Custom React Hooks
│   │   └── pages/                  # Route Pages (User, Therapist, Admin, Auth)
│   └── vite.config.js              # Vite Build & Proxy Settings
├── docker-compose.yml              # Multi-container Orchestration
├── .env.example                    # Environment Variable Template
└── README.md                       # Project Documentation
```

---

## 🔑 Environment Configuration

Copy `.env.example` to `.env` in the root directory before running the application:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example Value |
| :--- | :--- | :--- |
| `DB_PASSWORD` | MySQL root database password | `your_secure_db_password` |
| `JWT_SECRET` | Secret key used for signing JWT tokens | `your_jwt_secret_key_32_chars_min` |
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID | `your_google_client_id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 Client Secret | `your_google_client_secret` |
| `EMAIL_USERNAME` | SMTP email username for sending OTPs | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | SMTP email app password | `your-google-app-password` |
| `CORS_ALLOWED_ORIGINS` | Allowed origins for cross-origin requests | `http://localhost:5173,http://localhost:8080` |

---

## 🚀 Quick Start Guide

### Prerequisites
* **Java 17+** JDK installed
* **Node.js 18+** & **npm**
* **Maven 3.8+**
* **Docker Desktop** (optional for containerized deployment)

---

### Option A: Running via Docker Compose (Recommended)

Run the full stack (Frontend + Backend + MySQL Database) with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/mindcare-platform.git
cd mindcare-platform

# 2. Setup your environment variables
cp .env.example .env

# 3. Launch with Docker Compose
docker-compose up --build -d
```

* **Frontend Application**: `http://localhost:8080`
* **Backend REST API**: Proxy-matched via `http://localhost:8080/api`

---

### Option B: Local Manual Setup

#### 1. Backend Service (Spring Boot)

```bash
cd backend

# Build and package application
mvn clean install

# Launch Spring Boot application
mvn spring-boot:run
```
> The API server will start at `http://localhost:8080`.

#### 2. Frontend Application (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
> The React dev server will start at `http://localhost:5173` with automatic API proxying to `localhost:8080`.

---

## 📡 API Overview

| HTTP Method | Endpoint Path | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new patient account |
| `POST` | `/api/auth/login` | Public | Authenticate user and return JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `POST` | `/api/auth/verify-otp` | Public | Verify 6-digit OTP code |
| `GET` | `/api/session/my` | Patient | Get patient's session history |
| `POST` | `/api/session/book` | Patient | Book session with therapist |
| `GET` | `/api/session/therapist` | Therapist | Get therapist's scheduled sessions |
| `GET` | `/api/group/rooms` | Authenticated | List available group therapy rooms |
| `POST` | `/api/group/create` | Therapist | Create a new group room |
| `POST` | `/api/group/{id}/send` | Authenticated | Send real-time chat message |
| `GET` | `/api/admin/stats` | Admin | Fetch system analytics & metrics |
| `POST` | `/api/admin/therapists` | Admin | Onboard and provision a therapist |

---

## 🛡️ Security Architecture

* **Stateless JWT Authentication**: Passwords hashed using BCrypt. JWT tokens issued upon successful authentication and verified on protected API routes.
* **Role-Based Access Control (RBAC)**: Fine-grained security protecting `USER`, `THERAPIST`, and `ADMIN` endpoints.
* **CORS Protection**: Origin validation restricting unauthorized cross-origin API calls.
* **Data Protection**: Zero hardcoded production secrets. All credentials managed securely via environment variables.

---

## 📜 License

Distributed under the **MIT License**.
