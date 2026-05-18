import { useMemo, useState, useEffect } from "react";
import FaceExpression from "../Features/Expression/Component/FaceExpression";
import {
  authorizeWithSpotify,
  getStoredToken,
  searchTrack,
  playUri,
} from "../utils/spotify";

const moodOptions = [
  { value: "happy", label: "Happy" },
  { value: "sad", label: "Sad" },
  { value: "angry", label: "Angry" },
  { value: "relaxed", label: "Relaxed" },
  { value: "neutral", label: "Neutral" },
];

const moodSongs = {
  happy: [
    "Happy - Pharrell Williams",
    "Can't Stop the Feeling - Justin Timberlake",
    "Good as Hell - Lizzo",
  ],
  sad: [
    "Someone Like You - Adele",
    "Fix You - Coldplay",
    "Let Her Go - Passenger",
  ],
  angry: [
    "Break Stuff - Limp Bizkit",
    "Killing in the Name - Rage Against the Machine",
    "You Oughta Know - Alanis Morissette",
  ],
  relaxed: [
    "Weightless - Marconi Union",
    "Sunset Lover - Petit Biscuit",
    "Ocean Eyes - Billie Eilish",
  ],
  neutral: [
    "Electric Feel - MGMT",
    "Yellow - Coldplay",
    "Budapest - George Ezra",
  ],
};

function getSongSuggestions(mood) {
  return moodSongs[mood] || moodSongs.neutral;
}

