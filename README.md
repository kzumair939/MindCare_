# 🧠 MindCare - Mental Health Support Platform

A modern full-stack mental health platform built with **React**, **Spring Boot**, **JWT Authentication**, **WebRTC Video Calling**, **WebSockets**, and **Docker**.

MindCare connects users with therapists through secure online sessions, group therapy rooms, real-time messaging, and mental health assessments.

---

## ✨ Features

### 👤 User Features

* User Registration & Login
* JWT Authentication & Authorization
* Google OAuth2 Login
* Book Therapy Sessions
* View Upcoming & Previous Sessions
* Mental Health Surveys
* Feedback System
* Secure Online Video Sessions
* Settings Management
* Payment Integration

### 👨‍⚕️ Therapist Features

* Therapist Dashboard
* Session Management
* Create Therapy Rooms
* Group Therapy Management
* Therapist Reports
* Real-time Chat Support

### 🛠️ Admin Features

* Admin Dashboard
* Therapist Management
* Session Monitoring
* Platform Analytics
* User Oversight

### 💬 Real-Time Features

* WebRTC Video Calling
* WebSocket Messaging
* Group Chat Rooms
* Voice Message Uploads
* File Sharing

---

# 🏗️ System Architecture

```text
React + Vite SPA
        │
        ▼
Spring Boot REST API
        │
        ▼
MySQL Database
        │
        ▼
JWT Authentication
        │
        ▼
WebSocket + WebRTC
```

---

# 🚀 Technology Stack

## Frontend

* React
* Vite
* Axios
* React Router
* Context API
* WebRTC
* STOMP WebSocket

## Backend

* Spring Boot
* Spring Security
* JWT
* Spring Data JPA
* MySQL
* Maven

## DevOps

* Docker
* Docker Compose

---

# 📁 Project Structure

```text
mindcare-spa/
│
├── backend/
│   ├── config/
│   ├── controller/
│   ├── security/
│   ├── entity/
│   ├── service/
│   ├── repository/
│   ├── dto/
│   └── Enum/
│
└── frontend/
    ├── api/
    ├── context/
    ├── components/
    ├── hooks/
    ├── pages/
    ├── styles/
    └── utils/
```

---

# 🔐 Authentication Flow

### JWT Authentication

1. User logs in.
2. Backend generates JWT token.
3. Token is stored in localStorage.
4. Axios automatically attaches:

```http
Authorization: Bearer <token>
```

5. Unauthorized requests automatically redirect to Login.

---

### Google OAuth2 Login

```text
Frontend
   ↓
Google Authentication
   ↓
Spring Security OAuth2
   ↓
JWT Generation
   ↓
React Dashboard
```

---

# ⚙️ Running Locally

## Prerequisites

* Java 17+
* Maven 3+
* Node.js 18+
* MySQL
* Docker (Optional)

---

## Backend Setup

```bash
cd backend
mvn spring-boot:run
```

Backend URL:

```text
http://localhost:8080
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Vite automatically proxies:

```text
/api
/ws
/uploads
```

to:

```text
http://localhost:8080
```

---

# 🐳 Docker Setup

Run the complete application:

```bash
docker-compose up --build
```

Access:

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:8080
```

---

# 📡 API Overview

| Method | Endpoint               | Access           |
| ------ | ---------------------- | ---------------- |
| POST   | /api/auth/login        | Public           |
| POST   | /api/auth/register     | Public           |
| GET    | /api/auth/me           | Authenticated    |
| GET    | /api/session/my        | User             |
| POST   | /api/session/book      | User             |
| GET    | /api/session/therapist | Therapist        |
| GET    | /api/group/rooms       | User / Therapist |
| POST   | /api/group/create      | Therapist        |
| POST   | /api/group/join        | User             |
| POST   | /api/group/{id}/send   | User / Therapist |
| POST   | /api/group/{id}/upload | User / Therapist |
| GET    | /api/admin/stats       | Admin            |
| GET    | /api/therapist/all     | Authenticated    |

---

# 👨‍💻 Default Admin Account

```text
Username: admin
Password: admin123
```


---

# 📸 Screenshots

Add screenshots here:

```text
docs/screenshots/dashboard.png
docs/screenshots/video-session.png
docs/screenshots/group-chat.png
```

---

# 🔒 Security Features

* JWT Authentication
* Role-Based Authorization
* Spring Security
* Protected Routes
* OAuth2 Login
* CORS Configuration
* Secure API Access

---

# 📈 Future Improvements

* AI-Based Mental Health Analysis
* Appointment Reminders
* Email Notifications
* Mobile Application
* Video Session Recording
* Payment Gateway Integration

---

# 👥 Contributors

Developed as a full-stack mental health support platform using React and Spring Boot.

---

## ⭐ Support

If you find this project useful, consider giving it a star on GitHub.
