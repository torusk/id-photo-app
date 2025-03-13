// src/components/UploadStep.js
import React, { useRef } from "react";

const UploadStep = ({ onImageUpload }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div
      className="upload-container"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h2>ステップ1: 画像をアップロード</h2>
      <p>証明写真用の画像をアップロードしてください</p>

      <div className="upload-area" onClick={handleUploadClick}>
        <i className="upload-icon">📁</i>
        <p>
          クリックしてファイルを選択
          <br />
          または画像をここにドラッグ＆ドロップ
        </p>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      <div className="tips-container">
        <h3>写真撮影のヒント:</h3>
        <ul>
          <li>明るい場所で撮影してください</li>
          <li>なるべく無地の背景を使用してください</li>
          <li>高解像度の写真を使用すると品質が向上します</li>
        </ul>
      </div>
    </div>
  );
};

export default UploadStep;
