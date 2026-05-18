import { useEffect, useRef, useState } from "react";
import { detectExpression, init } from "../utils/utils";

function mapExpressionToMood(expression) {
  if (expression.includes("Smiling")) return "happy";
  if (expression.includes("Sad")) return "sad";
  if (expression.includes("Surprised")) return "neutral";
  if (expression.includes("Eyes Closed")) return "relaxed";
  return "neutral";
}

export default function FaceExpression({ onMoodDetected, onClose }) {
  const videoRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  const [expression, setExpression] = useState("Waiting for camera...");
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState("Initializing camera...");
  const [detectedMood, setDetectedMood] = useState("neutral");
  const [error, setError] = useState("");

  // setup camera + mediapipe
  useEffect(() => {
    async function start() {
      try {
        await init({
          stream: streamRef,
          videoRef,
          faceLandmarkerRef,
          setIsReady,
        });
        setStatus("Camera ready. Detecting expression...");
      } catch (err) {
        console.error(err);
        setError("Unable to access camera or load the model.");
        setStatus("Detection failed");
      }
    }

    start();

    // cleanup
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);


  // detection loop
  useEffect(() => {
    if (!isReady) return;

    const video = videoRef.current;
    const landmarker = faceLandmarkerRef.current;

    const detect = () => {
      const now = performance.now();
      const result = landmarker.detectForVideo(video, now);

      if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
        const blendshapes = result.faceBlendshapes[0].categories;
        const expr = detectExpression(blendshapes);
        const mood = mapExpressionToMood(expr);

        setExpression(expr);
        setDetectedMood(mood);
        if (onMoodDetected) {
          onMoodDetected(mood, expr);
        }
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isReady, onMoodDetected]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <div style={styles.badge}>Webcam mood detector</div>
          <h2 style={styles.title}>Detected: {expression}</h2>
          <p style={styles.subtitle}>
            Mood guess: <strong>{detectedMood}</strong>
          </p>
          <div style={styles.meta}>
            <span>{status}</span>
            {error && <span style={styles.error}>{error}</span>}
          </div>
        </div>

        {onClose && (
          <button type="button" onClick={onClose} style={styles.closeButton}>
            Close
          </button>
        )}
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={styles.video}
      />
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gap: 16,
    padding: 20,
    borderRadius: 24,
    background: "rgba(15, 23, 42, 0.96)",
    border: "1px solid rgba(124, 58, 237, 0.18)",
    boxShadow: "0 28px 80px rgba(3, 12, 34, 0.28)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(124, 58, 237, 0.18)",
    color: "#d8b4fe",
    fontSize: 13,
    marginBottom: 8,
  },
  title: {
    margin: 0,
    fontSize: 20,
    color: "#eef2ff",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#cbd5e1",
  },
  meta: {
    marginTop: 10,
    color: "#94a3b8",
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  error: {
    color: "#fecaca",
  },
  closeButton: {
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    cursor: "pointer",
  },
  video: {
    width: "100%",
    maxWidth: 640,
    height: 360,
    borderRadius: 22,
    border: "1px solid rgba(124, 58, 237, 0.22)",
    background: "#0b1224",
    objectFit: "cover",
  },
};