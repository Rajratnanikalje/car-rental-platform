import { useState, useRef } from "react";
import "./AdminImageUpload.css";

/**
 * Utility to compress and resize images client-side before storing as Base64.
 * Keeps file sizes lightweight (~100-250KB) while maintaining crisp HD quality.
 */
function compressImageFile(file, maxWidth = 1280, maxHeight = 1280, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      return reject(new Error("Please choose a valid image file (PNG, JPG, WEBP, GIF)."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image."));
      img.onload = () => {
        let { width, height } = img;

        if (file.type === "image/svg+xml") {
          return resolve(event.target.result);
        }

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // Preserve transparent PNG if under 400KB
        if (file.type === "image/png" && file.size < 400 * 1024) {
          return resolve(event.target.result);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === "image/webp" ? "image/webp" : "image/jpeg";
        const compressedBase64 = canvas.toDataURL(mimeType, quality);
        resolve(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminImageUpload({
  value = "",
  onChange,
  label = "Vehicle Photo / Image",
  helpText = "Upload directly from your device gallery (JPG, PNG, WEBP)",
  previewHeight = "170px",
}) {
  const fileInputRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = async (file) => {
    if (!file) return;
    try {
      setProcessing(true);
      setUploadError("");
      const base64Data = await compressImageFile(file);
      onChange(base64Data);
    } catch (err) {
      console.error("Image upload error:", err);
      setUploadError(err.message || "Failed to process image");
    } finally {
      setProcessing(false);
    }
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileChange(file);
  };

  const triggerGalleryPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = () => {
    onChange("");
    setUploadError("");
  };

  return (
    <div className="admin-img-upload-container">
      <div className="admin-img-upload-header">
        <label className="admin-img-upload-label">{label}</label>
        <button
          type="button"
          className="admin-img-toggle-url"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          {showUrlInput ? "📁 Use Gallery Upload" : "🔗 Or paste URL"}
        </button>
      </div>

      {/* Hidden file input for native device gallery / file explorer */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        style={{ display: "none" }}
        onChange={onFileInputChange}
      />

      {uploadError && (
        <div className="admin-img-error">
          ⚠️ {uploadError}
        </div>
      )}

      {/* When an image is selected/present: Show Preview Card */}
      {value ? (
        <div className="admin-img-preview-card">
          <div
            className="admin-img-preview-box"
            style={{ height: previewHeight }}
          >
            <img
              src={value}
              alt="Selected vehicle"
              className="admin-img-preview-thumb"
            />
            {processing && (
              <div className="admin-img-processing-overlay">
                <div className="admin-img-spinner" />
                <span>Processing photo...</span>
              </div>
            )}
          </div>

          <div className="admin-img-preview-actions">
            <div className="admin-img-badge-ready">
              <span className="dot">●</span> Photo Ready
            </div>
            <div className="admin-img-btn-group">
              <button
                type="button"
                className="admin-btn admin-btn-sm admin-btn-secondary"
                onClick={triggerGalleryPicker}
                disabled={processing}
              >
                🖼️ Change Photo
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-sm admin-btn-danger"
                onClick={handleRemove}
                disabled={processing}
              >
                🗑️ Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* When no image: Prominent Gallery Upload Dropzone */
        <div
          className={`admin-img-dropzone ${dragActive ? "drag-over" : ""} ${processing ? "processing" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerGalleryPicker}
        >
          {processing ? (
            <div className="admin-img-loading">
              <div className="admin-img-spinner" />
              <p>Optimizing and preparing photo...</p>
            </div>
          ) : (
            <div className="admin-img-dropzone-content">
              <div className="admin-img-dropzone-icon">🖼️</div>
              <div className="admin-img-dropzone-text">
                <strong>Click to Choose from Gallery</strong>
                <span>or drag & drop your vehicle photo here</span>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-primary admin-img-picker-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerGalleryPicker();
                }}
              >
                📁 Open Gallery
              </button>
              <div className="admin-img-dropzone-hint">{helpText}</div>
            </div>
          )}
        </div>
      )}

      {/* Optional fallback direct URL input if toggled */}
      {showUrlInput && (
        <div className="admin-img-url-box">
          <input
            type="url"
            placeholder="https://example.com/car-photo.jpg"
            value={value.startsWith("data:") ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            className="admin-img-url-input"
          />
          <span className="admin-img-url-tip">
            Direct web image link (supports https:// URLs)
          </span>
        </div>
      )}
    </div>
  );
}

