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

// Define ID photo sizes in mm (standard sizes in Japan)
const PHOTO_TEMPLATES = {
  license: {
    name: "運転免許証用",
    width: 24,
    height: 30,
    description: "2.4cm×3.0cm",
  },
  resume: {
    name: "履歴書・TOEIC用",
    width: 30,
    height: 40,
    description: "3.0cm×4.0cm",
  },
  mynumber: {
    name: "マイナンバー用",
    width: 35,
    height: 45,
    description: "3.5cm×4.5cm",
  },
};

// L-size print dimensions in mm
const L_SIZE = { width: 89, height: 127 };

// DPI for conversion from mm to pixels
const DPI = 300;

// Convert mm to pixels at specified DPI
const mmToPixels = (mm) => Math.round((mm * DPI) / 25.4);

// Convert photo templates and L-size to pixels
const PHOTO_TEMPLATES_PX = Object.entries(PHOTO_TEMPLATES).reduce(
  (acc, [key, template]) => {
    acc[key] = {
      ...template,
      widthPx: mmToPixels(template.width),
      heightPx: mmToPixels(template.height),
    };
    return acc;
  },
  {}
);

const L_SIZE_PX = {
  width: mmToPixels(L_SIZE.width),
  height: mmToPixels(L_SIZE.height),
};

