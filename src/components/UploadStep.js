// src/components/UploadStep.js
import React, { useRef } from "react";

const UploadStep = ({ onImageUpload, onBack, isActive, selectedTemplate }) => {
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

  // 選択されていない場合は表示しない
  if (!selectedTemplate) return null;

  return (
    <div
      className={`upload-container ${isActive ? "active" : ""}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h2 className="section-title">ステップ2: 画像をアップロード</h2>
      <p>
        {selectedTemplate.name}（{selectedTemplate.description}
        ）用の画像をアップロードしてください
      </p>

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

      <div className="button-container">
        <button onClick={onBack} className="back-button">
          戻る
        </button>
      </div>
    </div>
  );
};

export default UploadStep;
