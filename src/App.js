import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import { saveAs } from "file-saver";
import "./App.css";

// 証明写真サイズ定義（実際のピクセル値に変換）
const PHOTO_TEMPLATES = {
  license: {
    name: "運転免許証用",
    width: 240,
    height: 300,
    description: "2.4cm×3.0cm",
  },
  resume: {
    name: "履歴書・TOEIC用",
    width: 300,
    height: 400,
    description: "3.0cm×4.0cm",
  },
  mynumber: {
    name: "マイナンバー用",
    width: 350,
    height: 450,
    description: "3.5cm×4.5cm",
  },
};

// L判サイズ定義（300dpi換算）
const L_SIZE = {
  width: 1050, // 89mm × 300dpi / 25.4 ≈ 1050px
  height: 1500, // 127mm × 300dpi / 25.4 ≈ 1500px
};

const App = () => {
  const [image, setImage] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [cropRect, setCropRect] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [layoutImageUrl, setLayoutImageUrl] = useState(null);
  const [step, setStep] = useState(1); // 1: 画像アップロード, 2: テンプレート選択, 3: クロップ, 4: 結果表示
  const [imageOrientation, setImageOrientation] = useState(null); // 'portrait' または 'landscape'

  const imageRef = useRef(null);
  const rectRef = useRef(null);
  const transformerRef = useRef(null);
  const stageRef = useRef(null);

  // トランスフォーマーをアタッチする
  useEffect(() => {
    if (rectRef.current && transformerRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [cropRect]);

  // 画像アップロードハンドラー
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => {
        // 画像の向きを設定
        const orientation = img.width > img.height ? "landscape" : "portrait";
        setImageOrientation(orientation);
        setImage(img);
        setStep(2);
      };
    };
    reader.readAsDataURL(file);
  };

  // テンプレート選択ハンドラー
  const handleTemplateSelect = (templateKey) => {
    const template = PHOTO_TEMPLATES[templateKey];

    // 画像の中心に赤枠を配置
    const imgWidth = image.width;
    const imgHeight = image.height;

    // 赤枠の初期サイズと位置を設定
    setCropRect({
      x: imgWidth / 2 - template.width / 2,
      y: imgHeight / 2 - template.height / 2,
      width: template.width,
      height: template.height,
      templateKey,
    });

    setSelectedTemplate(template);
    setStep(3);
  };

  // クロップ実行ハンドラー
  const handleCrop = () => {
    if (!cropRect || !imageRef.current) return;

    // キャンバスを作成
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // クロップする領域の設定
    const scaleX = image.width / imageRef.current.attrs.width;
    const scaleY = image.height / imageRef.current.attrs.height;

    const cropX = cropRect.x * scaleX;
    const cropY = cropRect.y * scaleY;
    const cropWidth = cropRect.width * scaleX;
    const cropHeight = cropRect.height * scaleY;

    // キャンバスサイズをクロップサイズに合わせる
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // 画像をクロップしてキャンバスに描画
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // クロップした画像をURLに変換
    const croppedUrl = canvas.toDataURL();
    setCroppedImageUrl(croppedUrl);

    // L判用の配置を生成
    generateLayout(croppedUrl);
  };

  // L判レイアウト生成関数
  const generateLayout = (croppedUrl) => {
    const canvas = document.createElement("canvas");
    canvas.width = L_SIZE.width;
    canvas.height = L_SIZE.height;
    const ctx = canvas.getContext("2d");

    // 背景を白に設定
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new window.Image();
    img.onload = () => {
      // テンプレート基準のサイズを取得
      const template = PHOTO_TEMPLATES[cropRect.templateKey];
      const photoAspectRatio = template.width / template.height;

      // レイアウト設計
      // L判の向きに応じた最適な配置を計算
      let photoWidth, photoHeight, cols, rows;

      // L判は常に縦向き (width < height)
      const lSizeAspectRatio = L_SIZE.width / L_SIZE.height; // < 1 for portrait

      // 画像のアスペクト比に基づいて最適な配置を決定
      if (photoAspectRatio < 1) {
        // 証明写真が縦長の場合
        // L判に合わせて最大サイズを計算 (余白10%を確保)
        const maxHeight = L_SIZE.height * 0.45; // 縦に2枚入るように
        photoHeight = maxHeight;
        photoWidth = photoHeight * photoAspectRatio;

        // 縦2段、横は最大で何枚入るか計算
        cols = Math.floor((L_SIZE.width * 0.9) / photoWidth);
        cols = Math.min(cols, 2); // 最大2列まで
        rows = 2;
      } else {
        // 証明写真が横長の場合 (珍しいが対応)
        const maxWidth = L_SIZE.width * 0.45; // 横に2枚入るように
        photoWidth = maxWidth;
        photoHeight = photoWidth / photoAspectRatio;

        // 横2列、縦は最大で何枚入るか計算
        rows = Math.floor((L_SIZE.height * 0.9) / photoHeight);
        rows = Math.min(rows, 2); // 最大2行まで
        cols = 2;
      }

      // 余白計算
      const totalWidth = cols * photoWidth;
      const totalHeight = rows * photoHeight;

      const marginX = (L_SIZE.width - totalWidth) / (cols + 1);
      const marginY = (L_SIZE.height - totalHeight) / (rows + 1);

      // 画像を配置
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = marginX + (photoWidth + marginX) * col;
          const y = marginY + (photoHeight + marginY) * row;
          ctx.drawImage(img, x, y, photoWidth, photoHeight);
        }
      }

      const layoutUrl = canvas.toDataURL();
      setLayoutImageUrl(layoutUrl);
      setStep(4);
    };
    img.src = croppedUrl;
  };

  // 画像ダウンロードハンドラー
  const handleDownload = () => {
    if (layoutImageUrl) {
      saveAs(layoutImageUrl, "証明写真_L判.png");
    }
  };

  // 境界制約を処理するトランスフォーマーのコールバック
  const handleTransform = () => {
    if (rectRef.current) {
      const rect = rectRef.current;
      const template = PHOTO_TEMPLATES[cropRect.templateKey];

      // アスペクト比を維持
      const aspectRatio = template.width / template.height;
      const newWidth = Math.max(100, rect.width());
      rect.setAttrs({
        width: newWidth,
        height: newWidth / aspectRatio,
        scaleX: 1,
        scaleY: 1,
      });

      // 新しい位置とサイズでcropRectを更新
      setCropRect({
        ...cropRect,
        x: rect.x(),
        y: rect.y(),
        width: rect.width(),
        height: rect.height(),
      });
    }
  };

  // 前のステップに戻る
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // 最初に戻るハンドラー
  const handleReset = () => {
    setImage(null);
    setSelectedTemplate(null);
    setCropRect(null);
    setCroppedImageUrl(null);
    setLayoutImageUrl(null);
    setImageOrientation(null);
    setStep(1);
  };

  // 画像表示用のサイズを計算
  const calculateDisplayDimensions = (img, maxWidth, maxHeight) => {
    if (!img) return { width: 0, height: 0 };

    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = height * ratio;
    }

    if (height > maxHeight) {
      const ratio = maxHeight / height;
      height = maxHeight;
      width = width * ratio;
    }

    return { width, height };
  };

  // ステージサイズの計算
  const stageSize = image
    ? calculateDisplayDimensions(image, 800, 600)
    : { width: 0, height: 0 };

  return (
    <div className="app-container">
      <h1>証明写真作成アプリ</h1>
      <p className="privacy-notice">
        ※画像はブラウザ上でのみ処理され、サーバーには保存されません
      </p>

      {step === 1 && (
        <div className="upload-container">
          <h2>ステップ1: 画像をアップロード</h2>
          <p>縦向き・横向きどちらの写真も対応しています。</p>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </div>
      )}

      {step === 2 && (
        <div className="template-container">
          <h2>ステップ2: 証明写真の種類を選択</h2>
          {imageOrientation && (
            <p className="image-orientation">
              画像の向き:{" "}
              {imageOrientation === "portrait" ? "縦向き" : "横向き"}
            </p>
          )}
          <div className="template-options">
            {Object.entries(PHOTO_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => handleTemplateSelect(key)}
                className="template-button"
              >
                {template.name}
                <div className="template-size">{template.description}</div>
              </button>
            ))}
          </div>
          <button onClick={handleReset} className="back-button">
            戻る
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="crop-container">
          <h2>ステップ3: 顔の位置を調整</h2>
          <p>赤枠の位置・サイズを調整して顔の位置を合わせてください。</p>
          <div className="stage-container">
            <Stage
              width={stageSize.width}
              height={stageSize.height}
              ref={stageRef}
            >
              <Layer>
                <KonvaImage
                  ref={imageRef}
                  image={image}
                  width={stageSize.width}
                  height={stageSize.height}
                />
                {cropRect && (
                  <Rect
                    ref={rectRef}
                    x={cropRect.x * (stageSize.width / image.width)}
                    y={cropRect.y * (stageSize.height / image.height)}
                    width={cropRect.width * (stageSize.width / image.width)}
                    height={cropRect.height * (stageSize.height / image.height)}
                    stroke="red"
                    strokeWidth={2}
                    draggable
                    onTransform={handleTransform}
                    onDragEnd={() => {
                      setCropRect({
                        ...cropRect,
                        x:
                          rectRef.current.x() / (stageSize.width / image.width),
                        y:
                          rectRef.current.y() /
                          (stageSize.height / image.height),
                      });
                    }}
                  />
                )}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // 最小サイズを設定
                    if (newBox.width < 30 || newBox.height < 30) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                  keepRatio={true}
                />
              </Layer>
            </Stage>
          </div>
          <div className="button-container">
            <button onClick={handleCrop} className="crop-button">
              クロップ
            </button>
            <button onClick={handleBack} className="back-button">
              戻る
            </button>
          </div>
        </div>
      )}

      {step === 4 && layoutImageUrl && (
        <div className="result-container">
          <h2>ステップ4: 証明写真の完成</h2>
          <p>
            以下の画像をダウンロードして、コンビニなどでL判としてプリントしてください。
          </p>
          <div className="result-images">
            <div className="cropped-image-container">
              <h3>クロップした画像</h3>
              <img
                src={croppedImageUrl}
                alt="クロップした証明写真"
                className="result-img"
              />
            </div>
            <div className="layout-image-container">
              <h3>L判レイアウト</h3>
              <img
                src={layoutImageUrl}
                alt="L判レイアウト"
                className="result-img"
              />
              <p className="layout-preview">
                L判（89mm×127mm）にちょうど収まるようレイアウトされています
              </p>
            </div>
          </div>
          <div className="button-container">
            <button onClick={handleDownload} className="download-button">
              画像をダウンロード
            </button>
            <button onClick={handleReset} className="reset-button">
              最初からやり直す
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
