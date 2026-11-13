import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, X } from "lucide-react";
import { BrowserCodeReader, BrowserMultiFormatReader } from "@zxing/browser";

function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const onDetectedRef = useRef(onDetected);
  const [error, setError] = useState("");

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let stopped = false;
    let detected = false;
    let controls;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Camera access requires HTTPS or localhost in a supported browser.",
        );
        return;
      }

      try {
        const devices = await BrowserCodeReader.listVideoInputDevices();
        if (stopped) return;

        const preferredCamera = devices.find((device) =>
          /back|rear|environment/i.test(device.label),
        );
        const reader = new BrowserMultiFormatReader();
        controls = await reader.decodeFromVideoDevice(
          preferredCamera?.deviceId,
          videoRef.current,
          (result) => {
            if (stopped || detected || !result) return;
            detected = true;
            controls?.stop();
            onDetectedRef.current(result.getText());
          },
        );
        if (stopped) controls.stop();
      } catch (cameraError) {
        if (!stopped) {
          setError(
            cameraError.name === "NotAllowedError"
              ? "Camera permission was denied. Allow camera access or use a USB/Bluetooth scanner."
              : cameraError.name === "NotFoundError"
                ? "No camera was found. Connect a camera or use a USB/Bluetooth scanner."
                : `Unable to open the camera: ${cameraError.message}`,
          );
        }
      }
    }

    startCamera();
    return () => {
      stopped = true;
      controls?.stop();
    };
  }, []);

  return (
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
            <p>Point your camera at a product barcode.</p>
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
              <span className="camera-scan-frame" />
              <span className="camera-status">
                <Camera size={14} /> Scanning for a barcode...
              </span>
            </>
          )}
        </div>
        <div className="dialog-footer">
          <button type="button" className="outline-btn" onClick={onClose}>
            Close scanner
          </button>
        </div>
      </section>
    </div>
  );
}

export default BarcodeScanner;
