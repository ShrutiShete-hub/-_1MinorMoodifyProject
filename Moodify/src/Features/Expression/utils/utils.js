//  import { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

 export async function init({stream,videoRef,faceLandmarkerRef,setIsReady}) {
      // 1. Setup webcam
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      videoRef.current.srcObject = stream.current;

      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          resolve();
        };
      });

      // 2. Load MediaPipe model
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

      faceLandmarkerRef.current =
        await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
        });

      setIsReady(true);
    }
    
  function getScore(blendshapes, name) {
    return (
      blendshapes.find((b) => b.categoryName === name)
        ?.score || 0
    );
  }

  export function detectExpression(blendshapes) {
    const smile =
      getScore(blendshapes, "mouthSmileLeft") +
      getScore(blendshapes, "mouthSmileRight");

    const jawOpen = getScore(blendshapes, "jawOpen");

    const blink =
      getScore(blendshapes, "eyeBlinkLeft") +
      getScore(blendshapes, "eyeBlinkRight");
const browDown =
  getScore(blendshapes, "browDownLeft") +
  getScore(blendshapes, "browDownRight");

const frown =
  getScore(blendshapes, "mouthFrownLeft") +
  getScore(blendshapes, "mouthFrownRight");

const innerUp = getScore(blendshapes, "browInnerUp");

const smile1 =
  getScore(blendshapes, "mouthSmileLeft") +
  getScore(blendshapes, "mouthSmileRight");

// 🎯 SAD SCORE (weighted system)
const sadScore =
  (browDown * 0.4) +
  (frown * 0.3) +
  (innerUp * 0.2) -
  (smile1 * 0.6);




    if (sadScore > 0.04) return "😢 Sad";
    if (smile > 0.8) return "😀 Smiling";
    if (jawOpen > 0.6) return "😲 Surprised";
    if (blink > 1.2) return "😴 Eyes Closed";
    

    return "😐 Neutral";
  }