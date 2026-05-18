import { useEffect, useState } from "react";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import "./App.css";

const USERS_KEY = "moodifyUsers";
const CURRENT_USER_KEY = "moodifyCurrentUser";

function loadUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function loadCurrentUser(users) {
  const currentName = localStorage.getItem(CURRENT_USER_KEY);
  if (!currentName) {
    return null;
  }
  return users.find((item) => item.username === currentName) || null;
}

function App() {
  const initialUsers = loadUsers();
  const [users, setUsers] = useState(initialUsers);
  const [currentUser, setCurrentUser] = useState(() =>
    loadCurrentUser(initialUsers)
  );

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, currentUser.username);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [users, currentUser]);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleRegister = (newUser) => {
    setUsers((existing) => [...existing, newUser]);
    setCurrentUser(newUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleMoodSubmit = (mood) => {
    if (!currentUser) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const history = currentUser.moodHistory || [];
    const updatedHistory = history.filter((item) => item.date !== today);
    updatedHistory.push({ date: today, mood });
    const recentHistory = updatedHistory.slice(-7);

    const updatedUser = {
      ...currentUser,
      moodHistory: recentHistory,
    };

    setCurrentUser(updatedUser);
    setUsers((existing) =>
      existing.map((item) =>
        item.username === updatedUser.username ? updatedUser : item
      )
    );
  };

  if (!currentUser) {
    return <AuthPage users={users} onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <Dashboard
      user={currentUser}
      onLogout={handleLogout}
      onMoodSubmit={handleMoodSubmit}
    />
  );
}

export default App;
