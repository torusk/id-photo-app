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

const PHOTO_TEMPLATE = {
  resume: {
    name: "履歴書・TOEIC用",
    width: 30,
    height: 40,
    description: "3.0cm×4.0cm",
  },
};

const L_SIZE = { width: 89, height: 127 };
const DPI = 300;

const mmToPixels = (mm) => Math.round((mm * DPI) / 25.4);

const PHOTO_TEMPLATE_PX = {
  resume: {
    ...PHOTO_TEMPLATE.resume,
    widthPx: mmToPixels(PHOTO_TEMPLATE.resume.width),
    heightPx: mmToPixels(PHOTO_TEMPLATE.resume.height),
  },
};

const L_SIZE_PX = {
  width: mmToPixels(L_SIZE.width),
  height: mmToPixels(L_SIZE.height),
};

const App = () => {
  const [image, setImage] = useState(null);
  const [cropRect, setCropRect] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [layoutImageUrl, setLayoutImageUrl] = useState(null);
  const [step, setStep] = useState(1);
  const [imageOrientation, setImageOrientation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const imageRef = useRef(null);
  const rectRef = useRef(null);
  const transformerRef = useRef(null);

  useEffect(() => {
    if (rectRef.current && transformerRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [cropRect]);

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

  const handleTemplateSelect = () => {
    const template = PHOTO_TEMPLATE_PX.resume;
    const imgWidth = image.width;
    const imgHeight = image.height;
    const aspectRatio = template.widthPx / template.heightPx;

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
    setStep(3);
  };

  const handleZoomChange = (e) => {
    setZoomLevel(parseFloat(e.target.value));
  };

  const handleCrop = () => {
    if (!cropRect || !imageRef.current) return;

    setLoading(true);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const template = PHOTO_TEMPLATE_PX.resume;

    const scaleX = image.width / imageRef.current.attrs.width;
    const scaleY = image.height / imageRef.current.attrs.height;

    canvas.width = template.widthPx;
    canvas.height = template.heightPx;

    ctx.drawImage(
      image,
      cropRect.x * scaleX,
      cropRect.y * scaleY,
      cropRect.width * scaleX,
      cropRect.height * scaleY,
      0,
      0,
      template.widthPx,
      template.heightPx
    );

    const croppedUrl = canvas.toDataURL("image/png");
    setCroppedImageUrl(croppedUrl);
    generateLayout(croppedUrl);
  };

  const generateLayout = (croppedUrl) => {
    const canvas = document.createElement("canvas");
    canvas.width = L_SIZE_PX.width;
    canvas.height = L_SIZE_PX.height;
    const ctx = canvas.getContext("2d");
    const template = PHOTO_TEMPLATE_PX.resume;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new window.Image();
    img.onload = () => {
      const photoWidth = template.widthPx;
      const photoHeight = template.heightPx;
      const cols = 2;
      const rows = 2;
      const totalWidth = cols * photoWidth;
      const totalHeight = rows * photoHeight;
      const startX = (L_SIZE_PX.width - totalWidth) / 2;
      const startY = (L_SIZE_PX.height - totalHeight) / 2;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = startX + col * photoWidth;
          const y = startY + row * photoHeight;
          ctx.drawImage(img, x, y, photoWidth, photoHeight);
          ctx.strokeStyle = "#dddddd";
          ctx.strokeRect(x, y, photoWidth, photoHeight);
        }
      }

      ctx.fillStyle = "#888888";
      ctx.font = "12px sans-serif";
      ctx.fillText(
        `${template.description} ×4枚 | L判 (89mm×127mm) | 300dpi`,
        10,
        L_SIZE_PX.height - 10
      );

      setLayoutImageUrl(canvas.toDataURL("image/png"));
      setStep(4);
      setLoading(false);
    };
    img.src = croppedUrl;
  };
  const handleDownload = () => {
    if (layoutImageUrl) {
      saveAs(layoutImageUrl, `証明写真_${PHOTO_TEMPLATE.resume.name}_L判.png`);
    }
  };

  const handleTransform = () => {
    if (rectRef.current) {
      const rect = rectRef.current;
      const aspectRatio =
        PHOTO_TEMPLATE_PX.resume.widthPx / PHOTO_TEMPLATE_PX.resume.heightPx;

      const width = rect.width() * rect.scaleX();
      const height = rect.height() * rect.scaleY();
      const newWidth = width;
      const newHeight = newWidth / aspectRatio;

      rect.setAttrs({
        width: newWidth,
        height: newHeight,
        scaleX: 1,
        scaleY: 1,
      });
      setCropRect({
        ...cropRect,
        x: rect.x(),
        y: rect.y(),
        width: newWidth,
        height: newHeight,
      });
    }
  };

  const boundFunc = (oldBox, newBox) => {
    const aspectRatio =
      PHOTO_TEMPLATE_PX.resume.widthPx / PHOTO_TEMPLATE_PX.resume.heightPx;
    newBox.height = newBox.width / aspectRatio;
    if (newBox.width < 30 || newBox.height < 30) return oldBox;
    return newBox;
  };

  const handleBack = () => step > 1 && setStep(step - 1);
  const handleReset = () => {
    setImage(null);
    setCropRect(null);
    setCroppedImageUrl(null);
    setLayoutImageUrl(null);
    setImageOrientation(null);
    setZoomLevel(1);
    setStep(1);
  };

  const calculateDisplayDimensions = (img, maxWidth = 800, maxHeight = 600) => {
    if (!img) return { width: 0, height: 0 };
    const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
    return { width: img.width * ratio, height: img.height * ratio };
  };

  const stageSize = image
    ? calculateDisplayDimensions(image)
    : { width: 0, height: 0 };
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
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          <p className="tip">高解像度の写真を使用すると品質が向上します</p>
        </div>
      )}

      {step === 2 && (
        <div className="template-container">
          <h2>ステップ2: 証明写真の種類を選択</h2>
          <button onClick={handleTemplateSelect} className="template-button">
            {PHOTO_TEMPLATE.resume.name}
            <span className="template-size">
              {PHOTO_TEMPLATE.resume.description}
            </span>
          </button>
          <button onClick={handleReset} className="back-button">
            戻る
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="crop-container">
          <h2>ステップ3: 顔の位置を調整</h2>
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
            <Stage {...zoomedStageSize} scale={{ x: zoomLevel, y: zoomLevel }}>
              <Layer>
                <KonvaImage ref={imageRef} image={image} {...stageSize} />
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
                    onDragEnd={() =>
                      setCropRect({
                        ...cropRect,
                        x:
                          rectRef.current.x() / (stageSize.width / image.width),
                        y:
                          rectRef.current.y() /
                          (stageSize.height / image.height),
                      })
                    }
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
                />
              </Layer>
            </Stage>
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
          <div className="result-images">
            <div className="layout-image">
              <img
                src={layoutImageUrl}
                alt="L判レイアウト"
                className="result-img"
              />
              <p className="layout-info">
                L判（89mm×127mm）に4枚配置されています
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
