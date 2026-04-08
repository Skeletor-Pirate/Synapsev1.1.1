'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as mpHands from '@mediapipe/hands';
import * as mpCamera from '@mediapipe/camera_utils';
import * as mpDrawing from '@mediapipe/drawing_utils';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer2, Hand, Settings, Eye, EyeOff } from 'lucide-react';

type Results = mpHands.Results;

export default function GestureController() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const lastScrollY = useRef<number | null>(null);
  const lastClickTime = useRef<number>(0);

  // Initialize MediaPipe Hands
  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;

    const HandsClass = mpHands.Hands || (mpHands as any).default?.Hands || (window as any).Hands;
    const hands = new HandsClass({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results: Results) => {
      if (!canvasRef.current || !videoRef.current) return;

      const canvasCtx = canvasRef.current.getContext('2d');
      if (!canvasCtx) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Draw debug info if enabled
      if (showDebug) {
        canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            const drawConnectorsFn = mpDrawing.drawConnectors || (mpDrawing as any).default?.drawConnectors || (window as any).drawConnectors;
            const drawLandmarksFn = mpDrawing.drawLandmarks || (mpDrawing as any).default?.drawLandmarks || (window as any).drawLandmarks;
            const HAND_CONNECTIONS_VAL = mpHands.HAND_CONNECTIONS || (mpHands as any).default?.HAND_CONNECTIONS || (window as any).HAND_CONNECTIONS;
            
            drawConnectorsFn(canvasCtx, landmarks, HAND_CONNECTIONS_VAL, { color: '#00FF00', lineWidth: 5 });
            drawLandmarksFn(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
          }
        }
      }
      canvasCtx.restore();

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Index finger tip (8) for cursor
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        const middleTip = landmarks[12];

        // Map to screen coordinates (inverted X because webcam is mirrored)
        const screenX = (1 - indexTip.x) * window.innerWidth;
        const screenY = indexTip.y * window.innerHeight;
        
        setCursorPos({ x: screenX, y: screenY });

        // 1. Pinch Detection (Thumb + Index)
        const pinchDist = Math.sqrt(
          Math.pow(indexTip.x - thumbTip.x, 2) + 
          Math.pow(indexTip.y - thumbTip.y, 2)
        );

        if (pinchDist < 0.05) {
          if (!isPinching) {
            setIsPinching(true);
            triggerClick(screenX, screenY);
          }
        } else {
          setIsPinching(false);
        }

        // 2. Scroll Detection (Index + Middle close together)
        const scrollDist = Math.sqrt(
          Math.pow(indexTip.x - middleTip.x, 2) + 
          Math.pow(indexTip.y - middleTip.y, 2)
        );

        if (scrollDist < 0.05) {
          setIsScrolling(true);
          const currentY = indexTip.y;
          if (lastScrollY.current !== null) {
            const diff = (currentY - lastScrollY.current) * 1000;
            window.scrollBy(0, diff);
          }
          lastScrollY.current = currentY;
        } else {
          setIsScrolling(false);
          lastScrollY.current = null;
        }
      }
    });

    const CameraClass = mpCamera.Camera || (mpCamera as any).default?.Camera || (window as any).Camera;
    const camera = new CameraClass(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
      hands.close();
    };
  }, [isActive, showDebug, isPinching]);

  const triggerClick = (x: number, y: number) => {
    const now = Date.now();
    if (now - lastClickTime.current < 500) return; // Debounce
    lastClickTime.current = now;

    const element = document.elementFromPoint(x, y);
    if (element) {
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
      });
      element.dispatchEvent(clickEvent);
      
      // Also try focusing for inputs
      if (element instanceof HTMLElement) {
        element.focus();
      }
    }
  };

  return (
    <>
      {/* Control Panel */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-200 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium text-gray-700">Gesture Control Active</span>
                </div>
                <button 
                  onClick={() => setShowDebug(!showDebug)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                  title="Toggle Camera View"
                >
                  {showDebug ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {showDebug && (
                <div className="relative w-48 h-36 bg-black rounded-lg overflow-hidden border border-gray-300">
                  <video ref={videoRef} className="hidden" />
                  <canvas ref={canvasRef} className="w-full h-full object-cover mirror" width={640} height={480} />
                  <style jsx>{`
                    .mirror {
                      transform: scaleX(-1);
                    }
                  `}</style>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isPinching ? 'bg-blue-500' : 'bg-gray-200'}`} />
                  Pinch to Click
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isScrolling ? 'bg-purple-500' : 'bg-gray-200'}`} />
                  Mid+Index to Scroll
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsActive(!isActive)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 ${
            isActive 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isActive ? <Hand size={24} /> : <MousePointer2 size={24} />}
        </button>
      </div>

      {/* Virtual Cursor */}
      {isActive && (
        <motion.div
          animate={{
            x: cursorPos.x - 10,
            y: cursorPos.y - 10,
            scale: isPinching ? 0.8 : 1,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.5 }}
          className={`fixed top-0 left-0 w-5 h-5 rounded-full pointer-events-none z-[10000] border-2 shadow-lg flex items-center justify-center ${
            isPinching 
              ? 'bg-blue-500 border-white' 
              : isScrolling 
                ? 'bg-purple-500 border-white' 
                : 'bg-white/30 border-indigo-500 backdrop-blur-[2px]'
          }`}
        >
          {isScrolling && <div className="w-1 h-3 bg-white rounded-full animate-bounce" />}
        </motion.div>
      )}
    </>
  );
}
