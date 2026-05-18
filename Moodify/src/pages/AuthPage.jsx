import { useState } from "react";

const moodifyInstructions =
  "Login or register to unlock your mood dashboard and song suggestions.";

export default function AuthPage({ users, onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError("Username and password are required.");
      return;
    }

    if (mode === "login") {
      const user = users.find(
        (item) =>
          item.username === trimmedUsername && item.password === password
      );
      if (!user) {
        setError("Login failed. Check username and password.");
        return;
      }
      onLogin(user);
      return;
    }

    const exists = users.some((item) => item.username === trimmedUsername);
    if (exists) {
      setError("Username already exists. Choose a different username.");
      return;
    }

    const newUser = {
      username: trimmedUsername,
      password,
      moodHistory: [],
    };

    onRegister(newUser);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>{mode === "login" ? "Login" : "Register"}</h1>
        <p style={styles.subtitle}>{moodifyInstructions}</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              style={styles.input}
              placeholder="Enter your username"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={styles.input}
              placeholder="Enter your password"
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button style={styles.button} type="submit">
            {mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          style={styles.switchButton}
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login"
            ? "Need an account? Register"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #060916 0%, #101a30 100%)",
    color: "white",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 30,
    borderRadius: 28,
    background: "rgba(15, 23, 42, 0.95)",
    boxShadow: "0 32px 80px rgba(3, 12, 34, 0.35)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(124, 58, 237, 0.16)",
  },
  title: {
    marginBottom: 8,
    fontSize: 32,
    color: "#eef2ff",
  },
  subtitle: {
    marginBottom: 24,
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  form: {
    display: "grid",
    gap: 16,
  },
  label: {
    display: "grid",
    gap: 8,
    fontSize: 14,
    color: "#e2e8f0",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: "none",
    color: "white",
    background: "linear-gradient(135deg, #7c3aed, #0ea5e9)",
    cursor: "pointer",
    fontSize: 16,
    boxShadow: "0 16px 40px rgba(28, 51, 99, 0.25)",
  },
  switchButton: {
    marginTop: 18,
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid rgba(124,58,237,0.22)",
    background: "rgba(255,255,255,0.05)",
    color: "#c7d2fe",
    cursor: "pointer",
    fontSize: 14,
  },
  error: {
    color: "#fecaca",
    fontSize: 14,
    padding: "12px 14px",
    borderRadius: 14,
    background: "rgba(248, 113, 113, 0.12)",
  },
};
