import React, { useRef, useState } from 'react';

const AadhaarUpload = ({ side, onUpload }) => {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        onUpload(reader.result); // Base64 data to parent
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="aadhaar-upload-box" onClick={() => fileInputRef.current?.click()}>
      {previewUrl ? (
        <img src={previewUrl} alt={`Aadhaar ${side}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
      ) : (
        <>
          <span className="upload-icon" style={{ fontSize: '1.8rem' }}>📄</span>
          <div className="aadhaar-upload-label">{side === 'front' ? 'Front Side' : 'Back Side'}</div>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default AadhaarUpload;
