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
const L_SIZE = {
  width: 89,
  height: 127,
};

// DPI (dots per inch) for conversion from mm to pixels
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

  const imageRef = useRef(null);
  const rectRef = useRef(null);
  const transformerRef = useRef(null);
  const stageRef = useRef(null);

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

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => {
        const orientation = img.width > img.height ? "landscape" : "portrait";
        setImageOrientation(orientation);
        setImage(img);
        setStep(2);
      };
    };
    reader.readAsDataURL(file);
  };

  // Handle template selection
  const handleTemplateSelect = (templateKey) => {
    const template = PHOTO_TEMPLATES_PX[templateKey];

    // Calculate initial crop rectangle position and size
    const imgWidth = image.width;
    const imgHeight = image.height;

    // Initial position: center of the image
    setCropRect({
      x: imgWidth / 2 - template.widthPx / 2,
      y: imgHeight / 2 - template.heightPx / 2,
      width: template.widthPx,
      height: template.heightPx,
      templateKey,
    });

    setSelectedTemplate(template);
    setStep(3);
  };

  // Handle crop execution
  const handleCrop = () => {
    if (!cropRect || !imageRef.current) return;

    // Create canvas for cropping
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Calculate scale factors
    const scaleX = image.width / imageRef.current.attrs.width;
    const scaleY = image.height / imageRef.current.attrs.height;

    // Calculate crop area
    const cropX = cropRect.x * scaleX;
    const cropY = cropRect.y * scaleY;
    const cropWidth = cropRect.width * scaleX;
    const cropHeight = cropRect.height * scaleY;

    // Set canvas size to match crop size
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Draw cropped image to canvas
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

    // Convert canvas to data URL
    const croppedUrl = canvas.toDataURL("image/png");
    setCroppedImageUrl(croppedUrl);

    // Generate L-size layout
    generateLayout(croppedUrl);
  };

  // Generate L-size layout with multiple photos
  const generateLayout = (croppedUrl) => {
    const canvas = document.createElement("canvas");
    canvas.width = L_SIZE_PX.width;
    canvas.height = L_SIZE_PX.height;
    const ctx = canvas.getContext("2d");

    // Set white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new window.Image();
    img.onload = () => {
      const template = PHOTO_TEMPLATES_PX[cropRect.templateKey];

      // Calculate how many photos can fit in the L-size print
      // This is similar to the Python implementation, calculating optimal layout

      // Calculate margins and positions to place photos evenly
      const photoWidth = template.widthPx;
      const photoHeight = template.heightPx;

      // Calculate how many photos can fit horizontally and vertically
      // With proper spacing between them
      const horizontalGap = mmToPixels(3); // 3mm gap between photos
      const verticalGap = mmToPixels(3); // 3mm gap between photos

      // Calculate max number of photos that can fit (with margins)
      const maxHorizontal = Math.floor(
        (L_SIZE_PX.width + horizontalGap) / (photoWidth + horizontalGap)
      );
      const maxVertical = Math.floor(
        (L_SIZE_PX.height + verticalGap) / (photoHeight + verticalGap)
      );

      // Limit to 2x2 layout for standard ID photos (the Python implementation uses 2x2)
      const cols = Math.min(maxHorizontal, 2);
      const rows = Math.min(maxVertical, 2);

      // Calculate total width and height of all photos including gaps
      const totalWidth = cols * photoWidth + (cols - 1) * horizontalGap;
      const totalHeight = rows * photoHeight + (rows - 1) * verticalGap;

      // Calculate starting positions to center the layout
      const startX = (L_SIZE_PX.width - totalWidth) / 2;
      const startY = (L_SIZE_PX.height - totalHeight) / 2;

      // Draw the photos in a grid
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = startX + col * (photoWidth + horizontalGap);
          const y = startY + row * (photoHeight + verticalGap);

          ctx.drawImage(img, x, y, photoWidth, photoHeight);
        }
      }

      // Convert the layout to a data URL
      const layoutUrl = canvas.toDataURL("image/png");
      setLayoutImageUrl(layoutUrl);
      setStep(4);
    };
    img.src = croppedUrl;
  };

  // Handle download
  const handleDownload = () => {
    if (layoutImageUrl) {
      saveAs(layoutImageUrl, `証明写真_${selectedTemplate.name}_L判.png`);
    }
  };

  // Handle transformer transform
  const handleTransform = () => {
    if (rectRef.current) {
      const rect = rectRef.current;
      const template = PHOTO_TEMPLATES_PX[cropRect.templateKey];

      // Maintain aspect ratio
      const aspectRatio = template.widthPx / template.heightPx;

      // Get current scale and size
      const width = rect.width() * rect.scaleX();
      const height = width / aspectRatio;

      // Update rectangle with new dimensions
      rect.setAttrs({
        width: width,
        height: height,
        scaleX: 1,
        scaleY: 1,
      });

      // Update cropRect state
      setCropRect({
        ...cropRect,
        x: rect.x(),
        y: rect.y(),
        width: width,
        height: height,
      });
    }
  };

  // Handle going back
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Handle reset
  const handleReset = () => {
    setImage(null);
    setSelectedTemplate(null);
    setCropRect(null);
    setCroppedImageUrl(null);
    setLayoutImageUrl(null);
    setImageOrientation(null);
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
                    // Set minimum size
                    if (newBox.width < 30 || newBox.height < 30) {
                      return oldBox;
                    }

                    // Maintain aspect ratio
                    const template = PHOTO_TEMPLATES_PX[cropRect.templateKey];
                    const aspectRatio = template.widthPx / template.heightPx;

                    newBox.height = newBox.width / aspectRatio;

                    return newBox;
                  }}
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
              <p className="photo-info">
                {selectedTemplate?.description} 規格サイズ
              </p>
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
