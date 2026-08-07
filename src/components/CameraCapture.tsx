import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, RefreshCcw, Upload, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { toast } from "../lib/notifications";
import { motion, AnimatePresence } from "motion/react";
import { Capacitor } from "@capacitor/core";
import { Camera as NativeCamera, CameraResultType, CameraSource } from "@capacitor/camera";

export interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
  title?: string;
  assistantMode?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onClose,
  title = "Camera Capture",
  assistantMode,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
  }, [stream]);

  const startCamera = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await NativeCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });
        if (image.dataUrl) {
          onCapture(image.dataUrl);
        }
        onClose();
      } catch (e) {
        console.error("Native camera access denied or failed", e);
        setHasCamera(false);
      }
      return;
    }

    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      setStream(mediaStream);
      setHasCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (e) {
      console.error("Camera access denied or failed", e);
      setHasCamera(false);
      toast.show(
        "Camera access not available. You can upload AN image instead.",
        "info"
      );
    }
  }, [facingMode, stopCamera, onCapture, onClose]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setTimeout(() => startCamera(), 0);
    } else if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia !== 'undefined') {
      setTimeout(() => startCamera(), 0);
    } else {
      setTimeout(() => setHasCamera(false), 0);
    }
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth || 1080;
      canvas.height = videoRef.current.videoHeight || 1920;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        onCapture(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.show("Please select an image file", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onCapture(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10 pt-safe">
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="p-3 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 transition-colors border border-white/10 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center">
          <div className="px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2 shadow-lg">
            <div className={`w-2 h-2 rounded-full ${hasCamera ? 'bg-red-500 animate-pulse' : 'bg-primary'}`} />
            {title}
          </div>
          {assistantMode && (
            <div className="text-[9px] text-white/50 font-mono tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full border border-white/5">
              Mode: {assistantMode}
            </div>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 transition-colors border border-white/10 shadow-lg"
        >
          <Upload className="w-5 h-5" />
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {hasCamera ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="hidden"
            style={{ display: "none" }}
          />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
             </div>
          </div>
          
          <div className="absolute bottom-0 inset-x-0 pb-12 pt-24 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-center items-end gap-10 pb-safe">
            <button
              onClick={toggleCamera}
              className="p-4 bg-white/10 text-white rounded-full backdrop-blur-md hover:bg-white/20 transition-colors border border-white/10 mb-2"
            >
              <RefreshCcw className="w-6 h-6" />
            </button>

            <button
              onClick={handleCapture}
              className="w-20 h-20 bg-white/20 p-2 rounded-full backdrop-blur-md border border-white/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
               <div className="w-full h-full bg-white rounded-full shadow-inner"></div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-4 bg-white/10 text-white rounded-full backdrop-blur-md hover:bg-white/20 transition-colors border border-white/10 mb-2"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <Camera className="w-16 h-16 text-white/20 mb-6" />
          <h3 className="text-xl font-bold text-white mb-2 tracking-wide">Camera Unavailable</h3>
          <p className="text-white/50 mb-8 max-w-sm">
            We couldn't access your camera. You can still upload images from your files to use AR capabilities.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 bg-primary text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform"
          >
            <Upload className="w-5 h-5" />
            Upload Image
          </button>
        </div>
      )}
    </motion.div>
  );
};
