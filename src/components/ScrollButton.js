// src/components/ScrollButton.js
import React, { useState, useEffect } from "react";

const ScrollButton = () => {
  const [isVisible, setIsVisible] = useState(true);

  // スクロール位置に応じてボタンの表示/非表示を切り替え
  useEffect(() => {
    const toggleVisibility = () => {
      // ページの最下部に近づいたらボタンを非表示にする
      const scrolled = window.scrollY;
      const viewportHeight = window.innerHeight;
      const fullHeight = document.body.scrollHeight;

      // 画面下部から100pxの位置に来たら非表示にする
      if (scrolled + viewportHeight >= fullHeight - 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // 次のセクションへスクロール
  const scrollDown = () => {
    // 現在位置を取得
    const currentPos = window.scrollY;
    const windowHeight = window.innerHeight;

    // 各セクションの位置を取得
    const sections = document.querySelectorAll(".section-container");
    let targetSection = null;

    // 次のセクションを見つける
    for (let i = 0; i < sections.length; i++) {
      const sectionTop =
        sections[i].getBoundingClientRect().top + window.scrollY;
      if (sectionTop > currentPos + 10) {
        // 少し余裕を持たせる
        targetSection = sections[i];
        break;
      }
    }

    // 次のセクションが見つかった場合、そこへスクロール
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // 次のセクションが見つからない場合、少し下へスクロール
      window.scrollBy({
        top: windowHeight / 2,
        behavior: "smooth",
      });
    }
  };

  return (
    <button
      className={`scroll-down-button ${isVisible ? "visible" : ""}`}
      onClick={scrollDown}
      aria-label="下にスクロール"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 10L12 15L17 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default ScrollButton;
