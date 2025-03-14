// src/App.js
import React, { useState, useRef, useEffect } from "react";
import { saveAs } from "file-saver";
import "./App.css";

// コンポーネントをインポート
import TemplateStep from "./components/TemplateStep";
import UploadStep from "./components/UploadStep";
import CropStep from "./components/CropStep";
import ResultStep from "./components/ResultStep";
import FlowGuide from "./components/FlowGuide";
import Loading from "./components/Loading";

// 証明写真テンプレートの定義
export const PHOTO_TEMPLATES = {
  license: {
    id: "license",
    name: "自動車運転免許用",
    width: 24,
    height: 30,
    description: "2.4cm×3.0cm",
  },
  resume: {
    id: "resume",
    name: "履歴書・TOEIC用",
    width: 30,
    height: 40,
    description: "3.0cm×4.0cm",
  },
  mynumber: {
    id: "mynumber",
    name: "マイナンバー用",
    width: 35,
    height: 45,
    description: "3.5cm×4.5cm",
  },
};

// L判サイズの定義
export const L_SIZE = { width: 89, height: 127 };

// DPI設定
export const DPI = 300;

// mmをピクセルに変換する関数
export const mmToPixels = (mm) => Math.round((mm * DPI) / 25.4);

// テンプレートサイズをピクセルに変換
export const getTemplatePixels = (template) => {
  return {
    ...template,
    widthPx: mmToPixels(template.width),
    heightPx: mmToPixels(template.height),
  };
};

// L判サイズをピクセルに変換
export const L_SIZE_PX = {
  width: mmToPixels(L_SIZE.width),
  height: mmToPixels(L_SIZE.height),
};

