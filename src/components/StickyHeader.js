// src/components/StickyHeader.js
import React from "react";

const StickyHeader = ({ activeStep, onStepClick }) => {
  // 各ステップの情報
  const steps = [
    { id: 1, title: "サイズ選択" },
    { id: 2, title: "画像アップロード" },
    { id: 3, title: "位置調整" },
    { id: 4, title: "完成・ダウンロード" },
  ];

  return (
    <div className="sticky-header">
      <div className="steps-indicator">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`step-item ${activeStep >= step.id ? "active" : ""}`}
            onClick={() => onStepClick(step.id)}
          >
            <div className="step-number">{step.id}</div>
            <div className="step-title">{step.title}</div>
            {step.id < steps.length && <div className="step-connector"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StickyHeader;
