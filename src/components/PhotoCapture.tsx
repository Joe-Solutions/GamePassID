"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: Blob | null;
  previewUrl: string | null;
  onCapture: (blob: Blob, previewUrl: string) => void;
  onClear: () => void;
};

export function PhotoCapture({ value, previewUrl, onCapture, onClear }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setError("Camera access denied. Use file upload instead.");
      setCameraOn(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  async function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const size = Math.min(video.videoWidth, video.videoHeight) || 480;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    setFlash(true);
    setTimeout(() => setFlash(false), 420);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9),
    );
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    onCapture(blob, url);
    stopCamera();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    onCapture(file, url);
    stopCamera();
  }

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-square w-full max-w-[18rem] overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-black/40">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Player profile preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            muted
            playsInline
            className={`h-full w-full object-cover ${cameraOn ? "opacity-100" : "opacity-0"}`}
          />
        )}

        {!previewUrl && !cameraOn && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div>
              <p className="display text-xl font-semibold">Profile photo</p>
              <p className="mt-2 text-sm text-[var(--fg-muted)]">
                Start the camera or upload a clear face photo for the license.
              </p>
            </div>
          </div>
        )}

        {flash && (
          <div className="pointer-events-none absolute inset-0 bg-white shutter-flash" />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-wrap gap-2">
        {!value && !cameraOn && (
          <button type="button" className="btn btn-primary" onClick={startCamera}>
            Open camera
          </button>
        )}
        {cameraOn && (
          <>
            <button type="button" className="btn btn-primary" onClick={takePhoto}>
              Capture photo
            </button>
            <button type="button" className="btn btn-ghost" onClick={stopCamera}>
              Cancel camera
            </button>
          </>
        )}
        {value && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              onClear();
            }}
          >
            Retake / replace
          </button>
        )}
        <label className="btn btn-ghost cursor-pointer">
          Upload file
          <input
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={onFileChange}
          />
        </label>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