const App = () => {
  // 状態管理
  const [image, setImage] = useState(null);
  const [cropRect, setCropRect] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [layoutImageUrl, setLayoutImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  // 出力形式を常にJPEGに設定（選択肢を提供しない）
  const outputFormat = "image/jpeg";
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(1);

  // セクション参照用のRef
  const templateSectionRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const cropSectionRef = useRef(null);
  const resultSectionRef = useRef(null);

  // エラーハンドリング関数
  const handleError = (errorMessage) => {
    setError(errorMessage);
    setLoading(false);
  };

  // 画像アップロード処理
  const handleImageUpload = (file) => {
    if (!file || !selectedTemplate) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => {
        setImage(img);
        setActiveStep(3);
        setLoading(false);

        // クロップ領域の初期設定
        const templatePixels = getTemplatePixels(selectedTemplate);
        const imgWidth = img.width;
        const imgHeight = img.height;
        const aspectRatio = templatePixels.widthPx / templatePixels.heightPx;

        let cropWidth, cropHeight;
        if (imgWidth / imgHeight > aspectRatio) {
          cropHeight = imgHeight * 0.8;
          cropWidth = cropHeight * aspectRatio;
        } else {
          cropWidth = imgWidth * 0.8;
          cropHeight = cropWidth / aspectRatio;
        }

        setCropRect({
          x: imgWidth / 2 - cropWidth / 2,
          y: imgHeight / 2 - cropHeight / 2,
          width: cropWidth,
          height: cropHeight,
        });

        // クロップセクションへスクロール
        scrollToSection(cropSectionRef);
      };
      img.onerror = () => {
        handleError("画像の読み込みに失敗しました。別の画像を試してください。");
      };
    };
    reader.onerror = () => {
      handleError(
        "ファイルの読み込みに失敗しました。別のファイルを試してください。"
      );
    };
    reader.readAsDataURL(file);
  };

  // テンプレート選択処理
  const handleTemplateSelect = (templateId) => {
    const template = PHOTO_TEMPLATES[templateId];
    setSelectedTemplate(template);
    setActiveStep(2);

    // アップロードセクションへスクロール
    scrollToSection(uploadSectionRef);
  };

  // クロップ処理
  const handleCrop = () => {
    if (!cropRect || !image) return;

    setLoading(true);
    setError(null);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const templatePixels = getTemplatePixels(selectedTemplate);

      canvas.width = templatePixels.widthPx;
      canvas.height = templatePixels.heightPx;

      ctx.drawImage(
        image,
        cropRect.x,
        cropRect.y,
        cropRect.width,
        cropRect.height,
        0,
        0,
        templatePixels.widthPx,
        templatePixels.heightPx
      );

      const croppedUrl = canvas.toDataURL(outputFormat, 0.9);
      setCroppedImageUrl(croppedUrl);
      generateLayout(croppedUrl);
    } catch (error) {
      handleError("画像の切り抜きに失敗しました。もう一度お試しください。");
    }
  };

  // レイアウト生成処理
  const generateLayout = (croppedUrl) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = L_SIZE_PX.width;
      canvas.height = L_SIZE_PX.height;
      const ctx = canvas.getContext("2d");
      const templatePixels = getTemplatePixels(selectedTemplate);

      // 背景を白にする
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new window.Image();
      img.onload = () => {
        const photoWidth = templatePixels.widthPx;
        const photoHeight = templatePixels.heightPx;
        const cols = 2;
        const rows = 2;

        // スペーシングを追加（ピクセル単位）
        const spacingHorizontal = Math.round(mmToPixels(10)); // 1cm = 10mm
        const spacingVertical = Math.round(mmToPixels(10)); // 1cm = 10mm

        // スペースを考慮した全体の幅と高さ
        const totalWidth = cols * photoWidth + (cols - 1) * spacingHorizontal;
        const totalHeight = rows * photoHeight + (rows - 1) * spacingVertical;

        // 中央に配置するための開始位置
        const startX = (L_SIZE_PX.width - totalWidth) / 2;
        const startY = (L_SIZE_PX.height - totalHeight) / 2;

        // 4枚配置（スペース付き）
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            // 各写真の座標を計算（水平・垂直それぞれのスペースを考慮）
            const x = startX + col * (photoWidth + spacingHorizontal);
            const y = startY + row * (photoHeight + spacingVertical);

            // 画像の描画
            ctx.drawImage(img, x, y, photoWidth, photoHeight);

            // 枠線の描画
            ctx.strokeStyle = "#dddddd";
            ctx.strokeRect(x, y, photoWidth, photoHeight);
          }
        }

        // 情報テキスト
        ctx.fillStyle = "#888888";
        ctx.font = "12px sans-serif";
        ctx.fillText(
          `${selectedTemplate.description} ×4枚 | L判 (89mm×127mm) | 300dpi`,
          10,
          L_SIZE_PX.height - 10
        );

        setLayoutImageUrl(canvas.toDataURL(outputFormat, 0.9));
        setActiveStep(4);
        setLoading(false);

        // 結果セクションへスクロール
        scrollToSection(resultSectionRef);
      };
      img.onerror = () => {
        handleError("レイアウト生成中にエラーが発生しました。");
      };
      img.src = croppedUrl;
    } catch (error) {
      handleError("レイアウト生成中にエラーが発生しました。");
    }
  };

  // ダウンロード処理
  const handleDownload = () => {
    if (layoutImageUrl) {
      const fileName = `証明写真_${selectedTemplate.name}_L判.jpg`;
      saveAs(layoutImageUrl, fileName);
    }
  };

  // リセット処理
  const handleReset = () => {
    setImage(null);
    setCropRect(null);
    setCroppedImageUrl(null);
    setLayoutImageUrl(null);
    setSelectedTemplate(null);
    setActiveStep(1);
    setError(null);

    // テンプレート選択セクションへスクロール
    scrollToSection(templateSectionRef);
  };

  // クロップ領域の更新
  const updateCropRect = (newCropRect) => {
    setCropRect(newCropRect);
  };

  // セクションへのスクロール関数
  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // 前のステップに戻る
  const handleBack = (step) => {
    if (step >= 1) {
      setActiveStep(step);

      // 対応するセクションにスクロール
      if (step === 1) scrollToSection(templateSectionRef);
      else if (step === 2) scrollToSection(uploadSectionRef);
      else if (step === 3) scrollToSection(cropSectionRef);
    }
  };

  return (
    <div className="app-container">
      <h1>証明写真作成アプリ</h1>
      <p className="privacy-notice">
        ※画像はブラウザ上でのみ処理され、サーバーには保存されません
      </p>

      {error && <div className="error-message">{error}</div>}
      {loading && <Loading />}

      {/* 利用の流れガイド */}
      <FlowGuide activeStep={activeStep} />

      {/* STEP 1: テンプレート選択 */}
      <div
        ref={templateSectionRef}
        id="template-section"
        className="section-container"
      >
        <TemplateStep
          templates={PHOTO_TEMPLATES}
          onTemplateSelect={handleTemplateSelect}
          isActive={activeStep >= 1}
        />
      </div>

      {/* STEP 2: 画像アップロード */}
      <div
        ref={uploadSectionRef}
        id="upload-section"
        className="section-container"
      >
        <UploadStep
          onImageUpload={handleImageUpload}
          onBack={() => handleBack(1)}
          isActive={activeStep >= 2}
          selectedTemplate={selectedTemplate}
        />
      </div>

      {/* STEP 3: 画像クロップ */}
      {image && selectedTemplate && (
        <div
          ref={cropSectionRef}
          id="crop-section"
          className="section-container"
        >
          <CropStep
            image={image}
            cropRect={cropRect}
            updateCropRect={updateCropRect}
            onCrop={handleCrop}
            onBack={() => handleBack(2)}
            template={selectedTemplate}
            isActive={activeStep >= 3}
          />
        </div>
      )}

      {/* STEP 4: 結果表示 */}
      {layoutImageUrl && (
        <div
          ref={resultSectionRef}
          id="result-section"
          className="section-container"
        >
          <ResultStep
            layoutImageUrl={layoutImageUrl}
            template={selectedTemplate}
            onDownload={handleDownload}
            onReset={handleReset}
            outputFormat={outputFormat}
            isActive={activeStep >= 4}
          />
        </div>
      )}
    </div>
  );
};

export default App;
