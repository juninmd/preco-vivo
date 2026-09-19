import { BarcodeDetector, prepareZXingModule } from "barcode-detector/ponyfill";
import { useEffect, useRef, useState } from "react";
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

prepareZXingModule({
  overrides: { locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? wasmUrl : prefix + path) },
});

type Props = { onResult: (text: string) => void };

export function QrScanner({ onResult }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    const detector = new BarcodeDetector({ formats: ["qr_code"] });

    const tick = async () => {
      const video = videoRef.current;
      if (stopped || !video) return;
      try {
        if (video.readyState >= 2) {
          const [code] = await detector.detect(video);
          if (code?.rawValue && !stopped) {
            onResultRef.current(code.rawValue);
            return;
          }
        }
      } catch (e) {
        setError(`Falha ao ler QR: ${(e as Error).message}`);
        return;
      }
      timer = window.setTimeout(tick, 250);
    };

    const stopTracks = (s: MediaStream | null) => {
      for (const t of s?.getTracks() ?? []) t.stop();
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("navegador sem acesso à câmera");
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      const video = videoRef.current;
      if (stopped || !video) return stopTracks(s);
      stream = s;
      video.srcObject = s;
      await video.play();
      await tick();
    };
    start().catch((e: Error) => setError(`Câmera indisponível: ${e.message}. Cole a URL abaixo.`));

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stopTracks(stream);
    };
  }, []);

  return (
    <div className="scanner">
      <video ref={videoRef} muted playsInline aria-label="Câmera apontada para o QR code da nota" />
      <div className="scanner-frame" aria-hidden="true" />
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