export default function Dashboard({ user, onLogout, onMoodSubmit }) {
  const [selectedMood, setSelectedMood] = useState("neutral");
  const [spotifyToken, setSpotifyToken] = useState(() => getStoredToken());
  const [spotifyConnecting, setSpotifyConnecting] = useState(false);
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

  useEffect(() => {
    const stored = getStoredToken();
    if (stored) setSpotifyToken(stored);
  }, []);

  async function handleConnectSpotify() {
    if (!clientId) {
      alert("Set VITE_SPOTIFY_CLIENT_ID in .env and restart dev server.");
      return;
    }
    try {
      setSpotifyConnecting(true);
      const token = await authorizeWithSpotify(clientId, [
        "user-read-playback-state",
        "user-modify-playback-state",
      ]);
      setSpotifyToken(token);
      setSpotifyConnecting(false);
    } catch (err) {
      setSpotifyConnecting(false);
      console.error(err);
      alert("Spotify connect failed: " + err.message);
    }
  }

  async function handlePlaySuggestion(songTitle) {
    if (!spotifyToken) {
      alert("Connect Spotify first to play songs.");
      return;
    }
    try {
      const uri = await searchTrack(songTitle, spotifyToken);
      if (!uri) {
        alert("Track not found on Spotify: " + songTitle);
        return;
      }
      await playUri(uri, spotifyToken);
    } catch (err) {
      console.error(err);
      alert("Unable to play track: " + err.message);
    }
  }
  const [showDetector, setShowDetector] = useState(false);
  const [detectedMood, setDetectedMood] = useState("");

  const history = user.moodHistory || [];
  const latestMood = history.length > 0 ? history[history.length - 1].mood : "none";

  const suggestions = useMemo(
    () => getSongSuggestions(latestMood || selectedMood),
    [latestMood, selectedMood]
  );

  const handleDetectedMood = (mood) => {
    setDetectedMood(mood);
  };

  const handleSubmitDetectedMood = () => {
    if (!detectedMood) return;
    onMoodSubmit(detectedMood);
    setShowDetector(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
            
          <h1 style={styles.heading}>Moodify Dashboard</h1>
          <div style={{ display: "flex", gap: 12, position:"absolute", top: 20, right: 20 }}>
            <button
              style={styles.connectButton}
              onClick={handleConnectSpotify}
              disabled={spotifyConnecting}
            >
              {spotifyToken ? "Spotify: Connected" : spotifyConnecting ? "Connecting..." : "Connect Spotify"}
            </button>
            <button style={styles.logoutButton} onClick={onLogout}>
              Logout
            </button>
          </div>
          <p style={styles.description}>
            Welcome back, <strong>{user.username}</strong>. Choose your mood or use
            the webcam detector, then get song suggestions instantly.
          </p>
          <div style={styles.moodButtons}>
            {moodOptions.map((item) => (
              <button
                key={item.value}
                style={
                  selectedMood === item.value
                    ? { ...styles.moodButton, ...styles.moodButtonActive }
                    : styles.moodButton
                }
                type="button"
                onClick={() => setSelectedMood(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onMoodSubmit(selectedMood)}
            style={styles.submitButton}
          >
            Save mood entry
          </button>

          <div style={styles.statusBox}>
            <strong>Last recorded mood:</strong>
            <div style={styles.statusValue}>
              {latestMood === "none" ? "No mood recorded yet" : latestMood}
            </div>
          </div>
        </div>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Suggested Songs</h2>
          <p style={{  ...styles.cardText }}>
            Based on your latest mood, listen to one of these tracks.
          </p>
          <ul style={styles.songList}>
            {suggestions.map((song) => (
              <li key={song} style={styles.songItem}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{song}</span>
                  <button
                    type="button"
                    style={styles.playButton}
                    onClick={() => handlePlaySuggestion(song)}
                  >
                    Play
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section style={styles.card}>
        <div style={styles.detectorHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Detect mood with webcam</h2>
            <p style={styles.cardText}>
              Use the webcam detector to automatically guess your mood and save it.
            </p>
            {detectedMood && (
              <p style={styles.detectedText}>
                Latest detection: <strong>{detectedMood}</strong>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowDetector((open) => !open)}
            style={styles.submitButton}
          >
            {showDetector ? "Hide detector" : "Open detector"}
          </button>
        </div>

        {showDetector && (
          <div style={styles.detectorPanel}>
            <FaceExpression
              onMoodDetected={handleDetectedMood}
              onClose={() => setShowDetector(false)}
            />
            <button
              type="button"
              onClick={handleSubmitDetectedMood}
              style={{ ...styles.submitButton, width: "100%", marginTop: 18 }}
            >
              Save detected mood
            </button>
          </div>
        )}
      </section>

      <section style={styles.historyCard}>
        <div style={styles.historyHeader}>
          <h2 style={styles.sectionTitle}>Mood History (last 7 days)</h2>
          <p style={styles.cardText}>
            Track your mood over the last seven entries and keep a healthy routine.
          </p>
        </div>

        {history.length === 0 ? (
          <p style={styles.emptyText}>No history yet. Save a mood above to begin.</p>
        ) : (
          <div style={styles.historyTable}>
            <div style={styles.historyRowHeader}>
              <div style={styles.historyCell}>Date</div>
              <div style={styles.historyCell}>Mood</div>
            </div>
            {history
              .slice()
              .reverse()
              .map((entry) => (
                <div key={entry.date} style={styles.historyRow}>
                  <div style={styles.historyCell}>{entry.date}</div>
                  <div style={styles.historyCell}>{entry.mood}</div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "linear-gradient(180deg, #060916 0%, #101a30 100%)",
    color: "white",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  heading: {
    margin: 0,
    fontSize: 34,
    color: "#eef2ff",
  },
  description: {
    margin: "8px 0 0",
    padding:" 0 0 15px",
    color: "#cbd5e1",
    maxWidth: 600,
  },
  logoutButton: {
    padding: "12px 18px",
    borderRadius: 16,
    border: "1px solid rgba(124,58,237,0.22)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    cursor: "pointer",
  },
  connectButton: {
    padding: "10px 14px",
    borderRadius: 16,
    border: "1px solid rgba(124,58,237,0.22)",
    background: "linear-gradient(135deg, #7c3aed, #0ea5e9)",
    color: "white",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
  },
  card: {
    padding: 28,
    borderRadius: 28,
    background: "rgba(15,23,42,0.92)",
    border: "1px solid rgba(124,58,237,0.14)",
    boxShadow: "0 28px 70px rgba(3, 12, 34, 0.28)",
  },
  sectionTitle: {
    margin: 0,
    marginBottom: 14,
    fontSize: 22,
    color: "#f8fafc",
  },
  moodButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 20,
  },
  moodButton: {
    padding: "14px 12px",
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    cursor: "pointer",
  },
  moodButtonActive: {
    background: "linear-gradient(135deg, #7c3aed, #0ea5e9)",
    borderColor: "transparent",
    boxShadow: "0 10px 30px rgba(56, 189, 248, 0.2)",
  },
  submitButton: {
    marginTop: 4,
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #0ea5e9, #34d399)",
    color: "white",
    cursor: "pointer",
    fontSize: 16,
    boxShadow: "0 18px 46px rgba(16, 185, 129, 0.22)",
  },
  statusBox: {
    marginTop: 24,
    padding: "18px 16px",
    borderRadius: 20,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(124,58,237,0.12)",
  },
  statusValue: {
    marginTop: 8,
    fontSize: 20,
    color: "#e2e8f0",
  },
  cardText: {
    margin: "0 0 16px",
    
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  songList: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "grid",
    gap: 10,
  },
  songItem: {
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(124,58,237,0.12)",
  },
  playButton: {
    padding: "8px 12px",
    borderRadius: 12,
    border: "none",
    background: "rgba(124,58,237,0.9)",
    color: "white",
    cursor: "pointer",
    marginLeft: 12,
  },
  detectorHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  detectedText: {
    color: "#a5b4fc",
    marginTop: 8,
  },
  detectorPanel: {
    marginTop: 20,
    display: "grid",
    gap: 18,
  },
  historyCard: {
    marginTop: 24,
    padding: 24,
    borderRadius: 28,
    background: "rgba(15,23,42,0.92)",
    border: "1px solid rgba(124,58,237,0.14)",
    boxShadow: "0 24px 70px rgba(3, 12, 34, 0.24)",
  },
  historyHeader: {
    marginBottom: 18,
  },
  emptyText: {
    color: "#94a3b8",
    margin: 0,
  },
  historyTable: {
    display: "grid",
    gap: 10,
  },
  historyRowHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    fontWeight: 600,
    color: "#f8fafc",
  },
  historyRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
  },
  historyCell: {
    color: "#e2e8f0",
    minWidth: 0,
    overflowWrap: "break-word",
  },
};
