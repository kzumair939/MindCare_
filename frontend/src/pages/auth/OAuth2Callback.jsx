import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function OAuth2Callback() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const token = params.get("token");

        if (!token) {
            navigate("/login");
            return;
        }

        const handleLogin = async () => {
            try {
                // 1. Save token + fetch user data (returns user object)
                const userData = await loginWithToken(token);

                // 2. Role-based redirect
                if (userData?.role === "ROLE_ADMIN") {
                    navigate("/admin");
                } else if (userData?.role === "ROLE_THERAPIST") {
                    navigate("/therapist");
                } else {
                    navigate("/dashboard");
                }
            } catch (err) {
                console.error("OAuth login failed", err);
                navigate("/login");
            }
        };

        handleLogin();
    }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="mc-oauth-loading">
            <div className="mc-oauth-card">
                <div className="mc-spinner-lg"/>
                <h3>Signing you in…</h3>
                <p>Please wait while we set up your account.</p>
            </div>
        </div>
    );
}