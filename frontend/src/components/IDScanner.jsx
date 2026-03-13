import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

export default function IDScanner({ onClose, onSuccess }) {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualRoll, setManualRoll] = useState('');

  // Configure barcode reader with hints (no setHints method needed)
  const getCodeReader = () => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.ITF,
      BarcodeFormat.PDF_417,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.AZTEC,
      BarcodeFormat.CODABAR,
      BarcodeFormat.CODE_93,
      BarcodeFormat.MAXICODE,
      BarcodeFormat.RSS_14,
      BarcodeFormat.RSS_EXPANDED,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
    // Pass hints directly to constructor
    return new BrowserMultiFormatReader(hints);
  };

  const decodeFromDataUrl = async (dataUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        const codeReader = getCodeReader();
        try {
          const result = await codeReader.decodeFromImageElement(img);
          resolve(result.getText());
        } catch (err) {
          console.error('Barcode decoding error:', err);
          reject(err);
        } finally {
          codeReader.reset();
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  };

  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rollNo = await decodeFromDataUrl(e.target.result);
        onSuccess(rollNo);
      } catch (err) {
        console.error('File decode error:', err);
        setError('Could not read barcode from the image. Please try another image or use manual entry.');
      }
    };
    reader.readAsDataURL(file);
  };

  const captureAndScan = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError('Could not capture image. Please try again.');
      return;
    }

    try {
      const rollNo = await decodeFromDataUrl(imageSrc);
      onSuccess(rollNo);
    } catch (err) {
      console.error('Camera capture decode error:', err);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setError('Barcode scan failed 3 times. You can upload an image or enter your roll number manually.');
        setShowUpload(true);
      } else {
        setError(`Could not read barcode. Please ensure it is well-lit and centered. (Attempt ${newAttempts}/3)`);
      }
    }
  }, [attempts, onSuccess]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) processFile(file);
  };

  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          await processFile(blob);
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    if (showUpload) {
      window.addEventListener('paste', handlePaste);
      return () => window.removeEventListener('paste', handlePaste);
    }
  }, [showUpload, handlePaste]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  const retryScan = () => {
    setError('');
    setShowUpload(false);
    setShowManual(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualRoll.trim()) {
      onSuccess(manualRoll.trim());
    } else {
      setError('Please enter a valid roll number.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Scan Your ID Card</h3>

        {!showUpload ? (
          // Camera view
          <>
            <div className="relative mb-4">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full rounded"
                videoConstraints={{
                  facingMode: 'environment',
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                }}
              />
              <p className="text-white/50 text-xs mt-1 text-center">
                Position the barcode in the center, well-lit, and steady
              </p>
            </div>
            {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30"
              >
                Cancel
              </button>
              <button
                onClick={captureAndScan}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Capture & Scan
              </button>
            </div>
            {attempts > 0 && (
              <button
                onClick={retryScan}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Try scanning again
              </button>
            )}
            <button
              onClick={() => setShowUpload(true)}
              className="mt-2 text-sm text-gray-400 hover:text-gray-300 block text-center w-full"
            >
              Having trouble? Upload an image of your ID
            </button>
          </>
        ) : (
          // Upload / Manual view
          <div>
            {!showManual ? (
              <>
                <p className="text-white/80 mb-4 text-center">
                  Drag & drop an image, click to select, or paste (Ctrl+V)
                </p>
                <div
                  ref={dropZoneRef}
                  onClick={() => fileInputRef.current.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-purple-400 bg-purple-500/20'
                      : 'border-white/30 hover:border-white/50'
                  }`}
                >
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-white/70">
                    {isDragging ? 'Drop here' : 'Click or drag to upload'}
                  </p>
                  <p className="text-white/50 text-sm mt-2">Supports: JPG, PNG, GIF</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                <div className="flex justify-center space-x-4 mt-4">
                  <button
                    onClick={() => setShowUpload(false)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Back to Camera
                  </button>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowManual(true)}
                    className="text-sm text-gray-400 hover:text-gray-300"
                  >
                    Or enter roll number manually
                  </button>
                </div>
              </>
            ) : (
              // Manual entry
              <form onSubmit={handleManualSubmit}>
                <p className="text-white/80 mb-2">Enter your roll number:</p>
                <input
                  type="text"
                  value={manualRoll}
                  onChange={(e) => setManualRoll(e.target.value)}
                  placeholder="e.g., 24285A0501"
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 mb-4"
                  autoFocus
                />
                {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowManual(false)}
                    className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}