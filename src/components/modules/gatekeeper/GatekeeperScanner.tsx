"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, Flashlight, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GatekeeperScannerProps {
  eventId: string;
  onScan: (payload: string) => void;
  onSwitchToManual: () => void;
  isProcessing: boolean;
}

export function GatekeeperScanner({ eventId, onScan, onSwitchToManual, isProcessing }: GatekeeperScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const lastScannedData = useRef<string | null>(null);
  const lastScannedTime = useRef<number>(0);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isMounted = true;

    async function setupCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasPermission(false);
        return;
      }

      try {
        if (activeStream) {
          activeStream.getTracks().forEach((track) => track.stop());
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
          audio: false,
        });

        if (!isMounted) {
          newStream.getTracks().forEach((t) => t.stop());
          return;
        }

        activeStream = newStream;
        setStream(newStream);
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera access error:", err);
        if (isMounted) setHasPermission(false);
      }
    }

    setupCamera();

    return () => {
      isMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    function tick() {
      if (!video || !canvas || !ctx) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA && !isProcessing) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx!.getImageData(0, 0, canvas!.width, canvas!.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          const now = Date.now();
          if (code.data === lastScannedData.current && now - lastScannedTime.current < 3000) {
            // Debounce
          } else {
            lastScannedData.current = code.data;
            lastScannedTime.current = now;
            onScan(code.data);
          }
        }
      }
      requestRef.current = requestAnimationFrame(tick);
    }

    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isProcessing, onScan]);

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
    
    // @ts-ignore
    if (capabilities.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn }]
        } as any);
        setTorchOn(!torchOn);
      } catch (err) {
        console.error("Error toggling torch:", err);
      }
    }
  };

  if (hasPermission === false) {
    return (
      <div className="p-8 text-center bg-bg-surface shadow-sm rounded-xl max-w-sm mx-auto space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <Camera className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-text-primary">Acesso à Câmera Negado</h3>
        <p className="text-sm text-text-muted">
          Por favor, permita o acesso à câmera nas configurações do navegador ou utilize a digitação manual.
        </p>
        <Button variant="primary" className="w-full" onClick={onSwitchToManual}>
          Usar Digitação Manual
        </Button>
      </div>
    );
  }

  return (
    <div className="relative max-w-md mx-auto aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-lg shadow-sm group">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewfinder Graphic overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 pointer-events-none">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl opacity-80" />
          <div className="w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl opacity-80" />
        </div>
        
        {!isProcessing && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center overflow-hidden">
             <div className="w-[80%] h-0.5 bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
          </div>
        )}

        <div className="flex justify-between items-end">
          <div className="w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl opacity-80" />
          <div className="w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-xl opacity-80" />
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-20">
        <Button
          variant="secondary"
          className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-black/50 backdrop-blur border-none hover:bg-black/70 text-white"
          onClick={() => setFacingMode(m => m === "environment" ? "user" : "environment")}
          title="Alternar Câmera"
        >
          <RefreshCcw className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          className={`rounded-full w-12 h-12 p-0 flex items-center justify-center backdrop-blur border-none hover:bg-black/70 ${torchOn ? 'bg-emerald-500 text-white' : 'bg-black/50 text-white'}`}
          onClick={toggleTorch}
          title="Lanterna"
        >
          <Flashlight className="w-5 h-5" />
        </Button>
      </div>

      {isProcessing && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