const App = () => {
  const [image, setImage] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [cropRect, setCropRect] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [layoutImageUrl, setLayoutImageUrl] = useState(null);
  const [step, setStep] = useState(1); // 1: upload, 2: template selection, 3: crop, 4: result
  const [imageOrientation, setImageOrientation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const imageRef = useRef(null);
  const rectRef = useRef(null);
  const transformerRef = useRef(null);

  // Attach transformer to the rect
  useEffect(() => {
    if (rectRef.current && transformerRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [cropRect]);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => {
        setImageOrientation(img.width > img.height ? "landscape" : "portrait");
        setImage(img);
        setStep(2);
        setLoading(false);
      };
    };
    reader.readAsDataURL(file);
  };

  // Handle template selection
  const handleTemplateSelect = (templateKey) => {
    const template = PHOTO_TEMPLATES_PX[templateKey];
    const imgWidth = image.width;
    const imgHeight = image.height;
    const aspectRatio = template.widthPx / template.heightPx;

    // Choose a suitable initial size based on image dimensions
    let cropWidth, cropHeight;

    if (imgWidth / imgHeight > aspectRatio) {
      // Image is wider proportionally than the template
      cropHeight = imgHeight * 0.8; // Use 80% of image height
      cropWidth = cropHeight * aspectRatio;
    } else {
      // Image is taller proportionally than the template
      cropWidth = imgWidth * 0.8; // Use 80% of image width
      cropHeight = cropWidth / aspectRatio;
    }

    // Initial position: center of the image
    setCropRect({
      x: imgWidth / 2 - cropWidth / 2,
      y: imgHeight / 2 - cropHeight / 2,
      width: cropWidth,
      height: cropHeight,
      templateKey,
    });

    setSelectedTemplate(template);
    setStep(3);
  };

  // Handle zoom in/out for better control
  const handleZoomChange = (e) => {
    setZoomLevel(parseFloat(e.target.value));
  };

  // Handle crop execution
  const handleCrop = () => {
    if (!cropRect || !imageRef.current) return;

    setLoading(true);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Calculate scale factors
    const scaleX = image.width / imageRef.current.attrs.width;
    const scaleY = image.height / imageRef.current.attrs.height;

    // Calculate crop area with the correct aspect ratio
    const cropX = cropRect.x * scaleX;
    const cropY = cropRect.y * scaleY;
    const cropWidth = cropRect.width * scaleX;
    const cropHeight = cropRect.height * scaleY;

    // Set canvas size to match the template's exact pixel dimensions
    const template = PHOTO_TEMPLATES_PX[cropRect.templateKey];
    canvas.width = template.widthPx;
    canvas.height = template.heightPx;

    // Draw cropped image to canvas, scaling to fit the exact template dimensions
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      template.widthPx,
      template.heightPx
    );

    // Convert canvas to data URL
    const croppedUrl = canvas.toDataURL("image/png");
    setCroppedImageUrl(croppedUrl);

    // Generate L-size layout
    generateLayout(croppedUrl, template);
  };

  // Generate L-size layout with multiple photos
  const generateLayout = (croppedUrl, template) => {
    const canvas = document.createElement("canvas");
    canvas.width = L_SIZE_PX.width;
    canvas.height = L_SIZE_PX.height;
    const ctx = canvas.getContext("2d");

    // Set white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new window.Image();
    img.onload = () => {
      const photoWidth = template.widthPx;
      const photoHeight = template.heightPx;
      const horizontalGap = mmToPixels(3); // 3mm gap
      const verticalGap = mmToPixels(3); // 3mm gap

      // Calculate optimal number of rows and columns (typically 2x2 for ID photos)
      const cols = Math.min(
        Math.floor(
          (L_SIZE_PX.width + horizontalGap) / (photoWidth + horizontalGap)
        ),
        2
      );
      const rows = Math.min(
        Math.floor(
          (L_SIZE_PX.height + verticalGap) / (photoHeight + verticalGap)
        ),
        2
      );

      // Calculate total width and height with gaps
      const totalWidth = cols * photoWidth + (cols - 1) * horizontalGap;
      const totalHeight = rows * photoHeight + (rows - 1) * verticalGap;

      // Center the layout on the L-size print
      const startX = (L_SIZE_PX.width - totalWidth) / 2;
      const startY = (L_SIZE_PX.height - totalHeight) / 2;

      // Draw the photos in a grid
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = startX + col * (photoWidth + horizontalGap);
          const y = startY + row * (photoHeight + verticalGap);

          // Draw the image with the exact template dimensions
          ctx.drawImage(img, x, y, photoWidth, photoHeight);

          // Draw thin border around each photo
          ctx.strokeStyle = "#dddddd";
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, photoWidth, photoHeight);
        }
      }

      // Add cutting guides
      ctx.strokeStyle = "#eeeeee";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([5, 5]);

      // Horizontal guide lines
      for (let row = 0; row <= rows; row++) {
        const y = startY + row * (photoHeight + verticalGap) - verticalGap / 2;
        if (row > 0) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(L_SIZE_PX.width, y);
          ctx.stroke();
        }
      }

      // Vertical guide lines
      for (let col = 0; col <= cols; col++) {
        const x =
          startX + col * (photoWidth + horizontalGap) - horizontalGap / 2;
        if (col > 0) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, L_SIZE_PX.height);
          ctx.stroke();
        }
      }

      // Add print specifications at the bottom
      ctx.setLineDash([]);
      ctx.fillStyle = "#888888";
      ctx.font = "12px sans-serif";
      const specText = `${template.description} × ${rows * cols}枚 | L判 (${
        L_SIZE.width
      }mm×${L_SIZE.height}mm) | 300dpi`;
      ctx.fillText(specText, 10, L_SIZE_PX.height - 10);

      // Convert the layout to a data URL and update state
      setLayoutImageUrl(canvas.toDataURL("image/png"));
      setStep(4);
      setLoading(false);
    };
    img.src = croppedUrl;
  };

  // Handle download
  const handleDownload = () => {
    if (layoutImageUrl) {
      saveAs(layoutImageUrl, `証明写真_${selectedTemplate.name}_L判.png`);
    }
  };

  // Handle transformer transform with fixed aspect ratio
  const handleTransform = () => {
    if (rectRef.current) {
      const rect = rectRef.current;
      const template = PHOTO_TEMPLATES_PX[cropRect.templateKey];
      const aspectRatio = template.widthPx / template.heightPx;

      // Get current size with scale applied
      const width = rect.width() * rect.scaleX();
      const height = rect.height() * rect.scaleY();

      // Calculate new dimensions that maintain aspect ratio
      // We'll prioritize width and adjust height to match
      const newWidth = width;
      const newHeight = newWidth / aspectRatio;

      // Update rectangle with new dimensions
      rect.setAttrs({
        width: newWidth,
        height: newHeight,
        scaleX: 1,
        scaleY: 1,
      });

      // Update cropRect state
      setCropRect({
        ...cropRect,
        x: rect.x(),
        y: rect.y(),
        width: newWidth,
        height: newHeight,
      });
    }
  };

  // Ensure crop rectangle stays within image boundaries and maintains aspect ratio
  const boundFunc = (oldBox, newBox) => {
    if (!cropRect) return oldBox;

    const template = PHOTO_TEMPLATES_PX[cropRect.templateKey];
    const aspectRatio = template.widthPx / template.heightPx;

    // Maintain aspect ratio
    newBox.height = newBox.width / aspectRatio;

    // Set minimum size
    if (newBox.width < 30 || newBox.height < 30) {
      return oldBox;
    }

    return newBox;
  };

  // Handle navigation
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleReset = () => {
    setImage(null);
    setSelectedTemplate(null);
    setCropRect(null);
    setCroppedImageUrl(null);
    setLayoutImageUrl(null);
    setImageOrientation(null);
    setZoomLevel(1);
    setStep(1);
  };

  // Calculate display dimensions for Stage
  const calculateDisplayDimensions = (img, maxWidth, maxHeight) => {
    if (!img) return { width: 0, height: 0 };

    let width = img.width;
    let height = img.height;

    // Scale down if larger than maxWidth
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = height * ratio;
    }

    // Scale down further if still larger than maxHeight
    if (height > maxHeight) {
      const ratio = maxHeight / height;
      height = maxHeight;
      width = width * ratio;
    }

    return { width, height };
  };

  // Calculate stage size
  const stageSize = image
    ? calculateDisplayDimensions(image, 800, 600)
    : { width: 0, height: 0 };

  // Apply zoom to displayed stage
  const zoomedStageSize = {
    width: stageSize.width * zoomLevel,
    height: stageSize.height * zoomLevel,
  };

  return (
    <div className="app-container">
      <h1>証明写真作成アプリ</h1>
      <p className="privacy-notice">
        ※画像はブラウザ上でのみ処理され、サーバーには保存されません
      </p>

      {loading && (
        <div className="loading">
          <p>処理中...</p>
        </div>
      )}

      {step === 1 && (
        <div className="upload-container">
          <h2>ステップ1: 画像をアップロード</h2>
          <p>縦向き・横向きどちらの写真も対応しています。</p>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          <p className="tip">高解像度の写真を使用すると品質が向上します</p>
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
                <span className="template-size">{template.description}</span>
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

          <div className="zoom-control">
            <span>縮小</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={zoomLevel}
              onChange={handleZoomChange}
            />
            <span>拡大</span>
          </div>

          <div className="stage-container">
            <Stage
              width={zoomedStageSize.width}
              height={zoomedStageSize.height}
              scale={{ x: zoomLevel, y: zoomLevel }}
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
                  boundBoxFunc={boundFunc}
                  enabledAnchors={[
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                  ]}
                  rotateEnabled={false}
                />
              </Layer>
            </Stage>
          </div>

          <div className="guidelines">
            <h3>証明写真のガイドライン</h3>
            <ul>
              <li>顔が枠の中央に位置するよう調整してください</li>
              <li>顔の上部から顎までが写真の60-70%程度になると良いでしょう</li>
              <li>背景は白または薄い色が理想的です</li>
            </ul>
          </div>

          <div className="button-container">
            <button onClick={handleCrop} className="crop-button">
              クロップして完成
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
            <div className="cropped-image">
              <h3>クロップした画像</h3>
              <img
                src={croppedImageUrl}
                alt="クロップした証明写真"
                className="result-img"
              />
              <p className="photo-info">
                {selectedTemplate?.description} 規格サイズ
              </p>
            </div>

            <div className="layout-image">
              <h3>L判レイアウト</h3>
              <img
                src={layoutImageUrl}
                alt="L判レイアウト"
                className="result-img"
              />
              <p className="layout-info">
                L判（89mm×127mm）にちょうど収まるようレイアウトされています
              </p>
            </div>
          </div>

          <div className="print-instructions">
            <h3>プリント手順</h3>
            <ol>
              <li>「画像をダウンロード」ボタンをクリックして保存</li>
              <li>コンビニのマルチコピー機やプリントサービスを利用</li>
              <li>「L判」サイズを選択し、「等倍」または「原寸」でプリント</li>
              <li>点線に沿って切り取れば規格サイズの証明写真の完成です</li>
            </ol>
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
