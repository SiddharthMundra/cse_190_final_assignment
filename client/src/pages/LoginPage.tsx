import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

type Props = {
  /** Called after Firebase reports a signed-in user. Optional — auth gate auto-renders the app. */
  onSignedIn?: () => void;
  /** Optional back link target. Hidden when omitted (used as a gate page). */
  onBack?: () => void;
};

export function LoginPage({ onSignedIn, onBack }: Props) {
  const {
    user,
    loading: authLoading,
    firebaseConfigured,
    signInWithGoogle,
  } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) onSignedIn?.();
  }, [user, onSignedIn]);

  const handleGoogle = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }, [signInWithGoogle]);

  return (
    <div className="view-shell view-shell--login">
      <div className="login-page">
        <div className="login-card">
          <p className="login-kicker">Account</p>
          <h1 className="login-title">Sign in to Unfold</h1>
          <p className="login-lead">
            Please sign in with your Google account to continue. Your analyses
            are stored privately under your account.
          </p>

          <ul className="login-benefits" aria-label="What you get">
            <li>Plain-language summaries of your contracts</li>
            <li>Personal, private analysis history</li>
            <li>Secure access to your saved documents</li>
          </ul>

          {firebaseConfigured ? (
            <>
              <button
                type="button"
                className="login-google-btn"
                onClick={() => void handleGoogle()}
                disabled={authLoading || busy}
                aria-busy={busy}
              >
                <span className="login-google-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </span>
                {authLoading || busy ? "Opening Google…" : "Continue with Google"}
              </button>
              {error ? (
                <p className="login-error" role="alert">
                  {error}
                </p>
              ) : null}
            </>
          ) : (
            <div className="login-config-missing">
              <p>
                Firebase is not configured on this build. Add the{" "}
                <code className="login-code">VITE_FIREBASE_*</code> variables to{" "}
                <code className="login-code">client/.env</code> and restart the dev
                server.
              </p>
              <p className="muted small" style={{ marginTop: "0.75rem" }}>
                In the Firebase console, add a Web app under project settings,
                enable Google sign-in and Firestore, then paste the config into{" "}
                <code className="login-code">client/.env</code>.
              </p>
            </div>
          )}

          <p className="login-foot muted small">
            By continuing, you authorize Unfold to access your basic Google
            profile information. Unfold does not provide legal advice.
          </p>
        </div>

        {onBack ? (
          <a
            href="#home"
            className="login-back"
            onClick={(e) => {
              e.preventDefault();
              onBack();
            }}
          >
            ← Back to Homescreen
          </a>
        ) : null}
      </div>
    </div>
  );
}
