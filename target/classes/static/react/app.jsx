const { useEffect, useMemo, useState } = React;

const page = window.MINDCARE_PAGE || "index";
const model = window.MINDCARE_MODEL || {};
const qs = new URLSearchParams(window.location.search);

const therapyTypes = [
  ["CBT", "CBT"],
  ["ACT", "ACT"],
  ["DBT", "DBT"],
  ["TRAUMA_FOCUSED", "Trauma focused"],
  ["COUPLES_FAMILY", "Couples / family"],
  ["SLEEP_CBT_I", "Sleep CBT-I"],
  ["ADHD_COACHING", "ADHD coaching"],
  ["GENERAL_COUNSELLING", "General counselling"]
];

function icon(name) {
  return <i className={`bi bi-${name}`} aria-hidden="true"></i>;
}

function href(path) {
  window.location.href = path;
}

function text(value, fallback = "Not available") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).replaceAll("_", " ");
}

function formatDate(value) {
  if (!value) return "Not set";
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch (_) {
    return value;
  }
}

function formatTime(value) {
  if (!value) return "";
  const parts = String(value).split(":");
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : value;
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("mindcare-theme");
    if (stored) return stored;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("mindcare-theme", theme);
  }, [theme]);

  return [theme, () => setTheme((current) => current === "dark" ? "light" : "dark")];
}

function ButtonLink({ to, children, variant = "primary", iconName, small = false }) {
  return (
    <a className={`btn btn-${variant} ${small ? "btn-sm" : ""}`} href={to}>
      {iconName && icon(iconName)} <span>{children}</span>
    </a>
  );
}

function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button className="theme-toggle theme-fab" type="button" onClick={toggleTheme} aria-label="Toggle theme">
      {icon(theme === "dark" ? "sun-fill" : "moon-stars-fill")}
      <span>{theme === "dark" ? "Light mode" : "Night mode"}</span>
    </button>
  );
}

function Nav({ role = "", links = [], theme, toggleTheme }) {
  const home = role === "Admin" ? "/admin/dashboard" : role === "Therapist" ? "/therapist/dashboard" : role === "User" ? "/user/dashboard" : "/";
  return (
    <nav className="mc-nav">
      <a className="mc-brand" href={home}>
        <span className="mc-brand-mark">{icon("heart-pulse-fill")}</span>
        <span>MindCare{role ? ` ${role}` : ""}</span>
      </a>
      <div className="mc-nav-actions">
        {links.map((link) => (
          <a key={link.to} className="mc-nav-link" href={link.to}>
            {link.iconName && icon(link.iconName)} <span>{link.label}</span>
          </a>
        ))}
        {role && <a className="mc-nav-link" href="/logout">{icon("box-arrow-right")} <span>Logout</span></a>}
        <button className="mc-icon-button" type="button" onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Night mode"}>
          {icon(theme === "dark" ? "sun-fill" : "moon-stars-fill")}
        </button>
      </div>
    </nav>
  );
}

function AppShell({ role = "", links = [], children, theme, toggleTheme }) {
  return (
    <div className="mc-app">
      <Nav role={role} links={links} theme={theme} toggleTheme={toggleTheme} />
      {children}
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    </div>
  );
}

function PageHeader({ kicker, title, subtitle, actions }) {
  return (
    <section className="mc-hero">
      <div>
        {kicker && <div className="mc-kicker">{kicker}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="mc-hero-actions">{actions}</div>}
    </section>
  );
}

function AlertFromQuery() {
  const messages = [
    ["error", "danger", qs.get("error") || model.error || "Something needs attention."],
    ["logout", "success", "You have been logged out securely."],
    ["success", "success", qs.get("success") || "Saved successfully."],
    ["booked", "success", "Your session has been booked."],
    ["cancelled", "warning", "The session was cancelled."],
    ["completed", "success", "Session marked as completed."],
    ["created", "success", "Created successfully."],
    ["updated", "success", "Updated successfully."],
    ["uploaded", "success", "Upload completed."],
    ["saved", "success", "Saved successfully."],
    ["feedback", "success", qs.get("feedback") === "skipped" ? "Feedback skipped." : "Thanks for your feedback."]
  ];
  const hit = messages.find(([key]) => qs.has(key));
  if (!hit && !model.error) return null;
  const [, type, message] = hit || ["error", "danger", model.error];
  return <div className={`alert alert-${type} rounded-4 mc-alert`}>{message}</div>;
}

