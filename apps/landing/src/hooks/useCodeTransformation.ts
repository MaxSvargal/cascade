import { useState, useEffect } from 'react';

const CODE_TRANSFORMATIONS = ['TS', 'JS', 'PY', 'GO', 'RS'] as const;

/**
 * Custom hook for managing code transformation cycling animation.
 * Cycles through different programming language abbreviations when active.
 * @param codeTransformed - Whether the code transformation animation should be active
 */
export const useCodeTransformation = (codeTransformed: boolean) => {
  const [transformIndex, setTransformIndex] = useState(0);

  useEffect(() => {
    if (codeTransformed) {
      const interval = setInterval(() => {
        setTransformIndex(prev => (prev + 1) % CODE_TRANSFORMATIONS.length);
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [codeTransformed]);

  return {
    transformIndex,
    currentTransformation: CODE_TRANSFORMATIONS[transformIndex]
  };
}; 