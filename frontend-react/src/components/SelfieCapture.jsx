import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

const SelfieCapture = ({ onCapture }) => {
  const webcamRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | streaming | captured
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState('');

  const handleStart = () => {
    setStatus('streaming');
    setError('');
  };

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const src = webcamRef.current.getScreenshot();
      if (src) {
        setImageSrc(src);
        setStatus('captured');
        onCapture(src); // Send to parent
      }
    }
  }, [webcamRef, onCapture]);

  const handleRetake = () => {
    setImageSrc(null);
    setStatus('streaming');
    onCapture(null);
  };

  const onUserMediaError = () => {
    setError('Camera access denied. Please allow camera permissions in your browser.');
    setStatus('idle');
  };

  return (
    <div id="selfieSection">
      {error && <div className="error-msg show" style={{ marginBottom: '10px' }}>{error}</div>}

      {status === 'streaming' && (
        <div className="camera-container" id="cameraBox">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            onUserMediaError={onUserMediaError}
            videoConstraints={{ facingMode: "user" }}
            style={{ width: '100%', borderRadius: '12px', display: 'block' }}
          />
        </div>
      )}

      {status === 'captured' && imageSrc && (
        <div id="selfiePreviewBox" style={{ textAlign: 'center' }}>
          <img src={imageSrc} id="selfiePreviewImg" className="selfie-preview" alt="Selfie" />
        </div>
      )}

      <div className="camera-controls">
        {status === 'idle' && (
          <button type="button" className="camera-btn camera-btn-capture" onClick={handleStart}>
            📷 Open Camera
          </button>
        )}
        {status === 'streaming' && (
          <button type="button" className="camera-btn camera-btn-capture" onClick={handleCapture}>
            📸 Capture
          </button>
        )}
        {status === 'captured' && (
          <button type="button" className="camera-btn camera-btn-retake" onClick={handleRetake}>
            🔄 Retake
          </button>
        )}
      </div>
    </div>
  );
};

export default SelfieCapture;