function StatCard({ label, value, note, iconName }) {
  return (
    <div className="mc-stat">
      <div className="mc-stat-icon">{icon(iconName || "activity")}</div>
      <div className="mc-stat-value">{value ?? 0}</div>
      <div className="mc-stat-label">{label}</div>
      {note && <div className="mc-stat-note">{note}</div>}
    </div>
  );
}

function Field({ label, name, type = "text", iconName, required = true, defaultValue = "", min, max, placeholder }) {
  return (
    <label className="mc-field">
      <span>{label}</span>
      <div className="mc-input-wrap">
        {iconName && icon(iconName)}
        <input name={name} type={type} required={required} defaultValue={defaultValue || ""} min={min} max={max} placeholder={placeholder || ""} />
      </div>
    </label>
  );
}

function SelectField({ label, name, options, defaultValue = "", iconName, required = true }) {
  return (
    <label className="mc-field">
      <span>{label}</span>
      <div className="mc-input-wrap">
        {iconName && icon(iconName)}
        <select name={name} required={required} defaultValue={defaultValue || ""}>
          <option value="">Select</option>
          {options.map((option) => Array.isArray(option)
            ? <option key={option[0]} value={option[0]}>{option[1]}</option>
            : <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
    </label>
  );
}

function TextArea({ label, name, defaultValue = "", required = false }) {
  return (
    <label className="mc-field span-12">
      <span>{label}</span>
      <textarea name={name} rows="4" required={required} defaultValue={defaultValue || ""}></textarea>
    </label>
  );
}

function Landing({ theme, toggleTheme }) {
  return (
    <AppShell theme={theme} toggleTheme={toggleTheme} links={[{ to: "/login", label: "Login", iconName: "box-arrow-in-right" }, { to: "/signup", label: "Sign up", iconName: "person-plus" }]}>
      <main className="mc-container">
        <section className="mc-landing">
          <div>
            <div className="mc-kicker">Private care, clear next steps</div>
            <h1>A calmer therapy management experience for users, therapists, and admins.</h1>
            <p>Book sessions, complete surveys, join online care, review progress, and manage the platform without the heavy, cluttered feeling.</p>
            <div className="mc-row-actions">
              <ButtonLink to="/signup" iconName="person-plus">Create account</ButtonLink>
              <ButtonLink to="/login" variant="outline-secondary" iconName="grid">Open dashboard</ButtonLink>
            </div>
          </div>
          <div className="mc-preview">
            <div className="mc-preview-top"><span></span><span></span><span></span></div>
            <div className="mc-preview-card large">
              <span>Next session</span>
              <strong>Secure video room</strong>
              <small>Join only from your session page</small>
            </div>
            <div className="mc-preview-grid">
              <div className="mc-preview-card"><span>Survey</span><strong>Personalized</strong></div>
              <div className="mc-preview-card"><span>Reports</span><strong>Organized</strong></div>
            </div>
          </div>
        </section>
        <section className="mc-card-grid">
          {[
            ["calendar2-check", "Reliable session flow", "Buttons go to the correct protected routes without dropping you back to the landing page."],
            ["moon-stars", "Working night mode", "The theme is controlled by React and saved in your browser."],
            ["palette", "Comfortable UI", "Softer colors, clearer spacing, and readable cards across the app."]
          ].map(([i, title, body]) => <InfoCard key={title} iconName={i} title={title} body={body} />)}
        </section>
      </main>
    </AppShell>
  );
}

function InfoCard({ iconName, title, body }) {
  return <div className="mc-card"><div className="mc-card-icon">{icon(iconName)}</div><h3>{title}</h3><p>{body}</p></div>;
}

function AuthPage({ type, theme, toggleTheme }) {
  const signup = type === "signup";
  const forgot = type === "forgot-password";
  const reset = type === "reset-password";
  const title = signup ? "Create account" : forgot ? "Forgot password" : reset ? "Reset password" : "Welcome back";
  return (
    <AppShell theme={theme} toggleTheme={toggleTheme}>
      <main className="mc-container mc-auth">
        <section className="mc-auth-panel">
          <div className="mc-auth-side">
            <div className="mc-kicker">MindCare access</div>
            <h1>{signup ? "Start with a simple, supportive account." : "Continue your care in a focused workspace."}</h1>
            <p>Secure login, role-aware dashboards, and calmer screens for daily use.</p>
          </div>
          <div className="mc-auth-form">
            <h2>{title}</h2>
            <p>{signup ? "Use a strong password with uppercase, number, and special character." : "Enter your details to continue."}</p>
            <AlertFromQuery />
            <form method="post" action={signup ? "/signup" : forgot ? "/forgot-password" : reset ? "/reset-password" : "/login"} className="mc-form">
              {signup && <>
                <Field label="Username" name="username" iconName="person" />
                <Field label="Email" name="email" type="email" iconName="envelope" />
                <Field label="Password" name="password" type="password" iconName="lock" />
              </>}
              {!signup && !forgot && !reset && <>
                <Field label="Username" name="username" iconName="person" />
                <Field label="Password" name="password" type="password" iconName="lock" />
              </>}
              {forgot && <Field label="Email" name="email" type="email" iconName="envelope" />}
              {reset && <>
                <input type="hidden" name="token" value={qs.get("token") || ""} />
                <Field label="New password" name="password" type="password" iconName="lock" />
                <Field label="Confirm password" name="confirmPassword" type="password" iconName="lock-fill" />
              </>}
              {!signup && !forgot && !reset && <a className="mc-small-link" href="/forgot-password">Forgot password?</a>}
              <button className="btn btn-primary w-100" type="submit">{signup ? "Create account" : forgot ? "Send reset link" : reset ? "Reset password" : "Login"}</button>
            </form>
            {!signup && !forgot && !reset && <a className="btn btn-outline-secondary w-100 mt-3" href="/oauth2/authorization/google">{icon("google")} Continue with Google</a>}
            <div className="mc-auth-switch">
              <a href={signup ? "/login" : "/signup"}>{signup ? "Already have an account? Login" : "Need an account? Create one"}</a>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function UserDashboard({ theme, toggleTheme }) {
  return (
    <AppShell role="User" theme={theme} toggleTheme={toggleTheme} links={[
      { to: "/book-session", label: "Book", iconName: "plus-circle" },
      { to: "/my-session", label: "Sessions", iconName: "calendar2-heart" },
      { to: "/survey", label: "Survey", iconName: "clipboard2-pulse" }
    ]}>
      <main className="mc-container">
        <PageHeader
          kicker="User dashboard"
          title="Your care space is ready."
          subtitle="Check your progress, book appointments, and continue therapy without losing your place."
          actions={<ButtonLink to="/book-session" iconName="plus-circle">Book a session</ButtonLink>}
        />
        <AlertFromQuery />
        <section className="mc-stats-grid">
          <StatCard label="Upcoming" value={model.upcomingCount || 0} note="Scheduled sessions" iconName="calendar-event" />
          <StatCard label="Completed" value={model.completedCount || 0} note="Finished sessions" iconName="check2-circle" />
          <StatCard label="Online" value={model.onlineCount || 0} note="Digital care moments" iconName="camera-video" />
        </section>
        <section className="mc-two-col">
          <InfoCard iconName="clipboard-heart" title="Wellbeing survey" body="Retake the survey when your needs change. Your recommendation helps guide booking." />
          <InfoCard iconName="heart" title="Gentle reminder" body="Small steps still count. Taking care of yourself is progress, not pressure." />
        </section>
      </main>
    </AppShell>
  );
}

function BookSession({ theme, toggleTheme }) {
  const therapists = model.therapists || [];
  return (
    <AppShell role="User" theme={theme} toggleTheme={toggleTheme} links={[{ to: "/my-session", label: "Sessions", iconName: "calendar2-heart" }]}>
      <main className="mc-container">
        <PageHeader kicker="Booking" title="Reserve a therapy session." subtitle="Choose a therapist, therapy style, session type, date, and time." />
        <AlertFromQuery />
        <section className="mc-form-card">
          <form method="post" action="/book-session" className="mc-form-grid">
            <SelectField
              label="Therapist"
              name="therapistId"
              iconName="person-badge"
              options={therapists.map((t) => ({ value: t.id, label: `${t.name || "Therapist"}${t.specialization ? ` - ${t.specialization}` : ""}` }))}
            />
            <SelectField label="Therapy type" name="therapyType" iconName="heart-pulse" options={therapyTypes} defaultValue={model.recommendedTherapy || ""} />
            <SelectField label="Session type" name="sessionType" iconName="camera-video" options={[["ONLINE", "Online"], ["IN_PERSON", "In person"]]} />
            <Field label="Date" name="date" type="date" iconName="calendar-event" />
            <Field label="Time" name="time" type="time" iconName="clock" />
            <div className="span-12 mc-booking-note">
              {model.recommendedTherapy ? <span>{icon("stars")} Recommended therapy: {text(model.recommendedTherapy)}</span> : <span>{icon("info-circle")} Take the survey first for a stronger therapy recommendation.</span>}
            </div>
            <button className="btn btn-primary span-12" type="submit">{icon("calendar2-plus")} Confirm session</button>
          </form>
        </section>
      </main>
    </AppShell>
  );
}

function SessionsPage({ role, theme, toggleTheme }) {
  const isTherapist = role === "Therapist";
  const sessions = Array.isArray(model.sessions) ? model.sessions : [];
  return (
    <AppShell role={role || "User"} theme={theme} toggleTheme={toggleTheme} links={[
      { to: isTherapist ? "/therapist/dashboard" : "/user/dashboard", label: "Dashboard", iconName: "grid" },
      !isTherapist && { to: "/book-session", label: "Book", iconName: "plus-circle" }
    ].filter(Boolean)}>
      <main className="mc-container">
        <PageHeader
          kicker={isTherapist ? "Therapist schedule" : "My sessions"}
          title={isTherapist ? "Assigned sessions" : "Your session history"}
          subtitle="Every action stays on the correct route, so you should not be dropped back to the landing page."
        />
        <AlertFromQuery />
        <section className="mc-table-card">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Name</th><th>Date</th><th>Time</th><th>Mode</th><th>Therapy</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {sessions.length === 0 && <tr><td colSpan="7" className="text-muted p-4">No sessions found.</td></tr>}
                {sessions.map((s) => <SessionRow key={s.id || `${s.sessionDate}-${s.sessionTime}`} session={s} role={role} />)}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function SessionRow({ session, role }) {
  const online = String(session.sessionType || "").toUpperCase() === "ONLINE";
  const booked = String(session.status || "").toUpperCase() === "BOOKED";
  const completed = String(session.status || "").toUpperCase() === "COMPLETED";
  return (
    <tr>
      <td>{session.therapistName || session.clientUsername || "Session"}</td>
      <td>{formatDate(session.sessionDate)}</td>
      <td>{formatTime(session.sessionTime)}</td>
      <td><span className="mc-badge">{text(session.sessionType)}</span></td>
      <td>{text(session.therapyType)}</td>
      <td><span className={`mc-status ${String(session.status || "").toLowerCase()}`}>{text(session.status)}</span></td>
      <td>
        <div className="mc-row-actions compact">
          {online && booked && <ButtonLink small to={`/session/${session.id}/online`} iconName="camera-video">Join</ButtonLink>}
          {role === "User" && completed && <ButtonLink small variant="outline-secondary" to={`/feedback/${session.id}`} iconName="chat-heart">Feedback</ButtonLink>}
          {role === "User" && completed && <ButtonLink small variant="outline-secondary" to={`/user/sessions/${session.id}/summary`} iconName="file-text">Summary</ButtonLink>}
          {role === "Therapist" && <ButtonLink small variant="outline-secondary" to={`/therapist/sessions/${session.id}/report`} iconName="journal-text">Report</ButtonLink>}
          {role === "Therapist" && booked && <PostButton action={`/therapist/sessions/${session.id}/complete`} label="Complete" iconName="check2" />}
          {booked && <PostButton action={role === "Therapist" ? `/therapist/sessions/${session.id}/cancel` : `/sessions/cancel/${session.id}`} label="Cancel" iconName="x-circle" danger />}
        </div>
      </td>
    </tr>
  );
}

function PostButton({ action, label, iconName, danger }) {
  return (
    <form action={action} method="post" className="d-inline">
      <button className={`btn btn-sm ${danger ? "btn-outline-danger" : "btn-outline-secondary"}`} type="submit">{icon(iconName)} {label}</button>
    </form>
  );
}

function Survey({ theme, toggleTheme }) {
  const questions = [
    "How often have you felt anxious or worried?",
    "How often have you felt low or hopeless?",
    "How well have you been sleeping?",
    "How difficult is it to focus during the day?",
    "How often do you feel overwhelmed?",
    "How supported do you feel by people around you?",
    "How often do you avoid daily responsibilities?",
    "How intense are your stress symptoms?",
    "How often do you feel safe and in control?",
    "How urgently do you need support?"
  ];
  return (
    <AppShell role="User" theme={theme} toggleTheme={toggleTheme} links={[{ to: "/user/dashboard", label: "Dashboard", iconName: "grid" }]}>
      <main className="mc-container">
        <PageHeader kicker="Wellbeing survey" title="Answer gently and honestly." subtitle="Use a 1 to 5 score. You can retake this anytime." />
        <form method="post" action="/survey" className="mc-survey">
          {questions.map((question, idx) => (
            <div className="mc-survey-question" key={question}>
              <div><strong>{idx + 1}. {question}</strong><small>1 means low, 5 means high.</small></div>
              <select name={`q${idx + 1}`} defaultValue="3" className="form-select">
                {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}</option>)}
              </select>
            </div>
          ))}
          <button className="btn btn-primary" type="submit">{icon("clipboard2-check")} Submit survey</button>
        </form>
      </main>
    </AppShell>
  );
}

function SurveyResult({ theme, toggleTheme }) {
  const result = model.result || {};
  return (
    <AppShell role="User" theme={theme} toggleTheme={toggleTheme} links={[{ to: "/user/dashboard", label: "Dashboard", iconName: "grid" }]}>
      <main className="mc-container">
        <PageHeader kicker="Survey result" title="Your recommendation is ready." subtitle="Use this result to guide your next booking." actions={<ButtonLink to="/book-session" iconName="calendar2-plus">Book recommended care</ButtonLink>} />
        <section className="mc-card-grid">
          <StatCard label="Category" value={text(result.category, "Pending")} iconName="clipboard-heart" />
          <StatCard label="Therapy" value={text(result.recommendedTherapy, "Take survey")} iconName="heart-pulse" />
          <StatCard label="Support" value={model.helplineNumber ? model.helplineNumber : "Standard"} iconName="telephone" />
        </section>
      </main>
    </AppShell>
  );
}

function Feedback({ theme, toggleTheme }) {
  const sessionId = model.sessionId || location.pathname.split("/").filter(Boolean).pop();
  return (
    <AppShell role="User" theme={theme} toggleTheme={toggleTheme} links={[{ to: "/my-session", label: "Sessions", iconName: "calendar2-heart" }]}>
      <main className="mc-container">
        <PageHeader kicker="Feedback" title="How did the session feel?" subtitle="Your feedback helps improve care quality." />
        <AlertFromQuery />
        <section className="mc-form-card">
          <form method="post" action={`/feedback/${sessionId}`} className="mc-form-grid">
            <Field label="Rating (1-5)" name="rating" type="number" min="1" max="5" iconName="star" />
            <Field label="NPS (0-10)" name="nps" type="number" min="0" max="10" iconName="speedometer" required={false} />
            <TextArea label="Comments" name="comments" />
            <button className="btn btn-primary" type="submit">{icon("send")} Submit feedback</button>
          </form>
          <form action={`/feedback/${sessionId}/skip`} method="post" className="mt-3">
            <button className="btn btn-outline-secondary" type="submit">Skip for now</button>
          </form>
        </section>
      </main>
    </AppShell>
  );
}

function AdminDashboard({ theme, toggleTheme }) {
  return (
    <AppShell role="Admin" theme={theme} toggleTheme={toggleTheme} links={[
      { to: "/admin/therapists", label: "Therapists", iconName: "people" },
      { to: "/admin/analytics", label: "Analytics", iconName: "graph-up" }
    ]}>
      <main className="mc-container">
        <PageHeader kicker="Admin" title="Platform overview" subtitle="Manage therapists, monitor sessions, and keep care operations clear." />
        <section className="mc-stats-grid">
          <StatCard label="Therapists" value={model.therapistCount || 0} iconName="people" />
          <StatCard label="Active" value={model.activeTherapistCount || 0} iconName="person-check" />
          <StatCard label="Verified" value={model.verifiedTherapistCount || 0} iconName="patch-check" />
          <StatCard label="Sessions" value={model.sessionCount || 0} iconName="calendar2-week" />
        </section>
      </main>
    </AppShell>
  );
}

function AdminTherapists({ theme, toggleTheme }) {
  const therapists = Array.isArray(model.therapists) ? model.therapists : [];
  return (
    <AppShell role="Admin" theme={theme} toggleTheme={toggleTheme} links={[{ to: "/admin/dashboard", label: "Dashboard", iconName: "grid" }]}>
      <main className="mc-container">
        <PageHeader kicker="Admin" title="Therapists" subtitle="Create, edit, activate, verify, and manage therapist accounts." actions={<ButtonLink to="/admin/therapists/new" iconName="person-plus">Add therapist</ButtonLink>} />
        <AlertFromQuery />
        <section className="mc-table-card">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Name</th><th>Email</th><th>Specialization</th><th>Status</th><th>Account</th><th>Actions</th></tr></thead>
              <tbody>
                {therapists.length === 0 && <tr><td colSpan="6" className="text-muted p-4">No therapists found.</td></tr>}
                {therapists.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.email}</td>
                    <td>{text(t.specialization)}</td>
                    <td><span className={`mc-status ${t.active ? "booked" : "cancelled"}`}>{t.active ? "Active" : "Inactive"}</span></td>
                    <td>{t.accountCreated ? "Created" : "Not created"}</td>
                    <td><div className="mc-row-actions compact">
                      <ButtonLink small variant="outline-secondary" to={`/admin/therapists/edit/${t.id}`} iconName="pencil">Edit</ButtonLink>
                      <PostButton action={`/admin/therapists/${t.active ? "deactivate" : "activate"}/${t.id}`} label={t.active ? "Deactivate" : "Activate"} iconName={t.active ? "pause-circle" : "play-circle"} danger={t.active} />
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function TherapistDashboard({ theme, toggleTheme }) {
  return (
    <AppShell role="Therapist" theme={theme} toggleTheme={toggleTheme} links={[
      { to: "/therapist/sessions", label: "Sessions", iconName: "calendar2-check" },
      { to: "/therapist/profile", label: "Profile", iconName: "person-badge" }
    ]}>
      <main className="mc-container">
        <PageHeader kicker="Therapist" title="Your schedule at a glance." subtitle="Review sessions, complete care steps, and write reports." />
        <section className="mc-stats-grid">
          <StatCard label="Booked" value={model.bookedCount || 0} iconName="calendar-event" />
          <StatCard label="Completed" value={model.completedCount || 0} iconName="check2-circle" />
          <StatCard label="Today" value={model.todayCount || 0} iconName="sun" />
        </section>
      </main>
    </AppShell>
  );
}

function TherapistForm({ theme, toggleTheme }) {
  const t = model.therapist || {};
  const edit = model.mode === "edit" || location.pathname.includes("/edit/");
  const action = edit ? location.pathname.replace("/edit/", "/update/") : "/admin/therapists";
  return (
    <AppShell role="Admin" theme={theme} toggleTheme={toggleTheme} links={[{ to: "/admin/therapists", label: "Therapists", iconName: "people" }]}>
      <main className="mc-container">
        <PageHeader kicker="Admin" title={edit ? "Edit therapist" : "Add therapist"} subtitle="Keep provider details clear and complete." />
        <section className="mc-form-card">
          <form method="post" action={action} className="mc-form-grid">
            <Field label="Name" name="name" iconName="person" defaultValue={t.name} />
            <Field label="Email" name="email" type="email" iconName="envelope" defaultValue={t.email} />
            <Field label="Specialization" name="specialization" iconName="heart-pulse" defaultValue={t.specialization} />
            <Field label="Languages" name="languages" iconName="translate" required={false} defaultValue={t.languages} />
            <Field label="Session price" name="sessionPrice" type="number" iconName="cash" required={false} defaultValue={t.sessionPrice} />
            <Field label="Available days" name="availableDays" iconName="calendar-week" required={false} defaultValue={t.availableDays} />
            <TextArea label="Specialties" name="specialties" defaultValue={t.specialties} />
            {!edit && <><Field label="Account username" name="accountUsername" iconName="person-gear" required={false} /><Field label="Account password" name="accountPassword" type="password" iconName="lock" required={false} /></>}
            <button className="btn btn-primary span-12" type="submit">{icon("save")} Save therapist</button>
          </form>
        </section>
      </main>
    </AppShell>
  );
}

function TherapistProfile({ theme, toggleTheme }) {
  return (
    <AppShell role="Therapist" theme={theme} toggleTheme={toggleTheme} links={[{ to: "/therapist/dashboard", label: "Dashboard", iconName: "grid" }]}>
      <main className="mc-container">
        <PageHeader kicker="Profile" title="Qualification upload" subtitle="Upload verification documents for admin review." />
        <AlertFromQuery />
        <section className="mc-form-card">
          <form action="/therapist/profile/qualification" method="post" encType="multipart/form-data" className="mc-form">
            <Field label="Qualification file" name="file" type="file" iconName="file-earmark-arrow-up" />
            <button className="btn btn-primary" type="submit">{icon("upload")} Upload</button>
          </form>
        </section>
      </main>
    </AppShell>
  );
}

function ReportForm({ theme, toggleTheme }) {
  return (
    <AppShell role="Therapist" theme={theme} toggleTheme={toggleTheme} links={[{ to: "/therapist/sessions", label: "Sessions", iconName: "calendar2-check" }]}>
      <main className="mc-container">
        <PageHeader kicker="Report" title="Session report" subtitle="Record clinical notes and client-facing next steps." />
        <AlertFromQuery />
        <section className="mc-form-card">
          <form method="post" action={location.pathname} className="mc-form-grid">
            <TextArea label="Symptoms summary" name="symptomsSummary" />
            <TextArea label="Session goals" name="sessionGoals" />
            <Field label="Progress rating" name="progressRating" type="number" min="1" max="10" iconName="graph-up" />
            <TextArea label="Next steps" name="nextSteps" />
            <TextArea label="Client summary" name="clientSummary" />
            <TextArea label="Private notes" name="privateNotes" />
            <button className="btn btn-primary span-12" type="submit">{icon("save")} Save report</button>
          </form>
        </section>
      </main>
    </AppShell>
  );
}

function OnlineSession({ theme, toggleTheme }) {
  useEffect(() => {
    window.__ONLINE_SESSION__ = {
      sessionId: model.sessionId,
      displayName: model.displayName || "Participant",
      remainingSeconds: model.remainingSeconds || 0,
      role: String(model.role || "ROLE_USER").replace("ROLE_", "")
    };
    const load = (src) => new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
    load("https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js")
      .then(() => load("https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"))
      .then(() => load("/js/online-session.js"))
      .catch(() => {
        const status = document.getElementById("callStatus");
        if (status) status.textContent = "Could not load video scripts";
      });
  }, []);

  return (
    <AppShell role={String(model.role || "").includes("THERAPIST") ? "Therapist" : "User"} theme={theme} toggleTheme={toggleTheme} links={[{ to: "/dashboard", label: "Dashboard", iconName: "grid" }]}>
      <main className="mc-container">
        <PageHeader kicker="Online room" title="Secure session room" subtitle="Start the call when both participants are ready." />
        <section className="mc-online-grid">
          <div className="mc-video-panel">
            <div className="mc-video-top">
              <span id="callStatusPill" className="connection-pill"><span className="dot"></span><span id="callStatus">Not connected</span></span>
              <span className="mc-time">{icon("clock")} <span id="timeLeft">00:00</span></span>
              <span id="statusMirror" className="visually-hidden"></span>
              <span id="roleText" className="visually-hidden"></span>
            </div>
            <div className="mc-video-grid">
              <video id="remoteVideo" autoPlay playsInline></video>
              <video id="localVideo" autoPlay muted playsInline></video>
            </div>
            <div className="mc-row-actions mt-3">
              <button id="btnStart" className="btn btn-primary" type="button">{icon("camera-video")} Start call</button>
              <button id="btnHangup" className="btn btn-outline-danger" type="button" disabled>{icon("telephone-x")} Hang up</button>
            </div>
          </div>
          <div className="mc-chat-panel">
            <h2>Session chat</h2>
            <div id="chatBox" className="chat-box-modern"></div>
            <div id="typingIndicator" className="typing-indicator"><span id="typingLabel"></span></div>
            <form id="chatForm" className="mc-chat-form">
              <input id="chatInput" className="form-control" placeholder="Type a message" />
              <button className="btn btn-primary" type="submit">{icon("send")}</button>
            </form>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function EmptyPage({ title, role = "User", theme, toggleTheme }) {
  return (
    <AppShell role={role} theme={theme} toggleTheme={toggleTheme} links={[{ to: "/dashboard", label: "Dashboard", iconName: "grid" }]}>
      <main className="mc-container">
        <PageHeader kicker="MindCare" title={title} subtitle="This page is connected to the React shell and ready for backend data." />
        <AlertFromQuery />
      </main>
    </AppShell>
  );
}

function App() {
  const [theme, toggleTheme] = useTheme();
  const props = { theme, toggleTheme };
  const routes = {
    index: <Landing {...props} />,
    login: <AuthPage type="login" {...props} />,
    signup: <AuthPage type="signup" {...props} />,
    "forgot-password": <AuthPage type="forgot-password" {...props} />,
    "reset-password": <AuthPage type="reset-password" {...props} />,
    dashboard: <UserDashboard {...props} />,
    "book-session": <BookSession {...props} />,
    "my-session": <SessionsPage role="User" {...props} />,
    survey: <Survey {...props} />,
    "survey-result": <SurveyResult {...props} />,
    feedback: <Feedback {...props} />,
    "admin-dashboard": <AdminDashboard {...props} />,
    "admin-therapists": <AdminTherapists {...props} />,
    "admin-sessions": <SessionsPage role="Admin" {...props} />,
    "admin-analytics": <AdminDashboard {...props} />,
    "therapist-dashboard": <TherapistDashboard {...props} />,
    "therapist-sessions": <SessionsPage role="Therapist" {...props} />,
    "therapist-form": <TherapistForm {...props} />,
    "therapist-profile": <TherapistProfile {...props} />,
    "therapist-report": <ReportForm {...props} />,
    "therapist-report-history": <EmptyPage title="Report history" role="Therapist" {...props} />,
    "user-session-summary": <EmptyPage title="Session summary" role="User" {...props} />,
    "online-session": <OnlineSession {...props} />,
    error: <EmptyPage title="Something went wrong" role="" {...props} />
  };
  return routes[page] || <EmptyPage title={`Page not configured: ${page}`} role="" {...props} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
