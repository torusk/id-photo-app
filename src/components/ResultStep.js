// src/components/ResultStep.js
import React, { useRef, useEffect, useState } from "react";
import { L_SIZE, DPI } from "../App"; // L判サイズと解像度の定義をインポート

const ResultStep = ({
  layoutImageUrl,
  template,
  onDownload,
  onReset,
  outputFormat,
}) => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // 実際のL判サイズをmm単位で取得
  const lWidthMm = L_SIZE.width;
  const lHeightMm = L_SIZE.height;

  // ウィンドウサイズに応じて適切なスケールを計算
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && imageRef.current) {
        // 画面の物理的なDPI（表示ピクセル密度）を考慮
        // 典型的なモニターの解像度は96DPIだが、デバイスによって異なる
        const screenDpi = 96; // 一般的なモニターのDPI

        // 実際の物理サイズ（mm）をピクセルに変換
        // 25.4mm = 1インチ
        const lWidthPx = (lWidthMm / 25.4) * screenDpi;

        // コンテナの幅と画像の実サイズを比較
        const containerWidth = containerRef.current.clientWidth;

        // コンテナにフィットするスケール（余白を考慮して少し小さめに）
        const fitScale = (containerWidth * 0.95) / lWidthPx;

        // スマホなど画面が小さい場合は縮小、大きい場合は1（実寸）を超えないように
        const newScale = Math.min(1, fitScale);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [lWidthMm]);

  return (
    <div className="result-container">
      <h2>ステップ4: 証明写真の完成</h2>

      {layoutImageUrl && (
        <div className="result-images" ref={containerRef}>
          <div className="layout-image">
            <div
              className="actual-size-container"
              style={{
                // L判実寸表示用のスタイル
                width: `${lWidthMm}mm`,
                height: `${lHeightMm}mm`,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                margin: scale < 1 ? `0 0 ${(1 - scale) * lHeightMm}mm 0` : "0",
              }}
            >
              <img
                ref={imageRef}
                src={layoutImageUrl}
                alt="L判レイアウト"
                className="result-img"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
            <p className="actual-size-info">
              ↑実際のL判サイズ（89mm×127mm）で表示されています
            </p>
            <p className="layout-info">
              L判サイズに{template.name}（{template.description}
              ）が4枚配置されています
            </p>
          </div>
        </div>
      )}

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

      <div className="print-note">
        <p>
          ※コンビニのマルチコピー機では、JPEG形式のみ対応しています。
          <br />
          このアプリで生成された画像はJPEG形式で保存されます。
        </p>
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
