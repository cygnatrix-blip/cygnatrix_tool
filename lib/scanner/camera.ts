'use client';

/**
 * Camera helpers for the live scanner preview. Falls back gracefully: rear
 * camera if available, `ImageCapture` for a full-resolution still where the
 * browser supports it (Chrome Android), otherwise a frame grabbed from the
 * `<video>` element (Safari / iOS).
 */

export interface CameraHandle {
  stream: MediaStream;
  track: MediaStreamTrack;
}

export function cameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    (typeof window === 'undefined' || window.isSecureContext)
  );
}

export async function startCamera(): Promise<CameraHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 3840 },
      height: { ideal: 2160 },
    },
    audio: false,
  });
  const track = stream.getVideoTracks()[0];
  if (!track) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('No camera track available.');
  }
  return { stream, track };
}

export function stopCamera(handle: CameraHandle | null): void {
  handle?.stream.getTracks().forEach((t) => t.stop());
}

export interface Frame {
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

/** Grab the highest-resolution still the platform allows. */
export async function grabFrame(video: HTMLVideoElement, handle: CameraHandle): Promise<Frame> {
  const w = window as unknown as { ImageCapture?: new (t: MediaStreamTrack) => ImageCaptureLike };
  if (typeof w.ImageCapture === 'function') {
    try {
      const capture = new w.ImageCapture(handle.track);
      const blob = await capture.takePhoto();
      const bitmap = await createImageBitmap(blob);
      return { bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      /* fall through to the video-frame path */
    }
  }
  const bitmap = await createImageBitmap(video);
  return { bitmap, width: bitmap.width, height: bitmap.height };
}

interface ImageCaptureLike {
  takePhoto(): Promise<Blob>;
}
