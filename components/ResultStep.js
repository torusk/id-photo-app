// src/components/ResultStep.js
import React from "react";

const ResultStep = ({
  layoutImageUrl,
  template,
  onDownload,
  onReset,
  outputFormat,
  onFormatChange,
}) => {
  const handleFormatChange = (e) => {
    onFormatChange(e.target.value);
  };

  return (
    <div className="result-container">
      <h2>ステップ4: 証明写真の完成</h2>

      {layoutImageUrl && (
        <div className="result-images">
          <div className="layout-image">
            <img
              src={layoutImageUrl}
              alt="L判レイアウト"
              className="result-img"
            />
            <p className="layout-info">
              L判（89mm×127mm）に{template.name}（{template.description}
              ）が4枚配置されています
            </p>
          </div>
        </div>
      )}

      <div className="format-selector">
        <label htmlFor="format-select">出力形式:</label>
        <select
          id="format-select"
          value={outputFormat}
          onChange={handleFormatChange}
          className="format-select"
        >
          <option value="image/jpeg">JPEG形式（コンビニプリント推奨）</option>
          <option value="image/png">PNG形式（高画質）</option>
        </select>
      </div>

      <div className="print-instructions">
        <h3>プリント方法:</h3>
        <ol>
          <li>下の「画像をダウンロード」ボタンをクリックして画像を保存</li>
          <li>
            コンビニのマルチコピー機にUSBメモリや、スマホのアプリで画像を転送
          </li>
          <li>L判サイズでプリント（倍率100%、「ふちなし」設定はオフ）</li>
        </ol>
      </div>

      <div className="button-container">
        <button onClick={onDownload} className="download-button">
          画像をダウンロード
        </button>
        <button onClick={onReset} className="reset-button">
          最初からやり直す
        </button>
      </div>
    </div>
  );
};

export default ResultStep;
