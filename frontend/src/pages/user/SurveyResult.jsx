import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import api from "../../api/axios";
import { fmt } from "../../utils/helpers";

export default function SurveyResult() {
  const [result, setResult] = useState(null);
  useEffect(() => { api.get("/survey").then(r => setResult(r.data)); }, []);

  return (
    <AppShell>
      <main className="mc-container">
        <section className="mc-hero">
          <div><div className="mc-kicker">Your result</div><h1>Recommendation ready.</h1></div>
          <Link to="/book-session" className="btn btn-primary"><i className="bi bi-calendar2-plus me-2"/>Book recommended care</Link>
        </section>
        {result && (
          <section className="mc-stats-grid">
            <div className="mc-stat mc-stat-blue mc-stat-animated">
              <div className="mc-stat-icon"><i className="bi bi-clipboard-heart"/></div>
              <div className="mc-stat-value" style={{fontSize:"1.2rem"}}>{fmt(result.category,"Pending")}</div>
              <div className="mc-stat-label">Category</div>
            </div>
            <div className="mc-stat mc-stat-green mc-stat-animated">
              <div className="mc-stat-icon"><i className="bi bi-heart-pulse"/></div>
              <div className="mc-stat-value" style={{fontSize:"1.1rem"}}>{fmt(result.recommendedTherapy,"Take survey")}</div>
              <div className="mc-stat-label">Recommended therapy</div>
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}
