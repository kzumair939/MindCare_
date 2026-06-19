import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Auth
import Login    from "./pages/auth/Login";
import Signup   from "./pages/auth/Signup";
import Forgot   from "./pages/auth/ForgotPassword";
import Reset    from "./pages/auth/ResetPassword";
import OAuth2Cb from "./pages/auth/OAuth2Callback";
import VerifyOtp from "./pages/auth/VerifyOtp";

// Landing
import Landing from "./pages/Landing";

// User
import Dashboard    from "./pages/user/Dashboard";
import BookSession  from "./pages/user/BookSession";
import MySessions   from "./pages/user/MySessions";
import Survey       from "./pages/user/Survey";
import SurveyResult from "./pages/user/SurveyResult";
import Feedback     from "./pages/user/Feedback";
import SessionSummary from "./pages/user/SessionSummary";
import Settings     from "./pages/user/Settings";
import Payment      from "./pages/user/Payment";

// Group
import GroupRooms from "./pages/group/GroupRooms";
import GroupChat  from "./pages/group/GroupChat";

// Therapist
import TherapistDash     from "./pages/therapist/TherapistDashboard";
import TherapistSessions from "./pages/therapist/TherapistSessions";
import TherapistReport   from "./pages/therapist/TherapistReport";
import OnlineSession     from "./pages/OnlineSession";

// Admin
import AdminDash       from "./pages/admin/AdminDashboard";
import AdminTherapists from "./pages/admin/AdminTherapists";
import AdminSessions   from "./pages/admin/AdminSessions";
import TherapistForm   from "./pages/admin/TherapistForm";
import AdminAnalytics  from "./pages/admin/AdminAnalytics";
import AdminReports    from "./pages/admin/AdminReports";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"              element={<Landing/>}/>
          <Route path="/login"         element={<Login/>}/>
          <Route path="/signup"        element={<Signup/>}/>
          <Route path="/verify-otp"    element={<VerifyOtp/>}/>
          <Route path="/forgot-password" element={<Forgot/>}/>
          <Route path="/reset-password"  element={<Reset/>}/>
          <Route path="/oauth2/callback" element={<OAuth2Cb/>}/>

          {/* User */}
          <Route path="/dashboard"   element={<ProtectedRoute roles={["ROLE_USER"]}><Dashboard/></ProtectedRoute>}/>
          <Route path="/book-session" element={<ProtectedRoute roles={["ROLE_USER"]}><BookSession/></ProtectedRoute>}/>
          <Route path="/my-sessions" element={<ProtectedRoute roles={["ROLE_USER"]}><MySessions/></ProtectedRoute>}/>
          <Route path="/survey"      element={<ProtectedRoute roles={["ROLE_USER"]}><Survey/></ProtectedRoute>}/>
          <Route path="/survey/result" element={<ProtectedRoute roles={["ROLE_USER"]}><SurveyResult/></ProtectedRoute>}/>
          <Route path="/feedback/:sessionId" element={<ProtectedRoute roles={["ROLE_USER"]}><Feedback/></ProtectedRoute>}/>
          <Route path="/sessions/:sessionId/summary" element={<ProtectedRoute roles={["ROLE_USER"]}><SessionSummary/></ProtectedRoute>}/>
          <Route path="/settings"    element={<ProtectedRoute roles={["ROLE_USER"]}><Settings/></ProtectedRoute>}/>
          <Route path="/payment/:sessionId" element={<ProtectedRoute roles={["ROLE_USER"]}><Payment/></ProtectedRoute>}/>

          {/* Group (USER + THERAPIST) */}
          <Route path="/group"       element={<ProtectedRoute roles={["ROLE_USER","ROLE_THERAPIST"]}><GroupRooms/></ProtectedRoute>}/>
          <Route path="/group/:roomId" element={<ProtectedRoute roles={["ROLE_USER","ROLE_THERAPIST"]}><GroupChat/></ProtectedRoute>}/>

          {/* Online session (USER + THERAPIST) */}
          <Route path="/session/:sessionId/online" element={<ProtectedRoute roles={["ROLE_USER","ROLE_THERAPIST"]}><OnlineSession/></ProtectedRoute>}/>

          {/* Therapist */}
          <Route path="/therapist"          element={<ProtectedRoute roles={["ROLE_THERAPIST"]}><TherapistDash/></ProtectedRoute>}/>
          <Route path="/therapist/sessions" element={<ProtectedRoute roles={["ROLE_THERAPIST"]}><TherapistSessions/></ProtectedRoute>}/>
          <Route path="/therapist/sessions/:sessionId/report" element={<ProtectedRoute roles={["ROLE_THERAPIST"]}><TherapistReport/></ProtectedRoute>}/>

          {/* Admin */}
          <Route path="/admin"               element={<ProtectedRoute roles={["ROLE_ADMIN"]}><AdminDash/></ProtectedRoute>}/>
          <Route path="/admin/therapists"    element={<ProtectedRoute roles={["ROLE_ADMIN"]}><AdminTherapists/></ProtectedRoute>}/>
          <Route path="/admin/sessions"      element={<ProtectedRoute roles={["ROLE_ADMIN"]}><AdminSessions/></ProtectedRoute>}/>
          <Route path="/admin/therapists/new" element={<ProtectedRoute roles={["ROLE_ADMIN"]}><TherapistForm/></ProtectedRoute>}/>
          <Route path="/admin/therapists/:id/edit" element={<ProtectedRoute roles={["ROLE_ADMIN"]}><TherapistForm/></ProtectedRoute>}/>
          <Route path="/admin/analytics"     element={<ProtectedRoute roles={["ROLE_ADMIN"]}><AdminAnalytics/></ProtectedRoute>}/>
          <Route path="/admin/reports"       element={<ProtectedRoute roles={["ROLE_ADMIN"]}><AdminReports/></ProtectedRoute>}/>

          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
