import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Keyboard, X } from "lucide-react";
import { HTMLCanvasElementLuminanceSource } from "@zxing/browser";
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  GlobalHistogramBinarizer,
  HybridBinarizer,
  MultiFormatOneDReader,
  QRCodeReader,
} from "@zxing/library";

const FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
];
const NATIVE_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
  "qr_code",
];

// The scan frame covers the middle of the picture. Webcams are blurry and
// low-contrast, so each attempt reads a cropped, enlarged, high-contrast copy
// and alternates between two binarizers (one suits blurry 1D barcodes best).
const CENTER = { x: 0.08, y: 0.18, w: 0.84, h: 0.64 };
const FULL = { x: 0, y: 0, w: 1, h: 1 };
const STRATEGIES = [
  { region: CENTER, width: 1100, filter: "grayscale(1) contrast(1.6)", binarizer: GlobalHistogramBinarizer },
  { region: CENTER, width: 1100, filter: "grayscale(1) contrast(1.6)", binarizer: HybridBinarizer },
  { region: CENTER, width: 1700, filter: "grayscale(1) contrast(2) brightness(1.05)", binarizer: GlobalHistogramBinarizer },
  { region: FULL, width: 1280, filter: "grayscale(1) contrast(1.3)", binarizer: HybridBinarizer },
];

// The 1D and QR readers are called directly: going through
// MultiFormatReader logs a console warning on every failed frame.
function createReader() {
  const hints = new Map([
    [DecodeHintType.POSSIBLE_FORMATS, FORMATS],
    [DecodeHintType.TRY_HARDER, true],
  ]);
  return { hints, oneD: new MultiFormatOneDReader(hints), qr: new QRCodeReader() };
}

function drawRegion(video, canvas, { region, width, filter }) {
  const sourceWidth = video.videoWidth * region.w;
  const sourceHeight = video.videoHeight * region.h;
  const scale = width / sourceWidth;
  canvas.width = Math.round(sourceWidth * scale);
  canvas.height = Math.round(sourceHeight * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.filter = filter;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    video,
    video.videoWidth * region.x,
    video.videoHeight * region.y,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  context.filter = "none";
}

function decodeCanvas(reader, canvas, Binarizer, withQr) {
  const bitmap = new BinaryBitmap(
    new Binarizer(new HTMLCanvasElementLuminanceSource(canvas)),
  );
  try {
    return reader.oneD.decode(bitmap, reader.hints).getText();
  } catch {
    // no 1D barcode in this frame
  } finally {
    reader.oneD.reset();
  }
  if (!withQr) return null;
  try {
    return reader.qr.decode(bitmap, reader.hints).getText();
  } catch {
    return null;
  } finally {
    reader.qr.reset();
  }
}

async function openCamera() {
  const attempts = [
    {
      facingMode: { ideal: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    { facingMode: { ideal: "environment" } },
    true,
  ];
  let lastError;
  for (const video of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: false, video });
    } catch (error) {
      lastError = error;
      if (error.name === "NotAllowedError" || error.name === "NotFoundError") break;
    }
  }
  throw lastError;
}

function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const onDetectedRef = useRef(onDetected);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [resolution, setResolution] = useState("");

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let stopped = false;
    let stream;
    let timer;
    const canvas = document.createElement("canvas");
    const reader = createReader();
    let nativeDetector = null;

    const finish = (code) => {
      if (stopped || !code) return;
      stopped = true;
      navigator.vibrate?.(60);
      stream?.getTracks().forEach((track) => track.stop());
      onDetectedRef.current(code.trim());
    };

    async function setupNativeDetector() {
      if (!("BarcodeDetector" in window)) return;
      try {
        const supported = await window.BarcodeDetector.getSupportedFormats();
        const formats = NATIVE_FORMATS.filter((format) => supported.includes(format));
        if (formats.length) nativeDetector = new window.BarcodeDetector({ formats });
      } catch {
        nativeDetector = null;
      }
    }

    async function tick(attempt) {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth) {
        if (nativeDetector) {
          try {
            const [found] = await nativeDetector.detect(video);
            if (found?.rawValue) return finish(found.rawValue);
          } catch {
            nativeDetector = null;
          }
        }
        const strategy = STRATEGIES[attempt % STRATEGIES.length];
        drawRegion(video, canvas, strategy);
        const code = decodeCanvas(
          reader,
          canvas,
          strategy.binarizer,
          strategy.binarizer === HybridBinarizer,
        );
        if (code) return finish(code);
      }
      timer = window.setTimeout(() => tick(attempt + 1), 60);
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access requires HTTPS or localhost in a supported browser.");
        return;
      }
      try {
        stream = await openCamera();
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const [track] = stream.getVideoTracks();
        const capabilities = track.getCapabilities?.() || {};
        const advanced = {};
        if (capabilities.focusMode?.includes("continuous")) advanced.focusMode = "continuous";
        // A little optical/digital zoom puts more pixels on each bar.
        if (capabilities.zoom?.max > 1) {
          advanced.zoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min || 1, 2));
        }
        if (Object.keys(advanced).length) {
          await track.applyConstraints({ advanced: [advanced] }).catch(() => {});
        }
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play().catch(() => {});
        if (video.videoWidth) setResolution(`${video.videoWidth}×${video.videoHeight}`);
        await setupNativeDetector();
        tick(0);
      } catch (cameraError) {
        if (stopped) return;
        setError(
          cameraError.name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access, or type the barcode number below."
            : cameraError.name === "NotFoundError"
              ? "No camera was found. Type the barcode number below, or use a USB/Bluetooth scanner."
              : cameraError.name === "NotReadableError"
                ? "The camera is being used by another app. Close it and try again."
                : `Unable to open the camera: ${cameraError.message}`,
        );
      }
    }

    start();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const submitManual = (event) => {
    event.preventDefault();
    const code = manualCode.trim();
    if (code) onDetectedRef.current(code);
  };

  return createPortal(
    <div className="dialog-overlay barcode-overlay" onMouseDown={onClose}>
      <section
        className="dialog-card barcode-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Scan product barcode with camera"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <h2>Scan barcode with camera</h2>
            <p>Fill the frame with the barcode and hold it still until it reads.</p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close camera scanner"
          >
            <X size={18} />
          </button>
        </div>
        <div className="camera-preview">
          {error ? (
            <div className="camera-error">
              <CameraOff size={25} />
              <p>{error}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} muted playsInline />
              <span className="camera-scan-frame">
                <i className="camera-scan-line" />
              </span>
              <span className="camera-status">
                <Camera size={14} /> Scanning for a barcode...
                {resolution && <em>{resolution}</em>}
              </span>
            </>
          )}
        </div>
        <form className="barcode-manual" onSubmit={submitManual}>
          <label htmlFor="barcode-manual-input">
            <Keyboard size={15} /> Can't scan? Type the number under the barcode
          </label>
          <div>
            <input
              id="barcode-manual-input"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 7643022210366"
            />
            <button type="submit" className="primary-btn" disabled={!manualCode.trim()}>
              Use code
            </button>
          </div>
        </form>
        <div className="dialog-footer">
          <button type="button" className="outline-btn" onClick={onClose}>
            Close scanner
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default BarcodeScanner;
