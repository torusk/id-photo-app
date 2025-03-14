// src/components/TemplateStep.js
import React from "react";

const TemplateStep = ({ templates, onTemplateSelect, isActive }) => {
  return (
    <div className={`template-container ${isActive ? "active" : ""}`}>
      <h2 className="section-title">ステップ1: 証明写真の種類を選択</h2>
      <p>作成したい証明写真の種類を選んでください</p>

      <div className="templates-grid">
        {Object.keys(templates).map((templateId) => {
          const template = templates[templateId];
          return (
            <button
              key={templateId}
              onClick={() => onTemplateSelect(templateId)}
              className="template-button"
              aria-label={`${template.name}を選択`}
            >
              <div className="template-name">{template.name}</div>
              <span className="template-size">{template.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateStep;
