import React, { useEffect, useRef, useState } from 'react';
import { createPoseLandmarker, calculateMetrics } from '../utils/mediapipe-loader';

interface LocalPosturalAnalysisProps {
  onResultsReady?: (results: string) => void;
  patientName?: string;
}

interface PosturalMetrics {
  posture: {
    trunkAngle: string;
    alignment: string;
  } | null;
  joints: {
    leftElbow: string;
    rightElbow: string;
    leftKnee: string;
    rightKnee: string;
  } | null;
  symmetry: {
    shoulders: string;
    shoulderDiff: string;
    hips: string;
    hipDiff: string;
  } | null;
}

export const LocalPosturalAnalysis: React.FC<LocalPosturalAnalysisProps> = ({
  onResultsReady,
  patientName = 'Paciente',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>('Inicializando...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [metrics, setMetrics] = useState<PosturalMetrics | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const poseLandmarkerRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera and MediaPipe
  useEffect(() => {
    let isMounted = true;

    const initializeAnalysis = async () => {
      try {
        setStatus('Accediendo a cámara...');

        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus('Cargando modelo de análisis...');

        // Initialize MediaPipe PoseLandmarker
        const poseLandmarker = await createPoseLandmarker();

        if (!isMounted) {
          poseLandmarker.close();
          return;
        }

        poseLandmarkerRef.current = poseLandmarker;

        setStatus('Analizando postura...');
        setIsProcessing(true);

        // Start pose detection loop
        startPoseDetection();
      } catch (error) {
        console.error('[Local Postural Analysis] Initialization error:', error);
        setStatus('Error: No se pudo acceder a la cámara');
      }
    };

    initializeAnalysis();

    // Cleanup
    return () => {
      isMounted = false;
      cleanup();
    };
  }, []);

  const startPoseDetection = () => {
    if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    let lastProcessTime = 0;
    const processingInterval = 1000 / 15; // 15 FPS

    const detectPose = () => {
      const now = performance.now();

      if (now - lastProcessTime < processingInterval) {
        animationFrameRef.current = requestAnimationFrame(detectPose);
        return;
      }

      lastProcessTime = now;

      if (video.readyState >= 2) {
        try {
          // Detect pose
          const result = poseLandmarkerRef.current.detectForVideo(video, now);

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw video frame (mirrored for natural view)
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();

          // Draw landmarks if detected
          if (result.landmarks && result.landmarks.length > 0) {
            const landmarks = result.landmarks[0];

            // Mirror landmarks for correct display
            const mirroredLandmarks = landmarks.map((lm: any) => ({
              ...lm,
              x: 1 - lm.x,
            }));

            // Draw skeleton
            drawSkeleton(ctx, mirroredLandmarks, canvas.width, canvas.height);

            // Calculate metrics
            const calculatedMetrics = calculateMetrics(landmarks);
            setMetrics(calculatedMetrics);
          }
        } catch (error) {
          console.error('[Local Postural Analysis] Detection error:', error);
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectPose);
    };

    detectPose();
  };

  const drawSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number
  ) => {
    // Draw connections
    const connections = [
      [11, 12], // Shoulders
      [11, 13], // Left arm
      [13, 15], // Left forearm
      [12, 14], // Right arm
      [14, 16], // Right forearm
      [11, 23], // Left torso
      [12, 24], // Right torso
      [23, 24], // Hips
      [23, 25], // Left thigh
      [25, 27], // Left shin
      [24, 26], // Right thigh
      [26, 28], // Right shin
      // Head connections
      [0, 1], [1, 2], [2, 3], [3, 7], // Left eye
      [0, 4], [4, 5], [5, 6], [6, 8], // Right eye
      [9, 10], // Mouth
    ];

    // Draw connection lines
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      if (startPoint && endPoint) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x * width, startPoint.y * height);
        ctx.lineTo(endPoint.x * width, endPoint.y * height);
        ctx.stroke();
      }
    });

    // Draw landmarks
    ctx.fillStyle = '#ff0000';
    landmarks.forEach((landmark, index) => {
      // Different sizes for different body parts
      const size = index < 11 ? 3 : 5; // Smaller for face, larger for body
      ctx.beginPath();
      ctx.arc(landmark.x * width, landmark.y * height, size, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const takeSnapshot = () => {
    if (canvasRef.current && metrics) {
      // Get current canvas image
      const imageData = canvasRef.current.toDataURL('image/png');
      setSnapshot(imageData);

      // Generate report text
      const timestamp = new Date().toLocaleString('es-CO');
      const report = generateReport(timestamp);

      // Call callback with results
      if (onResultsReady) {
        onResultsReady(report);
      }
    }
  };

  const generateReport = (timestamp: string): string => {
    if (!metrics) return '';

    let report = `\n=== ANÁLISIS OSTEOMUSCULAR ===\n`;
    report += `Fecha: ${timestamp}\n`;
    report += `Paciente: ${patientName}\n\n`;

    if (metrics.posture) {
      report += `POSTURA:\n`;
      report += `- Ángulo del tronco: ${metrics.posture.trunkAngle}°\n`;
      report += `- Alineación: ${metrics.posture.alignment}\n\n`;
    }

    if (metrics.joints) {
      report += `ARTICULACIONES:\n`;
      report += `- Codo izquierdo: ${metrics.joints.leftElbow}°\n`;
      report += `- Codo derecho: ${metrics.joints.rightElbow}°\n`;
      report += `- Rodilla izquierda: ${metrics.joints.leftKnee}°\n`;
      report += `- Rodilla derecha: ${metrics.joints.rightKnee}°\n\n`;
    }

    if (metrics.symmetry) {
      report += `SIMETRÍA:\n`;
      report += `- Hombros: ${metrics.symmetry.shoulders} (diff: ${metrics.symmetry.shoulderDiff}%)\n`;
      report += `- Caderas: ${metrics.symmetry.hips} (diff: ${metrics.symmetry.hipDiff}%)\n`;
    }

    report += `\n=== FIN DEL ANÁLISIS ===\n`;

    return report;
  };

  const cleanup = () => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close pose landmarker
    if (poseLandmarkerRef.current) {
      poseLandmarkerRef.current.close();
    }

    setIsProcessing(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b141a]">
      {/* Header */}
      <div className="p-4 bg-[#1f2c34] border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">Análisis Osteomuscular</h3>
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400">{status}</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-yellow-400">{status}</span>
                </>
              )}
            </div>
          </div>

          {/* Botón de captura */}
          <button
            onClick={takeSnapshot}
            disabled={!isProcessing || !metrics}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Capturar y Guardar
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video/Canvas área */}
        <div className="flex-1 relative bg-black">
          <video
            ref={videoRef}
            className="hidden"
            playsInline
            muted
            autoPlay
          />
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
          />

          {/* Overlay con instrucciones */}
          {!isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-white text-lg">{status}</p>
              </div>
            </div>
          )}
        </div>

        {/* Panel de métricas */}
        <div className="w-80 bg-[#1f2c34] border-l border-gray-700 overflow-y-auto p-4">
          <h4 className="text-white font-semibold mb-4">Métricas en Tiempo Real</h4>

          {metrics ? (
            <div className="space-y-4">
              {/* Postura */}
              {metrics.posture && (
                <div className="bg-[#2a3942] rounded-lg p-3">
                  <h5 className="text-purple-400 text-sm font-semibold mb-2">Postura</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ángulo tronco:</span>
                      <span className="text-white">{metrics.posture.trunkAngle}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Alineación:</span>
                      <span className={metrics.posture.alignment === 'Buena' ? 'text-green-400' : 'text-yellow-400'}>
                        {metrics.posture.alignment}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Articulaciones */}
              {metrics.joints && (
                <div className="bg-[#2a3942] rounded-lg p-3">
                  <h5 className="text-purple-400 text-sm font-semibold mb-2">Articulaciones</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Codo izq:</span>
                      <span className="text-white">{metrics.joints.leftElbow}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Codo der:</span>
                      <span className="text-white">{metrics.joints.rightElbow}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rodilla izq:</span>
                      <span className="text-white">{metrics.joints.leftKnee}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rodilla der:</span>
                      <span className="text-white">{metrics.joints.rightKnee}°</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Simetría */}
              {metrics.symmetry && (
                <div className="bg-[#2a3942] rounded-lg p-3">
                  <h5 className="text-purple-400 text-sm font-semibold mb-2">Simetría</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hombros:</span>
                      <span className={metrics.symmetry.shoulders === 'Simétrico' ? 'text-green-400' : 'text-yellow-400'}>
                        {metrics.symmetry.shoulders}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Diferencia:</span>
                      <span className="text-gray-400">{metrics.symmetry.shoulderDiff}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Caderas:</span>
                      <span className={metrics.symmetry.hips === 'Simétrico' ? 'text-green-400' : 'text-yellow-400'}>
                        {metrics.symmetry.hips}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Diferencia:</span>
                      <span className="text-gray-400">{metrics.symmetry.hipDiff}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">
                Las métricas aparecerán cuando se detecte a una persona en cámara
              </p>
            </div>
          )}

          {/* Snapshot preview */}
          {snapshot && (
            <div className="mt-4">
              <h5 className="text-white text-sm font-semibold mb-2">Última Captura</h5>
              <div className="bg-[#2a3942] rounded-lg p-2">
                <img src={snapshot} alt="Snapshot" className="w-full rounded" />
                <p className="text-green-400 text-xs mt-2 text-center">
                  Resultados guardados en el historial
                </p>
              </div>
            </div>
          )}

          {/* Instrucciones */}
          <div className="mt-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <p className="text-purple-300 text-xs">
              <strong>Instrucciones:</strong><br />
              1. Posicione al paciente frente a la cámara<br />
              2. Asegúrese de que el cuerpo completo sea visible<br />
              3. Haga clic en "Capturar" para guardar el análisis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
