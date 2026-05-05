import React from "react";

const TestCategoryCard = ({ icon: Icon, category, isSelected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(category.key)}
    className={`test-category-card ${isSelected ? "selected" : ""}`}
    style={{
      background: isSelected ? category.accent : "linear-gradient(170deg, rgba(18,30,48,0.95), rgba(12,22,36,0.98))",
      borderColor: isSelected ? category.border : "var(--border-soft)",
    }}
  >
    <span className="test-category-icon" style={{ background: category.accent, borderColor: category.border }}>
      <Icon size={18} />
    </span>
    <span className="test-category-copy">
      <span className="test-category-title">{category.label}</span>
      <span className="test-category-description">{category.description}</span>
    </span>
  </button>
);

export default TestCategoryCard;
