// src/components/CropStep.js
import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Image as KonvaImage,
  Transformer,
} from "react-konva";

const CropStep = ({
  image,
  cropRect,
  updateCropRect,
  onCrop,
  onBack,
  template,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const imageRef = useRef(null);
  const rectRef = useRef(null);
  const transformerRef = useRef(null);
  const containerRef = useRef(null);

  // アスペクト比を計算
  const aspectRatio = template.width / template.height;

  // ステージのサイズを計算
  useEffect(() => {
    if (image && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 40; // パディングを考慮
      const maxHeight = window.innerHeight * 0.6; // 画面の60%を最大高さに

      const ratio = Math.min(
        containerWidth / image.width,
        maxHeight / image.height
      );

      setStageSize({
        width: image.width * ratio,
        height: image.height * ratio,
      });
    }
  }, [image, containerRef]);

  // トランスフォーマーを設定
  useEffect(() => {
    if (rectRef.current && transformerRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [cropRect]);

  // ズームレベルの変更
  const handleZoomChange = (e) => {
    setZoomLevel(parseFloat(e.target.value));
  };

  // クロップ領域のトランスフォーム処理
  const handleTransform = () => {
    if (rectRef.current) {
      const rect = rectRef.current;

      // スケールを適用
      const width = rect.width() * rect.scaleX();
      const height = width / aspectRatio;

      // 新しい位置とサイズを設定
      rect.setAttrs({
        width: width,
        height: height,
        scaleX: 1,
        scaleY: 1,
      });

      // 親コンポーネントの状態を更新
      const scale = image.width / stageSize.width;
      updateCropRect({
        x: rect.x() * scale,
        y: rect.y() * scale,
        width: width * scale,
        height: height * scale,
      });
    }
  };

  // ドラッグ終了時の処理
  const handleDragEnd = () => {
    if (rectRef.current) {
      const scale = image.width / stageSize.width;
      updateCropRect({
        ...cropRect,
        x: rectRef.current.x() * scale,
        y: rectRef.current.y() * scale,
      });
    }
  };

  // バウンディングボックスの制約関数
  const boundFunc = (oldBox, newBox) => {
    // アスペクト比を維持
    newBox.height = newBox.width / aspectRatio;

    // 最小サイズを制限
    if (newBox.width < 30 || newBox.height < 30) {
      return oldBox;
    }

    return newBox;
  };

  // ズームを適用したステージサイズ
  const zoomedStageSize = {
    width: stageSize.width * zoomLevel,
    height: stageSize.height * zoomLevel,
  };

  // クロップ領域のステージ座標変換
  const getStageCropRect = () => {
    if (!cropRect || !image || !stageSize.width) return null;

    const scale = stageSize.width / image.width;
    return {
      x: cropRect.x * scale,
      y: cropRect.y * scale,
      width: cropRect.width * scale,
      height: cropRect.height * scale,
    };
  };

  const stageCropRect = getStageCropRect();

  return (
    <div className="crop-container" ref={containerRef}>
      <h2>ステップ3: 顔の位置を調整</h2>
      <p>
        {template.name}（{template.description}
        ）用に写真の位置を調整してください。
        <br />
        赤い枠を動かしたりサイズ変更して、顔が適切に収まるようにしてください。
      </p>

      <div className="zoom-control">
        <span>縮小</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={zoomLevel}
          onChange={handleZoomChange}
          aria-label="ズームレベル"
        />
        <span>拡大</span>
      </div>

      <div className="stage-container">
        {image && stageSize.width > 0 && (
          <Stage
            width={zoomedStageSize.width}
            height={zoomedStageSize.height}
            scale={{ x: zoomLevel, y: zoomLevel }}
            style={{ margin: "0 auto" }}
          >
            <Layer>
              <KonvaImage
                ref={imageRef}
                image={image}
                width={stageSize.width}
                height={stageSize.height}
              />
              {stageCropRect && (
                <Rect
                  ref={rectRef}
                  x={stageCropRect.x}
                  y={stageCropRect.y}
                  width={stageCropRect.width}
                  height={stageCropRect.height}
                  stroke="red"
                  strokeWidth={2}
                  draggable
                  onTransform={handleTransform}
                  onDragEnd={handleDragEnd}
                />
              )}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={boundFunc}
                keepRatio={true}
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ]}
              />
            </Layer>
          </Stage>
        )}
      </div>

      <div className="crop-tips">
        <h3>証明写真ガイド:</h3>
        <ul>
          <li>頭頂部から顎までが写真の高さの70-80%になるように</li>
          <li>目線はまっすぐ前を向いて</li>
          <li>顔の中心が写真の中央に来るよう調整</li>
        </ul>
      </div>

      <div className="button-container">
        <button onClick={onCrop} className="crop-button">
          クロップして完成
        </button>
        <button onClick={onBack} className="back-button">
          戻る
        </button>
      </div>
    </div>
  );
};

export default CropStep;
