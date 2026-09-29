"use client";

import React, { useState, useEffect } from "react";

export default function TypewriterText({ text, delay = 60, initialDelay = 800, className = "" }) {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Initial delay before starting
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setHasStarted(true);
    }, initialDelay);
    return () => clearTimeout(startTimeout);
  }, [initialDelay]);

  // Typing effect
  useEffect(() => {
    if (hasStarted && currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else if (hasStarted && currentIndex >= text.length) {
      // Hide cursor slightly after typing finishes
      const cursorTimeout = setTimeout(() => {
        setShowCursor(false);
      }, 500); // 500ms grace period to see the cursor blink at the end
      return () => clearTimeout(cursorTimeout);
    }
  }, [currentIndex, delay, text, hasStarted]);

  const renderText = () => {
    return currentText.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < currentText.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <span className={className}>
      {renderText()}
      <span 
        className={`border-r-2 border-zinc-900 ml-1 h-full transition-opacity duration-300 ${showCursor ? 'animate-pulse opacity-100' : 'opacity-0'}`}
      ></span>
    </span>
  );
}
